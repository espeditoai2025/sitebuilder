import Link from "next/link";
import { redirect } from "next/navigation";
import { ReceiptText } from "lucide-react";
import { GenerateButton } from "@/components/generate-button";
import { ProposalCard } from "@/components/proposal-card";
import { getCurrentUser } from "@/lib/auth";
import { hasDatabaseEnv, query as dbQuery } from "@/lib/db";
import { formatStatus } from "@/lib/status";

export default async function ProjectPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ confirmed?: string; error?: string }>;
}) {
  if (!hasDatabaseEnv()) {
    redirect("/setup");
  }

  const { id } = await params;
  const pageQuery = await searchParams;
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const [project] = await dbQuery<{
    id: string;
    website_url: string;
    business_name: string | null;
    industry: string | null;
    goal: string | null;
    status: string;
  }>("select * from projects where id = $1 and user_id = $2 limit 1", [id, user.id]);

  if (!project) {
    redirect("/dashboard");
  }

  const [analyses, proposals, quotes] = await Promise.all([
    dbQuery<{
      summary: string;
      detected_colors: unknown;
      detected_structure: unknown;
    }>("select * from site_analyses where project_id = $1 order by created_at desc limit 1", [id]),
    dbQuery<{
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
    }>("select * from proposals where project_id = $1 order by variant asc", [id]),
    dbQuery<{ id: string }>("select * from quotes where project_id = $1 order by created_at desc limit 1", [id])
  ]);

  const analysis = analyses?.[0];
  const latestQuote = quotes?.[0];
  const detectedColors: unknown[] = Array.isArray(analysis?.detected_colors)
    ? analysis.detected_colors
    : [];
  const detectedStructure: unknown[] = Array.isArray(analysis?.detected_structure)
    ? analysis.detected_structure
    : [];

  return (
    <main className="container">
      {pageQuery.confirmed ? <p className="notice">Preventivo confermato. Lo stato del progetto e stato aggiornato.</p> : null}
      {pageQuery.error ? <p className="notice">{pageQuery.error}</p> : null}

      <div className="toolbar" style={{ justifyContent: "space-between" }}>
        <div>
          <span className="badge">{formatStatus(project.status)}</span>
          <h1 className="page-title">{project.business_name || "Progetto sito"}</h1>
          <p className="lead">{project.website_url}</p>
        </div>
        {latestQuote ? (
          <Link className="button secondary" href={`/project/${id}/quote/${latestQuote.id}`}>
            <ReceiptText size={18} />
            Preventivo
          </Link>
        ) : null}
      </div>

      <section className="grid two">
        <div className="card">
          <h2>Contesto</h2>
          <p>
            <strong>Settore:</strong> {project.industry || "Non indicato"}
          </p>
          <p>
            <strong>Obiettivo:</strong> {project.goal || "Non indicato"}
          </p>
        </div>
        <div className="card">
          <h2>Prossima azione</h2>
          {proposals?.length ? (
            <p className="muted">Le proposte sono pronte. Scegli una versione per generare il preventivo.</p>
          ) : (
            <>
              <p className="muted">Avvia l&apos;analisi del sito e crea due versioni di restyling.</p>
              <GenerateButton projectId={id} />
            </>
          )}
        </div>
      </section>

      {analysis ? (
        <section className="card" style={{ marginTop: 18 }}>
          <h2>Analisi AI</h2>
          <p>{analysis.summary}</p>
          <div className="grid two">
            <div>
              <h3>Colori rilevati o consigliati</h3>
              <div className="palette">
                {detectedColors.map((color) => (
                  <span className="swatch" key={String(color)} style={{ background: String(color) }} />
                ))}
              </div>
            </div>
            <div>
              <h3>Struttura</h3>
              <p className="muted">
                {detectedStructure.length ? detectedStructure.join(", ") : "Non rilevata"}
              </p>
            </div>
          </div>
        </section>
      ) : null}

      {proposals?.length ? (
        <section style={{ marginTop: 18 }}>
          <div className="grid two">
            {proposals.map((proposal) => (
              <ProposalCard key={proposal.id} proposal={proposal} />
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
