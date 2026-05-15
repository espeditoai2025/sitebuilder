import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, ArrowRight } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { hasDatabaseEnv, query } from "@/lib/db";
import { formatStatus } from "@/lib/status";

export default async function DashboardPage() {
  if (!hasDatabaseEnv()) {
    redirect("/setup");
  }

  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const projects = await query<{
    id: string;
    website_url: string;
    business_name: string | null;
    status: string;
    created_at: string;
  }>(
    "select id, website_url, business_name, status, created_at from projects where user_id = $1 order by created_at desc",
    [user.id]
  );

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
