import type { SiteContent } from "./site-analysis";

export type GeneratedProposal = {
  variant: "A" | "B";
  title: string;
  description: string;
  homepage_structure: string[];
  visual_style: Record<string, string>;
  palette: string[];
  copy: {
    hero_title: string;
    hero_subtitle: string;
    cta: string;
  };
  preview_data: Record<string, unknown>;
};

export type GeneratedResult = {
  analysis: {
    summary: string;
    detected_style: Record<string, string>;
    detected_colors: string[];
    detected_structure: string[];
  };
  proposals: GeneratedProposal[];
};

export async function generateProjectIdeas(input: {
  websiteUrl: string;
  businessName?: string | null;
  industry?: string | null;
  goal?: string | null;
  content: SiteContent;
}): Promise<GeneratedResult> {
  if (!process.env.OPENROUTER_API_KEY) {
    return buildFallbackResult(input);
  }

  const prompt = [
    "Sei un senior web strategist italiano.",
    "Analizza il sito esistente e genera un output JSON valido.",
    "Crea 2 proposte di restyling: A conservativa, B piu moderna.",
    "Mantieni coerenza con stile, contenuti e identita del sito originale.",
    "",
    `URL: ${input.websiteUrl}`,
    `Azienda: ${input.businessName || input.content.title}`,
    `Settore: ${input.industry || "non specificato"}`,
    `Obiettivo: ${input.goal || "migliorare presenza online e conversioni"}`,
    `Titolo rilevato: ${input.content.title}`,
    `Pagine analizzate: ${input.content.pages.map((page) => `${page.title} (${page.url})`).join(" | ")}`,
    `Immagini disponibili: ${input.content.images.map((image) => `${image.alt}: ${image.url}`).join(" | ")}`,
    `Heading: ${input.content.headings.join(" | ")}`,
    `Testi principali: ${input.content.paragraphs.slice(0, 14).join(" | ")}`,
    `Testo complessivo estratto: ${input.content.rawText.slice(0, 3200)}`,
    "",
    "Rispondi solo con questo schema JSON:",
    JSON.stringify({
      analysis: {
        summary: "string",
        detected_style: { tone: "string", layout: "string", audience: "string" },
        detected_colors: ["string"],
        detected_structure: ["string"]
      },
      proposals: [
        {
          variant: "A",
          title: "string",
          description: "string",
          homepage_structure: ["string"],
          visual_style: { mood: "string", typography: "string", imagery: "string" },
          palette: ["#111111", "#ffffff", "#0f766e"],
          copy: {
            hero_title: "string",
            hero_subtitle: "string",
            cta: "string"
          },
          preview_data: {}
        }
      ]
    })
  ].join("\n");

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "HTTP-Referer": process.env.OPENROUTER_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
      "X-Title": process.env.OPENROUTER_SITE_NAME || "SiteBuilder PCS AI"
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || "openai/gpt-5.4-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.45,
      max_tokens: 1400
    })
  });

  if (!response.ok) {
    return buildFallbackResult(input);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;

  if (!text) {
    return buildFallbackResult(input);
  }

  try {
    return await withGeneratedImages(JSON.parse(extractJson(text)) as GeneratedResult, input);
  } catch {
    return buildFallbackResult(input);
  }
}

async function withGeneratedImages(
  result: GeneratedResult,
  input: {
    websiteUrl: string;
    businessName?: string | null;
    industry?: string | null;
    content: SiteContent;
  }
) {
  const name = input.businessName || input.content.title || "Il tuo brand";
  const first = result.proposals[0];

  const image = await generatePreviewImage({
    name,
    title: first?.copy?.hero_title || first?.title || name,
    subtitle: first?.copy?.hero_subtitle || first?.description || "",
    cta: first?.copy?.cta || "Contattaci",
    palette: first?.palette?.length >= 3 ? first.palette : ["#111827", "#f5f0e8", "#e85d4f"],
    sections: Array.isArray(first?.homepage_structure) ? first.homepage_structure : []
  });

  return {
    ...result,
    proposals: result.proposals.map((proposal) => ({
      ...proposal,
      preview_data: {
        ...proposal.preview_data,
        image: image ?? null
      }
    }))
  };
}

