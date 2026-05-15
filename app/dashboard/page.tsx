import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatStatus } from "@/lib/status";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: projects } = await supabase
    .from("projects")
    .select("id, website_url, business_name, status, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <main className="container">
      <div className="toolbar" style={{ justifyContent: "space-between" }}>
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="lead">Gestisci richieste, proposte AI e preventivi.</p>
        </div>
        <Link className="button" href="/new-project">
          <Plus size={18} />
          Nuovo progetto
        </Link>
      </div>

      <section className="grid">
        {!projects?.length ? (
          <div className="card">
            <h2>Nessun progetto</h2>
            <p className="muted">Crea il primo progetto inserendo il sito web esistente del cliente.</p>
            <Link className="button" href="/new-project">
              <Plus size={18} />
              Crea progetto
            </Link>
          </div>
        ) : (
          projects.map((project) => (
            <article className="card project-row" key={project.id}>
              <div>
                <h2>{project.business_name || project.website_url}</h2>
                <p className="muted">{project.website_url}</p>
              </div>
              <span className="badge">{formatStatus(project.status)}</span>
              <Link className="button secondary" href={`/project/${project.id}`}>
                Apri
                <ArrowRight size={18} />
              </Link>
            </article>
          ))
        )}
      </section>
    </main>
  );
}
