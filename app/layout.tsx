import type { Metadata } from "next";
import Link from "next/link";
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
            <nav className="nav">
              <Link className="button ghost" href="/dashboard">
                Dashboard
              </Link>
              <Link className="button secondary" href="/login">
                Accedi
              </Link>
              <form action={logout}>
                <button className="button ghost" type="submit">
                  Esci
                </button>
              </form>
            </nav>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
