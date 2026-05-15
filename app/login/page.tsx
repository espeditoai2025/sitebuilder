import Link from "next/link";
import { login } from "../auth/actions";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="container">
      <h1 className="page-title">Accedi</h1>
      <p className="lead">Entra per creare progetti, generare proposte e confermare preventivi.</p>
      {params.error ? <p className="notice">{params.error}</p> : null}
      <form className="form card" action={login}>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" required />
        </div>
        <button className="button" type="submit">
          Accedi
        </button>
      </form>
      <p className="muted">
        Non hai un account? <Link href="/signup">Registrati</Link>
      </p>
    </main>
  );
}
