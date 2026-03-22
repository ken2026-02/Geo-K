export interface LibrarySectionDefinition {
  id: "search" | "words" | "phrases" | "sentences" | "geo-materials" | "features" | "strategies" | "favorites";
  label: string;
  description: string;
  phase1: boolean;
}

export const librarySections: LibrarySectionDefinition[] = [
  {
    id: "search",
    label: "Global Search",
    description: "Unified offline search across approved words, phrases, sentences, geo materials, features, strategies, tags, notes, and image metadata.",
    phase1: true
  },
  {
    id: "words",
    label: "Words",
    description: "Approved engineering vocabulary with linked phrases, sentences, notes, favorites, and mastery metadata.",
    phase1: true
  },
  {
    id: "phrases",
    label: "Phrases",
    description: "Reusable engineering phrases with scenario, function, related words, and source tracing.",
    phase1: true
  },
  {
    id: "sentences",
    label: "Sentences",
    description: "Report-ready sentences and reusable patterns with function, scenario, and source report traceability.",
    phase1: true
  },
  {
    id: "geo-materials",
    label: "Geo Materials",
    description: "Geotechnical material knowledge with identification methods, risks, linked features, strategies, and image gallery.",
    phase1: true
  },
  {
    id: "features",
    label: "Features",
    description: "Engineering feature and defect knowledge with causes, mitigation, reporting expressions, and linked materials.",
    phase1: true
  },
  {
    id: "strategies",
    label: "Strategies",
    description: "Identification, inspection, treatment, monitoring, and reporting strategies linked to materials, features, and sentences.",
    phase1: false
  },
  {
    id: "favorites",
    label: "Favorites",
    description: "Quick access to user-selected high-value items grouped by type and filtered by custom tags.",
    phase1: true
  }
];
