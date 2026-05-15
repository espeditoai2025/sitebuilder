import { redirect } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { confirmQuote } from "@/app/actions";
import { createClient } from "@/lib/supabase/server";

export default async function QuotePage({
  params
}: {
  params: Promise<{ id: string; quoteId: string }>;
}) {
  const { id, quoteId } = await params;
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

  const { data: quote } = await supabase
    .from("quotes")
    .select("*, proposals(title, variant)")
    .eq("id", quoteId)
    .eq("project_id", id)
    .single();

  if (!quote) {
    redirect(`/project/${id}`);
  }

  const scope: unknown[] = Array.isArray(quote.scope) ? quote.scope : [];

  return (
    <main className="container">
      <span className="badge">{quote.status === "confirmed" ? "Confermato" : "Da confermare"}</span>
      <h1 className="page-title">Preventivo</h1>
      <p className="lead">
        Proposta scelta: versione {quote.proposals?.variant} - {quote.proposals?.title}
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
