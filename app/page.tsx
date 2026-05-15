import Link from "next/link";
import { ArrowRight, CheckCircle2, FileSearch, ReceiptText, Sparkles, Wand2 } from "lucide-react";

export default function Home() {
  return (
    <main>
      <section className="home-hero">
        <div className="hero-copy">
          <div className="pcs-mark" aria-label="PCS AI Artificial Intelligence">
            <span>PCS</span>
            <i />
            <strong>AI</strong>
            <small>ARTIFICIAL INTELLIGENCE</small>
          </div>
          <span className="badge glow">powered by PCS AI</span>
          <h1>Trasforma il tuo sito in pochi passaggi</h1>
          <p className="lead">
            Inserisci l&apos;URL del tuo sito e ricevi due proposte di restyling pensate a partire dalla tua identita
            attuale. Scegli la direzione che preferisci e conferma il preventivo direttamente dalla dashboard.
          </p>
          <div className="toolbar">
            <Link className="button" href="/new-project">
              <Sparkles size={18} />
              Inizia un nuovo progetto
            </Link>
            <Link className="button secondary" href="/dashboard">
              Dashboard
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>

        <div className="ai-orbit" aria-hidden="true">
          <div className="orbit-core">
            <Wand2 size={54} />
            <span>RESTYLE</span>
          </div>
          <div className="orbit-ring ring-one" />
          <div className="orbit-ring ring-two" />
          <div className="orbit-node node-a">
            <FileSearch size={28} />
            <span>Analisi</span>
          </div>
          <div className="orbit-node node-b">
            <Sparkles size={28} />
            <span>2 Proposte</span>
          </div>
          <div className="orbit-node node-c">
            <ReceiptText size={28} />
            <span>Preventivo</span>
          </div>
          <div className="orbit-node node-d">
            <CheckCircle2 size={28} />
            <span>Conferma</span>
          </div>
        </div>
      </section>

      <section className="process-band">
        <div className="container">
          <div className="section-heading">
            <span className="badge">Come funziona</span>
            <h2>Come funziona</h2>
          </div>
          <div className="grid three">
            <article className="card step-card">
              <span className="step-number">1</span>
              <h3>Analizziamo il tuo sito</h3>
              <p className="muted">
                Recuperiamo contenuti, struttura, stile visivo e tono di voce per capire da dove partire.
              </p>
            </article>
            <article className="card step-card">
              <span className="step-number">2</span>
              <h3>Ti mostriamo due proposte</h3>
              <p className="muted">
                Una soluzione mantiene continuita con il sito attuale, l&apos;altra propone un&apos;immagine piu moderna
                e rinnovata.
              </p>
            </article>
            <article className="card step-card">
              <span className="step-number">3</span>
              <h3>Confermi il preventivo</h3>
              <p className="muted">
                Visualizzi un prezzo chiaro, calcolato secondo regole definite, e confermi il progetto in modo tracciato.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="closing-band">
        <div className="container closing-grid">
          <div>
            <h2>Dalla tua idea al nuovo sito</h2>
            <p className="lead">
              Un processo guidato per rinnovare il tuo sito senza partire da zero: veloce, ordinato e pensato per
              aiutarti a scegliere la direzione giusta prima di iniziare lo sviluppo.
            </p>
          </div>
          <div className="closing-panel">
            <div className="signal-lines">
              <span />
              <span />
              <span />
            </div>
            <p>powered by PCS AI</p>
          </div>
        </div>
      </section>
    </main>
  );
}
