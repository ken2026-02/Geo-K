import "fake-indexeddb/auto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { createDatabase } from "../src/data/db/database";
import { InboxService } from "../src/services/review/inboxService";
import { JsonKnowledgePackImportService } from "../src/services/import/jsonKnowledgePackImportService";
import { ApprovedCommitService } from "../src/services/import/approvedCommitService";
import { LibraryService } from "../src/services/library/libraryService";

function countTable(db: Awaited<ReturnType<typeof createDatabase>>, table: string): number {
  const result = db.exec(`SELECT COUNT(*) AS c FROM ${table}`);
  return Number(result[0]?.values?.[0]?.[0] ?? 0);
}

function hasTitle(rows: Array<{ title: string }>, expected: string): boolean {
  return rows.some((row) => row.title.toLowerCase() === expected.toLowerCase());
}

function findIdByTitle(rows: Array<{ id: string; title: string }>, expected: string): string | undefined {
  return rows.find((row) => row.title.toLowerCase() === expected.toLowerCase())?.id;
}

function resolveUserKnowledgeBatchPath(): string {
  const candidatePaths = [
    resolve(process.cwd(), "Test", "user_knowledge_real_batch_v1.json"),
    resolve(process.cwd(), "SS", "Test", "user_knowledge_real_batch_v1.json")
  ];

  const matchedPath = candidatePaths.find((candidate) => existsSync(candidate));
  if (!matchedPath) {
    throw new Error("Missing user_knowledge_real_batch_v1.json fixture in Test/ or SS/Test/.");
  }

  return matchedPath;
}

