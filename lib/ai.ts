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
    `Testi principali: ${input.content.paragraphs.join(" | ")}`,
    `Testo complessivo estratto: ${input.content.rawText.slice(0, 12000)}`,
    "",
    "Ogni proposta deve includere preview_data.html: un documento HTML completo e autonomo della homepage rinnovata.",
    "Il documento deve contenere <html>, <head>, <style>, <body>, sezioni reali, testi italiani coerenti, responsive CSS e nessuno script.",
    "Usa le immagini disponibili del sito originale se sono coerenti: hero fotografico, categorie, prodotti, team o luogo.",
    "Non inventare URL immagini. Puoi usare solo URL presenti in Immagini disponibili. Se non ci sono immagini buone, crea un visual CSS curato.",
    "Cura molto la qualita visuale: header completo, hero fotografico o editoriale, categorie/servizi, storia o proof, CTA e footer.",
    "I link dell'anteprima devono essere solo anchor interne come #servizi, #chi-siamo, #contatti. Non usare URL relativi come /contatti o /dove-siamo.",
    "La preview deve sembrare una homepage completa, non un wireframe.",
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
          preview_data: {
            layout: "string",
            html: "<!doctype html><html>...</html>"
          }
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
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.5
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
    return JSON.parse(extractJson(text)) as GeneratedResult;
  } catch {
    return buildFallbackResult(input);
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

function buildFallbackResult(input: {
  websiteUrl: string;
  businessName?: string | null;
  industry?: string | null;
  goal?: string | null;
  content: SiteContent;
}): GeneratedResult {
  const name = input.businessName || input.content.title || "Il tuo brand";
  const detectedStructure = input.content.headings.length
    ? input.content.headings.slice(0, 6)
    : ["Hero", "Servizi", "Chi siamo", "Contatti"];
  const fallbackImages = input.content.images.map((image) => image.url);

  return {
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
        preview_data: {
          layout: "classic",
          html: buildPreviewHtml({
            name,
            title: `${name}, rinnovato senza perdere identita`,
            subtitle: "Un sito piu chiaro, moderno e orientato al contatto, costruito sui contenuti gia esistenti.",
            cta: "Richiedi una consulenza",
            palette: ["#16324f", "#f7f7f2", "#16a085"],
            images: fallbackImages,
            mode: "classic"
          })
        }
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
        preview_data: {
          layout: "modern",
          html: buildPreviewHtml({
            name,
            title: `${name}: una presenza digitale piu forte`,
            subtitle: "Una nuova esperienza web che valorizza servizi, fiducia e conversioni senza stravolgere il brand.",
            cta: "Sviluppiamo la nuova versione",
            palette: ["#111827", "#f5f0e8", "#e85d4f"],
            images: fallbackImages,
            mode: "modern"
          })
        }
      }
    ]
  };
}

function buildPreviewHtml(input: {
  name: string;
  title: string;
  subtitle: string;
  cta: string;
  palette: string[];
  images: string[];
  mode: "classic" | "modern";
}) {
  const [dark, light, accent] = input.palette;
  const radius = input.mode === "classic" ? "8px" : "18px";
  const heroImage = input.images[0];
  const categoryImages = input.images.slice(1, 4);
  const visualBackground = heroImage
    ? `linear-gradient(90deg,rgba(0,0,0,.54),rgba(0,0,0,.08)),url('${escapeCssUrl(heroImage)}') center/cover`
    : `radial-gradient(circle at 70% 28%,${accent}66,transparent 32%),linear-gradient(135deg,${dark},#0b2238)`;
  const categoryCards = ["Servizi principali", "Metodo di lavoro", "Qualita e fiducia"]
    .map((title, index) => {
      const image = categoryImages[index];
      const media = image
        ? `<div class="card-media" style="background-image:url('${escapeCssUrl(image)}')"></div>`
        : `<div class="card-media empty">${String(index + 1).padStart(2, "0")}</div>`;

      return `<div class="card">${media}<strong>0${index + 1}</strong><h2>${title}</h2><p>Contenuti e messaggi ripensati a partire dall'identita esistente del brand.</p></div>`;
    })
    .join("");

  return `<!doctype html>
<html lang="it">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    *{box-sizing:border-box}body{margin:0;font-family:Arial,Helvetica,sans-serif;background:${light};color:${dark}}header{display:flex;justify-content:space-between;align-items:center;padding:28px 7vw;border-bottom:1px solid rgba(0,0,0,.08);background:rgba(255,255,255,.82);backdrop-filter:blur(12px)}.logo{font-weight:900;letter-spacing:.04em}.nav{display:flex;gap:22px;color:rgba(0,0,0,.62);font-size:14px}.hero{display:grid;grid-template-columns:.82fr 1.18fr;gap:48px;align-items:center;padding:58px 7vw}.eyebrow{color:${accent};font-weight:800;text-transform:uppercase;font-size:13px;letter-spacing:.12em}h1{font-size:clamp(42px,7vw,82px);line-height:.94;margin:16px 0 22px}p{font-size:18px;line-height:1.65}.cta{display:inline-block;background:${accent};color:white;padding:14px 20px;border-radius:${radius};font-weight:800;margin-top:12px}.visual{min-height:460px;border-radius:${radius};background:${visualBackground};box-shadow:0 26px 80px rgba(0,0,0,.18);position:relative;overflow:hidden}.visual:before{content:"";position:absolute;inset:42px;border:1px solid rgba(255,255,255,.22);border-radius:${radius}}.visual:after{content:"${input.mode === "classic" ? "Identita chiara" : "Nuova esperienza"}";position:absolute;left:42px;bottom:42px;color:white;font-size:34px;font-weight:900;max-width:280px;text-shadow:0 2px 16px rgba(0,0,0,.5)}.section{padding:54px 7vw}.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}.card{border:1px solid rgba(0,0,0,.08);border-radius:${radius};padding:18px;background:white;overflow:hidden}.card-media{height:150px;border-radius:calc(${radius} - 4px);background-size:cover;background-position:center;margin-bottom:18px}.card-media.empty{display:grid;place-items:center;background:${dark};color:white;font-size:34px;font-weight:900}.card strong{color:${accent};display:block;margin-bottom:10px}@media(max-width:760px){header,.nav{display:block}.hero,.cards{grid-template-columns:1fr}.hero{padding-top:44px}.visual{min-height:300px}}
  </style>
</head>
<body>
  <header><div class="logo">${escapeHtml(input.name)}</div><nav class="nav"><span>Servizi</span><span>Metodo</span><span>Contatti</span></nav></header>
  <main>
    <section class="hero"><div><div class="eyebrow">Restyling sito web</div><h1>${escapeHtml(input.title)}</h1><p>${escapeHtml(input.subtitle)}</p><a class="cta">${escapeHtml(input.cta)}</a></div><div class="visual"></div></section>
    <section class="section"><div class="cards">${categoryCards}</div></section>
  </main>
</body>
</html>`;
}

function escapeCssUrl(value: string) {
  return value.replace(/'/g, "\\'");
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
