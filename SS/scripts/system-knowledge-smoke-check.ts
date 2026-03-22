import "fake-indexeddb/auto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { createDatabase } from "../src/data/db/database";
import { SqliteApprovedLibraryRepository } from "../src/data/repositories/sqlite/approvedLibraryRepository";
import { BundledSystemKnowledgeService } from "../src/services/systemKnowledge/bundledSystemKnowledgeService";

function tableCount(db: Awaited<ReturnType<typeof createDatabase>>, table: string): number {
  const result = db.exec(`SELECT COUNT(*) AS c FROM ${table}`);
  return Number(result[0]?.values?.[0]?.[0] ?? 0);
}

function hasTitle(rows: Array<{ title: string }>, expected: string): boolean {
  return rows.some((row) => row.title.toLowerCase() === expected.toLowerCase());
}

async function main(): Promise<void> {
  const db = await createDatabase();
  const schemaSql = readFileSync(resolve(process.cwd(), "db", "schema.sql"), "utf8");
  db.exec(schemaSql);

  const bundledService = new BundledSystemKnowledgeService();
  const pack = bundledService.listTrustedPacks()[0];
  if (!pack) {
    throw new Error("No bundled system pack found.");
  }

  const validation = bundledService.validateTrustedPack(pack.id);

  const pendingTables = [
    "pending_words",
    "pending_phrases",
    "pending_sentences",
    "pending_geo_materials",
    "pending_geo_features",
    "pending_strategies",
    "pending_images",
    "pending_item_image_links"
  ] as const;

  const trackedTables = [
    "geo_materials",
    "geo_features",
    "strategies",
    "item_relations",
    "images",
    "item_sources",
    "reports",
    "item_image_links"
  ] as const;

  const beforePending = Object.fromEntries(pendingTables.map((table) => [table, tableCount(db, table)]));
  const beforeTracked = Object.fromEntries(trackedTables.map((table) => [table, tableCount(db, table)]));

  const first = await bundledService.injectTrustedPack(db, pack.id);
  const afterFirstTracked = Object.fromEntries(trackedTables.map((table) => [table, tableCount(db, table)]));
  const afterFirstPending = Object.fromEntries(pendingTables.map((table) => [table, tableCount(db, table)]));

  const second = await bundledService.injectTrustedPack(db, pack.id);
  const afterSecondTracked = Object.fromEntries(trackedTables.map((table) => [table, tableCount(db, table)]));
  const afterSecondPending = Object.fromEntries(pendingTables.map((table) => [table, tableCount(db, table)]));

  const firstDeltas = Object.fromEntries(
    trackedTables.map((table) => [table, Number(afterFirstTracked[table]) - Number(beforeTracked[table])])
  );

  const secondDeltas = Object.fromEntries(
    trackedTables.map((table) => [table, Number(afterSecondTracked[table]) - Number(afterFirstTracked[table])])
  );

  const noPendingWrites = pendingTables.every((table) =>
    Number(beforePending[table]) === Number(afterFirstPending[table]) && Number(afterFirstPending[table]) === Number(afterSecondPending[table])
  );

  const expectedFirstApply =
    firstDeltas.geo_materials === 10 &&
    firstDeltas.geo_features === 10 &&
    firstDeltas.strategies === 8 &&
    firstDeltas.item_relations === 15 &&
    firstDeltas.images === 0;

  const secondApplyNoDup =
    secondDeltas.geo_materials === 0 &&
    secondDeltas.geo_features === 0 &&
    secondDeltas.strategies === 0 &&
    secondDeltas.item_relations === 0 &&
    secondDeltas.images === 0 &&
    secondDeltas.item_sources === 0 &&
    secondDeltas.reports === 0 &&
    secondDeltas.item_image_links === 0;

  const libraryRepo = new SqliteApprovedLibraryRepository(db);
  const materials = libraryRepo.listGeoMaterials();
  const features = libraryRepo.listGeoFeatures();
  const detachedRelations = libraryRepo.listRelations("geo_feature", "system-geo-feature:detached-block");
  const foliationRelations = libraryRepo.listRelations("geo_feature", "system-geo-feature:foliation-plane");
  const ravellingRelations = libraryRepo.listRelations("geo_feature", "system-geo-feature:ravelling");

  const libraryVisibility = {
    faultGouge: hasTitle(materials, "fault gouge"),
    clayInfill: hasTitle(materials, "clay infill"),
    quartzVein: hasTitle(materials, "quartz vein"),
    detachedBlock: hasTitle(features, "detached block"),
    foliationPlane: hasTitle(features, "foliation plane"),
    ravelling: hasTitle(features, "ravelling"),
    handScalingViaRelation: detachedRelations.some((row) => row.title.toLowerCase() === "hand scaling"),
    detailedMappingViaRelation: foliationRelations.some((row) => row.title.toLowerCase() === "detailed mapping"),
    shotcreteExtensionViaRelation: ravellingRelations.some((row) => row.title.toLowerCase() === "shotcrete extension")
  };

  const snapshotCount = tableCount(db, "backup_snapshots");

  console.log(
    JSON.stringify(
      {
        packId: pack.id,
        validationState: validation.validationReport.state,
        firstInjectionCounts: first.injection.injected,
        secondInjectionCounts: second.injection.injected,
        firstDeltas,
        secondDeltas,
        noPendingWrites,
        expectedFirstApply,
        secondApplyNoDup,
        libraryVisibility,
        snapshotCount
      },
      null,
      2
    )
  );
}

await main();
