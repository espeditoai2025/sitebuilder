"use server";

// Unified image generation for OpenRouter.
// - "Images API" models (dall-e-3, flux, etc.): POST /v1/images/generations
// - "Chat image" models (gpt-5-image-mini, nano-banana, etc.): POST /v1/chat/completions
//   These models output the image as base64 inside the message content.

const BASE = "https://openrouter.ai/api/v1";
const TIMEOUT_MS = 50_000; // stay under Vercel's 60s hard limit

// Models that use /images/generations (DALL-E style)
const IMAGES_API_MODELS = ["dall-e", "flux", "riverflow", "stable-diffusion", "sdxl", "playground"];

function isImagesApiModel(model: string) {
  const lower = model.toLowerCase();
  return IMAGES_API_MODELS.some((prefix) => lower.includes(prefix));
}

function buildHeaders(apiKey: string, siteUrl: string, siteName: string) {
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    "HTTP-Referer": siteUrl,
    "X-Title": siteName
  };
}

function buildPrompt(input: {
  name: string;
  title: string;
  subtitle: string;
  cta: string;
  palette: string[];
  sections: string[];
}) {
  const [dark, light, accent] = input.palette;
  return (
    `Website homepage UI mockup. Desktop. No browser chrome. ` +
    `Brand: "${input.name}". Background: ${light}, text: ${dark}, accent: ${accent}. ` +
    `Header: logo left, nav right. ` +
    `Hero: headline "${input.title}", subline "${input.subtitle}", CTA "${input.cta}" in ${accent}. ` +
    `Below: 3 content sections (${input.sections.slice(0, 3).join(", ")}). Footer. ` +
    `Modern, clean, professional web design.`
  );
}

async function viaImagesApi(
  model: string,
  prompt: string,
  headers: Record<string, string>
): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  // DALL-E 3 supports 1792x1024; gpt-image-1 / others use 1536x1024
  const size = model.includes("dall-e-3") ? "1792x1024" : "1536x1024";

  try {
    const res = await fetch(`${BASE}/images/generations`, {
      method: "POST",
      headers,
      signal: controller.signal,
      body: JSON.stringify({ model, prompt, n: 1, size, quality: "medium", response_format: "b64_json" })
    });

    clearTimeout(timer);
    const text = await res.text();

    if (!res.ok) {
      console.error(`[image/generations] ${res.status} ${model}:`, text.slice(0, 300));
      return null;
    }

    const json = JSON.parse(text) as { data?: { b64_json?: string; url?: string }[] };
    const item = json.data?.[0];
    if (item?.b64_json) return `data:image/png;base64,${item.b64_json}`;
    if (item?.url) return item.url;

    console.error("[image/generations] no image data:", text.slice(0, 300));
    return null;
  } catch (err) {
    clearTimeout(timer);
    console.error("[image/generations] error:", err);
    return null;
  }
}

function extractImageFromContent(content: unknown): string | null {
  if (typeof content === "string") {
    if (content.startsWith("data:image")) return content;
    if (content.startsWith("http")) return content;
    if (content.length > 200 && /^[A-Za-z0-9+/]+=*$/.test(content.slice(0, 40))) {
      return `data:image/png;base64,${content}`;
    }
  }
  if (Array.isArray(content)) {
    for (const part of content as Record<string, unknown>[]) {
      if (part.type === "image_url") {
        const url = (part.image_url as { url?: string } | undefined)?.url;
        if (url) return url;
      }
      if (part.type === "image_generation_call") {
        // Responses API tool output
        const result = part.result as { data?: string; url?: string } | undefined;
        if (result?.data) return `data:image/png;base64,${result.data}`;
        if (result?.url) return result.url;
      }
      if (part.type === "image") {
        const b64 =
          (part as { source?: { data?: string } }).source?.data ??
          (part as { data?: string }).data;
        if (b64) return `data:image/png;base64,${b64}`;
      }
    }
  }
  return null;
}

// For gpt-5-image-mini and similar Responses API models:
// use chat/completions with tools:[{type:"image_generation"}]
async function viaChatCompletions(
  model: string,
  prompt: string,
  headers: Record<string, string>
): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${BASE}/chat/completions`, {
      method: "POST",
      headers,
      signal: controller.signal,
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        tools: [{ type: "image_generation" }]
      })
    });

    clearTimeout(timer);
    const text = await res.text();

    if (!res.ok) {
      console.error(`[image/chat] ${res.status} ${model}:`, text.slice(0, 300));
      return null;
    }

    const json = JSON.parse(text) as {
      choices?: {
        message?: {
          content?: unknown;
          tool_calls?: { type: string; id: string; image_generation?: { data?: string; url?: string } }[];
        };
      }[];
      output?: unknown[];
    };

    // 1. Check tool_calls (Responses API style via chat wrapper)
    const toolCalls = json.choices?.[0]?.message?.tool_calls;
    if (Array.isArray(toolCalls)) {
      for (const call of toolCalls) {
        if (call.image_generation?.data) return `data:image/png;base64,${call.image_generation.data}`;
        if (call.image_generation?.url) return call.image_generation.url;
      }
    }

    // 2. Check message content
    const content = json.choices?.[0]?.message?.content;
    const fromContent = extractImageFromContent(content);
    if (fromContent) return fromContent;

    // 3. Check output array (native Responses API shape)
    if (Array.isArray(json.output)) {
      for (const item of json.output as Record<string, unknown>[]) {
        if (item.type === "image_generation_call") {
          const d = (item as { result?: { data?: string; url?: string } }).result;
          if (d?.data) return `data:image/png;base64,${d.data}`;
          if (d?.url) return d.url;
        }
        const fromItem = extractImageFromContent(item.content);
        if (fromItem) return fromItem;
      }
    }

    console.error("[image/chat] unrecognised response:", text.slice(0, 400));
    return null;
  } catch (err) {
    clearTimeout(timer);
    console.error("[image/chat] error:", err);
    return null;
  }
}

export async function generatePreviewImage(input: {
  name: string;
  title: string;
  subtitle: string;
  cta: string;
  palette: string[];
  sections: string[];
}): Promise<string | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;

  const model = process.env.OPENROUTER_IMAGE_MODEL || "openai/gpt-5-image-mini";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const siteName = process.env.OPENROUTER_SITE_NAME || "SiteBuilder PCS AI";

  const prompt = buildPrompt(input);
  const headers = buildHeaders(apiKey, siteUrl, siteName);

  if (isImagesApiModel(model)) {
    return viaImagesApi(model, prompt, headers);
  }

  return viaChatCompletions(model, prompt, headers);
}
