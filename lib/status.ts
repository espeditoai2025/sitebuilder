export const statusLabels: Record<string, string> = {
  submitted: "Inviato",
  analyzing: "Analisi in corso",
  analysis_completed: "Analisi completata",
  generating_proposals: "Generazione proposte",
  proposals_ready: "Proposte pronte",
  proposal_selected: "Proposta scelta",
  quote_generated: "Preventivo generato",
  quote_confirmed: "Preventivo confermato",
  contacted: "Contattato",
  closed: "Chiuso"
};

export function formatStatus(status: string) {
  return statusLabels[status] ?? status;
}
