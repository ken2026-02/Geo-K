import { Link } from "react-router-dom";
import type { PropsWithChildren } from "react";

export interface AppShellProps extends PropsWithChildren {
  title: string;
  subtitle: string;
  pageDescription?: string | null;
}

const navItems = [
  { to: "/learning/import", label: "Learning" },
  { to: "/library", label: "Library" },
  { to: "/review", label: "Review" },
  { to: "/", label: "Inbox" },
  { to: "/rules", label: "Rule Center" },
  { to: "/settings", label: "Backup / Settings" }
];

export function AppShell({ title, subtitle, pageDescription, children }: AppShellProps) {
  const resolvedPageDescription = pageDescription === undefined ? subtitle : pageDescription;

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f4", color: "#111827", fontFamily: "Segoe UI, sans-serif" }}>
      <header style={{ padding: "1rem", background: "#1f2937", color: "#f9fafb" }}>
        <h1 style={{ margin: 0, fontSize: "1.25rem" }}>Engineering Knowledge Vault</h1>
        <p style={{ margin: "0.35rem 0 0", color: "#d1d5db", maxWidth: 720 }}>{subtitle}</p>
        <nav style={{ display: "flex", gap: "0.75rem", marginTop: "0.75rem", flexWrap: "wrap" }}>
          {navItems.map((item) => (
            <Link key={item.to} to={item.to} style={{ color: "#e5e7eb", textDecoration: "none" }}>
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main style={{ padding: "1rem" }}>
        <section style={{ marginBottom: "0.75rem" }}>
          <h2 style={{ margin: 0 }}>{title}</h2>
          {resolvedPageDescription ? <p style={{ margin: "0.2rem 0 0", color: "#4b5563" }}>{resolvedPageDescription}</p> : null}
        </section>
        {children}
      </main>
    </div>
  );
}