async function generatePreviewImage(input: {
  name: string;
  title: string;
  subtitle: string;
  cta: string;
  palette: string[];
  sections: string[];
}): Promise<string | null> {
  if (!process.env.OPENROUTER_API_KEY) {
    return null;
  }

  const [dark, light, accent] = input.palette;

  const prompt = [
    `Professional website homepage mockup, full desktop screenshot, no browser chrome, no device frame.`,
    `Business name: "${input.name}".`,
    `Design style: modern, clean, professional web design.`,
    `Color palette: primary background ${light}, dark text/elements ${dark}, accent color ${accent}.`,
    `Layout: sticky header with brand logo "${input.name}" on left and navigation links on right.`,
    `Hero section: large bold headline "${input.title}", descriptive subtitle "${input.subtitle}", prominent call-to-action button labeled "${input.cta}" in accent color ${accent}.`,
    `Below hero: visible section previews for ${input.sections.slice(0, 3).join(", ")}.`,
    `Footer with brand name and contact info.`,
    `High quality, pixel-perfect UI design, full-width layout, realistic web design screenshot.`
  ].join(" ");

  try {
    const model = process.env.OPENROUTER_IMAGE_MODEL || "openai/gpt-5-image-mini";

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": process.env.OPENROUTER_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
        "X-Title": process.env.OPENROUTER_SITE_NAME || "SiteBuilder PCS AI"
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }]
      })
    });

    const responseText = await response.text().catch(() => "");

    if (!response.ok) {
      console.error(`[generatePreviewImage] ${response.status} from ${model}:`, responseText.slice(0, 400));
      return null;
    }

    let data: unknown;
    try {
      data = JSON.parse(responseText);
    } catch {
      console.error("[generatePreviewImage] Failed to parse JSON:", responseText.slice(0, 200));
      return null;
    }

    // gpt-5-image-mini returns image inside choices[0].message.content
    // content can be a string (data URL) or an array of content parts
    const content = (data as { choices?: { message?: { content?: unknown } }[] }).choices?.[0]?.message?.content;

    if (typeof content === "string") {
      // data:image/png;base64,... returned directly
      if (content.startsWith("data:image")) {
        return content;
      }
      // URL returned as plain string
      if (content.startsWith("http")) {
        return content;
      }
    }

    if (Array.isArray(content)) {
      for (const part of content) {
        if (part?.type === "image_url") {
          return part.image_url?.url ?? null;
        }
        if (part?.type === "image") {
          const b64 = part.source?.data ?? part.data;
          if (b64) return `data:image/png;base64,${b64}`;
        }
      }
    }

    console.error("[generatePreviewImage] Unexpected response structure:", responseText.slice(0, 400));
    return null;
  } catch (err) {
    console.error("[generatePreviewImage] Exception:", err);
    return null;
  }
}

function extractJson(text: string) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);

  if (fenced?.[1]) {
    return fenced[1].trim();
  }

  return trimmed;
}

async function buildFallbackResult(input: {
  websiteUrl: string;
  businessName?: string | null;
  industry?: string | null;
  goal?: string | null;
  content: SiteContent;
}): Promise<GeneratedResult> {
  const name = input.businessName || input.content.title || "Il tuo brand";
  const detectedStructure = input.content.headings.length
    ? input.content.headings.slice(0, 6)
    : ["Hero", "Servizi", "Chi siamo", "Contatti"];

  const base: GeneratedResult = {
    analysis: {
      summary: `${name} ha gia una base contenutistica utile. Il restyling dovrebbe conservare riconoscibilita e messaggi principali, rendendo piu chiara la proposta di valore e il percorso verso il contatto.`,
      detected_style: {
        tone: "istituzionale e orientato alla fiducia",
        layout: "struttura classica con contenuti informativi",
        audience: input.industry || "clienti potenziali"
      },
      detected_colors: ["#16324f", "#f7f7f2", "#16a085"],
      detected_structure: detectedStructure
    },
    proposals: [
      {
        variant: "A",
        title: "Restyling essenziale e fedele",
        description: "Una versione ordinata e professionale che mantiene il carattere del sito attuale, migliorando chiarezza, gerarchia dei contenuti e call to action.",
        homepage_structure: ["Hero con promessa chiara", "Servizi principali", "Punti di forza", "Chi siamo", "Testimonianze o prove", "Contatto rapido"],
        visual_style: {
          mood: "sobrio, affidabile, pulito",
          typography: "sans serif leggibile con titoli decisi",
          imagery: "immagini reali o professionali a supporto dei servizi"
        },
        palette: ["#16324f", "#f7f7f2", "#16a085"],
        copy: {
          hero_title: `${name}, rinnovato senza perdere identita`,
          hero_subtitle: "Un sito piu chiaro, moderno e orientato al contatto, costruito sui contenuti gia esistenti.",
          cta: "Richiedi una consulenza"
        },
        preview_data: {}
      },
      {
        variant: "B",
        title: "Restyling moderno e conversion-oriented",
        description: "Una proposta piu contemporanea, con sezioni piu dinamiche, messaggi sintetici e una navigazione pensata per guidare l'utente verso la richiesta di preventivo.",
        homepage_structure: ["Hero editoriale", "Problema e soluzione", "Servizi in evidenza", "Processo di lavoro", "Risultati attesi", "CTA finale"],
        visual_style: {
          mood: "moderno, distintivo, diretto",
          typography: "titoli ad alto impatto e testi brevi",
          imagery: "visual piu immersivi e dettagli di brand"
        },
        palette: ["#111827", "#f5f0e8", "#e85d4f"],
        copy: {
          hero_title: `${name}: una presenza digitale piu forte`,
          hero_subtitle: "Una nuova esperienza web che valorizza servizi, fiducia e conversioni senza stravolgere il brand.",
          cta: "Sviluppiamo la nuova versione"
        },
        preview_data: {}
      }
    ]
  };

  return withGeneratedImages(base, input);
}
