import Link from "next/link";
import { redirect } from "next/navigation";
import { Eye, ShieldCheck } from "lucide-react";
import { promoteUserToAdmin, updateQuotePackage } from "./actions";
import { requireAdmin } from "@/lib/admin";
import { hasDatabaseEnv, query } from "@/lib/db";
import { formatStatus } from "@/lib/status";

type AdminUser = {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  created_at: string;
  projects_count: number;
};

type AdminProject = {
  id: string;
  website_url: string;
  business_name: string | null;
  status: string;
  created_at: string;
  user_email: string;
  quote_price: number | null;
  quote_status: string | null;
};

type AdminQuote = {
  id: string;
  project_id: string;
  price: number;
  currency: string;
  status: string;
  created_at: string;
  website_url: string;
  user_email: string;
  proposal_title: string;
  proposal_variant: string;
};

type AdminProposal = {
  id: string;
  project_id: string;
  variant: string;
  title: string;
  created_at: string;
  website_url: string;
};

type QuotePackage = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  base_price: number;
  variant_b_delta: number;
  extra_section_price: number;
  included_sections_threshold: number;
  currency: string;
  timeline: string;
  scope: unknown;
  active: boolean;
};

export default async function AdminPage({
  searchParams
}: {
  searchParams: Promise<{ updated?: string; error?: string }>;
}) {
  if (!hasDatabaseEnv()) {
    redirect("/setup");
  }

  await requireAdmin();
  const params = await searchParams;
  const [users, projects, quotes, proposals, packages] = await Promise.all([
    query<AdminUser>(
      `select app_users.id, app_users.email, app_users.full_name, app_users.role, app_users.created_at,
              count(projects.id)::int as projects_count
       from app_users
       left join projects on projects.user_id = app_users.id
       group by app_users.id
       order by app_users.created_at desc
       limit 50`
    ),
    query<AdminProject>(
      `select projects.id, projects.website_url, projects.business_name, projects.status, projects.created_at,
              app_users.email as user_email,
              latest_quote.price as quote_price,
              latest_quote.status as quote_status
       from projects
       join app_users on app_users.id = projects.user_id
       left join lateral (
         select price, status from quotes
         where quotes.project_id = projects.id
         order by created_at desc
         limit 1
       ) latest_quote on true
       order by projects.created_at desc
       limit 50`
    ),
    query<AdminQuote>(
      `select quotes.id, quotes.project_id, quotes.price, quotes.currency, quotes.status, quotes.created_at,
              projects.website_url,
              app_users.email as user_email,
              proposals.title as proposal_title,
              proposals.variant as proposal_variant
       from quotes
       join projects on projects.id = quotes.project_id
       join app_users on app_users.id = projects.user_id
       join proposals on proposals.id = quotes.proposal_id
       order by quotes.created_at desc
       limit 50`
    ),
    query<AdminProposal>(
      `select proposals.id, proposals.project_id, proposals.variant, proposals.title, proposals.created_at,
              projects.website_url
       from proposals
       join projects on projects.id = proposals.project_id
       order by proposals.created_at desc
       limit 50`
    ),
    query<QuotePackage>("select * from quote_packages order by sort_order asc, created_at asc")
  ]);

  return (
    <main className="container admin-page">
      <span className="badge">
        <ShieldCheck size={16} />
        Backend admin
      </span>
      <h1 className="page-title">Controllo progetti</h1>
      <p className="lead">Utenti registrati, preventivi, proposte generate e listino prezzi reale.</p>
      {params.updated ? <p className="notice">Modifiche salvate.</p> : null}
      {params.error ? <p className="notice">{params.error}</p> : null}

      <section className="admin-stats">
        <div className="card">
          <span className="muted">Utenti</span>
          <strong>{users.length}</strong>
        </div>
        <div className="card">
          <span className="muted">Progetti</span>
          <strong>{projects.length}</strong>
        </div>
        <div className="card">
          <span className="muted">Preventivi</span>
          <strong>{quotes.length}</strong>
        </div>
        <div className="card">
          <span className="muted">Anteprime</span>
          <strong>{proposals.length}</strong>
        </div>
      </section>

      <section className="admin-section">
        <h2>Listino prezzi</h2>
        <div className="grid">
          {packages.map((quotePackage) => {
            const scope = Array.isArray(quotePackage.scope) ? quotePackage.scope.join("\n") : "";

            return (
              <form className="card admin-price-form" action={updateQuotePackage} key={quotePackage.id}>
                <input name="id" type="hidden" value={quotePackage.id} />
                <div className="grid two">
                  <div className="field">
                    <label>Nome pacchetto</label>
                    <input name="name" defaultValue={quotePackage.name} required />
                  </div>
                  <div className="field">
                    <label>Prezzo base</label>
                    <input name="base_price" defaultValue={quotePackage.base_price} min={0} required type="number" />
                  </div>
                </div>
                <div className="field">
                  <label>Descrizione</label>
                  <input name="description" defaultValue={quotePackage.description || ""} />
                </div>
                <div className="grid three">
                  <div className="field">
                    <label>Extra versione B</label>
                    <input name="variant_b_delta" defaultValue={quotePackage.variant_b_delta} min={0} type="number" />
                  </div>
                  <div className="field">
                    <label>Extra sezione</label>
                    <input name="extra_section_price" defaultValue={quotePackage.extra_section_price} min={0} type="number" />
                  </div>
                  <div className="field">
                    <label>Sezioni incluse</label>
                    <input
                      name="included_sections_threshold"
                      defaultValue={quotePackage.included_sections_threshold}
                      min={1}
                      type="number"
                    />
                  </div>
                </div>
                <div className="grid two">
                  <div className="field">
                    <label>Valuta</label>
                    <input name="currency" defaultValue={quotePackage.currency} />
                  </div>
                  <div className="field">
                    <label>Tempistiche</label>
                    <input name="timeline" defaultValue={quotePackage.timeline} required />
                  </div>
                </div>
                <div className="field">
                  <label>Incluso nel preventivo</label>
                  <textarea name="scope" defaultValue={scope} />
                </div>
                <label className="check-row">
                  <input name="active" type="checkbox" defaultChecked={quotePackage.active} />
                  Pacchetto attivo
                </label>
                <button className="button" type="submit">
                  Salva prezzo
                </button>
              </form>
            );
          })}
        </div>
      </section>

      <section className="admin-section">
        <h2>Utenti registrati</h2>
        <div className="admin-table">
          {users.map((user) => (
            <div className="admin-row" key={user.id}>
              <div>
                <strong>{user.full_name || user.email}</strong>
                <p className="muted">{user.email}</p>
              </div>
              <span className="badge">{user.role}</span>
              <span>{user.projects_count} progetti</span>
              {user.role === "admin" ? null : (
                <form action={promoteUserToAdmin}>
                  <input name="id" type="hidden" value={user.id} />
                  <button className="button secondary" type="submit">
                    Rendi admin
                  </button>
                </form>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="admin-section">
        <h2>Progetti e preventivi</h2>
        <div className="admin-table">
          {projects.map((project) => (
            <div className="admin-row" key={project.id}>
              <div>
                <strong>{project.business_name || project.website_url}</strong>
                <p className="muted">{project.user_email}</p>
              </div>
              <span className="badge">{formatStatus(project.status)}</span>
              <span>
                {project.quote_price
                  ? new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(project.quote_price)
                  : "Nessun preventivo"}
              </span>
              <Link className="button secondary" href={`/project/${project.id}`}>
                <Eye size={16} />
                Apri
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="admin-section">
        <h2>Anteprime generate</h2>
        <div className="admin-table">
          {proposals.map((proposal) => (
            <div className="admin-row" key={proposal.id}>
              <div>
                <strong>
                  Versione {proposal.variant} - {proposal.title}
                </strong>
                <p className="muted">{proposal.website_url}</p>
              </div>
              <Link className="button secondary" href={`/project/${proposal.project_id}`}>
                <Eye size={16} />
                Visualizza
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="admin-section">
        <h2>Preventivi generati</h2>
        <div className="admin-table">
          {quotes.map((quote) => (
            <div className="admin-row" key={quote.id}>
              <div>
                <strong>
                  {new Intl.NumberFormat("it-IT", { style: "currency", currency: quote.currency }).format(quote.price)}
                </strong>
                <p className="muted">
                  {quote.user_email} - versione {quote.proposal_variant}
                </p>
              </div>
              <span className="badge">{quote.status}</span>
              <Link className="button secondary" href={`/project/${quote.project_id}/quote/${quote.id}`}>
                <Eye size={16} />
                Apri
              </Link>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
