export default function SetupPage() {
  return (
    <main className="container">
      <span className="badge">Configurazione richiesta</span>
      <h1 className="page-title">Collega Supabase</h1>
      <p className="lead">
        L&apos;app e online, ma per usare login, dashboard e progetti devi aggiungere le variabili Supabase su Vercel.
      </p>
      <section className="card">
        <h2>Variabili necessarie</h2>
        <ul>
          <li>
            <code>NEXT_PUBLIC_SUPABASE_URL</code>
          </li>
          <li>
            <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>
          </li>
        </ul>
        <p className="muted">
          Dopo averle aggiunte in Vercel, esegui un nuovo deploy. Le tabelle Supabase sono in <code>supabase/schema.sql</code>.
        </p>
      </section>
    </main>
  );
}
