import { Link } from "react-router-dom";

import { AppShell } from "../../shared/ui/layout/AppShell";

const sections = [
  { id: "search", label: "Search", description: "Global approved-library search with local filters." },
  { id: "words", label: "Words", description: "Approved vocabulary entries." },
  { id: "phrases", label: "Phrases", description: "Approved engineering phrases." },
  { id: "sentences", label: "Sentences", description: "Approved report-ready sentences." },
  { id: "geo-materials", label: "Geo Materials", description: "Approved geotechnical materials." },
  { id: "features", label: "Features", description: "Approved geo features and defects." }
] as const;

export function LibraryPage() {
  return (
    <AppShell title="Library" subtitle="Approved library browsing for Phase 1E/1F.">
      <section style={{ border: "1px solid #e5e7eb", borderRadius: "0.75rem", background: "#ffffff", padding: "0.85rem", marginBottom: "0.9rem" }}>
        <h3 style={{ marginTop: 0, marginBottom: "0.45rem" }}>How To Use This MVP</h3>
        <p style={{ margin: "0 0 0.45rem", color: "#374151" }}>
          Browse or search approved geo items, open detail pages for quick engineering reading, reuse reporting phrases, then capture item-linked personal notes.
        </p>
        <p style={{ margin: "0 0 0.35rem", color: "#4b5563" }}>
          Layer boundaries: System Reference = built-in baseline, User Imported = approved external knowledge, Personal Notes = local item-linked notes only.
        </p>
        <p style={{ margin: 0, color: "#6b7280", fontSize: "0.9rem" }}>
          Not yet implemented: personal note photos, global personal-note search, and personal-note cross-item linking.
        </p>
      </section>

      <div style={{ display: "grid", gap: "0.75rem" }}>
        {sections.map((section) => (
          <article key={section.id} style={{ padding: "0.75rem", background: "#ffffff", borderRadius: "0.75rem", border: "1px solid #e5e7eb" }}>
            <strong>{section.label}</strong>
            <p style={{ margin: "0.5rem 0", color: "#4b5563" }}>{section.description}</p>
            <Link to={section.id === "search" ? "/library/search" : `/library/${section.id}`}>Open {section.label}</Link>
          </article>
        ))}
      </div>

      <section style={{ border: "1px solid #dbeafe", borderRadius: "0.75rem", background: "#eff6ff", padding: "0.85rem", marginTop: "0.9rem" }}>
        <h3 style={{ marginTop: 0, marginBottom: "0.45rem" }}>MVP Verification Checklist</h3>
        <ol style={{ margin: 0, paddingLeft: "1.15rem", display: "grid", gap: "0.3rem" }}>
          <li>Search or browse to a geo material or geo feature.</li>
          <li>Open detail and read the quick engineering view block.</li>
          <li>Reuse a reporting expression/inspection phrase from the copy-ready section.</li>
          <li>Add or update a personal engineering note for the same item.</li>
          <li>Archive then restore a note to confirm personal-note lifecycle behavior.</li>
          <li>Check provenance/source labels to distinguish approved knowledge from personal notes.</li>
        </ol>
      </section>
    </AppShell>
  );
}
