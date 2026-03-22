import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { useDatabaseRuntime } from "../../data/db/DatabaseContext";
import { InlineInfo } from "../../shared/ui/feedback/InlineInfo";
import { AppShell } from "../../shared/ui/layout/AppShell";
import { ApprovedSearchService } from "../../services/search/approvedSearchService";
import type { SearchItemType } from "../../data/repositories/sqlite/approvedSearchRepository";

type ItemTypeFilter = "all" | SearchItemType;

const groupOrder: Array<{ key: SearchItemType; label: string }> = [
  { key: "word", label: "Words" },
  { key: "phrase", label: "Phrases" },
  { key: "sentence", label: "Sentences" },
  { key: "requirement", label: "Requirements" },
  { key: "method", label: "Methods" },
  { key: "geo_material", label: "Geo Materials" },
  { key: "geo_feature", label: "Features" }
];

export function LibrarySearchPage() {
  const { db } = useDatabaseRuntime();
  const searchService = new ApprovedSearchService();

  const options = useMemo(() => searchService.getFilterOptions(db), [db]);

  const [queryText, setQueryText] = useState("");
  const [itemType, setItemType] = useState<ItemTypeFilter>("all");
  const [category, setCategory] = useState("all");
  const [functionType, setFunctionType] = useState("all");
  const [scenarioType, setScenarioType] = useState("all");

  const result = useMemo(
    () =>
      searchService.search(db, {
        queryText,
        itemType,
        category: category === "all" ? undefined : category,
        functionType: functionType === "all" ? undefined : functionType,
        scenarioType: scenarioType === "all" ? undefined : scenarioType
      }),
    [db, queryText, itemType, category, functionType, scenarioType]
  );

  return (
    <AppShell title="Library Search" subtitle="Search approved knowledge." pageDescription={null}>
      <p><Link to="/library">Back to Library</Link></p>

      <section style={{ border: "1px solid #e5e7eb", borderRadius: "0.75rem", padding: "0.75rem", marginBottom: "1rem", background: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
          <h3 style={{ margin: 0 }}>Search Filters</h3>
          <InlineInfo title="Library search">
            Search covers approved library items only, including requirements and methods. Personal notes stay inside each item detail page.
          </InlineInfo>
        </div>
        <div style={{ display: "grid", gap: "0.5rem" }}>
          <label>
            Query
            <input value={queryText} onChange={(event) => setQueryText(event.target.value)} placeholder="Search normalized approved text" style={{ width: "100%" }} />
          </label>
          <label>
            Item Type
            <select value={itemType} onChange={(event) => setItemType(event.target.value as ItemTypeFilter)} style={{ width: "100%" }}>
              <option value="all">All</option>
              {groupOrder.map((group) => (
                <option key={group.key} value={group.key}>{group.label}</option>
              ))}
            </select>
          </label>
          <label>
            Category
            <select value={category} onChange={(event) => setCategory(event.target.value)} style={{ width: "100%" }}>
              <option value="all">All</option>
              {options.categories.map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </label>
          <label>
            Function Type
            <select value={functionType} onChange={(event) => setFunctionType(event.target.value)} style={{ width: "100%" }}>
              <option value="all">All</option>
              {options.functionTypes.map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </label>
          <label>
            Scenario Type
            <select value={scenarioType} onChange={(event) => setScenarioType(event.target.value)} style={{ width: "100%" }}>
              <option value="all">All</option>
              {options.scenarioTypes.map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </label>
        </div>
        <p style={{ marginBottom: 0, color: "#4b5563" }}>Total results: {result.total}</p>
      </section>

      <div style={{ display: "grid", gap: "1rem" }}>
        {groupOrder.map((group) => {
          const groupItems = result.grouped[group.key];
          if (groupItems.length === 0) {
            return null;
          }

          return (
            <section key={group.key}>
              <h3 style={{ marginBottom: "0.5rem" }}>{group.label} ({groupItems.length})</h3>
              <div style={{ display: "grid", gap: "0.5rem" }}>
                {groupItems.map((item) => (
                  <article key={`${item.itemType}-${item.itemId}`} style={{ border: "1px solid #e5e7eb", borderRadius: "0.75rem", padding: "0.75rem", background: "#fff" }}>
                    <Link to={searchService.getDetailPath(item.itemType, item.itemId)} style={{ display: "block", fontWeight: 600, paddingBottom: "0.25rem" }}>{item.title}</Link>
                    <p style={{ margin: "0.3rem 0 0", color: "#4b5563" }}>{item.snippet ?? "No snippet"}</p>
                    <p style={{ margin: "0.25rem 0 0", color: "#4b5563" }}>
                      category: {item.category ?? "N/A"} | function / authority: {item.functionType ?? "N/A"} | scenario / jurisdiction: {item.scenarioType ?? "N/A"}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </AppShell>
  );
}
