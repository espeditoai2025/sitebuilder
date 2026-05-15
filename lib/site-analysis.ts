export type SiteContent = {
  title: string;
  headings: string[];
  paragraphs: string[];
  rawText: string;
  pages: SitePage[];
};

export type SitePage = {
  url: string;
  title: string;
  headings: string[];
  paragraphs: string[];
  rawText: string;
};

export async function scrapeWebsite(url: string, maxPages = 5): Promise<SiteContent> {
  const homeHtml = await fetchWebsite(url);
  const homePage = extractPageContent(url, homeHtml);
  const links = collectInternalLinks(url, homeHtml).slice(0, Math.max(0, maxPages - 1));
  const linkedPages = await Promise.all(
    links.map(async (link) => {
      const html = await fetchWebsite(link);
      return html ? extractPageContent(link, html) : null;
    })
  );
  const pages = [homePage, ...linkedPages.filter((page): page is SitePage => Boolean(page))];

  const title = homePage.title || "Sito esistente";
  const headings = unique(pages.flatMap((page) => page.headings)).slice(0, 24);
  const paragraphs = unique(pages.flatMap((page) => page.paragraphs)).slice(0, 36);
  const rawText = pages.map((page) => `[${page.title}]\n${page.rawText}`).join("\n\n").slice(0, 14000);

  return {
    title,
    headings,
    paragraphs,
    rawText,
    pages
  };
}

export function extractSiteContent(html: string): SiteContent {
  const page = extractPageContent("", html);

  return {
    title: page.title,
    headings: page.headings,
    paragraphs: page.paragraphs,
    rawText: page.rawText,
    pages: [page]
  };
}

function extractPageContent(url: string, html: string): SitePage {
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
    url,
    title: cleanText(title),
    headings,
    paragraphs,
    rawText
  };
}

async function fetchWebsite(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "SiteBuilderAI/0.2 (+https://sitebuilder-green.vercel.app)"
      }
    });

    if (!response.ok) {
      return "";
    }

    const contentType = response.headers.get("content-type") || "";

    if (!contentType.includes("text/html")) {
      return "";
    }

    return await response.text();
  } catch {
    return "";
  } finally {
    clearTimeout(timeout);
  }
}

function collectInternalLinks(baseUrl: string, html: string) {
  const base = new URL(baseUrl);
  const hrefs = [...html.matchAll(/<a\s+[^>]*href=["']([^"']+)["'][^>]*>/gi)]
    .map((match) => match[1])
    .filter(Boolean);
  const links = new Set<string>();

  for (const href of hrefs) {
    try {
      const url = new URL(href, base);

      if (url.origin !== base.origin || url.hash || isAssetUrl(url.pathname)) {
        continue;
      }

      url.hash = "";
      url.search = "";
      links.add(url.toString());
    } catch {
      // Ignore invalid href values.
    }
  }

  return [...links].sort((a, b) => scoreLink(b) - scoreLink(a));
}

function isAssetUrl(pathname: string) {
  return /\.(pdf|jpg|jpeg|png|gif|webp|svg|zip|mp4|mp3|doc|docx|xls|xlsx)$/i.test(pathname);
}

function scoreLink(url: string) {
  const lower = url.toLowerCase();
  let score = 0;

  for (const keyword of ["servizi", "service", "chi-siamo", "about", "azienda", "contatti", "contact", "portfolio"]) {
    if (lower.includes(keyword)) {
      score += 3;
    }
  }

  return score;
}

function unique(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
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
