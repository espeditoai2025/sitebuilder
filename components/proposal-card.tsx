import { CheckCircle2 } from "lucide-react";
import { selectProposal } from "@/app/actions";

type Proposal = {
  id: string;
  project_id: string;
  variant: string;
  title: string;
  description: string;
  homepage_structure: unknown;
  visual_style: unknown;
  palette: unknown;
  copy: unknown;
  preview_data: unknown;
  is_selected: boolean;
};

export function ProposalCard({ proposal }: { proposal: Proposal }) {
  const palette = Array.isArray(proposal.palette) ? proposal.palette.slice(0, 4) : [];
  const structure = Array.isArray(proposal.homepage_structure) ? proposal.homepage_structure : [];
  const copy = isRecord(proposal.copy) ? proposal.copy : {};
  const preview = isRecord(proposal.preview_data) ? proposal.preview_data : {};
  const previewHtml = typeof preview.html === "string" ? preview.html : "";
  const safePreviewHtml = previewHtml ? sanitizePreviewHtml(previewHtml) : "";

  return (
    <article className="card proposal-preview">
      <div>
        <span className="badge">Versione {proposal.variant}</span>
        <h2>{proposal.title}</h2>
        <p className="muted">{proposal.description}</p>
      </div>

      <div className="preview-frame-shell">
        {safePreviewHtml ? (
          <iframe className="preview-frame" sandbox="" srcDoc={safePreviewHtml} title={`Anteprima versione ${proposal.variant}`} />
        ) : (
          <div className="mockup">
            <div className="mockup-hero" style={{ background: String(palette[0] || "#16324f"), color: String(palette[1] || "#ffffff") }}>
              <h3>{String(copy.hero_title || proposal.title)}</h3>
              <p>{String(copy.hero_subtitle || proposal.description)}</p>
              <span className="badge">{String(copy.cta || "Contattaci")}</span>
            </div>
            <div className="mockup-lines">
              <span className="mockup-line" />
              <span className="mockup-line short" />
              <span className="mockup-line" />
            </div>
          </div>
        )}
        <div className="preview-frame-footer">
          <span>Anteprima HTML reale della homepage</span>
        </div>
      </div>

      <div>
        <h3>Palette</h3>
        <div className="palette">
          {palette.map((color) => (
            <span className="swatch" key={String(color)} style={{ background: String(color) }} title={String(color)} />
          ))}
        </div>
      </div>

      <div>
        <h3>Struttura homepage</h3>
        <ul>
          {structure.map((item) => (
            <li key={String(item)}>{String(item)}</li>
          ))}
        </ul>
      </div>

      {proposal.is_selected ? (
        <span className="badge">
          <CheckCircle2 size={16} />
          Scelta
        </span>
      ) : (
        <form action={selectProposal}>
          <input name="project_id" type="hidden" value={proposal.project_id} />
          <input name="proposal_id" type="hidden" value={proposal.id} />
          <button className="button" type="submit">
            <CheckCircle2 size={18} />
            Scelgo questa
          </button>
        </form>
      )}
    </article>
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function sanitizePreviewHtml(html: string) {
  const sanitizedLinks = html.replace(/\s(href)=["']([^"']*)["']/gi, (_match, attr: string, href: string) => {
    const normalized = href.trim().toLowerCase();

    if (normalized.startsWith("#") || normalized.startsWith("mailto:") || normalized.startsWith("tel:")) {
      return ` ${attr}="${escapeAttribute(href)}"`;
    }

    return ` ${attr}="#preview"`;
  });

  const previewBase = `<base href="about:srcdoc" target="_self"><style>a{cursor:pointer}</style>`;

  if (sanitizedLinks.includes("</head>")) {
    return sanitizedLinks.replace("</head>", `${previewBase}</head>`);
  }

  return `${previewBase}${sanitizedLinks}`;
}

function escapeAttribute(value: string) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}
