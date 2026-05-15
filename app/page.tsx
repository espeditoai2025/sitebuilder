import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <main className="container">
      <section className="hero">
        <div>
          <span className="badge">MVP restyling siti con AI</span>
          <h1>Trasforma un sito esistente in due proposte vendibili.</h1>
          <p className="lead">
            Il cliente inserisce il proprio URL, riceve due direzioni di restyling coerenti con il sito attuale,
            sceglie la preferita e conferma un preventivo.
          </p>
          <div className="toolbar">
            <Link className="button" href="/new-project">
              <Sparkles size={18} />
              Nuovo progetto
            </Link>
            <Link className="button secondary" href="/dashboard">
              Dashboard
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
        <div className="card">
          <div className="grid">
            <div>
              <span className="badge">01</span>
              <h3>Analisi sito</h3>
              <p className="muted">Recupero contenuti, tono e struttura principali.</p>
            </div>
            <div>
              <span className="badge">02</span>
              <h3>Due proposte</h3>
              <p className="muted">Una fedele all&apos;identita esistente, una piu moderna.</p>
            </div>
            <div>
              <span className="badge">03</span>
              <h3>Preventivo</h3>
              <p className="muted">Prezzo controllato da regole e conferma tracciata.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
