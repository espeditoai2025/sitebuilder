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

export function buildQuote(input: QuoteInput) {
  const sections = Array.isArray(input.proposal.homepage_structure)
    ? input.proposal.homepage_structure.length
    : 5;
  const base = input.proposal.variant === "B" ? 1450 : 1150;
  const complexity = sections > 6 ? 350 : 0;
  const price = base + complexity;

  return {
    price,
    currency: "EUR",
    timeline: sections > 6 ? "15-20 giorni lavorativi" : "10-15 giorni lavorativi",
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
