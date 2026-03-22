import "fake-indexeddb/auto";

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { validateFrozenPackContracts } from "./contracts/validateFrozenPackContracts";
import { validateTransformationReviewPackContracts } from "./contracts/validateTransformationReviewPackContracts";
import { buildTransformationReviewPackSeed } from "./transformationReview/generateTransformationReviewSeed";

import { createDatabase } from "../src/data/db/database";
import { readFirstRow } from "../src/data/repositories/sqlite/sqliteHelpers";
import { learningPackV1Schema } from "../src/features/learning/types";
import { ImportValidationService } from "../src/features/import/importValidation";
import { ApprovedCommitService } from "../src/services/import/approvedCommitService";
import { BackupOrchestrationService } from "../src/services/backup/backupOrchestrationService";
import { JsonKnowledgePackImportService } from "../src/services/import/jsonKnowledgePackImportService";
import { InboxService } from "../src/services/review/inboxService";
import { ReviewWorkflowService } from "../src/services/review/reviewWorkflowService";
import { SystemKnowledgeInjectionService } from "../src/services/systemKnowledge/systemKnowledgeInjectionService";
import { SystemKnowledgePackValidationService } from "../src/services/systemKnowledge/systemKnowledgePackValidationService";
import { BundledSystemKnowledgeService } from "../src/services/systemKnowledge/bundledSystemKnowledgeService";
import { IntegrityCheckService } from "../src/services/maintenance/integrityCheckService";
import { SystemDiagnosticsService } from "../src/services/maintenance/systemDiagnosticsService";
import { LibraryService } from "../src/services/library/libraryService";
import { PersonalNoteService } from "../src/services/personal/personalNoteService";
import { LearningModuleService } from "../src/services/learning/learningModuleService";
import { filterLearningItems } from "../src/features/learning/classification";
import { systemKnowledgePackSchema } from "../src/features/systemKnowledge/types";
import { TransformationReviewPackValidationService } from "../src/services/transformationReview/transformationReviewPackValidationService";

const schemaSql = readFileSync(new URL("../db/migrations/001_initial.sql", import.meta.url), "utf8");

function createPackJson(): string {
  return JSON.stringify({
    schema_version: "1.0",
    pack_id: "pack-test-001",
    generated_at: "2026-03-17T10:00:00.000Z",
    generator: {
      model: "test-model",
      version: "1.0"
    },
    source_report: {
      report_id: "report-001",
      title: "Test Report",
      project: "Geo Project",
      discipline: "geotechnical",
      author: "Tester",
      organization: "Engineering Org",
      date: "2026-03-17",
      file_name: "report.pdf"
    },
    statistics: {
      words: 1,
      phrases: 1,
      sentences: 1,
      geo_materials: 1,
      geo_features: 1,
      strategies: 0,
      images: 0
    },
    items: {
      words: [
        {
          id: "word-001",
          canonical_word: "weathered",
          lemma: "weather",
          part_of_speech: "adjective",
          language_category: "geotechnical",
          chinese_meaning: "�绯��",
          english_definition: "affected by weathering",
          example_sentence: "The rock mass is weathered.",
          confidence: 0.95,
          source_ref: {
            section: "Geology",
            sentence: "The rock mass is weathered."
          }
        }
      ],
      phrases: [
        {
          id: "phrase-001",
          canonical_phrase: "weathered rock mass",
          phrase_type: "noun_phrase",
          function_type: "observation",
          scenario_type: "mapping",
          chinese_meaning: "�绯����",
          explanation: "describes a weathered rock mass",
          example_sentence: "A weathered rock mass was observed.",
          confidence: 0.9,
          source_ref: {
            section: "Mapping",
            sentence: "A weathered rock mass was observed."
          }
        }
      ],
      sentences: [
        {
          id: "sentence-001",
          canonical_sentence: "The rock mass is weathered and fractured.",
          sentence_type: "observation_sentence",
          function_type: "observation",
          scenario_type: "mapping",
          chinese_literal: "Literal Chinese placeholder",
          chinese_natural: "Natural Chinese placeholder",
          reusable_score: 0.8,
          confidence: 0.92,
          source_ref: {
            section: "Mapping",
            sentence: "The rock mass is weathered and fractured."
          }
        }
      ],
      geo_materials: [
        {
          id: "material-001",
          canonical_name: "reference fault gouge",
          chinese_name: "�ϲ���",
          geo_material_category: "infill_material",
          geo_material_subtype: "gouge",
          description: "soft fault infill",
          identification_method: "soft clay-like material",
          distinguishing_points: "soft, sheared clay-rich infill",
          common_misidentifications: "may be mistaken for weak soil infill",
          engineering_significance: "can form a low-strength sliding horizon",
          common_risks: "low strength",
          common_treatments: "additional support",
          australia_context: "common in weathered faulted rock masses",
          confidence: 0.93,
          source_ref: {
            section: "Geology",
            sentence: "Fault gouge was observed."
          }
        }
      ],
      geo_features: [
        {
          id: "feature-001",
          canonical_name: "reference detached block",
          chinese_name: "Detached block placeholder",
          geo_feature_category: "instability_feature",
          geo_feature_subtype: "detached_block",
          description: "reference detached block near reference fault gouge",
          identification_method: "visible separation",
          distinguishing_points: "clear separation crack around block",
          common_causes: "jointing",
          risk_implications: "rockfall",
          treatment_or_mitigation: "scaling",
          reporting_expressions: ["Detached block observed."],
          inspection_points: "check crown and sidewall for widening gaps",
          confidence: 0.91,
          source_ref: {
            section: "Inspection",
            sentence: "A reference detached block near reference fault gouge was observed."
          }
        }
      ],
      strategies: []
    },
    images: []
  });
}

