import { Link, useLocation } from "react-router-dom";
import type { PropsWithChildren } from "react";

export interface AppShellProps extends PropsWithChildren {
  title: string;
  subtitle: string;
  pageDescription?: string | null;
}

const navItems = [
  { to: "/learning/import", label: "Learning", shortLabel: "Learn" },
  { to: "/inbox", label: "Inbox", shortLabel: "Inbox" },
  { to: "/library", label: "Library", shortLabel: "Library" },
  { to: "/review", label: "Review", shortLabel: "Review" },
  { to: "/settings", label: "Settings", shortLabel: "Settings" }
] as const;

function isActivePath(currentPath: string, itemPath: string): boolean {
  return currentPath === itemPath || currentPath.startsWith(`${itemPath}/`);
}

export function AppShell({ title, subtitle, pageDescription, children }: AppShellProps) {
  const location = useLocation();
  const resolvedPageDescription = pageDescription ?? null;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #f8fafc 0%, #f8fafc 180px, #f1f5f9 100%)",
        color: "#0f172a",
        fontFamily: "\"Segoe UI\", system-ui, sans-serif",
        paddingBottom: "calc(5.5rem + env(safe-area-inset-bottom, 0px))"
      }}
    >
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 30,
          backdropFilter: "blur(12px)",
          background: "rgba(15, 23, 42, 0.9)",
          borderBottom: "1px solid rgba(148, 163, 184, 0.18)"
        }}
      >
        <div style={{ maxWidth: "1120px", margin: "0 auto", padding: "1rem 1rem 0.9rem" }}>
          <div style={{ display: "flex", gap: "0.8rem", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 320px" }}>
              <div style={{ color: "#93c5fd", fontSize: "0.8rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Engineering Knowledge Vault
              </div>
              <p className="app-shell-header-subtitle" style={{ margin: "0.4rem 0 0", color: "#cbd5e1", maxWidth: "680px", lineHeight: 1.4, fontSize: "0.95rem" }}>{subtitle}</p>
            </div>
            <Link
              to="/audit"
              className="app-shell-audit-link"
              style={{
                padding: "0.68rem 0.95rem",
                borderRadius: "0.8rem",
                background: isActivePath(location.pathname, "/audit") ? "#2563eb" : "rgba(148, 163, 184, 0.14)",
                color: "#f8fafc",
                textDecoration: "none",
                fontWeight: 700,
                border: "1px solid rgba(148, 163, 184, 0.18)",
                maxWidth: "100%"
              }}
            >
              Audit
            </Link>
          </div>

          <nav
            aria-label="Primary navigation"
            style={{
              display: "flex",
              gap: "0.55rem",
              flexWrap: "wrap",
              marginTop: "0.9rem"
            }}
            className="app-shell-desktop-nav"
          >
            {navItems.map((item) => {
              const active = isActivePath(location.pathname, item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  style={{
                    padding: "0.62rem 0.95rem",
                    borderRadius: "0.8rem",
                    textDecoration: "none",
                    fontWeight: 700,
                    color: active ? "#0f172a" : "#e2e8f0",
                    background: active ? "#f8fafc" : "rgba(255, 255, 255, 0.08)",
                    border: active ? "1px solid rgba(255, 255, 255, 0.9)" : "1px solid rgba(148, 163, 184, 0.14)"
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main style={{ maxWidth: "1120px", margin: "0 auto", padding: "1rem" }}>
        <section
          style={{
            marginBottom: "1rem",
            padding: "1rem",
            borderRadius: "1rem",
            background: "rgba(255, 255, 255, 0.84)",
            border: "1px solid rgba(203, 213, 225, 0.8)",
            boxShadow: "0 10px 30px rgba(15, 23, 42, 0.05)"
          }}
        >
          <h1 style={{ margin: 0, fontSize: "clamp(1.5rem, 4vw, 2rem)", lineHeight: 1.15, letterSpacing: "-0.03em" }}>{title}</h1>
          {resolvedPageDescription ? (
            <p style={{ margin: "0.45rem 0 0", color: "#475569", lineHeight: 1.6, maxWidth: "780px" }}>{resolvedPageDescription}</p>
          ) : null}
        </section>

        {children}
      </main>

      <nav
        aria-label="Mobile primary navigation"
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 40,
          display: "grid",
          gridTemplateColumns: `repeat(${navItems.length}, minmax(0, 1fr))`,
          gap: "0.2rem",
          padding: "0.45rem 0.45rem calc(0.45rem + env(safe-area-inset-bottom, 0px))",
          background: "rgba(255, 255, 255, 0.96)",
          borderTop: "1px solid rgba(203, 213, 225, 0.9)",
          boxShadow: "0 -8px 24px rgba(15, 23, 42, 0.08)"
        }}
        className="app-shell-mobile-nav"
      >
        {navItems.map((item) => {
          const active = isActivePath(location.pathname, item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              style={{
                minWidth: 0,
                padding: "0.62rem 0.2rem",
                borderRadius: "0.75rem",
                textAlign: "center",
                textDecoration: "none",
                fontSize: "0.72rem",
                fontWeight: 800,
                letterSpacing: "0.01em",
                color: active ? "#1d4ed8" : "#475569",
                background: active ? "#dbeafe" : "transparent"
              }}
            >
              {item.shortLabel}
            </Link>
          );
        })}
      </nav>

      <style>{`
        * {
          box-sizing: border-box;
        }
        html, body, #root {
          margin: 0;
          min-height: 100%;
          width: 100%;
          overflow-x: hidden;
        }
        a, button, input, select, textarea {
          font-family: inherit;
        }
        p, li, a, strong, span, code {
          overflow-wrap: anywhere;
          word-break: break-word;
        }
        button, input, select, textarea {
          max-width: 100%;
        }
        button {
          min-height: 44px;
          cursor: pointer;
        }
        input:not([type="checkbox"]):not([type="radio"]), select, textarea {
          min-height: 44px;
          width: 100%;
          border: 1px solid #cbd5e1;
          border-radius: 0.75rem;
          padding: 0.7rem 0.85rem;
          background: #fff;
          color: #0f172a;
        }
        input[type="checkbox"], input[type="radio"] {
          width: 1rem;
          height: 1rem;
          min-height: 0;
          margin: 0;
          accent-color: #2563eb;
        }
        textarea {
          min-height: 120px;
          resize: vertical;
        }
        @media (min-width: 880px) {
          .app-shell-mobile-nav {
            display: none !important;
          }
        }
        @media (max-width: 879px) {
          .app-shell-desktop-nav {
            display: none !important;
          }
          .app-shell-audit-link {
            display: none !important;
          }
        }
        @media (max-width: 640px) {
          .app-shell-header-subtitle {
            font-size: 0.88rem !important;
            line-height: 1.35 !important;
            max-width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
}
