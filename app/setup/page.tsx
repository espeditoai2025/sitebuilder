export default function SetupPage() {
  return (
    <main className="container">
      <span className="badge">Configurazione richiesta</span>
      <h1 className="page-title">Collega Neon</h1>
      <p className="lead">
        L&apos;app e online, ma per usare login, dashboard e progetti devi aggiungere le variabili Neon su Vercel.
      </p>
      <section className="card">
        <h2>Variabili necessarie</h2>
        <ul>
          <li>
            <code>DATABASE_URL</code>
          </li>
        </ul>
        <p className="muted">
          Dopo averla aggiunta in Vercel, esegui un nuovo deploy. Le tabelle Neon sono in <code>neon/schema.sql</code>.
        </p>
      </section>
    </main>
  );
}
