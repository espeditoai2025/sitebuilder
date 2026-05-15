import { query } from "./db";

type QuoteInput = {
  project: {
    industry?: string | null;
    goal?: string | null;
  };
  proposal: {
    variant: string;
    homepage_structure?: unknown;
  };
};

type QuotePackage = {
  name: string;
  base_price: number;
  variant_b_delta: number;
  extra_section_price: number;
  included_sections_threshold: number;
  currency: string;
  timeline: string;
  scope: unknown;
};

export async function buildQuote(input: QuoteInput) {
  const sections = Array.isArray(input.proposal.homepage_structure)
    ? input.proposal.homepage_structure.length
    : 5;
  const quotePackage = await getDefaultPackage();
  const variantDelta = input.proposal.variant === "B" ? quotePackage.variant_b_delta : 0;
  const extraSections = Math.max(0, sections - quotePackage.included_sections_threshold);
  const price = quotePackage.base_price + variantDelta + extraSections * quotePackage.extra_section_price;
  const scope = Array.isArray(quotePackage.scope) ? quotePackage.scope : [];

  return {
    price,
    currency: quotePackage.currency,
    timeline: quotePackage.timeline,
    scope: [`Pacchetto: ${quotePackage.name}`, ...scope]
  };
}

async function getDefaultPackage(): Promise<QuotePackage> {
  const [quotePackage] = await query<QuotePackage>(
    `select name, base_price, variant_b_delta, extra_section_price, included_sections_threshold, currency, timeline, scope
     from quote_packages
     where active = true
     order by sort_order asc, created_at asc
     limit 1`
  );

  return quotePackage ?? {
    name: "Sito vetrina",
    base_price: 1200,
    variant_b_delta: 250,
    extra_section_price: 120,
    included_sections_threshold: 6,
    currency: "EUR",
    timeline: "10-15 giorni lavorativi",
    scope: [
      "Restyling homepage",
      "Direzione visiva coerente con il sito esistente",
      "Copy principale ottimizzato",
      "Layout responsive",
      "SEO tecnico base",
      "Pubblicazione su hosting concordato"
    ]
  };
}
