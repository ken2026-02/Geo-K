import type { Database } from "sql.js";

import { escapeSqlString } from "./sqliteHelpers";

function nullableText(value?: string): string {
  return value ? `'${escapeSqlString(value)}'` : "NULL";
}

function nullableNumber(value?: number): string {
  return value == null ? "NULL" : String(value);
}

function boolAsInt(value: boolean): number {
  return value ? 1 : 0;
}

export class SqliteSystemKnowledgeRepository {
  constructor(private readonly db: Database) {}

  upsertReport(record: {
    id: string;
    sourceReportId: string;
    title: string;
    project: string;
    discipline: string;
    reportDate: string;
    sourceType: string;
    author: string;
    organization: string;
    summary?: string;
    createdAt: string;
    updatedAt: string;
  }): void {
    this.db.run(`
      INSERT INTO reports (id, source_report_id, title, project, discipline, report_date, source_type, author, organization, tags_json, summary, created_at, updated_at)
      VALUES (
        '${escapeSqlString(record.id)}',
        '${escapeSqlString(record.sourceReportId)}',
        '${escapeSqlString(record.title)}',
        '${escapeSqlString(record.project)}',
        '${escapeSqlString(record.discipline)}',
        '${escapeSqlString(record.reportDate)}',
        '${escapeSqlString(record.sourceType)}',
        '${escapeSqlString(record.author)}',
        '${escapeSqlString(record.organization)}',
        NULL,
        ${nullableText(record.summary)},
        '${escapeSqlString(record.createdAt)}',
        '${escapeSqlString(record.updatedAt)}'
      )
      ON CONFLICT(id) DO UPDATE SET
        source_report_id = excluded.source_report_id,
        title = excluded.title,
        project = excluded.project,
        discipline = excluded.discipline,
        report_date = excluded.report_date,
        source_type = excluded.source_type,
        author = excluded.author,
        organization = excluded.organization,
        summary = excluded.summary,
        updated_at = excluded.updated_at
    `);
  }

  upsertGeoMaterial(record: {
    id: string;
    canonicalName: string;
    normalizedName: string;
    chineseName?: string;
    category?: string;
    subtype?: string;
    description?: string;
    identificationMethod?: string;
    distinguishingPoints?: string;
    commonMisidentifications?: string;
    engineeringSignificance?: string;
    commonRisks?: string;
    commonTreatments?: string;
    australiaContext?: string;
    provenanceType: string;
    firstAddedAt: string;
    updatedAt: string;
  }): void {
    this.db.run(`
      INSERT INTO geo_materials (id, canonical_name, normalized_name, chinese_name, geo_material_category, geo_material_subtype, description, identification_method, distinguishing_points, common_misidentifications, engineering_significance, common_risks, common_treatments, australia_context, difficulty_level, mastery_level, provenance_type, first_added_at, updated_at, is_starred, is_archived)
      VALUES (
        '${escapeSqlString(record.id)}',
        '${escapeSqlString(record.canonicalName)}',
        '${escapeSqlString(record.normalizedName)}',
        ${nullableText(record.chineseName)},
        ${nullableText(record.category)},
        ${nullableText(record.subtype)},
        ${nullableText(record.description)},
        ${nullableText(record.identificationMethod)},
        ${nullableText(record.distinguishingPoints)},
        ${nullableText(record.commonMisidentifications)},
        ${nullableText(record.engineeringSignificance)},
        ${nullableText(record.commonRisks)},
        ${nullableText(record.commonTreatments)},
        ${nullableText(record.australiaContext)},
        NULL,
        NULL,
        '${escapeSqlString(record.provenanceType)}',
        '${escapeSqlString(record.firstAddedAt)}',
        '${escapeSqlString(record.updatedAt)}',
        0,
        0
      )
      ON CONFLICT(id) DO UPDATE SET
        canonical_name = excluded.canonical_name,
        normalized_name = excluded.normalized_name,
        chinese_name = excluded.chinese_name,
        geo_material_category = excluded.geo_material_category,
        geo_material_subtype = excluded.geo_material_subtype,
        description = excluded.description,
        identification_method = excluded.identification_method,
        distinguishing_points = excluded.distinguishing_points,
        common_misidentifications = excluded.common_misidentifications,
        engineering_significance = excluded.engineering_significance,
        common_risks = excluded.common_risks,
        common_treatments = excluded.common_treatments,
        australia_context = excluded.australia_context,
        provenance_type = excluded.provenance_type,
        updated_at = excluded.updated_at
    `);
  }

