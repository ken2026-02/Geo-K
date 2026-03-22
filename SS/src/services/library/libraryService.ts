import type { Database } from "sql.js";

import { getBlob } from "../../data/idb/storage";
import { SqliteApprovedImageRepository } from "../../data/repositories/sqlite/approvedImageRepository";
import {
  SqliteApprovedLibraryRepository,
  type CommitItemType,
  type GeoBrowseFilterOptions,
  type GeoBrowseFilters,
  type LibraryDetailRecord,
  type LibraryListItem,
  type RelatedItemRecord,
  type RelatedItemType
} from "../../data/repositories/sqlite/approvedLibraryRepository";

export type LibrarySection = "words" | "phrases" | "sentences" | "geo-materials" | "features";

export interface LibraryImageView {
  imageAssetId: string;
  assetGroupId?: string;
  fileName?: string;
  variantType: string;
  mimeType?: string;
  caption?: string;
  description?: string;
  previewUrl?: string;
}

export interface LibraryRelationView {
  direction: "outgoing" | "incoming";
  relationType: string;
  itemType: RelatedItemType;
  itemId: string;
  title: string;
  subtitle?: string;
  confidenceScore?: number;
  detailPath?: string;
}

export interface LibraryRelationGroup {
  key: "materials" | "features" | "expressions" | "words" | "strategies" | "other";
  title: string;
  items: LibraryRelationView[];
}

export interface DetailEntry {
  label: string;
  value: string | string[];
}

export interface DetailSection {
  title: string;
  entries: DetailEntry[];
}

export interface LibraryDetailView {
  record: LibraryDetailRecord;
  title: string;
  subtitle?: string;
  sections: DetailSection[];
  relations: LibraryRelationView[];
  relationGroups: LibraryRelationGroup[];
}

export interface LibraryGeoBrowseResult {
  items: LibraryListItem[];
  filterOptions: GeoBrowseFilterOptions;
}

function parseTextList(value: unknown): string[] | undefined {
  if (value == null) {
    return undefined;
  }

  const raw = String(value).trim();
  if (!raw) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      const entries = parsed.map((entry) => String(entry).trim()).filter((entry) => entry.length > 0);
      return entries.length > 0 ? entries : undefined;
    }
  } catch {
    // Fall back to plain text.
  }

  return [raw];
}

function asText(value: unknown): string | undefined {
  if (value == null) {
    return undefined;
  }
  const text = String(value).trim();
  return text.length > 0 ? text : undefined;
}

function addEntry(entries: DetailEntry[], label: string, value: unknown, options?: { list?: boolean }): void {
  if (options?.list) {
    const items = parseTextList(value);
    if (items && items.length > 0) {
      entries.push({ label, value: items });
    }
    return;
  }

  const text = asText(value);
  if (text) {
    entries.push({ label, value: text });
  }
}

