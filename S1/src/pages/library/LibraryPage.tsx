import { Link } from "react-router-dom";

import { AppShell } from "../../shared/ui/layout/AppShell";

const sections = [
  { id: "search", label: "Search", description: "Global approved-library search with local filters." },
  { id: "words", label: "Words", description: "Approved vocabulary entries." },
  { id: "phrases", label: "Phrases", description: "Approved engineering phrases." },
  { id: "sentences", label: "Sentences", description: "Approved report-ready sentences." },
  { id: "requirements", label: "Requirements", description: "Approved requirements distilled from standards and manuals." },
  { id: "methods", label: "Methods", description: "Approved methods, workflows, and verification procedures." },
  { id: "geo-materials", label: "Geo Materials", description: "Approved geotechnical materials." },
  { id: "features", label: "Features", description: "Approved geo features and defects." }
] as const;

export function LibraryPage() {
  return (
    <AppShell title="Library" subtitle="Browse approved knowledge." pageDescription={null}>
      <section style={{ border: "1px solid #e5e7eb", borderRadius: "0.75rem", background: "#ffffff", padding: "0.8rem", marginBottom: "0.9rem" }}>
        <details>
          <summary style={{ cursor: "pointer", fontSize: "0.98rem", fontWeight: 700, color: "#0f172a" }}>Quick start</summary>
          <div style={{ display: "grid", gap: "0.35rem", marginTop: "0.55rem" }}>
            <p style={{ margin: 0, color: "#475569", lineHeight: 1.45 }}>
              Open a section or search first. Use detail pages for quick reading, reusable phrases, and item-linked personal notes.
            </p>
            <p style={{ margin: 0, color: "#64748b", fontSize: "0.9rem", lineHeight: 1.4 }}>
              System and approved imported knowledge appear here. Personal notes stay local to each item.
            </p>
          </div>
        </details>
      </section>

      <div style={{ display: "grid", gap: "0.75rem" }}>
        {sections.map((section) => (
          <article key={section.id} style={{ padding: "0.75rem", background: "#ffffff", borderRadius: "0.75rem", border: "1px solid #e5e7eb" }}>
            <strong>{section.label}</strong>
            <p style={{ margin: "0.35rem 0 0", color: "#64748b", fontSize: "0.95rem" }}>{section.description}</p>
            <Link to={section.id === "search" ? "/library/search" : `/library/${section.id}`} style={{ display: "inline-block", padding: "0.5rem 1rem", background: "#2563eb", color: "#fff", textDecoration: "none", borderRadius: "0.5rem", marginTop: "0.5rem" }}>Open {section.label}</Link>
          </article>
        ))}
      </div>
    </AppShell>
  );
}