function createSystemPackJson(): string {
  return JSON.stringify({
    schema_version: "1.1",
    pack_id: "system-geo-core",
    pack_name: "System Geo Core",
    ownership: "system",
    source_report: {
      id: "system-report:geo-core",
      source_report_id: "system.geo.core",
      title: "Built-in Geotechnical Reference Core",
      project: "System Knowledge Library",
      discipline: "geotechnical",
      author: "Engineering Knowledge Vault",
      organization: "Engineering Knowledge Vault",
      date: "2026-03-17",
      file_name: "system-geo-core",
      notes: "Built-in system reference content"
    },
    source_documents: [
      {
        id: "source:as1726-2017",
        source_report_id: "AS1726-2017",
        title: "Geotechnical Site Investigations",
        document_type: "standard",
        document_number: "AS 1726:2017",
        edition: "2017",
        jurisdiction: "AU",
        authority_level: "adopted_standard",
        document_status: "current",
        publisher: "Standards Australia",
        discipline: "geotechnical",
        organization: "Standards Australia",
        date: "2017-08-31",
        effective_date: "2017-08-31",
        reviewed_at: "2026-03-21",
        keywords: ["site investigation", "baseline"],
        notes: "Primary Australian baseline for site investigation terminology."
      }
    ],
    items: {
      words: [
        {
          id: "system-word:site-investigation",
          canonical_word: "site investigation",
          language_category: "geotechnical",
          english_definition: "Planned investigation to define ground conditions and risks.",
          source_ref: {
            source_document_id: "source:as1726-2017",
            section: "Purpose and scope",
            sentence: "Site investigation scope should match project risk and design needs."
          }
        }
      ],
      phrases: [
        {
          id: "system-phrase:engineering-geological-model",
          canonical_phrase: "engineering geological model",
          phrase_type: "multiword_term",
          function_type: "definition",
          scenario_type: "design",
          explanation: "Ground model describing materials, structures, hazards, and engineering relevance.",
          source_ref: {
            source_document_id: "source:as1726-2017",
            section: "Interpretation and model development",
            sentence: "The engineering geological model should evolve with new investigation data."
          }
        }
      ],
      sentences: [
        {
          id: "system-sentence:risk-based-investigation",
          canonical_sentence: "Investigation effort should be proportionate to geotechnical complexity and consequence.",
          sentence_type: "recommendation_sentence",
          function_type: "recommendation",
          scenario_type: "design",
          source_ref: {
            source_document_id: "source:as1726-2017",
            section: "Planning investigations",
            sentence: "Investigation effort should reflect complexity and consequence."
          }
        }
      ],
      geo_materials: [
        {
          id: "system-geo-material:reference-fault-gouge",
          canonical_name: "system reference fault gouge",
          geo_material_category: "infill_material",
          geo_material_subtype: "gouge",
          description: "system reference gouge material",
          identification_method: "soft clay-rich infill",
          distinguishing_points: "soft clay-rich seam along the structure",
          engineering_significance: "can reduce structural shear strength",
          common_risks: "low shear strength",
          common_treatments: "support and mapping review",
          source_ref: {
            section: "System Reference",
            sentence: "Fault gouge commonly forms a weak infill horizon."
          }
        }
      ],
      geo_features: [
        {
          id: "system-geo-feature:reference-detached-block",
          canonical_name: "system reference detached block",
          geo_feature_category: "instability_feature",
          geo_feature_subtype: "detached_block",
          description: "system reference reference detached block",
          identification_method: "visible separation around block perimeter",
          distinguishing_points: "separation crack visible around the block",
          risk_implications: "rockfall hazard",
          treatment_or_mitigation: "scaling and support review",
          reporting_expressions: ["Detached block observed in crown."],
          inspection_points: "check widening cracks and support condition",
          source_ref: {
            section: "System Reference",
            sentence: "Detached blocks indicate a localized instability hazard."
          }
        }
      ],
      requirements: [
        {
          id: "system-requirement:risk-proportionate-investigation",
          canonical_name: "Investigation scope must match geotechnical risk",
          requirement_category: "investigation_requirement",
          jurisdiction: "AU",
          authority_level: "adopted_standard",
          clause_reference: "AS 1726 planning principles",
          requirement_text: "Investigation scope must be proportionate to project complexity and consequence.",
          plain_language_summary: "Scale the investigation to the actual geotechnical risk.",
          verification_method: "Review scope against project stage and risk profile.",
          tags: ["site investigation", "scoping"],
          source_ref: {
            source_document_id: "source:as1726-2017",
            section: "Planning investigations",
            sentence: "Investigation effort should reflect complexity and consequence."
          }
        }
      ],
      methods: [
        {
          id: "system-method:engineering-geological-model-review",
          canonical_name: "Engineering geological model review",
          method_category: "analysis_method",
          jurisdiction: "AU",
          authority_level: "adopted_standard",
          purpose: "Maintain an updated ground interpretation as information grows.",
          procedure_summary: "Review new exposures and investigation data against the current ground model.",
          inputs_or_prerequisites: "Current ground model, new investigation data, and mapped observations.",
          outputs_or_results: "Updated engineering geological model and identified uncertainties.",
          limitations: "Model quality remains dependent on investigation coverage and data quality.",
          tags: ["ground model", "design review"],
          source_ref: {
            source_document_id: "source:as1726-2017",
            section: "Interpretation and model development",
            sentence: "The engineering geological model should evolve with new investigation data."
          }
        }
      ],
      strategies: [
        {
          id: "system-strategy:inspect-detached-block",
          canonical_name: "inspect system reference detached block",
          strategy_category: "inspection_method",
          description: "inspect visible reference detached blocks systematically",
          steps_or_method: "check crown, sidewall, aperture, and support interaction",
          application_conditions: "use when visible block separation is present",
          limitations: "visual inspection does not replace detailed stability assessment",
          monitoring_notes: "record crack change over time",
          source_ref: {
            section: "System Reference",
            sentence: "Detached block inspection should be systematic and repeatable."
          }
        }
      ]
    },
    relations: [
      {
        id: "system-relation:feature-to-material",
        from_item_type: "geo_feature",
        from_item_id: "system-geo-feature:reference-detached-block",
        relation_type: "related_material",
        to_item_type: "geo_material",
        to_item_id: "system-geo-material:reference-fault-gouge",
        confidence_score: 0.8
      },
      {
        id: "system-relation:feature-to-strategy",
        from_item_type: "geo_feature",
        from_item_id: "system-geo-feature:reference-detached-block",
        relation_type: "recommended_strategy",
        to_item_type: "strategy",
        to_item_id: "system-strategy:inspect-detached-block",
        confidence_score: 0.9
      }
    ],
    images: [
      {
        id: "system-image:reference-detached-block-example",
        file_name: "system-detached-block-example.png",
        caption: "Reference detached block field example",
        description: "Reference image for reference detached block recognition",
        tags: ["detached_block", "instability_feature"],
        source_type: "imported_from_pack",
        linked_items: [
          {
            item_type: "geo_feature",
            item_id: "system-geo-feature:reference-detached-block",
            link_role: "source_image"
          }
        ]
      }
    ]
  });
}

