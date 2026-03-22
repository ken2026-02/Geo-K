import type { Database } from "sql.js";

import { SCHEMA_VERSION } from "../../data/db/schemaVersion";
import { readRows } from "../../data/repositories/sqlite/sqliteHelpers";
import { SqliteMigrationLogRepository } from "../../data/repositories/sqlite/migrationLogRepository";
import { IntegrityCheckService, type IntegrityCheckResult } from "../maintenance/integrityCheckService";
import { PerformanceMetricsService, type PerformanceMetric } from "../performance/performanceMetricsService";

export interface DiagnosticsSnapshot {
  schemaVersion: string;
  migrationCount: number;
  latestMigration?: {
    migrationName: string;
    toVersion: string;
    appliedAt: string;
  };
  storageUsage: {
    databaseBytes: number;
    imageResourceCount: number;
    imageResourceBytes: number;
    backupResourceCount: number;
    backupResourceBytes: number;
    totalKeys: number;
  };
  dataState: {
    approvedCounts: {
      words: number;
      phrases: number;
      sentences: number;
      geoMaterials: number;
      geoFeatures: number;
      strategies: number;
      requirements: number;
      methods: number;
      images: number;
      relations: number;
      sources: number;
      reports: number;
    };
    pendingCounts: {
      words: number;
      phrases: number;
      sentences: number;
      geoMaterials: number;
      geoFeatures: number;
      strategies: number;
      images: number;
      itemImageLinks: number;
      inboxTotal: number;
      inboxApproved: number;
      inboxRejected: number;
      inboxDeferred: number;
      inboxUnreviewed: number;
    };
    approvedProvenance: {
      systemGenerated: number;
      importedAi: number;
      manualUser: number;
      merged: number;
      userOwned: number;
      other: number;
      total: number;
    };
    flowAvailability: {
      systemBuiltInValidateApply: string;
      userImportPendingReviewCommit: string;
      governanceIntegrityDiagnostics: string;
      geoLibraryDetailRead: string;
    };
  };
  integrity?: IntegrityCheckResult;
  recentMetrics: PerformanceMetric[];
}

function readCount(db: Database, tableName: string): number {
  return Number(readRows(db, `SELECT COUNT(*) AS c FROM ${tableName}`)[0]?.c ?? 0);
}

function readPendingInboxCountByStatus(db: Database, reviewStatus: "approved" | "rejected" | "deferred" | "unreviewed"): number {
  return Number(
    readRows(
      db,
      `
      SELECT COUNT(*) AS c
      FROM (
        SELECT review_status FROM pending_words
        UNION ALL SELECT review_status FROM pending_phrases
        UNION ALL SELECT review_status FROM pending_sentences
        UNION ALL SELECT review_status FROM pending_geo_materials
        UNION ALL SELECT review_status FROM pending_geo_features
        UNION ALL SELECT review_status FROM pending_strategies
      ) inbox
      WHERE review_status = '${reviewStatus}'
      `
    )[0]?.c ?? 0
  );
}

function readApprovedProvenance(db: Database): DiagnosticsSnapshot["dataState"]["approvedProvenance"] {
  const rows = readRows(
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
      UNION ALL
      SELECT provenance_type, COUNT(*) AS record_count FROM requirements GROUP BY provenance_type
      UNION ALL
      SELECT provenance_type, COUNT(*) AS record_count FROM methods GROUP BY provenance_type
    ) grouped
    GROUP BY provenance_type
    `
  );

  let systemGenerated = 0;
  let importedAi = 0;
  let manualUser = 0;
  let merged = 0;
  let other = 0;

  for (const row of rows) {
    const provenance = String(row.provenance_type ?? "");
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

function readDataState(db: Database): DiagnosticsSnapshot["dataState"] {
  const inboxApproved = readPendingInboxCountByStatus(db, "approved");
  const inboxRejected = readPendingInboxCountByStatus(db, "rejected");
  const inboxDeferred = readPendingInboxCountByStatus(db, "deferred");
  const inboxUnreviewed = readPendingInboxCountByStatus(db, "unreviewed");

  return {
    approvedCounts: {
      words: readCount(db, "words"),
      phrases: readCount(db, "phrases"),
      sentences: readCount(db, "sentences"),
      geoMaterials: readCount(db, "geo_materials"),
      geoFeatures: readCount(db, "geo_features"),
      strategies: readCount(db, "strategies"),
      requirements: readCount(db, "requirements"),
      methods: readCount(db, "methods"),
      images: readCount(db, "images"),
      relations: readCount(db, "item_relations"),
      sources: readCount(db, "item_sources"),
      reports: readCount(db, "reports")
    },
    pendingCounts: {
      words: readCount(db, "pending_words"),
      phrases: readCount(db, "pending_phrases"),
      sentences: readCount(db, "pending_sentences"),
      geoMaterials: readCount(db, "pending_geo_materials"),
      geoFeatures: readCount(db, "pending_geo_features"),
      strategies: readCount(db, "pending_strategies"),
      images: readCount(db, "pending_images"),
      itemImageLinks: readCount(db, "pending_item_image_links"),
      inboxTotal: inboxApproved + inboxRejected + inboxDeferred + inboxUnreviewed,
      inboxApproved,
      inboxRejected,
      inboxDeferred,
      inboxUnreviewed
    },
    approvedProvenance: readApprovedProvenance(db),
    flowAvailability: {
      systemBuiltInValidateApply: "available",
      userImportPendingReviewCommit: "available",
      governanceIntegrityDiagnostics: "available",
      geoLibraryDetailRead: "available"
    }
  };
}

export class SystemDiagnosticsService {
  private readonly integrityService = new IntegrityCheckService();
  private readonly performanceService = new PerformanceMetricsService();

  async loadDiagnostics(db: Database, includeIntegrity = false): Promise<DiagnosticsSnapshot> {
    const migrations = await new SqliteMigrationLogRepository(db).listAll();
    const latestMigration = migrations.length > 0 ? migrations[migrations.length - 1] : undefined;

    return {
      schemaVersion: SCHEMA_VERSION,
      migrationCount: migrations.length,
      latestMigration: latestMigration
        ? {
            migrationName: latestMigration.migrationName,
            toVersion: latestMigration.toVersion,
            appliedAt: latestMigration.appliedAt
          }
        : undefined,
      storageUsage: await this.integrityService.getStorageUsageSummary(),
      dataState: readDataState(db),
      integrity: includeIntegrity ? await this.integrityService.runBasicChecks(db) : undefined,
      recentMetrics: await this.performanceService.listRecent()
    };
  }
}
