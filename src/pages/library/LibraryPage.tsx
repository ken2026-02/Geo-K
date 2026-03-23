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
      <section className="mb-3 rounded-[1.35rem] border border-slate-200 bg-white p-3 shadow-sm">
        <details>
          <summary className="cursor-pointer text-[0.98rem] font-semibold text-slate-900">Quick start</summary>
          <div className="mt-2 grid gap-1.5">
            <p className="m-0 text-sm leading-6 text-slate-600">
              Open a section or search first. Use detail pages for quick reading, reusable phrases, and item-linked personal notes.
            </p>
            <p className="m-0 text-xs leading-5 text-slate-500">
              System and approved imported knowledge appear here. Personal notes stay local to each item.
            </p>
          </div>
        </details>
      </section>

      <div className="grid gap-3">
        {sections.map((section) => (
          <article key={section.id} className="rounded-[1.35rem] border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <strong className="block text-lg font-semibold text-slate-900">{section.label}</strong>
                <p className="mt-1.5 text-sm leading-6 text-slate-600">{section.description}</p>
              </div>
              <Link
                to={section.id === "search" ? "/library/search" : `/library/${section.id}`}
                className="ekv-button-primary min-h-10 shrink-0 px-3 text-sm"
              >
                Open
              </Link>
            </div>
          </article>
        ))}
      </div>
    </AppShell>
  );
}