async function main(): Promise<void> {
  const db = await createDatabase();
  db.exec(schemaSql);

  validateFrozenPackContracts();
  validateTransformationReviewPackContracts();

  const validPack = createPackJson();
  const validator = new ImportValidationService();
  const validReport = validator.validate(validPack);
  assert.notEqual(validReport.state, "invalid", "valid pack should pass validation");

  const invalidReport = validator.validate('{"schema_version":"9.9"}');
  assert.equal(invalidReport.state, "invalid", "invalid pack should fail validation");

  const importService = new JsonKnowledgePackImportService();
  const importResult = await importService.importIntoPending(db, "knowledge_pack.json", validPack);
  assert.equal(importResult.batch.id.startsWith("pack-test-001"), true, "pending import batch id should be derived from the source pack id");
  assert.equal(Number(readFirstRow(db, "SELECT COUNT(*) AS count_value FROM pending_words")?.count_value ?? 0), 1);
  assert.equal(Number(readFirstRow(db, "SELECT COUNT(*) AS count_value FROM backup_snapshots")?.count_value ?? 0) >= 1, true);

  const inboxService = new InboxService();
  const pendingItems = await inboxService.listPendingItems(db, importResult.batch.id);
  for (const item of pendingItems) {
    await inboxService.approve(db, item.itemType, item.id);
  }

  const commitSummary = await new ApprovedCommitService().commitApprovedPendingBatch(db, importResult.batch.id);
  assert.equal(commitSummary.committed.words, 1);
  assert.equal(Number(readFirstRow(db, "SELECT COUNT(*) AS count_value FROM words")?.count_value ?? 0), 1);
  assert.equal(Number(readFirstRow(db, "SELECT COUNT(*) AS count_value FROM item_sources")?.count_value ?? 0) >= 5, true);

  const committedMaterial = readFirstRow(
    db,
    "SELECT distinguishing_points, common_misidentifications, engineering_significance, australia_context FROM geo_materials WHERE normalized_name = 'reference fault gouge'"
  );
  assert.equal(String(committedMaterial?.distinguishing_points ?? ""), "soft, sheared clay-rich infill");
  assert.equal(String(committedMaterial?.common_misidentifications ?? ""), "may be mistaken for weak soil infill");
  assert.equal(String(committedMaterial?.engineering_significance ?? ""), "can form a low-strength sliding horizon");
  assert.equal(String(committedMaterial?.australia_context ?? ""), "common in weathered faulted rock masses");

  const committedFeature = readFirstRow(
    db,
    "SELECT distinguishing_points, inspection_points FROM geo_features WHERE normalized_name = 'reference detached block'"
  );
  assert.equal(String(committedFeature?.distinguishing_points ?? ""), "clear separation crack around block");
  assert.equal(String(committedFeature?.inspection_points ?? ""), "check crown and sidewall for widening gaps");

  const systemPack = createSystemPackJson();
  const systemValidator = new SystemKnowledgePackValidationService();
  const systemValidReport = systemValidator.validate(systemPack);
  assert.equal(systemValidReport.state, "valid", "valid system pack should pass validation");
  const systemInvalidReport = systemValidator.validate('{"schema_version":"1.1","pack_id":"bad","ownership":"system"}');
  assert.equal(systemInvalidReport.state, "invalid", "invalid system pack should fail validation");

  const fakeImagePipeline = {
    async process(input: { id: string; fileName: string; mimeType: string; blob: Blob }) {
      return {
        id: input.id,
        variants: [
          {
            variant: "thumbnail" as const,
            blob: new Blob([`thumb:${input.id}`], { type: "image/webp" }),
            mimeType: "image/webp",
            width: 160,
            height: 120
          },
          {
            variant: "standard" as const,
            blob: new Blob([`standard:${input.id}`], { type: "image/webp" }),
            mimeType: "image/webp",
            width: 960,
            height: 720
          }
        ]
      };
    }
  };

  const pendingGeoCountBefore = Number(readFirstRow(db, "SELECT COUNT(*) AS count_value FROM pending_geo_materials")?.count_value ?? 0);
  const pendingImageCountBefore = Number(readFirstRow(db, "SELECT COUNT(*) AS count_value FROM pending_images")?.count_value ?? 0);

  const systemInjectionService = new SystemKnowledgeInjectionService({ imagePipeline: fakeImagePipeline });
  const systemResult = await systemInjectionService.inject(
    db,
    systemPack,
    new Map([["system-detached-block-example.png", new Blob(["png-data"], { type: "image/png" })]])
  );

  assert.equal(systemResult.injected.sourceDocuments, 1);
  assert.equal(systemResult.injected.words, 1);
  assert.equal(systemResult.injected.phrases, 1);
  assert.equal(systemResult.injected.sentences, 1);
  assert.equal(systemResult.injected.geoMaterials, 1);
  assert.equal(systemResult.injected.geoFeatures, 1);
  assert.equal(systemResult.injected.strategies, 1);
  assert.equal(systemResult.injected.requirements, 1);
  assert.equal(systemResult.injected.methods, 1);
  assert.equal(Number(readFirstRow(db, "SELECT COUNT(*) AS count_value FROM pending_geo_materials")?.count_value ?? 0), pendingGeoCountBefore);
  assert.equal(Number(readFirstRow(db, "SELECT COUNT(*) AS count_value FROM pending_images")?.count_value ?? 0), pendingImageCountBefore);
  assert.equal(Number(readFirstRow(db, "SELECT COUNT(*) AS count_value FROM words WHERE id = 'system-word:site-investigation'")?.count_value ?? 0), 1);
  assert.equal(Number(readFirstRow(db, "SELECT COUNT(*) AS count_value FROM phrases WHERE id = 'system-phrase:engineering-geological-model'")?.count_value ?? 0), 1);
  assert.equal(Number(readFirstRow(db, "SELECT COUNT(*) AS count_value FROM sentences WHERE id = 'system-sentence:risk-based-investigation'")?.count_value ?? 0), 1);
  assert.equal(Number(readFirstRow(db, "SELECT COUNT(*) AS count_value FROM strategies WHERE id = 'system-strategy:inspect-detached-block'")?.count_value ?? 0), 1);
  assert.equal(Number(readFirstRow(db, "SELECT COUNT(*) AS count_value FROM requirements WHERE id = 'system-requirement:risk-proportionate-investigation'")?.count_value ?? 0), 1);
  assert.equal(Number(readFirstRow(db, "SELECT COUNT(*) AS count_value FROM methods WHERE id = 'system-method:engineering-geological-model-review'")?.count_value ?? 0), 1);
  assert.equal(Number(readFirstRow(db, "SELECT COUNT(*) AS count_value FROM images WHERE asset_group_id = 'system-image:reference-detached-block-example'")?.count_value ?? 0), 2);
  assert.equal(Number(readFirstRow(db, "SELECT COUNT(*) AS count_value FROM item_image_links WHERE item_id = 'system-geo-feature:reference-detached-block'")?.count_value ?? 0), 1);
  assert.equal(String(readFirstRow(db, "SELECT source_type FROM reports WHERE id = 'system-report:geo-core'")?.source_type ?? ""), "system_knowledge_pack");
  assert.equal(String(readFirstRow(db, "SELECT source_type FROM reports WHERE id = 'source:as1726-2017'")?.source_type ?? ""), "system_source_register");
  assert.equal(String(readFirstRow(db, "SELECT authority_level FROM reports WHERE id = 'source:as1726-2017'")?.authority_level ?? ""), "adopted_standard");
  assert.equal(String(readFirstRow(db, "SELECT provenance_type FROM geo_features WHERE id = 'system-geo-feature:reference-detached-block'")?.provenance_type ?? ""), "system_generated");

  await systemInjectionService.inject(
    db,
    systemPack,
    new Map([["system-detached-block-example.png", new Blob(["png-data"], { type: "image/png" })]])
  );

  assert.equal(Number(readFirstRow(db, "SELECT COUNT(*) AS count_value FROM strategies WHERE id = 'system-strategy:inspect-detached-block'")?.count_value ?? 0), 1);
  assert.equal(Number(readFirstRow(db, "SELECT COUNT(*) AS count_value FROM item_relations WHERE id = 'system-relation:feature-to-material'")?.count_value ?? 0), 1);
  assert.equal(Number(readFirstRow(db, "SELECT COUNT(*) AS count_value FROM item_image_links WHERE id = 'system-image-link:geo_feature:system-geo-feature:reference-detached-block:system-image:reference-detached-block-example:source_image'")?.count_value ?? 0), 1);

  const bundledSystemKnowledgeService = new BundledSystemKnowledgeService(new SystemKnowledgeInjectionService({ imagePipeline: fakeImagePipeline }));
  const trustedPacks = bundledSystemKnowledgeService.listTrustedPacks();
  assert.equal(trustedPacks.length >= 1, true, "at least one trusted bundled system pack should be available");
  const triggerValidation = bundledSystemKnowledgeService.validateTrustedPack(trustedPacks[0].id);
  assert.equal(triggerValidation.validationReport.state, "valid", "trusted bundled system pack should validate");
  const triggerResult = await bundledSystemKnowledgeService.injectTrustedPack(db, trustedPacks[0].id);
  assert.equal(triggerResult.snapshotCreated, true);
  assert.equal(triggerResult.injection.snapshotRecord.snapshotType, "auto_pre_system_injection");
  assert.equal(Number(readFirstRow(db, "SELECT COUNT(*) AS count_value FROM strategies WHERE id = 'system-strategy:inspect-detached-block'")?.count_value ?? 0), 1);
  const diagnosticsService = new SystemDiagnosticsService();
  const diagnosticsWithoutIntegrity = await diagnosticsService.loadDiagnostics(db, false);
  assert.equal(diagnosticsWithoutIntegrity.dataState.flowAvailability.systemBuiltInValidateApply, "available");
  assert.equal(diagnosticsWithoutIntegrity.dataState.flowAvailability.userImportPendingReviewCommit, "available");
  assert.equal(diagnosticsWithoutIntegrity.dataState.flowAvailability.governanceIntegrityDiagnostics, "available");
  assert.equal(diagnosticsWithoutIntegrity.dataState.flowAvailability.geoLibraryDetailRead, "available");
  assert.equal(diagnosticsWithoutIntegrity.dataState.approvedCounts.geoMaterials >= 1, true);
  assert.equal(diagnosticsWithoutIntegrity.dataState.approvedCounts.geoFeatures >= 1, true);
  assert.equal(diagnosticsWithoutIntegrity.dataState.approvedCounts.strategies >= 1, true);
  assert.equal(diagnosticsWithoutIntegrity.dataState.pendingCounts.geoMaterials >= 1, true);
  assert.equal(diagnosticsWithoutIntegrity.dataState.approvedProvenance.total >= diagnosticsWithoutIntegrity.dataState.approvedProvenance.systemGenerated, true);

  const diagnosticsWithIntegrity = await diagnosticsService.loadDiagnostics(db, true);
  assert.equal(Boolean(diagnosticsWithIntegrity.integrity), true, "diagnostics should return integrity details when requested");
  assert.equal((diagnosticsWithIntegrity.integrity?.summary.totalIssues ?? 0) >= 0, true, "integrity summary should be available");

  const libraryService = new LibraryService();
  const featureBrowse = libraryService.getGeoBrowseData(db, "features", { sortBy: "name" });
  assert.equal(featureBrowse.items.length >= 1, true, "feature browse should return injected approved features");
  assert.equal(featureBrowse.filterOptions.categories.length >= 1, true, "feature browse should expose category filters");

  const materialBrowse = libraryService.getGeoBrowseData(db, "geo-materials", { sortBy: "name" });
  assert.equal(materialBrowse.items.length >= 1, true, "material browse should return injected approved materials");
  assert.equal(materialBrowse.filterOptions.categories.length >= 1, true, "material browse should expose category filters");

  const detachedBlockId = String(
    readFirstRow(db, "SELECT id FROM geo_features WHERE normalized_name = 'detached block' ORDER BY updated_at DESC LIMIT 1")?.id ??
      readFirstRow(db, "SELECT id FROM geo_features ORDER BY updated_at DESC LIMIT 1")?.id ??
      ""
  );
  assert.notEqual(detachedBlockId, "", "expected at least one geo feature id for detail view checks");

  const featureDetailView = libraryService.getDetailView(db, "features", detachedBlockId);
  assert.equal(Boolean(featureDetailView), true, "feature detail view should load");
  assert.equal(featureDetailView?.sections.length ? true : false, true, "feature detail should expose sectioned content");
  assert.equal(
    featureDetailView?.sections.some((section) => section.title === "Reporting Expressions and Inspection Points"),
    true,
    "feature detail should expose reporting/inspection section"
  );
  assert.equal(featureDetailView?.relationGroups.length ? featureDetailView.relationGroups[0].key === "materials" || featureDetailView.relationGroups[0].key === "features" || featureDetailView.relationGroups[0].key === "strategies" : true, true, "relation groups should be organized");

  const faultGougeId = String(
    readFirstRow(db, "SELECT id FROM geo_materials WHERE normalized_name = 'fault gouge' ORDER BY updated_at DESC LIMIT 1")?.id ??
      readFirstRow(db, "SELECT id FROM geo_materials ORDER BY updated_at DESC LIMIT 1")?.id ??
      ""
  );
  assert.notEqual(faultGougeId, "", "expected at least one geo material id for detail view checks");

  const materialDetailView = libraryService.getDetailView(db, "geo-materials", faultGougeId);
  assert.equal(Boolean(materialDetailView), true, "material detail view should load");
  assert.equal(materialDetailView?.sections.length ? true : false, true, "material detail should expose sectioned content");

  const personalNotesService = new PersonalNoteService();
  const approvedRowsBeforePersonal = {
    geoMaterials: Number(readFirstRow(db, "SELECT COUNT(*) AS count_value FROM geo_materials")?.count_value ?? 0),
    geoFeatures: Number(readFirstRow(db, "SELECT COUNT(*) AS count_value FROM geo_features")?.count_value ?? 0),
    relations: Number(readFirstRow(db, "SELECT COUNT(*) AS count_value FROM item_relations")?.count_value ?? 0)
  };

  const personalCreated = await personalNotesService.createForItem(db, {
    targetItemType: "geo_feature",
    targetItemId: detachedBlockId,
    noteType: "observation",
    body: "Personal note: monitor detached block crest gap during next shift."
  });

  const personalByFeature = await personalNotesService.listForItem(db, "geo_feature", detachedBlockId);
  assert.equal(personalByFeature.some((entry) => entry.id === personalCreated.id), true, "personal note should be listed for its target item");

  const personalUpdated = await personalNotesService.updateNote(db, {
    id: personalCreated.id,
    noteType: "action",
    body: "Personal action: verify support condition before scaling.",
    status: "active"
  });
  assert.equal(personalUpdated.noteType, "action", "personal note type should update");

  await personalNotesService.archiveNote(db, personalUpdated.id);
  const archivedPersonal = await personalNotesService.listForItem(db, "geo_feature", detachedBlockId);
  assert.equal(archivedPersonal.find((entry) => entry.id === personalUpdated.id)?.status, "archived", "personal note should archive");

  const personalRows = Number(readFirstRow(db, "SELECT COUNT(*) AS count_value FROM personal_notes")?.count_value ?? 0);
  assert.equal(personalRows >= 1, true, "personal notes should persist in isolated table");

  const approvedRowsAfterPersonal = {
    geoMaterials: Number(readFirstRow(db, "SELECT COUNT(*) AS count_value FROM geo_materials")?.count_value ?? 0),
    geoFeatures: Number(readFirstRow(db, "SELECT COUNT(*) AS count_value FROM geo_features")?.count_value ?? 0),
    relations: Number(readFirstRow(db, "SELECT COUNT(*) AS count_value FROM item_relations")?.count_value ?? 0)
  };

  assert.equal(approvedRowsAfterPersonal.geoMaterials, approvedRowsBeforePersonal.geoMaterials, "personal notes must not modify approved geo_material rows");
  assert.equal(approvedRowsAfterPersonal.geoFeatures, approvedRowsBeforePersonal.geoFeatures, "personal notes must not modify approved geo_feature rows");
  assert.equal(approvedRowsAfterPersonal.relations, approvedRowsBeforePersonal.relations, "personal notes must not modify approved relations");


  const learningService = new LearningModuleService();
  const learningRaw = readFileSync(new URL("../public/pack-samples/learning-pack-v1.sample.json", import.meta.url), "utf8");
  const learningValidation = learningService.validatePack(learningRaw);
  assert.equal(learningValidation.state, "valid", "frozen Learning Pack v1 sample should validate");

  const approvedBeforeLearning = {
    words: Number(readFirstRow(db, "SELECT COUNT(*) AS count_value FROM words")?.count_value ?? 0),
    geoMaterials: Number(readFirstRow(db, "SELECT COUNT(*) AS count_value FROM geo_materials")?.count_value ?? 0)
  };

  const learningImport = await learningService.importPack(learningRaw);
  assert.equal(learningImport.imported >= 1, true, "learning sample should import at least one item");

  const learningWords = await learningService.listItems("word");
  assert.equal(learningWords.length >= 1, true, "learning word filter should return imported word items");
  assert.equal(learningWords.every((entry) => entry.status === "new"), true, "learning items imported without explicit status should default to new");

  const classifiedLearningRaw = JSON.stringify({
    schema_version: "1.0",
    pack_id: "learning-classification-test",
    items: [
      {
        id: "learning-classification-existing-domain",
        type: "concept",
        content: "Observed seepage band in weathered slope face.",
        domain: "groundwater",
        tags: ["seepage", "mapping"]
      },
      {
        id: "learning-classification-default-domain",
        type: "phrase",
        content: "fresh blast overbreak",
        tags: ["blast"]
      },
      {
        id: "learning-classification-default-tags",
        type: "word",
        content: "ravelling"
      }
    ]
  });
  const classifiedLearningValidation = learningService.validatePack(classifiedLearningRaw);
  assert.equal(classifiedLearningValidation.state, "valid", "learning classification extension pack should validate");

  const classifiedLearningImport = await learningService.importPack(classifiedLearningRaw, {
    defaultDomain: "safety",
    defaultTags: ["batch-default", "field-note"]
  });
  assert.equal(classifiedLearningImport.imported, 3, "classification test pack should import all items");

  const allLearning = await learningService.listItems("all");
  assert.equal(allLearning.length >= 1, true, "learning list should return imported items");

  const domainPreserved = allLearning.find((entry) => entry.id === "learning-classification-existing-domain");
  assert.equal(domainPreserved?.domain, "groundwater", "existing learning domain should be preserved on import");
  assert.equal(domainPreserved?.status, "new", "learning import should default status to new when status is missing");
  assert.equal(domainPreserved?.tags?.includes("batch-default"), true, "default tags should merge with existing item tags");

  const domainDefaulted = allLearning.find((entry) => entry.id === "learning-classification-default-domain");
  assert.equal(domainDefaulted?.domain, "safety", "default learning domain should apply when item domain is missing");
  assert.equal(domainDefaulted?.status, "new", "defaulted learning items should still start as new");
  assert.equal(domainDefaulted?.tags?.includes("blast"), true, "existing item tags should be preserved when defaults are merged");
  assert.equal(domainDefaulted?.tags?.includes("field-note"), true, "default tags should be added when provided");

  const tagsDefaulted = allLearning.find((entry) => entry.id === "learning-classification-default-tags");
  assert.equal(tagsDefaulted?.domain, "safety", "default learning domain should apply to unclassified items");
  assert.equal(tagsDefaulted?.status, "new", "unclassified imported items should default to new status");
  assert.equal(tagsDefaulted?.tags?.includes("batch-default"), true, "default tags should apply when item tags are missing");

  const batchSelectedIds = ["learning-classification-default-domain", "learning-classification-default-tags"];
  const batchDomainCount = await learningService.batchSetDomain(batchSelectedIds, "geology");
  assert.equal(batchDomainCount, 2, "batch domain update should affect the selected learning items");

  const afterBatchDomain = await learningService.listItems("all");
  assert.equal(afterBatchDomain.find((entry) => entry.id === "learning-classification-default-domain")?.domain, "geology", "batch domain update should overwrite domain for selected items");
  assert.equal(afterBatchDomain.find((entry) => entry.id === "learning-classification-default-tags")?.domain, "geology", "batch domain update should apply to all selected items");

  const batchStatusCount = await learningService.batchSetStatus(batchSelectedIds, "reviewed");
  assert.equal(batchStatusCount, 2, "batch status update should affect the selected learning items");

  const afterBatchStatus = await learningService.listItems("all");
  assert.equal(afterBatchStatus.find((entry) => entry.id === "learning-classification-default-domain")?.status, "reviewed", "batch status update should set reviewed status for selected items");
  assert.equal(afterBatchStatus.find((entry) => entry.id === "learning-classification-default-tags")?.status, "reviewed", "batch status update should apply to every selected item");

  const batchAddTagCount = await learningService.batchAddTags(batchSelectedIds, ["reviewed", "priority"]);
  assert.equal(batchAddTagCount, 2, "batch add tags should affect the selected learning items");

  const afterBatchAddTags = await learningService.listItems("all");
  assert.equal(afterBatchAddTags.find((entry) => entry.id === "learning-classification-default-domain")?.tags?.includes("priority"), true, "batch add tags should append new tags to selected items");
  assert.equal(afterBatchAddTags.find((entry) => entry.id === "learning-classification-default-tags")?.tags?.includes("reviewed"), true, "batch add tags should apply to every selected item");

  const combinedStudyFilterMatches = filterLearningItems(afterBatchAddTags, {
    type: "all",
    domain: "geology",
    status: "reviewed",
    searchText: "priority"
  });
  assert.equal(combinedStudyFilterMatches.length, 2, "combined learning filters should match reviewed geology items by tag search text");

  const batchRemoveTagCount = await learningService.batchRemoveTags(batchSelectedIds, ["batch-default", "field-note"]);
  assert.equal(batchRemoveTagCount, 2, "batch remove tags should affect the selected learning items");

  const afterBatchRemoveTags = await learningService.listItems("all");
  assert.equal(afterBatchRemoveTags.find((entry) => entry.id === "learning-classification-default-domain")?.tags?.includes("batch-default"), false, "batch remove tags should remove selected tags");
  assert.equal(afterBatchRemoveTags.find((entry) => entry.id === "learning-classification-default-tags")?.tags?.includes("field-note"), false, "batch remove tags should remove selected tags from every selected item");

  const batchDeleteCount = await learningService.batchDelete(batchSelectedIds);
  assert.equal(batchDeleteCount, 2, "batch delete should remove the selected learning items only");

  const afterBatchDelete = await learningService.listItems("all");
  assert.equal(afterBatchDelete.some((entry) => entry.id === "learning-classification-default-domain"), false, "batch delete should remove the selected domain item");
  assert.equal(afterBatchDelete.some((entry) => entry.id === "learning-classification-default-tags"), false, "batch delete should remove the selected tag item");
  assert.equal(afterBatchDelete.some((entry) => entry.id === "learning-classification-existing-domain"), true, "batch delete must not remove unrelated learning items");

  const updateCandidate = afterBatchDelete.find((entry) => entry.id === "learning-classification-existing-domain") ?? afterBatchDelete[0];
  if (!updateCandidate) {
    throw new Error("expected at least one learning item for status edit checks");
  }

  const updatedLearning = await learningService.updateItem({
    id: updateCandidate.id,
    type: updateCandidate.type,
    content: `${updateCandidate.content} (edited)`,
    meaning: updateCandidate.meaning,
    example: updateCandidate.example,
    note: updateCandidate.note,
    domain: "reporting",
    status: "learning",
    tags: updateCandidate.tags,
    sourceReport: "study-status-source"
  });
  assert.equal(updatedLearning.content.endsWith("(edited)"), true, "learning item should be editable");
  assert.equal(updatedLearning.domain, "reporting", "learning item domain should be editable");
  assert.equal(updatedLearning.status, "learning", "learning item status should be editable");

  const sourceSearchMatches = filterLearningItems(await learningService.listItems("all"), {
    type: "all",
    domain: "reporting",
    status: "learning",
    searchText: "study-status-source"
  });
  assert.equal(sourceSearchMatches.some((entry) => entry.id === updatedLearning.id), true, "combined learning filters should match source-report search for study mode");

  const deleteCandidate = afterBatchDelete.find((entry) => entry.id !== updatedLearning.id);
  if (deleteCandidate) {
    await learningService.deleteItem(deleteCandidate.id);
    const afterDelete = await learningService.listItems("all");
    assert.equal(afterDelete.some((entry) => entry.id === deleteCandidate.id), false, "learning item delete should remove item");
  }

  const learningExport = await learningService.exportPack("learning-export-validation");
  const exportedLearningValidation = learningService.validatePack(learningExport.json);
  assert.equal(exportedLearningValidation.state, "valid", "learning export should produce valid Learning Pack v1 JSON");
  const exportedLearningPack = JSON.parse(learningExport.json) as { items: Array<{ id: string; domain?: string; status?: string }> };
  assert.equal(
    exportedLearningPack.items.some((item) => item.id === updatedLearning.id && item.domain === "reporting" && item.status === "learning"),
    true,
    "learning export should preserve optional classification and status extension fields"
  );

  const inboxExport = await learningService.exportForInbox([updatedLearning.id]);
  const inboxExportValidation = validator.validate(inboxExport.json);
  assert.notEqual(inboxExportValidation.state, "invalid", "learning export-for-inbox should produce a valid Inbox knowledge pack");
  const inboxExportImport = await importService.importIntoPending(db, inboxExport.fileName, inboxExport.json);
  assert.equal(inboxExportImport.batch.pendingItems >= 1, true, "export-for-inbox should be stageable through Inbox import");

  const seedHelperLearningRaw = readFileSync(new URL("../public/pack-samples/learning-pack-v1.seed-helper.sample.json", import.meta.url), "utf8");
  assert.equal(learningPackV1Schema.safeParse(JSON.parse(seedHelperLearningRaw) as unknown).success, true, "seed-helper input sample should validate as Learning Pack");

  const seededTransformationResult = buildTransformationReviewPackSeed(seedHelperLearningRaw);
  assert.equal(seededTransformationResult.summary.learningItemsRead, 6, "seed helper sample should read the expected number of Learning items");
  assert.equal(seededTransformationResult.summary.candidatesCreated, 5, "seed helper sample should create deterministic candidate scaffolds");
  assert.equal(seededTransformationResult.summary.skippedItems, 1, "seed helper sample should skip one word item by default");
  assert.equal(seededTransformationResult.summary.candidateCountsByTargetType.geo_material, 1, "seed helper sample should produce one geo material candidate");
  assert.equal(seededTransformationResult.summary.candidateCountsByTargetType.geo_feature, 3, "seed helper sample should produce three geo feature candidates");
  assert.equal(seededTransformationResult.summary.candidateCountsByTargetType.strategy, 1, "seed helper sample should produce one strategy candidate");

  const seededTransformationValidator = new TransformationReviewPackValidationService();
  const seededTransformationReport = seededTransformationValidator.validate(seededTransformationResult.json);
  assert.equal(seededTransformationReport.state, "valid", "seed helper output should validate as Transformation Review Pack");

  const seededTransformationPack = JSON.parse(seededTransformationResult.json) as unknown;
  assert.equal(learningPackV1Schema.safeParse(seededTransformationPack).success, false, "seed helper output must not validate as Learning Pack");
  assert.equal(systemKnowledgePackSchema.safeParse(seededTransformationPack).success, false, "seed helper output must not validate as System Pack");

  const seededOutputExampleRaw = readFileSync(
    new URL("../public/pack-samples/transformation-review-pack-v1.seeded-from-learning.sample.json", import.meta.url),
    "utf8"
  );
  assert.deepEqual(
    JSON.parse(seededOutputExampleRaw) as unknown,
    seededTransformationPack,
    "checked-in seeded Transformation Review Pack sample should match the deterministic helper output"
  );

  const approvedAfterLearning = {
    words: Number(readFirstRow(db, "SELECT COUNT(*) AS count_value FROM words")?.count_value ?? 0),
    geoMaterials: Number(readFirstRow(db, "SELECT COUNT(*) AS count_value FROM geo_materials")?.count_value ?? 0)
  };
  assert.equal(approvedAfterLearning.words, approvedBeforeLearning.words, "learning module must not modify engineering words table");
  assert.equal(approvedAfterLearning.geoMaterials, approvedBeforeLearning.geoMaterials, "learning module must not modify engineering geo_materials table");
  const backupService = new BackupOrchestrationService();
  const backup = await backupService.exportFullBackup(db);
  const backupFile = new File([backup.blob], backup.fileName, { type: "application/zip" });
  const restorePreview = await backupService.previewRestore(backupFile);
  assert.notEqual(restorePreview.state, "invalid", "exported backup should preview successfully");

  const invalidZipFile = new File([new Blob(["not-a-valid-backup"])], "bad-backup.zip", { type: "application/zip" });
  const invalidPreview = await backupService.previewRestore(invalidZipFile).catch((error) => ({ state: "invalid", errors: [error instanceof Error ? error.message : "invalid"] }));
  assert.equal(invalidPreview.state, "invalid", "invalid backup should be rejected");

  const reviewService = new ReviewWorkflowService();
  const reviewSession = reviewService.loadSession(db, "word-review", false);
  assert.equal(reviewSession.queue.length >= 1, true, "review queue should load approved items");
  const firstCard = reviewSession.queue[0];
  await reviewService.recordResult(db, "word-review", firstCard.itemType, firstCard.itemId, "correct", 1234);
  assert.equal(Number(readFirstRow(db, "SELECT COUNT(*) AS count_value FROM review_logs")?.count_value ?? 0), 1);


  const integrityService = new IntegrityCheckService();
  const integrityBaseline = await integrityService.runBasicChecks(db);
  assert.equal(integrityBaseline.summary.totalIssues >= 0, true, "integrity checks should run");

  const beforeGovernanceRows = {
    strategies: Number(readFirstRow(db, "SELECT COUNT(*) AS count_value FROM strategies")?.count_value ?? 0),
    relations: Number(readFirstRow(db, "SELECT COUNT(*) AS count_value FROM item_relations")?.count_value ?? 0),
    sources: Number(readFirstRow(db, "SELECT COUNT(*) AS count_value FROM item_sources")?.count_value ?? 0)
  };

  const governanceNow = new Date().toISOString();
  db.run(`
    INSERT INTO strategies (
      id, canonical_name, normalized_name, strategy_category, description, provenance_type, first_added_at, updated_at, is_starred, is_archived
    ) VALUES (
      'gov-system-strategy-collision',
      'governance system collision strategy',
      'governance collision strategy',
      'inspection_method',
      'system-side governance collision fixture',
      'system_generated',
      '${governanceNow}',
      '${governanceNow}',
      0,
      0
    )
  `);

  db.run(`
    INSERT INTO strategies (
      id, canonical_name, normalized_name, strategy_category, description, provenance_type, first_added_at, updated_at, is_starred, is_archived
    ) VALUES (
      'gov-user-strategy-collision',
      'governance user collision strategy',
      'governance  collision strategy',
      'inspection_method',
      'user-side governance collision fixture',
      'imported_ai',
      '${governanceNow}',
      '${governanceNow}',
      0,
      0
    )
  `);

  const integrityGovernance = await integrityService.runBasicChecks(db);
  assert.equal(
    integrityGovernance.duplicateNormalizedNames.some((entry) => entry.itemType === "strategy" && entry.normalizedName === "governance collision strategy"),
    true,
    "duplicate-name detection should identify strategy normalized duplicates"
  );
  assert.equal(
    integrityGovernance.systemUserCollisions.some((entry) => entry.itemType === "strategy" && entry.normalizedName === "governance collision strategy"),
    true,
    "system/user collision detection should identify mixed provenance normalized names"
  );

  const afterGovernanceRows = {
    strategies: Number(readFirstRow(db, "SELECT COUNT(*) AS count_value FROM strategies")?.count_value ?? 0),
    relations: Number(readFirstRow(db, "SELECT COUNT(*) AS count_value FROM item_relations")?.count_value ?? 0),
    sources: Number(readFirstRow(db, "SELECT COUNT(*) AS count_value FROM item_sources")?.count_value ?? 0)
  };

  assert.equal(afterGovernanceRows.strategies, beforeGovernanceRows.strategies + 2, "governance fixture inserts should be the only strategy row changes");
  assert.equal(afterGovernanceRows.relations, beforeGovernanceRows.relations, "governance checks must not mutate relation rows");
  assert.equal(afterGovernanceRows.sources, beforeGovernanceRows.sources, "governance checks must not mutate source rows");

  const pwaMainRuntime = readFileSync(new URL("../src/main.tsx", import.meta.url), "utf8");
  assert.equal(pwaMainRuntime.includes('registerSW({'), true, "main runtime should register the service worker explicitly");
  assert.equal(pwaMainRuntime.includes('immediate: true'), true, "service worker registration should be immediate for offline reopen reliability");

  const pwaConfigRaw = readFileSync(new URL("../vite.config.ts", import.meta.url), "utf8");
  assert.equal(pwaConfigRaw.includes('injectRegister: null'), true, "vite PWA config should rely on explicit runtime registration instead of delayed auto-injection");
  assert.equal(pwaConfigRaw.includes('navigateFallback: "index.html"'), true, "vite PWA config should declare an app-shell navigation fallback");

  const builtServiceWorker = readFileSync(new URL("../dist/sw.js", import.meta.url), "utf8");
  assert.equal(builtServiceWorker.includes('precacheAndRoute'), true, "built service worker should precache the app shell");
  assert.equal(builtServiceWorker.includes('index.html'), true, "built service worker should precache index.html for offline reopen");
  assert.equal(builtServiceWorker.includes('NavigationRoute'), true, "built service worker should serve navigations from the cached shell");

  console.log("Engineering validation passed:");
  console.log("- knowledge pack validation");
  console.log("- import staging");
  console.log("- approved commit");
  console.log("- geo field parity alignment");
  console.log("- system knowledge injection");
  console.log("- bundled system injection trigger");
  console.log("- backup preview / invalid backup rejection");
  console.log("- review log persistence");
  console.log("- governance audit checks");
  console.log("- diagnostics data-state hardening checks");
  console.log("- geo browse/detail read-side checks");
  console.log("- personal notes isolated CRUD checks");
  console.log("- frozen Learning/System pack contract sample validation");
  console.log("- learning module import/list/filter/edit/delete/export/classification/status/search/batch-delete checks");
  console.log("- transformation review pack contract validation and separation checks");
  console.log("- learning export to transformation review seed-helper checks");
  console.log("- offline reopen app-shell reliability checks");
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
























