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
      <div className="mb-4">
        <Link to="/library" className="ekv-button-compact">
          Back to Library
        </Link>
      </div>

      <section className="ekv-card mb-4 p-3 sm:p-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <h3 className="m-0 text-lg font-semibold text-slate-900">Search Filters</h3>
          <InlineInfo title="Library search">
            Search covers approved library items only, including requirements and methods. Personal notes stay inside each item detail page.
          </InlineInfo>
        </div>
        <div className="grid gap-2.5">
          <label className="grid gap-1.5">
            <span className="ekv-label">Query</span>
            <input value={queryText} onChange={(event) => setQueryText(event.target.value)} placeholder="Search normalized approved text" className="ekv-input" />
          </label>
          <details className="rounded-2xl border border-slate-200 bg-slate-50">
            <summary className="cursor-pointer px-3.5 py-2.5 text-sm font-semibold text-slate-800">More filters</summary>
            <div className="grid gap-2.5 px-3.5 pb-3.5 sm:grid-cols-2">
              <label className="grid gap-1.5">
                <span className="ekv-label">Item Type</span>
                <select value={itemType} onChange={(event) => setItemType(event.target.value as ItemTypeFilter)} className="ekv-select">
                  <option value="all">All</option>
                  {groupOrder.map((group) => (
                    <option key={group.key} value={group.key}>{group.label}</option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1.5">
                <span className="ekv-label">Category</span>
                <select value={category} onChange={(event) => setCategory(event.target.value)} className="ekv-select">
                  <option value="all">All</option>
                  {options.categories.map((value) => (
                    <option key={value} value={value}>{value}</option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1.5">
                <span className="ekv-label">Function Type</span>
                <select value={functionType} onChange={(event) => setFunctionType(event.target.value)} className="ekv-select">
                  <option value="all">All</option>
                  {options.functionTypes.map((value) => (
                    <option key={value} value={value}>{value}</option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1.5">
                <span className="ekv-label">Scenario Type</span>
                <select value={scenarioType} onChange={(event) => setScenarioType(event.target.value)} className="ekv-select">
                  <option value="all">All</option>
                  {options.scenarioTypes.map((value) => (
                    <option key={value} value={value}>{value}</option>
                  ))}
                </select>
              </label>
            </div>
          </details>
        </div>
        <p className="mt-3 mb-0 text-sm text-slate-500">Total results: {result.total}</p>
      </section>

      <div className="grid gap-4">
        {groupOrder.map((group) => {
          const groupItems = result.grouped[group.key];
          if (groupItems.length === 0) {
            return null;
          }

          return (
            <section key={group.key}>
              <div className="mb-2 flex items-center gap-2">
                <h3 className="m-0 text-lg font-semibold text-slate-900">{group.label}</h3>
                <span className="text-sm text-slate-500">({groupItems.length})</span>
              </div>
              <div className="grid gap-2.5">
                {groupItems.map((item) => (
                  <article key={`${item.itemType}-${item.itemId}`} className="ekv-card rounded-[1.35rem] p-3">
                    <Link to={searchService.getDetailPath(item.itemType, item.itemId)} className="block text-[1.02rem] font-semibold leading-6 text-slate-900 hover:text-indigo-700">
                      {item.title}
                    </Link>
                    <p className="mt-1.5 text-sm leading-6 text-slate-600">
                      {item.snippet ?? "No snippet"}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {item.category ? <span className="ekv-chip bg-slate-100 text-slate-700 ring-1 ring-slate-200">{item.category}</span> : null}
                      {item.functionType ? <span className="ekv-chip bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200">{item.functionType}</span> : null}
                      {item.scenarioType ? <span className="ekv-chip bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200">{item.scenarioType}</span> : null}
                    </div>
                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      authority: {item.functionType ?? "N/A"} | jurisdiction: {item.scenarioType ?? "N/A"}
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
