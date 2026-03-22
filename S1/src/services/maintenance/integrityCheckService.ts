import type { Database } from "sql.js";

import { getBinary, getBlob, listKeys } from "../../data/idb/storage";
import { DATABASE_IDB_KEY } from "../../data/db/schemaVersion";
import { readRows } from "../../data/repositories/sqlite/sqliteHelpers";

export interface IntegrityCheckIssue {
  severity: "warning" | "error";
  category:
    | "missing_source_ref"
    | "broken_source_ref"
    | "broken_item_image_link"
    | "missing_image_file"
    | "missing_report_reference"
    | "broken_item_relation"
    | "duplicate_normalized_name"
    | "system_user_name_collision";
  message: string;
  entityType?: string;
  entityId?: string;
}

export interface DuplicateNormalizedNameRecord {
  itemType: string;
  normalizedName: string;
  count: number;
  provenanceTypes: string[];
}

export interface SystemUserCollisionRecord {
  itemType: "geo_material" | "geo_feature" | "strategy";
  normalizedName: string;
  systemCount: number;
  userCount: number;
  provenanceTypes: string[];
}

export interface ProvenanceCountSummary {
  systemGenerated: number;
  importedAi: number;
  manualUser: number;
  merged: number;
  userOwned: number;
  other: number;
  total: number;
}

export interface IntegrityIssueSummary {
  totalIssues: number;
  errorCount: number;
  warningCount: number;
  byCategory: Record<string, number>;
}

export interface IntegrityCheckResult {
  checkedAt: string;
  issues: IntegrityCheckIssue[];
  summary: IntegrityIssueSummary;
  duplicateNormalizedNames: DuplicateNormalizedNameRecord[];
  systemUserCollisions: SystemUserCollisionRecord[];
  approvedProvenance: ProvenanceCountSummary;
}

