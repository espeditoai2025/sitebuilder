import { Globe2 } from "lucide-react";
import { createProject } from "../actions";

export default async function NewProjectPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="container">
      <h1 className="page-title">Nuovo progetto</h1>
      <p className="lead">Inserisci il sito esistente. L&apos;app usera URL, contesto e obiettivo per generare 2 direzioni di restyling.</p>
      {params.error ? <p className="notice">{params.error}</p> : null}
      <form className="form card" action={createProject}>
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
        <button className="button" type="submit">
          <Globe2 size={18} />
          Crea progetto
        </button>
      </form>
    </main>
  );
}
