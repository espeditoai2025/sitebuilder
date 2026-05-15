import Link from "next/link";
import { signup } from "../auth/actions";

export default async function SignupPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="container">
      <h1 className="page-title">Registrati</h1>
      <p className="lead">Crea l&apos;accesso cliente per avviare un progetto di restyling.</p>
      {params.error ? <p className="notice">{params.error}</p> : null}
      <form className="form card" action={signup}>
        <div className="field">
          <label htmlFor="full_name">Nome</label>
          <input id="full_name" name="full_name" type="text" />
        </div>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" minLength={8} required />
        </div>
        <button className="button" type="submit">
          Crea account
        </button>
      </form>
      <p className="muted">
        Hai gia un account? <Link href="/login">Accedi</Link>
      </p>
    </main>
  );
}
