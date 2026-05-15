import { Globe2 } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { hasDatabaseEnv } from "@/lib/db";
import { createProject } from "../actions";

export default async function NewProjectPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const user = hasDatabaseEnv() ? await getCurrentUser() : null;

  return (
    <main className="container">
      <h1 className="page-title">Nuovo progetto</h1>
      <p className="lead">
        Inserisci sito, obiettivo e dati di accesso: salviamo il progetto e ti portiamo direttamente alla dashboard del
        restyling.
      </p>
      {params.error ? <p className="notice">{params.error}</p> : null}
      <form className="form card" action={createProject}>
        <span className="badge">1. Dati sito</span>
        <div className="field">
          <label htmlFor="website_url">Sito web esistente</label>
          <input id="website_url" name="website_url" placeholder="https://esempio.it" required type="text" />
        </div>
        <div className="field">
          <label htmlFor="business_name">Nome azienda</label>
          <input id="business_name" name="business_name" placeholder="Es. Studio Rossi" type="text" />
        </div>
        <div className="field">
          <label htmlFor="industry">Settore</label>
          <input id="industry" name="industry" placeholder="Es. consulenza, ristorante, edilizia" type="text" />
        </div>
        <div className="field">
          <label htmlFor="goal">Obiettivo del nuovo sito</label>
          <textarea id="goal" name="goal" placeholder="Es. ricevere piu richieste di preventivo, rendere il sito piu moderno, spiegare meglio i servizi" />
        </div>

        {!user ? (
          <>
            <span className="badge">2. Dati accesso</span>
            <div className="grid two">
              <div className="field">
                <label htmlFor="full_name">Nome</label>
                <input id="full_name" name="full_name" placeholder="Mario Rossi" type="text" />
              </div>
              <div className="field">
                <label htmlFor="email">Email</label>
                <input id="email" name="email" placeholder="nome@email.it" required type="email" />
              </div>
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input id="password" name="password" required minLength={8} type="password" />
            </div>
          </>
        ) : (
          <p className="notice">Progetto salvato come {user.email}.</p>
        )}

        <button className="button" type="submit">
          <Globe2 size={18} />
          Crea progetto e continua
        </button>
      </form>
    </main>
  );
}
