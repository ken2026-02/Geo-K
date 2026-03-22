import type { LearningItemRecord, LearningItemStatus, LearningItemType } from "../../data/repositories/interfaces";

export const suggestedLearningDomains = [
  "geology",
  "slope",
  "support",
  "blasting",
  "weathering",
  "groundwater",
  "classification",
  "testing",
  "compliance",
  "standards",
  "reporting",
  "safety"
] as const;

export const learningItemStatuses = ["new", "learning", "reviewed", "ignored"] as const;

export interface LearningItemFilterOptions {
  type?: LearningItemType | "all";
  domain?: string | "all";
  status?: LearningItemStatus | "all";
  searchText?: string;
}

export function normalizeLearningDomain(value?: string): string | undefined {
  const trimmed = value?.trim().toLowerCase();
  return trimmed ? trimmed : undefined;
}

export function normalizeLearningStatus(value?: string): LearningItemStatus | undefined {
  const trimmed = value?.trim().toLowerCase();
  return learningItemStatuses.find((status) => status === trimmed) as LearningItemStatus | undefined;
}

export function getLearningStatus(value?: string): LearningItemStatus {
  return normalizeLearningStatus(value) ?? "new";
}

export function normalizeLearningTags(tags?: string[]): string[] | undefined {
  if (!tags) {
    return undefined;
  }

  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const tag of tags) {
    const trimmed = tag.trim();
    if (!trimmed) {
      continue;
    }

    const key = trimmed.toLowerCase();
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    normalized.push(trimmed);
  }

  return normalized.length > 0 ? normalized : undefined;
}

export function mergeLearningTags(current?: string[], defaults?: string[]): string[] | undefined {
  return normalizeLearningTags([...(current ?? []), ...(defaults ?? [])]);
}

export function tagsToCsv(tags?: string[]): string {
  return tags?.join(", ") ?? "";
}

export function parseTagsCsv(tagsCsv: string): string[] | undefined {
  return normalizeLearningTags(tagsCsv.split(","));
}

export function buildLearningDomainOptions(domains: Array<string | undefined>): string[] {
  const ordered = [...suggestedLearningDomains, ...domains];
  const seen = new Set<string>();
  const options: string[] = [];

  for (const domain of ordered) {
    const normalized = normalizeLearningDomain(domain);
    if (!normalized || seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    options.push(normalized);
  }

  return options;
}

export function matchesLearningSearch(item: LearningItemRecord, searchText: string): boolean {
  if (!searchText) {
    return true;
  }

  const haystack = [
    item.content,
    item.meaning,
    item.example,
    item.note,
    item.sourceReport,
    item.tags?.join(" ")
  ]
    .filter((value): value is string => Boolean(value))
    .join("\n")
    .toLowerCase();

  return haystack.includes(searchText);
}

export function filterLearningItems(items: LearningItemRecord[], options: LearningItemFilterOptions): LearningItemRecord[] {
  return items.filter((item) => {
    const typeMatches = !options.type || options.type === "all" || item.type === options.type;
    const domainMatches = !options.domain || options.domain === "all" || item.domain === options.domain;
    const statusMatches = !options.status || options.status === "all" || getLearningStatus(item.status) === options.status;
    return typeMatches && domainMatches && statusMatches && matchesLearningSearch(item, options.searchText?.trim().toLowerCase() ?? "");
  });
}
