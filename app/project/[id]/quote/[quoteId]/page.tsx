import { redirect } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { confirmQuote } from "@/app/actions";
import { canSeeAdmin } from "@/lib/admin";
import { getCurrentUser } from "@/lib/auth";
import { hasDatabaseEnv, query } from "@/lib/db";

export default async function QuotePage({
  params
}: {
  params: Promise<{ id: string; quoteId: string }>;
}) {
  if (!hasDatabaseEnv()) {
    redirect("/setup");
  }

  const { id, quoteId } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const isAdmin = canSeeAdmin(user);
  const [project] = await query<{ id: string }>(
    isAdmin ? "select id from projects where id = $1 limit 1" : "select id from projects where id = $1 and user_id = $2 limit 1",
    isAdmin ? [id] : [id, user.id]
  );

  if (!project) {
    redirect("/dashboard");
  }

  const [quote] = await query<{
    id: string;
    price: number;
    currency: string;
    timeline: string;
    scope: unknown;
    status: string;
    proposal_title: string;
    proposal_variant: string;
  }>(
    `select quotes.*, proposals.title as proposal_title, proposals.variant as proposal_variant
     from quotes
     join proposals on proposals.id = quotes.proposal_id
     where quotes.id = $1 and quotes.project_id = $2
     limit 1`,
    [quoteId, id]
  );

  if (!quote) {
    redirect(`/project/${id}`);
  }

  const scope: unknown[] = Array.isArray(quote.scope) ? quote.scope : [];

  return (
    <main className="container">
      <span className="badge">{quote.status === "confirmed" ? "Confermato" : "Da confermare"}</span>
      <h1 className="page-title">Preventivo</h1>
      <p className="lead">
        Proposta scelta: versione {quote.proposal_variant} - {quote.proposal_title}
      </p>

      <section className="grid two">
        <div className="card">
          <p className="muted">Totale stimato</p>
          <p className="price">
            {new Intl.NumberFormat("it-IT", {
              style: "currency",
              currency: quote.currency
            }).format(quote.price)}
          </p>
          <p className="muted">Tempistiche: {quote.timeline}</p>
        </div>
        <div className="card">
          <h2>Incluso</h2>
          <ul>
            {scope.map((item) => (
              <li key={String(item)}>{String(item)}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="card" style={{ marginTop: 18 }}>
        <h2>Conferma</h2>
        <p className="muted">
          Confermando, il progetto passa allo stato preventivo confermato. Se Resend e OWNER_EMAIL sono configurati, parte anche la notifica email.
        </p>
        {quote.status === "confirmed" ? (
          <span className="badge">
            <CheckCircle2 size={16} />
            Preventivo confermato
          </span>
        ) : (
          <form action={confirmQuote}>
            <input name="project_id" type="hidden" value={id} />
            <input name="quote_id" type="hidden" value={quoteId} />
            <button className="button" type="submit">
              <CheckCircle2 size={18} />
              Conferma preventivo
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