  upsertGeoFeature(record: {
    id: string;
    canonicalName: string;
    normalizedName: string;
    chineseName?: string;
    category?: string;
    subtype?: string;
    description?: string;
    identificationMethod?: string;
    distinguishingPoints?: string;
    commonCauses?: string;
    riskImplications?: string;
    treatmentOrMitigation?: string;
    reportingExpressions?: string;
    inspectionPoints?: string;
    provenanceType: string;
    firstAddedAt: string;
    updatedAt: string;
  }): void {
    this.db.run(`
      INSERT INTO geo_features (id, canonical_name, normalized_name, chinese_name, geo_feature_category, geo_feature_subtype, description, identification_method, distinguishing_points, common_causes, risk_implications, treatment_or_mitigation, reporting_expressions, inspection_points, difficulty_level, mastery_level, provenance_type, first_added_at, updated_at, is_starred, is_archived)
      VALUES (
        '${escapeSqlString(record.id)}',
        '${escapeSqlString(record.canonicalName)}',
        '${escapeSqlString(record.normalizedName)}',
        ${nullableText(record.chineseName)},
        ${nullableText(record.category)},
        ${nullableText(record.subtype)},
        ${nullableText(record.description)},
        ${nullableText(record.identificationMethod)},
        ${nullableText(record.distinguishingPoints)},
        ${nullableText(record.commonCauses)},
        ${nullableText(record.riskImplications)},
        ${nullableText(record.treatmentOrMitigation)},
        ${nullableText(record.reportingExpressions)},
        ${nullableText(record.inspectionPoints)},
        NULL,
        NULL,
        '${escapeSqlString(record.provenanceType)}',
        '${escapeSqlString(record.firstAddedAt)}',
        '${escapeSqlString(record.updatedAt)}',
        0,
        0
      )
      ON CONFLICT(id) DO UPDATE SET
        canonical_name = excluded.canonical_name,
        normalized_name = excluded.normalized_name,
        chinese_name = excluded.chinese_name,
        geo_feature_category = excluded.geo_feature_category,
        geo_feature_subtype = excluded.geo_feature_subtype,
        description = excluded.description,
        identification_method = excluded.identification_method,
        distinguishing_points = excluded.distinguishing_points,
        common_causes = excluded.common_causes,
        risk_implications = excluded.risk_implications,
        treatment_or_mitigation = excluded.treatment_or_mitigation,
        reporting_expressions = excluded.reporting_expressions,
        inspection_points = excluded.inspection_points,
        provenance_type = excluded.provenance_type,
        updated_at = excluded.updated_at
    `);
  }

  upsertStrategy(record: {
    id: string;
    canonicalName: string;
    normalizedName: string;
    chineseName?: string;
    strategyCategory?: string;
    description?: string;
    stepsOrMethod?: string;
    applicationConditions?: string;
    limitations?: string;
    linkedReportingExpression?: string;
    monitoringNotes?: string;
    provenanceType: string;
    firstAddedAt: string;
    updatedAt: string;
  }): void {
    this.db.run(`
      INSERT INTO strategies (id, canonical_name, normalized_name, chinese_name, strategy_category, description, steps_or_method, application_conditions, limitations, linked_reporting_expression, monitoring_notes, difficulty_level, provenance_type, first_added_at, updated_at, is_starred, is_archived)
      VALUES (
        '${escapeSqlString(record.id)}',
        '${escapeSqlString(record.canonicalName)}',
        '${escapeSqlString(record.normalizedName)}',
        ${nullableText(record.chineseName)},
        ${nullableText(record.strategyCategory)},
        ${nullableText(record.description)},
        ${nullableText(record.stepsOrMethod)},
        ${nullableText(record.applicationConditions)},
        ${nullableText(record.limitations)},
        ${nullableText(record.linkedReportingExpression)},
        ${nullableText(record.monitoringNotes)},
        NULL,
        '${escapeSqlString(record.provenanceType)}',
        '${escapeSqlString(record.firstAddedAt)}',
        '${escapeSqlString(record.updatedAt)}',
        0,
        0
      )
      ON CONFLICT(id) DO UPDATE SET
        canonical_name = excluded.canonical_name,
        normalized_name = excluded.normalized_name,
        chinese_name = excluded.chinese_name,
        strategy_category = excluded.strategy_category,
        description = excluded.description,
        steps_or_method = excluded.steps_or_method,
        application_conditions = excluded.application_conditions,
        limitations = excluded.limitations,
        linked_reporting_expression = excluded.linked_reporting_expression,
        monitoring_notes = excluded.monitoring_notes,
        provenance_type = excluded.provenance_type,
        updated_at = excluded.updated_at
    `);
  }