interface NormalizedNameAuditSpec {
  itemType: string;
  tableName: string;
  normalizedColumn: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

function parseVariantKeys(tempStoragePath?: string): string[] {
  if (!tempStoragePath) {
    return [];
  }

  try {
    const parsed = JSON.parse(tempStoragePath) as { variants?: Array<{ storageKey?: string }> };
    return (parsed.variants ?? [])
      .map((variant) => variant.storageKey)
      .filter((value): value is string => typeof value === "string" && value.length > 0);
  } catch {
    return [];
  }
}

function splitDistinctCsv(value: unknown): string[] {
  if (value == null) {
    return [];
  }

  const raw = String(value).trim();
  if (!raw) {
    return [];
  }

  return Array.from(new Set(raw.split(",").map((entry) => entry.trim()).filter((entry) => entry.length > 0)));
}

function summarizeIssues(issues: IntegrityCheckIssue[]): IntegrityIssueSummary {
  const byCategory: Record<string, number> = {};
  for (const issue of issues) {
    byCategory[issue.category] = (byCategory[issue.category] ?? 0) + 1;
  }

  return {
    totalIssues: issues.length,
    errorCount: issues.filter((issue) => issue.severity === "error").length,
    warningCount: issues.filter((issue) => issue.severity === "warning").length,
    byCategory
  };
}

function canonicalNormalizedSql(columnName: string): string {
  return `LOWER(TRIM(REPLACE(${columnName}, '  ', ' ')))`;
}

function normalizeProvenanceSummary(rows: Record<string, unknown>[]): ProvenanceCountSummary {
  let systemGenerated = 0;
  let importedAi = 0;
  let manualUser = 0;
  let merged = 0;
  let other = 0;

  for (const row of rows) {
    const provenance = String(row.provenance_type ?? "").trim();
    const count = Number(row.record_count ?? 0);

    if (provenance === "system_generated") {
      systemGenerated += count;
    } else if (provenance === "imported_ai") {
      importedAi += count;
    } else if (provenance === "manual_user") {
      manualUser += count;
    } else if (provenance === "merged") {
      merged += count;
    } else {
      other += count;
    }
  }

  const userOwned = importedAi + manualUser + merged;
  const total = systemGenerated + userOwned + other;

  return {
    systemGenerated,
    importedAi,
    manualUser,
    merged,
    userOwned,
    other,
    total
  };
}

export class IntegrityCheckService {
  async runBasicChecks(db: Database): Promise<IntegrityCheckResult> {
    const issues: IntegrityCheckIssue[] = [];

    for (const itemType of ["word", "phrase", "sentence", "geo_material", "geo_feature", "strategy"] as const) {
      const tableName =
        itemType === "word"
          ? "words"
          : itemType === "phrase"
            ? "phrases"
            : itemType === "sentence"
              ? "sentences"
              : itemType === "geo_material"
                ? "geo_materials"
                : itemType === "geo_feature"
                  ? "geo_features"
                  : "strategies";

      const rows = readRows(
        db,
        `
        SELECT t.id
        FROM ${tableName} t
        LEFT JOIN item_sources s ON s.item_type = '${itemType}' AND s.item_id = t.id
        WHERE s.id IS NULL
        `
      );

      for (const row of rows) {
        issues.push({
          severity: "warning",
          category: "missing_source_ref",
          message: `${itemType} item has no source traceability record.`,
          entityType: itemType,
          entityId: String(row.id)
        });
      }
    }

    for (const row of readRows(db, `
      SELECT s.id, s.item_type, s.item_id
      FROM item_sources s
      LEFT JOIN words w ON s.item_type = 'word' AND w.id = s.item_id
      LEFT JOIN phrases p ON s.item_type = 'phrase' AND p.id = s.item_id
      LEFT JOIN sentences sn ON s.item_type = 'sentence' AND sn.id = s.item_id
      LEFT JOIN geo_materials gm ON s.item_type = 'geo_material' AND gm.id = s.item_id
      LEFT JOIN geo_features gf ON s.item_type = 'geo_feature' AND gf.id = s.item_id
      LEFT JOIN strategies st ON s.item_type = 'strategy' AND st.id = s.item_id
      WHERE (s.item_type = 'word' AND w.id IS NULL)
         OR (s.item_type = 'phrase' AND p.id IS NULL)
         OR (s.item_type = 'sentence' AND sn.id IS NULL)
         OR (s.item_type = 'geo_material' AND gm.id IS NULL)
         OR (s.item_type = 'geo_feature' AND gf.id IS NULL)
         OR (s.item_type = 'strategy' AND st.id IS NULL)
    `)) {
      issues.push({
        severity: "error",
        category: "broken_source_ref",
        message: "item_source points to a missing approved item.",
        entityType: String(row.item_type),
        entityId: String(row.item_id)
      });
    }

    for (const row of readRows(db, `
      SELECT s.id, s.item_type, s.item_id, s.report_id
      FROM item_sources s
      LEFT JOIN reports r ON r.id = s.report_id
      WHERE s.report_id IS NOT NULL AND r.id IS NULL
    `)) {
      issues.push({
        severity: "error",
        category: "missing_report_reference",
        message: "item_source references a missing report.",
        entityType: String(row.item_type),
        entityId: String(row.item_id)
      });
    }

    for (const row of readRows(db, `
      SELECT l.id, l.item_type, l.item_id, l.image_asset_id
      FROM item_image_links l
      LEFT JOIN images i ON i.id = l.image_asset_id
      LEFT JOIN words w ON l.item_type = 'word' AND w.id = l.item_id
      LEFT JOIN phrases p ON l.item_type = 'phrase' AND p.id = l.item_id
      LEFT JOIN sentences s ON l.item_type = 'sentence' AND s.id = l.item_id
      LEFT JOIN geo_materials gm ON l.item_type = 'geo_material' AND gm.id = l.item_id
      LEFT JOIN geo_features gf ON l.item_type = 'geo_feature' AND gf.id = l.item_id
      LEFT JOIN strategies st ON l.item_type = 'strategy' AND st.id = l.item_id
      WHERE i.id IS NULL
         OR (l.item_type = 'word' AND w.id IS NULL)
         OR (l.item_type = 'phrase' AND p.id IS NULL)
         OR (l.item_type = 'sentence' AND s.id IS NULL)
         OR (l.item_type = 'geo_material' AND gm.id IS NULL)
         OR (l.item_type = 'geo_feature' AND gf.id IS NULL)
         OR (l.item_type = 'strategy' AND st.id IS NULL)
    `)) {
      issues.push({
        severity: "error",
        category: "broken_item_image_link",
        message: "approved item_image_link points to a missing item or image asset.",
        entityType: String(row.item_type),
        entityId: String(row.item_id)
      });
    }

    for (const row of readRows(db, `
      SELECT r.id, r.from_item_type, r.from_item_id, r.to_item_type, r.to_item_id
      FROM item_relations r
      LEFT JOIN words fw ON r.from_item_type = 'word' AND fw.id = r.from_item_id
      LEFT JOIN phrases fp ON r.from_item_type = 'phrase' AND fp.id = r.from_item_id
      LEFT JOIN sentences fs ON r.from_item_type = 'sentence' AND fs.id = r.from_item_id
      LEFT JOIN geo_materials fgm ON r.from_item_type = 'geo_material' AND fgm.id = r.from_item_id
      LEFT JOIN geo_features fgf ON r.from_item_type = 'geo_feature' AND fgf.id = r.from_item_id
      LEFT JOIN strategies fst ON r.from_item_type = 'strategy' AND fst.id = r.from_item_id
      LEFT JOIN words tw ON r.to_item_type = 'word' AND tw.id = r.to_item_id
      LEFT JOIN phrases tp ON r.to_item_type = 'phrase' AND tp.id = r.to_item_id
      LEFT JOIN sentences ts ON r.to_item_type = 'sentence' AND ts.id = r.to_item_id
      LEFT JOIN geo_materials tgm ON r.to_item_type = 'geo_material' AND tgm.id = r.to_item_id
      LEFT JOIN geo_features tgf ON r.to_item_type = 'geo_feature' AND tgf.id = r.to_item_id
      LEFT JOIN strategies tst ON r.to_item_type = 'strategy' AND tst.id = r.to_item_id
      WHERE (r.from_item_type = 'word' AND fw.id IS NULL)
         OR (r.from_item_type = 'phrase' AND fp.id IS NULL)
         OR (r.from_item_type = 'sentence' AND fs.id IS NULL)
         OR (r.from_item_type = 'geo_material' AND fgm.id IS NULL)
         OR (r.from_item_type = 'geo_feature' AND fgf.id IS NULL)
         OR (r.from_item_type = 'strategy' AND fst.id IS NULL)
         OR (r.to_item_type = 'word' AND tw.id IS NULL)
         OR (r.to_item_type = 'phrase' AND tp.id IS NULL)
         OR (r.to_item_type = 'sentence' AND ts.id IS NULL)
         OR (r.to_item_type = 'geo_material' AND tgm.id IS NULL)
         OR (r.to_item_type = 'geo_feature' AND tgf.id IS NULL)
         OR (r.to_item_type = 'strategy' AND tst.id IS NULL)
    `)) {
      issues.push({
        severity: "error",
        category: "broken_item_relation",
        message: "item_relation points to a missing source or target item.",
        entityType: String(row.from_item_type),
        entityId: String(row.from_item_id)
      });
    }

    for (const row of readRows(db, "SELECT id, storage_path FROM images")) {
      const storagePath = String(row.storage_path);
      const blob = await getBlob(storagePath);
      if (!blob) {
        issues.push({
          severity: "error",
          category: "missing_image_file",
          message: "approved image resource is missing from local storage.",
          entityType: "image",
          entityId: String(row.id)
        });
      }
    }

    for (const row of readRows(db, "SELECT id, temp_storage_path FROM pending_images WHERE temp_storage_path IS NOT NULL")) {
      const keys = parseVariantKeys(row.temp_storage_path == null ? undefined : String(row.temp_storage_path));
      for (const key of keys) {
        const blob = await getBlob(key);
        if (!blob) {
          issues.push({
            severity: "warning",
            category: "missing_image_file",
            message: "pending image variant resource is missing from local storage.",
            entityType: "pending_image",
            entityId: String(row.id)
          });
        }
      }
    }

    const duplicateNormalizedNames: DuplicateNormalizedNameRecord[] = [];
    const normalizedNameSpecs: NormalizedNameAuditSpec[] = [
      { itemType: "word", tableName: "words", normalizedColumn: "normalized_word" },
      { itemType: "phrase", tableName: "phrases", normalizedColumn: "normalized_phrase" },
      { itemType: "sentence", tableName: "sentences", normalizedColumn: "normalized_sentence" },
      { itemType: "geo_material", tableName: "geo_materials", normalizedColumn: "normalized_name" },
      { itemType: "geo_feature", tableName: "geo_features", normalizedColumn: "normalized_name" },
      { itemType: "strategy", tableName: "strategies", normalizedColumn: "normalized_name" }
    ];

    for (const spec of normalizedNameSpecs) {
      const canonicalNameSql = canonicalNormalizedSql(spec.normalizedColumn);
      const duplicates = readRows(
        db,
        `
        SELECT ${canonicalNameSql} AS normalized_name,
               COUNT(*) AS duplicate_count,
               GROUP_CONCAT(DISTINCT provenance_type) AS provenance_types
        FROM ${spec.tableName}
        WHERE TRIM(${spec.normalizedColumn}) != ''
        GROUP BY ${canonicalNameSql}
        HAVING COUNT(*) > 1
        `
      );

      for (const row of duplicates) {
        const normalizedName = String(row.normalized_name);
        const duplicateRecord: DuplicateNormalizedNameRecord = {
          itemType: spec.itemType,
          normalizedName,
          count: Number(row.duplicate_count ?? 0),
          provenanceTypes: splitDistinctCsv(row.provenance_types)
        };

        duplicateNormalizedNames.push(duplicateRecord);
        issues.push({
          severity: "warning",
          category: "duplicate_normalized_name",
          message: `${spec.itemType} has duplicate normalized name '${normalizedName}'.`,
          entityType: spec.itemType,
          entityId: normalizedName
        });
      }
    }

    const systemUserCollisions: SystemUserCollisionRecord[] = [];
    const collisionSpecs: Array<{ itemType: "geo_material" | "geo_feature" | "strategy"; tableName: string }> = [
      { itemType: "geo_material", tableName: "geo_materials" },
      { itemType: "geo_feature", tableName: "geo_features" },
      { itemType: "strategy", tableName: "strategies" }
    ];

    for (const spec of collisionSpecs) {
      const canonicalNameSql = canonicalNormalizedSql("normalized_name");
      const rows = readRows(
        db,
        `
        SELECT ${canonicalNameSql} AS normalized_name,
               SUM(CASE WHEN provenance_type = 'system_generated' THEN 1 ELSE 0 END) AS system_count,
               SUM(CASE WHEN provenance_type IN ('imported_ai', 'manual_user', 'merged') THEN 1 ELSE 0 END) AS user_count,
               GROUP_CONCAT(DISTINCT provenance_type) AS provenance_types
        FROM ${spec.tableName}
        WHERE TRIM(normalized_name) != ''
        GROUP BY ${canonicalNameSql}
        HAVING system_count > 0 AND user_count > 0
        `
      );

      for (const row of rows) {
        const normalizedName = String(row.normalized_name);
        const record: SystemUserCollisionRecord = {
          itemType: spec.itemType,
          normalizedName,
          systemCount: Number(row.system_count ?? 0),
          userCount: Number(row.user_count ?? 0),
          provenanceTypes: splitDistinctCsv(row.provenance_types)
        };

        systemUserCollisions.push(record);
        issues.push({
          severity: "warning",
          category: "system_user_name_collision",
          message: `${spec.itemType} normalized name '${normalizedName}' appears in both system and user-owned content.`,
          entityType: spec.itemType,
          entityId: normalizedName
        });
      }
    }

    const provenanceRows = readRows(
      db,
      `
      SELECT provenance_type, SUM(record_count) AS record_count
      FROM (
        SELECT provenance_type, COUNT(*) AS record_count FROM words GROUP BY provenance_type
        UNION ALL
        SELECT provenance_type, COUNT(*) AS record_count FROM phrases GROUP BY provenance_type
        UNION ALL
        SELECT provenance_type, COUNT(*) AS record_count FROM sentences GROUP BY provenance_type
        UNION ALL
        SELECT provenance_type, COUNT(*) AS record_count FROM geo_materials GROUP BY provenance_type
        UNION ALL
        SELECT provenance_type, COUNT(*) AS record_count FROM geo_features GROUP BY provenance_type
        UNION ALL
        SELECT provenance_type, COUNT(*) AS record_count FROM strategies GROUP BY provenance_type
      ) grouped
      GROUP BY provenance_type
      `
    );

    return {
      checkedAt: nowIso(),
      issues,
      summary: summarizeIssues(issues),
      duplicateNormalizedNames,
      systemUserCollisions,
      approvedProvenance: normalizeProvenanceSummary(provenanceRows)
    };
  }

  async getStorageUsageSummary(): Promise<{
    databaseBytes: number;
    imageResourceCount: number;
    imageResourceBytes: number;
    backupResourceCount: number;
    backupResourceBytes: number;
    totalKeys: number;
  }> {
    const databaseBinary = await getBinary(DATABASE_IDB_KEY);
    const allKeys = await listKeys();
    const imageKeys = allKeys.filter((key) => key.startsWith("image:"));
    const backupKeys = allKeys.filter((key) => key.startsWith("backup:"));

    let imageResourceBytes = 0;
    for (const key of imageKeys) {
      const blob = await getBlob(key);
      imageResourceBytes += blob?.size ?? 0;
    }

    let backupResourceBytes = 0;
    for (const key of backupKeys) {
      const blob = await getBlob(key);
      backupResourceBytes += blob?.size ?? 0;
    }

    return {
      databaseBytes: databaseBinary?.byteLength ?? 0,
      imageResourceCount: imageKeys.length,
      imageResourceBytes,
      backupResourceCount: backupKeys.length,
      backupResourceBytes,
      totalKeys: allKeys.length
    };
  }
}
