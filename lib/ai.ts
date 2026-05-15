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
    `Heading: ${input.content.headings.join(" | ")}`,
    `Testi principali: ${input.content.paragraphs.join(" | ")}`,
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
          preview_data: { layout: "string" }
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
      model: process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini",
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
          layout: "classic"
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
          layout: "modern"
        }
      }
    ]
  };
}
