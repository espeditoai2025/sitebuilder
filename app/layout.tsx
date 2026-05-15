import type { Metadata } from "next";
import Link from "next/link";
import { canSeeAdmin } from "@/lib/admin";
import { getCurrentUser } from "@/lib/auth";
import { logout } from "./auth/actions";
import "./globals.css";

export const metadata: Metadata = {
  title: "SiteBuilder AI",
  description: "MVP per proposte AI di restyling siti web"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const userPromise = getCurrentUser().catch(() => null);

  return (
    <html lang="it">
      <body>
        <div className="shell">
          <header className="topbar">
            <Link className="brand" href="/">
              <span>PCS</span>
              <i />
              <strong>AI</strong>
            </Link>
            <Nav userPromise={userPromise} />
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}

async function Nav({ userPromise }: { userPromise: Promise<Awaited<ReturnType<typeof getCurrentUser>>> }) {
  const user = await userPromise;

  return (
    <nav className="nav">
      <Link className="button ghost" href="/dashboard">
        Dashboard
      </Link>
      {canSeeAdmin(user) ? (
        <Link className="button ghost" href="/admin">
          Admin
        </Link>
      ) : null}
      <Link className="button secondary" href="/login">
        Accedi
      </Link>
      <form action={logout}>
        <button className="button ghost" type="submit">
          Esci
        </button>
      </form>
    </nav>
  );
}
