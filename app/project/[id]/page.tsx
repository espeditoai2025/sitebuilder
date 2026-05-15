import Link from "next/link";
import { redirect } from "next/navigation";
import { ReceiptText } from "lucide-react";
import { GenerateButton } from "@/components/generate-button";
import { ProposalCard } from "@/components/proposal-card";
import { createClient } from "@/lib/supabase/server";
import { formatStatus } from "@/lib/status";

export default async function ProjectPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ confirmed?: string; error?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!project) {
    redirect("/dashboard");
  }

  const [{ data: analyses }, { data: proposals }, { data: quotes }] = await Promise.all([
    supabase.from("site_analyses").select("*").eq("project_id", id).order("created_at", { ascending: false }).limit(1),
    supabase.from("proposals").select("*").eq("project_id", id).order("variant", { ascending: true }),
    supabase.from("quotes").select("*").eq("project_id", id).order("created_at", { ascending: false }).limit(1)
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
      {query.confirmed ? <p className="notice">Preventivo confermato. Lo stato del progetto e stato aggiornato.</p> : null}
      {query.error ? <p className="notice">{query.error}</p> : null}

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
