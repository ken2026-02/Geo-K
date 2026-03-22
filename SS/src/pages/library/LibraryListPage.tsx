import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { useDatabaseRuntime } from "../../data/db/DatabaseContext";
import { AppShell } from "../../shared/ui/layout/AppShell";
import { LibraryService, type LibrarySection } from "../../services/library/libraryService";
import type { GeoBrowseSort, LibraryListItem } from "../../data/repositories/sqlite/approvedLibraryRepository";

const sectionLabels: Record<LibrarySection, string> = {
  words: "Words",
  phrases: "Phrases",
  sentences: "Sentences",
  "geo-materials": "Geo Materials",
  features: "Features"
};

function isSection(value: string): value is LibrarySection {
  return value === "words" || value === "phrases" || value === "sentences" || value === "geo-materials" || value === "features";
}

function isGeoSection(value: LibrarySection): value is "geo-materials" | "features" {
  return value === "geo-materials" || value === "features";
}

function toProvenanceLabel(provenanceType?: string): string {
  switch (provenanceType) {
    case "system_generated":
      return "System Reference";
    case "imported_ai":
      return "User Imported";
    case "manual_user":
      return "User Manual";
    case "merged":
      return "Merged";
    default:
      return "Unknown Provenance";
  }
}

function provenanceBadgeStyle(provenanceType?: string): { background: string; color: string; border: string } {
  if (provenanceType === "system_generated") {
    return { background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe" };
  }
  if (provenanceType === "imported_ai" || provenanceType === "manual_user" || provenanceType === "merged") {
    return { background: "#ecfdf5", color: "#065f46", border: "1px solid #a7f3d0" };
  }
  return { background: "#f9fafb", color: "#4b5563", border: "1px solid #e5e7eb" };
}

function previewSnippet(item: LibraryListItem): string {
  const description = item.description?.trim();
  if (!description) {
    return "Open detail for identification cues, engineering context, related knowledge, and source traceability.";
  }

  if (description.length <= 180) {
    return description;
  }

  return `${description.slice(0, 177)}...`;
}

function groupGeoItems(items: LibraryListItem[], sortBy: GeoBrowseSort): Array<{ key: string; label: string; items: LibraryListItem[] }> {
  if (sortBy === "recent" || sortBy === "name") {
    return [{ key: "all", label: sortBy === "recent" ? "Most Recent" : "A-Z", items }];
  }

  const grouped = new Map<string, LibraryListItem[]>();
  for (const item of items) {
    const rawLabel = sortBy === "subtype"
      ? item.subtype ?? "Unspecified subtype"
      : item.category ?? "Unspecified category";

    if (!grouped.has(rawLabel)) {
      grouped.set(rawLabel, []);
    }
    grouped.get(rawLabel)?.push(item);
  }

  return Array.from(grouped.entries()).map(([rawLabel, groupedItems]) => ({
    key: rawLabel,
    label: sortBy === "subtype" ? `Subtype: ${rawLabel}` : `Category: ${rawLabel}`,
    items: groupedItems
  }));
}

export function LibraryListPage() {
  const { section = "" } = useParams();
  const { db } = useDatabaseRuntime();
  const service = useMemo(() => new LibraryService(), []);

  const validSection = isSection(section) ? section : undefined;
  const [categoryFilter, setCategoryFilter] = useState("");
  const [subtypeFilter, setSubtypeFilter] = useState("");
  const [sortBy, setSortBy] = useState<GeoBrowseSort>("category");

  const geoBrowse = validSection && isGeoSection(validSection)
    ? service.getGeoBrowseData(db, validSection, {
        category: categoryFilter || undefined,
        subtype: subtypeFilter || undefined,
        sortBy
      })
    : undefined;

  const items = validSection
    ? geoBrowse?.items ?? service.listBySection(db, validSection)
    : [];

  const groupedItems = validSection && isGeoSection(validSection)
    ? groupGeoItems(items, sortBy)
    : [{ key: "all", label: "Results", items }];

  if (!validSection) {
    return (
      <AppShell title="Library" subtitle="Invalid section.">
        <p>Unknown library section.</p>
        <Link to="/library">Back to Library</Link>
      </AppShell>
    );
  }

  return (
    <AppShell title={sectionLabels[validSection]} subtitle={isGeoSection(validSection) ? "Approved geo knowledge with filters, grouping, provenance, and concise previews." : "Approved items only."}>
      <p><Link to="/library">Back to Library Home</Link></p>

      {validSection && isGeoSection(validSection) ? (
        <section style={{ border: "1px solid #dbeafe", borderRadius: "0.75rem", padding: "0.75rem", background: "#eff6ff", marginBottom: "1rem" }}>
          <h3 style={{ marginTop: 0, marginBottom: "0.4rem" }}>Finding And Layer Guidance</h3>
          <p style={{ margin: "0 0 0.35rem", color: "#1f2937" }}>
            Start with Category/Subtype to narrow candidates, open detail pages for engineering context, then use Personal Engineering Notes for item-specific site context.
          </p>
          <p style={{ margin: 0, color: "#4b5563", fontSize: "0.92rem" }}>
            Provenance labels: System Reference = built-in baseline. User Imported/User Manual/Merged = approved user-owned content. Personal notes are only shown on detail pages.
          </p>
        </section>
      ) : null}

      {validSection && isGeoSection(validSection) ? (
        <section style={{ border: "1px solid #e5e7eb", borderRadius: "0.75rem", padding: "0.75rem", background: "#fff", marginBottom: "1rem" }}>
          <h3 style={{ marginTop: 0 }}>Browse Controls</h3>
          <div style={{ display: "grid", gap: "0.75rem", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
            <label style={{ display: "grid", gap: "0.35rem" }}>
              <span>Category</span>
              <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
                <option value="">All categories</option>
                {geoBrowse?.filterOptions.categories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </label>
            <label style={{ display: "grid", gap: "0.35rem" }}>
              <span>Subtype</span>
              <select value={subtypeFilter} onChange={(event) => setSubtypeFilter(event.target.value)}>
                <option value="">All subtypes</option>
                {geoBrowse?.filterOptions.subtypes.map((subtype) => (
                  <option key={subtype} value={subtype}>{subtype}</option>
                ))}
              </select>
            </label>
            <label style={{ display: "grid", gap: "0.35rem" }}>
              <span>Sort / Group</span>
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value as GeoBrowseSort)}>
                <option value="category">Category</option>
                <option value="subtype">Subtype</option>
                <option value="name">Name</option>
                <option value="recent">Most recent</option>
              </select>
            </label>
          </div>
          <p style={{ margin: "0.75rem 0 0", color: "#4b5563" }}>
            Showing {items.length} approved item(s). Use provenance badges to distinguish system reference vs user/imported entries.
          </p>
        </section>
      ) : null}

      {items.length === 0 ? (
        <section style={{ border: "1px solid #e5e7eb", borderRadius: "0.75rem", padding: "0.85rem", background: "#fff" }}>
          <p style={{ margin: 0 }}>
            No approved items match the current filters. Try clearing category/subtype filters or switching grouping mode.
          </p>
          {isGeoSection(validSection) ? (
            <p style={{ margin: "0.45rem 0 0", color: "#6b7280", fontSize: "0.9rem" }}>
              If you still cannot find an item, check whether it is pending review in Inbox or only captured as a personal note on a detail page.
            </p>
          ) : null}
        </section>
      ) : null}

      <div style={{ display: "grid", gap: "1rem" }}>
        {groupedItems.map((group) => (
          <section key={group.key}>
            {validSection && isGeoSection(validSection) && groupedItems.length > 1 ? <h3 style={{ marginBottom: "0.5rem" }}>{group.label}</h3> : null}
            <ul style={{ display: "grid", gap: "0.6rem", padding: 0, listStyle: "none", margin: 0 }}>
              {group.items.map((item) => {
                const badgeStyle = provenanceBadgeStyle(item.provenanceType);
                return (
                  <li key={item.id} style={{ border: "1px solid #e5e7eb", borderRadius: "0.75rem", padding: "0.75rem", background: "#fff" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", flexWrap: "wrap" }}>
                      <Link to={`/library/${validSection}/${item.id}`} style={{ fontWeight: 600 }}>{item.title}</Link>
                      {isGeoSection(validSection) ? (
                        <span style={{ padding: "0.15rem 0.45rem", borderRadius: "999px", fontSize: "0.78rem", ...badgeStyle }}>
                          {toProvenanceLabel(item.provenanceType)}
                        </span>
                      ) : null}
                    </div>
                    <p style={{ margin: "0.35rem 0 0", color: "#4b5563", fontSize: "0.92rem" }}>{item.subtitle ?? "No secondary label"}</p>
                    {validSection && isGeoSection(validSection) ? (
                      <p style={{ margin: "0.35rem 0 0", color: "#111827", fontSize: "0.92rem" }}>{previewSnippet(item)}</p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </AppShell>
  );
}
