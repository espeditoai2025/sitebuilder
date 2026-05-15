export type SiteContent = {
  title: string;
  headings: string[];
  paragraphs: string[];
  rawText: string;
};

export function extractSiteContent(html: string): SiteContent {
  const withoutNoise = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ");

  const title = matchText(withoutNoise, /<title[^>]*>([\s\S]*?)<\/title>/i) || "Sito esistente";
  const headings = collectMatches(withoutNoise, /<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi).slice(0, 12);
  const paragraphs = collectMatches(withoutNoise, /<p[^>]*>([\s\S]*?)<\/p>/gi)
    .filter((text) => text.length > 30)
    .slice(0, 18);

  const rawText = cleanText(withoutNoise.replace(/<[^>]+>/g, " ")).slice(0, 8000);

  return {
    title: cleanText(title),
    headings,
    paragraphs,
    rawText
  };
}

function matchText(value: string, pattern: RegExp) {
  const match = value.match(pattern);
  return match ? cleanText(match[1]) : "";
}

function collectMatches(value: string, pattern: RegExp) {
  const matches = [...value.matchAll(pattern)];
  return matches.map((match) => cleanText(match[1])).filter(Boolean);
}

function cleanText(value: string) {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}