  upsertImage(record: {
    id: string;
    assetGroupId: string;
    fileName: string;
    mimeType?: string;
    originalWidth?: number;
    originalHeight?: number;
    originalSizeBytes?: number;
    hash?: string;
    variantType: string;
    storagePath: string;
    caption?: string;
    description?: string;
    tagsJson?: string;
    sourceType?: string;
    provenanceType: string;
    addedByUser: boolean;
    createdAt: string;
    updatedAt: string;
  }): void {
    this.db.run(`
      INSERT INTO images (id, asset_group_id, file_name, mime_type, original_width, original_height, original_size_bytes, hash, variant_type, storage_path, caption, description, tags_json, source_type, provenance_type, added_by_user, created_at, updated_at)
      VALUES (
        '${escapeSqlString(record.id)}',
        '${escapeSqlString(record.assetGroupId)}',
        '${escapeSqlString(record.fileName)}',
        ${nullableText(record.mimeType)},
        ${nullableNumber(record.originalWidth)},
        ${nullableNumber(record.originalHeight)},
        ${nullableNumber(record.originalSizeBytes)},
        ${nullableText(record.hash)},
        '${escapeSqlString(record.variantType)}',
        '${escapeSqlString(record.storagePath)}',
        ${nullableText(record.caption)},
        ${nullableText(record.description)},
        ${nullableText(record.tagsJson)},
        ${nullableText(record.sourceType)},
        '${escapeSqlString(record.provenanceType)}',
        ${boolAsInt(record.addedByUser)},
        '${escapeSqlString(record.createdAt)}',
        '${escapeSqlString(record.updatedAt)}'
      )
      ON CONFLICT(id) DO UPDATE SET
        asset_group_id = excluded.asset_group_id,
        file_name = excluded.file_name,
        mime_type = excluded.mime_type,
        original_width = excluded.original_width,
        original_height = excluded.original_height,
        original_size_bytes = excluded.original_size_bytes,
        hash = excluded.hash,
        variant_type = excluded.variant_type,
        storage_path = excluded.storage_path,
        caption = excluded.caption,
        description = excluded.description,
        tags_json = excluded.tags_json,
        source_type = excluded.source_type,
        provenance_type = excluded.provenance_type,
        added_by_user = excluded.added_by_user,
        updated_at = excluded.updated_at
    `);
  }

  upsertItemSource(record: {
    id: string;
    itemType: string;
    itemId: string;
    reportId: string;
    sourceSection?: string;
    sourceSentence?: string;
    sourceExcerpt?: string;
    sourcePageRef?: string;
    sourceParagraphRef?: string;
    createdAt: string;
  }): void {
    this.db.run(`
      INSERT INTO item_sources (id, item_type, item_id, report_id, source_section, source_sentence, source_excerpt, source_page_ref, source_paragraph_ref, created_at)
      VALUES (
        '${escapeSqlString(record.id)}',
        '${escapeSqlString(record.itemType)}',
        '${escapeSqlString(record.itemId)}',
        '${escapeSqlString(record.reportId)}',
        ${nullableText(record.sourceSection)},
        ${nullableText(record.sourceSentence)},
        ${nullableText(record.sourceExcerpt)},
        ${nullableText(record.sourcePageRef)},
        ${nullableText(record.sourceParagraphRef)},
        '${escapeSqlString(record.createdAt)}'
      )
      ON CONFLICT(id) DO UPDATE SET
        item_type = excluded.item_type,
        item_id = excluded.item_id,
        report_id = excluded.report_id,
        source_section = excluded.source_section,
        source_sentence = excluded.source_sentence,
        source_excerpt = excluded.source_excerpt,
        source_page_ref = excluded.source_page_ref,
        source_paragraph_ref = excluded.source_paragraph_ref
    `);
  }

  upsertRelation(record: {
    id: string;
    fromItemType: string;
    fromItemId: string;
    relationType: string;
    toItemType: string;
    toItemId: string;
    confidenceScore?: number;
    createdBy: string;
    createdAt: string;
  }): void {
    this.db.run(`
      INSERT INTO item_relations (id, from_item_type, from_item_id, relation_type, to_item_type, to_item_id, confidence_score, created_by, created_at)
      VALUES (
        '${escapeSqlString(record.id)}',
        '${escapeSqlString(record.fromItemType)}',
        '${escapeSqlString(record.fromItemId)}',
        '${escapeSqlString(record.relationType)}',
        '${escapeSqlString(record.toItemType)}',
        '${escapeSqlString(record.toItemId)}',
        ${nullableNumber(record.confidenceScore)},
        '${escapeSqlString(record.createdBy)}',
        '${escapeSqlString(record.createdAt)}'
      )
      ON CONFLICT(id) DO UPDATE SET
        from_item_type = excluded.from_item_type,
        from_item_id = excluded.from_item_id,
        relation_type = excluded.relation_type,
        to_item_type = excluded.to_item_type,
        to_item_id = excluded.to_item_id,
        confidence_score = excluded.confidence_score,
        created_by = excluded.created_by
    `);
  }

  upsertItemImageLink(record: {
    id: string;
    itemType: string;
    itemId: string;
    imageAssetId: string;
    displayOrder: number;
    linkRole?: string;
    createdAt: string;
  }): void {
    this.db.run(`
      INSERT INTO item_image_links (id, item_type, item_id, image_asset_id, display_order, link_role, created_at)
      VALUES (
        '${escapeSqlString(record.id)}',
        '${escapeSqlString(record.itemType)}',
        '${escapeSqlString(record.itemId)}',
        '${escapeSqlString(record.imageAssetId)}',
        ${record.displayOrder},
        ${nullableText(record.linkRole)},
        '${escapeSqlString(record.createdAt)}'
      )
      ON CONFLICT(id) DO UPDATE SET
        item_type = excluded.item_type,
        item_id = excluded.item_id,
        image_asset_id = excluded.image_asset_id,
        display_order = excluded.display_order,
        link_role = excluded.link_role
    `);
  }
}