function prettifyLabel(label: string): string {
  return label
    .replace(/_/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function mapSectionToItemType(section: LibrarySection): CommitItemType {
  const itemTypeMap: Record<LibrarySection, CommitItemType> = {
    words: "word",
    phrases: "phrase",
    sentences: "sentence",
    "geo-materials": "geo_material",
    features: "geo_feature"
  };

  return itemTypeMap[section];
}

function getRelationPath(itemType: RelatedItemType, itemId: string): string | undefined {
  const sectionMap: Partial<Record<RelatedItemType, LibrarySection>> = {
    word: "words",
    phrase: "phrases",
    sentence: "sentences",
    geo_material: "geo-materials",
    geo_feature: "features"
  };

  const section = sectionMap[itemType];
  return section ? `/library/${section}/${itemId}` : undefined;
}

function groupKeyForRelation(itemType: RelatedItemType): LibraryRelationGroup["key"] {
  switch (itemType) {
    case "geo_material":
      return "materials";
    case "geo_feature":
      return "features";
    case "phrase":
    case "sentence":
      return "expressions";
    case "word":
      return "words";
    case "strategy":
      return "strategies";
    default:
      return "other";
  }
}

function groupTitle(key: LibraryRelationGroup["key"]): string {
  switch (key) {
    case "materials":
      return "Related Materials";
    case "features":
      return "Related Features";
    case "expressions":
      return "Related Expressions";
    case "words":
      return "Related Words";
    case "strategies":
      return "Related Strategies";
    case "other":
    default:
      return "Other Related Items";
  }
}

function compareRelationViews(left: LibraryRelationView, right: LibraryRelationView): number {
  return left.title.localeCompare(right.title) || left.relationType.localeCompare(right.relationType);
}

function relationPriorityForFeatureStrategies(relation: LibraryRelationView): number {
  const relationType = relation.relationType.toLowerCase();
  if (relationType.includes("recommended") || relationType.includes("mitigation") || relationType.includes("treatment")) {
    return 0;
  }
  if (relationType.includes("monitor") || relationType.includes("inspection")) {
    return 1;
  }
  return 2;
}

function compareRelationViewsForContext(relationContext: CommitItemType, left: LibraryRelationView, right: LibraryRelationView): number {
  if (relationContext === "geo_feature" && left.itemType === "strategy" && right.itemType === "strategy") {
    const priorityDelta = relationPriorityForFeatureStrategies(left) - relationPriorityForFeatureStrategies(right);
    if (priorityDelta !== 0) {
      return priorityDelta;
    }

    const confidenceDelta = (right.confidenceScore ?? 0) - (left.confidenceScore ?? 0);
    if (confidenceDelta !== 0) {
      return confidenceDelta;
    }
  }

  return compareRelationViews(left, right);
}

function buildRelationGroups(relations: LibraryRelationView[], relationContext: CommitItemType): LibraryRelationGroup[] {
  const order: Array<LibraryRelationGroup["key"]> =
    relationContext === "geo_material" || relationContext === "geo_feature"
      ? ["materials", "features", "strategies", "expressions", "words", "other"]
      : ["materials", "features", "expressions", "words", "strategies", "other"];
  const grouped = new Map<LibraryRelationGroup["key"], LibraryRelationView[]>();

  for (const relation of relations) {
    const key = groupKeyForRelation(relation.itemType);
    const current = grouped.get(key) ?? [];
    current.push(relation);
    grouped.set(key, current);
  }

  return order
    .map((key) => {
      const items = grouped.get(key);
      if (!items || items.length === 0) {
        return undefined;
      }

      return {
        key,
        title: groupTitle(key),
        items: [...items].sort((left, right) => compareRelationViewsForContext(relationContext, left, right))
      };
    })
    .filter((group): group is LibraryRelationGroup => group !== undefined);
}

function buildGenericSections(detail: LibraryDetailRecord): DetailSection[] {
  const ignoredKeys = new Set(["id"]);
  const entries: DetailEntry[] = [];

  for (const [key, value] of Object.entries(detail.fields)) {
    if (ignoredKeys.has(key)) {
      continue;
    }

    const text = asText(value);
    if (text) {
      entries.push({ label: prettifyLabel(key), value: text });
    }
  }

  return entries.length > 0 ? [{ title: "Core Fields", entries }] : [];
}

function buildGeoMaterialSections(fields: Record<string, unknown>): DetailSection[] {
  const referenceContext: DetailEntry[] = [];
  addEntry(referenceContext, "Category", fields.geo_material_category);
  addEntry(referenceContext, "Subtype", fields.geo_material_subtype);
  addEntry(referenceContext, "Description", fields.description);
  addEntry(referenceContext, "Chinese Name", fields.chinese_name);

  const identification: DetailEntry[] = [];
  addEntry(identification, "Identification Method", fields.identification_method);

  const distinguishing: DetailEntry[] = [];
  addEntry(distinguishing, "Distinguishing Points", fields.distinguishing_points, { list: true });

  const misidentifications: DetailEntry[] = [];
  addEntry(misidentifications, "Common Misidentifications", fields.common_misidentifications, { list: true });

  const engineering: DetailEntry[] = [];
  addEntry(engineering, "Engineering Significance", fields.engineering_significance);
  addEntry(engineering, "Common Risks", fields.common_risks, { list: true });

  const treatment: DetailEntry[] = [];
  addEntry(treatment, "Common Treatments", fields.common_treatments, { list: true });
  addEntry(treatment, "Australia Context", fields.australia_context);

  return [
    referenceContext.length > 0 ? { title: "Reference Context", entries: referenceContext } : undefined,
    identification.length > 0 ? { title: "Identification", entries: identification } : undefined,
    distinguishing.length > 0 ? { title: "Distinguishing Points", entries: distinguishing } : undefined,
    misidentifications.length > 0 ? { title: "Common Misidentifications", entries: misidentifications } : undefined,
    engineering.length > 0 ? { title: "Engineering Significance and Risks", entries: engineering } : undefined,
    treatment.length > 0 ? { title: "Treatments and Mitigation", entries: treatment } : undefined
  ].filter((section): section is DetailSection => section !== undefined);
}

function buildGeoFeatureSections(fields: Record<string, unknown>): DetailSection[] {
  const referenceContext: DetailEntry[] = [];
  addEntry(referenceContext, "Category", fields.geo_feature_category);
  addEntry(referenceContext, "Subtype", fields.geo_feature_subtype);
  addEntry(referenceContext, "Description", fields.description);
  addEntry(referenceContext, "Chinese Name", fields.chinese_name);

  const identification: DetailEntry[] = [];
  addEntry(identification, "Identification Method", fields.identification_method);

  const distinguishing: DetailEntry[] = [];
  addEntry(distinguishing, "Distinguishing Points", fields.distinguishing_points, { list: true });

  const causes: DetailEntry[] = [];
  addEntry(causes, "Common Causes", fields.common_causes, { list: true });

  const engineering: DetailEntry[] = [];
  addEntry(engineering, "Risk Implications", fields.risk_implications, { list: true });

  const mitigation: DetailEntry[] = [];
  addEntry(mitigation, "Treatment Or Mitigation", fields.treatment_or_mitigation, { list: true });

  const reporting: DetailEntry[] = [];
  addEntry(reporting, "Reporting Expressions", fields.reporting_expressions, { list: true });
  addEntry(reporting, "Inspection Points", fields.inspection_points, { list: true });

  return [
    referenceContext.length > 0 ? { title: "Reference Context", entries: referenceContext } : undefined,
    identification.length > 0 ? { title: "Identification", entries: identification } : undefined,
    distinguishing.length > 0 ? { title: "Distinguishing Points", entries: distinguishing } : undefined,
    causes.length > 0 ? { title: "Common Causes", entries: causes } : undefined,
    engineering.length > 0 ? { title: "Engineering Significance and Risks", entries: engineering } : undefined,
    mitigation.length > 0 ? { title: "Treatments and Mitigation", entries: mitigation } : undefined,
    reporting.length > 0 ? { title: "Reporting Expressions and Inspection Points", entries: reporting } : undefined
  ].filter((section): section is DetailSection => section !== undefined);
}

export class LibraryService {
  listBySection(db: Database, section: LibrarySection, filters?: GeoBrowseFilters): LibraryListItem[] {
    const repository = new SqliteApprovedLibraryRepository(db);
    switch (section) {
      case "words":
        return repository.listWords();
      case "phrases":
        return repository.listPhrases();
      case "sentences":
        return repository.listSentences();
      case "geo-materials":
        return repository.listGeoMaterials(filters);
      case "features":
        return repository.listGeoFeatures(filters);
    }
  }

  getGeoBrowseData(db: Database, section: Extract<LibrarySection, "geo-materials" | "features">, filters?: GeoBrowseFilters): LibraryGeoBrowseResult {
    const repository = new SqliteApprovedLibraryRepository(db);
    return section === "geo-materials"
      ? {
          items: repository.listGeoMaterials(filters),
          filterOptions: repository.getGeoMaterialFilterOptions()
        }
      : {
          items: repository.listGeoFeatures(filters),
          filterOptions: repository.getGeoFeatureFilterOptions()
        };
  }

  getDetail(db: Database, section: LibrarySection, id: string): LibraryDetailRecord | undefined {
    return new SqliteApprovedLibraryRepository(db).getDetail(mapSectionToItemType(section), id);
  }

  getDetailView(db: Database, section: LibrarySection, id: string): LibraryDetailView | undefined {
    const repository = new SqliteApprovedLibraryRepository(db);
    const detail = repository.getDetail(mapSectionToItemType(section), id);
    if (!detail) {
      return undefined;
    }

    const relations = repository.listRelations(detail.itemType, id).map((relation: RelatedItemRecord) => ({
      ...relation,
      detailPath: getRelationPath(relation.itemType, relation.itemId)
    }));
    const relationGroups = buildRelationGroups(relations, detail.itemType);

    const title =
      asText(detail.fields.canonical_name) ??
      asText(detail.fields.canonical_sentence) ??
      asText(detail.fields.canonical_phrase) ??
      asText(detail.fields.canonical_word) ??
      id;

    const subtitle =
      section === "geo-materials"
        ? [asText(detail.fields.geo_material_category), asText(detail.fields.geo_material_subtype)].filter(Boolean).join(" | ") || undefined
        : section === "features"
          ? [asText(detail.fields.geo_feature_category), asText(detail.fields.geo_feature_subtype)].filter(Boolean).join(" | ") || undefined
          : undefined;

    const sections =
      section === "geo-materials"
        ? buildGeoMaterialSections(detail.fields)
        : section === "features"
          ? buildGeoFeatureSections(detail.fields)
          : buildGenericSections(detail);

    return {
      record: detail,
      title,
      subtitle,
      sections,
      relations,
      relationGroups
    };
  }

  async listDetailImages(db: Database, section: LibrarySection, id: string): Promise<LibraryImageView[]> {
    const imageRows = new SqliteApprovedImageRepository(db).listByItem(mapSectionToItemType(section), id);
    const views: LibraryImageView[] = [];

    for (const row of imageRows) {
      let previewUrl: string | undefined;
      const blob = await getBlob(row.storagePath);
      if (blob) {
        previewUrl = URL.createObjectURL(blob);
      }

      views.push({
        imageAssetId: row.imageAssetId,
        assetGroupId: row.assetGroupId,
        fileName: row.fileName,
        variantType: row.variantType,
        mimeType: row.mimeType,
        caption: row.caption,
        description: row.description,
        previewUrl
      });
    }

    return views;
  }
}