async function main(): Promise<void> {
  const db = await createDatabase();
  const schemaSql = readFileSync(resolve(process.cwd(), "db", "schema.sql"), "utf8");
  db.exec(schemaSql);

  const importService = new JsonKnowledgePackImportService();
  const inboxService = new InboxService();
  const commitService = new ApprovedCommitService();
  const libraryService = new LibraryService();

  const invalidReport = await importService.validate("{bad json");

  const rawJson = readFileSync(resolveUserKnowledgeBatchPath(), "utf8");
  const validationReport = await importService.validate(rawJson);
  const importResult = await importService.importIntoPending(db, "user_knowledge_real_batch_v1.json", rawJson);

  const pendingAfterImport = {
    pendingGeoMaterials: countTable(db, "pending_geo_materials"),
    pendingGeoFeatures: countTable(db, "pending_geo_features"),
    pendingStrategies: countTable(db, "pending_strategies"),
    approvedGeoMaterials: countTable(db, "geo_materials"),
    approvedGeoFeatures: countTable(db, "geo_features"),
    approvedStrategies: countTable(db, "strategies")
  };

  const pendingItems = await inboxService.listPendingItems(db, importResult.batch.id);
  const pendingVisibility = {
    total: pendingItems.length,
    hasGeoMaterial: pendingItems.some((item) => item.itemType === "geo_material"),
    hasGeoFeature: pendingItems.some((item) => item.itemType === "geo_feature"),
    hasStrategy: pendingItems.some((item) => item.itemType === "strategy")
  };

  const pendingByTitle = new Map(pendingItems.map((item) => [item.title.toLowerCase(), item]));
  const requiredPendingTitles = [
    "slick clay seam",
    "oxidized fracture infill",
    "residual volcanic soil",
    "decomposed andesite",
    "active ravelling pocket",
    "wet open joint",
    "blast damaged brow",
    "foliation daylighting plane",
    "targeted hand scaling",
    "short-interval re-inspection",
    "detailed face mapping"
  ] as const;

  for (const title of requiredPendingTitles) {
    if (!pendingByTitle.has(title)) {
      throw new Error(`Expected pending item missing: ${title}`);
    }
  }

  await inboxService.approve(db, "geo_material", pendingByTitle.get("slick clay seam")!.id);
  await inboxService.approve(db, "geo_material", pendingByTitle.get("decomposed andesite")!.id);
  await inboxService.reject(db, "geo_material", pendingByTitle.get("oxidized fracture infill")!.id);
  await inboxService.defer(db, "geo_material", pendingByTitle.get("residual volcanic soil")!.id);

  await inboxService.approve(db, "geo_feature", pendingByTitle.get("active ravelling pocket")!.id);
  await inboxService.approve(db, "geo_feature", pendingByTitle.get("wet open joint")!.id);
  await inboxService.reject(db, "geo_feature", pendingByTitle.get("blast damaged brow")!.id);
  await inboxService.defer(db, "geo_feature", pendingByTitle.get("foliation daylighting plane")!.id);

  await inboxService.approve(db, "strategy", pendingByTitle.get("targeted hand scaling")!.id);
  await inboxService.defer(db, "strategy", pendingByTitle.get("short-interval re-inspection")!.id);
  await inboxService.reject(db, "strategy", pendingByTitle.get("detailed face mapping")!.id);

  const reviewedItems = await inboxService.listPendingItems(db, importResult.batch.id);
  const reviewStatusSummary = {
    approved: reviewedItems.filter((item) => item.reviewStatus === "approved").length,
    rejected: reviewedItems.filter((item) => item.reviewStatus === "rejected").length,
    deferred: reviewedItems.filter((item) => item.reviewStatus === "deferred").length
  };

  const firstCommit = await commitService.commitApprovedPendingBatch(db, importResult.batch.id);
  const approvedAfterFirstCommit = {
    geoMaterials: countTable(db, "geo_materials"),
    geoFeatures: countTable(db, "geo_features"),
    strategies: countTable(db, "strategies")
  };

  const secondCommit = await commitService.commitApprovedPendingBatch(db, importResult.batch.id);
  const approvedAfterSecondCommit = {
    geoMaterials: countTable(db, "geo_materials"),
    geoFeatures: countTable(db, "geo_features"),
    strategies: countTable(db, "strategies")
  };

  const thirdCommit = await commitService.commitApprovedPendingBatch(db, importResult.batch.id);
  const approvedAfterThirdCommit = {
    geoMaterials: countTable(db, "geo_materials"),
    geoFeatures: countTable(db, "geo_features"),
    strategies: countTable(db, "strategies")
  };

  const libraryMaterials = libraryService.listBySection(db, "geo-materials");
  const libraryFeatures = libraryService.listBySection(db, "features");
  const ravellingFeatureId = findIdByTitle(libraryFeatures, "active ravelling pocket");
  const ravellingFeatureDetail = ravellingFeatureId
    ? libraryService.getDetailView(db, "features", ravellingFeatureId)
    : undefined;

  const libraryVisibility = {
    hasSlickClaySeam: hasTitle(libraryMaterials, "slick clay seam"),
    hasDecomposedAndesite: hasTitle(libraryMaterials, "decomposed andesite"),
    hasActiveRavellingPocket: hasTitle(libraryFeatures, "active ravelling pocket"),
    hasWetOpenJoint: hasTitle(libraryFeatures, "wet open joint"),
    hasRejectedMaterial: hasTitle(libraryMaterials, "oxidized fracture infill"),
    hasDeferredMaterial: hasTitle(libraryMaterials, "residual volcanic soil"),
    hasRejectedFeature: hasTitle(libraryFeatures, "blast damaged brow"),
    hasDeferredFeature: hasTitle(libraryFeatures, "foliation daylighting plane"),
    hasApprovedStrategyViaRelation: (ravellingFeatureDetail?.relations ?? []).some(
      (relation) => relation.itemType === "strategy" && relation.title.toLowerCase() === "targeted hand scaling"
    )
  };

  const sourceTraceability = {
    materialSources: libraryService.getDetail(db, "geo-materials", findIdByTitle(libraryMaterials, "slick clay seam") ?? "")?.sources.length ?? 0,
    featureSources: libraryService.getDetail(db, "features", ravellingFeatureId ?? "")?.sources.length ?? 0,
    strategySources: countTable(db, "item_sources")
  };

  const noSystemFlowMixed = countTable(db, "reports") > 0
    ? Number(db.exec("SELECT COUNT(*) AS c FROM reports WHERE source_type = 'system_knowledge_pack'")[0]?.values?.[0]?.[0] ?? 0) === 0
    : true;

  const firstCommitApprovedOnly =
    firstCommit.committed.geoMaterials === 2 &&
    firstCommit.committed.geoFeatures === 2 &&
    firstCommit.committed.strategies === 1;

  const repeatedCommitNoDuplicate =
    approvedAfterSecondCommit.geoMaterials === approvedAfterFirstCommit.geoMaterials &&
    approvedAfterSecondCommit.geoFeatures === approvedAfterFirstCommit.geoFeatures &&
    approvedAfterSecondCommit.strategies === approvedAfterFirstCommit.strategies &&
    approvedAfterThirdCommit.geoMaterials === approvedAfterFirstCommit.geoMaterials &&
    approvedAfterThirdCommit.geoFeatures === approvedAfterFirstCommit.geoFeatures &&
    approvedAfterThirdCommit.strategies === approvedAfterFirstCommit.strategies;

  console.log(
    JSON.stringify(
      {
        batchId: importResult.batch.id,
        invalidValidationState: invalidReport.state,
        validValidationState: validationReport.state,
        pendingAfterImport,
        pendingVisibility,
        reviewStatusSummary,
        firstCommit,
        secondCommit,
        thirdCommit,
        approvedAfterFirstCommit,
        approvedAfterSecondCommit,
        approvedAfterThirdCommit,
        firstCommitApprovedOnly,
        repeatedCommitNoDuplicate,
        libraryVisibility,
        sourceTraceability,
        noSystemFlowMixed,
        noPendingWritesAfterCommit:
          countTable(db, "pending_geo_materials") === 4 &&
          countTable(db, "pending_geo_features") === 4 &&
          countTable(db, "pending_strategies") === 3
      },
      null,
      2
    )
  );
}

await main();
