import type { Database } from "sql.js";

import { escapeSqlString, readFirstRow } from "./sqliteHelpers";

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
    documentType?: string;
    documentNumber?: string;
    edition?: string;
    jurisdiction?: string;
    authorityLevel?: string;
    documentStatus?: string;
    publisher?: string;
    sourceUrl?: string;
    project?: string;
    discipline?: string;
    reportDate?: string;
    effectiveDate?: string;
    sourceType: string;
    author?: string;
    organization?: string;
    keywordsJson?: string;
    summary?: string;
    reviewedAt?: string;
    createdAt: string;
    updatedAt: string;
  }): void {
    this.db.run(`
      INSERT INTO reports (id, source_report_id, title, document_type, document_number, edition, jurisdiction, authority_level, document_status, publisher, source_url, project, discipline, report_date, effective_date, source_type, author, organization, tags_json, keywords_json, summary, reviewed_at, created_at, updated_at)
      VALUES (
        '${escapeSqlString(record.id)}',
        '${escapeSqlString(record.sourceReportId)}',
        '${escapeSqlString(record.title)}',
        ${nullableText(record.documentType)},
        ${nullableText(record.documentNumber)},
        ${nullableText(record.edition)},
        ${nullableText(record.jurisdiction)},
        ${nullableText(record.authorityLevel)},
        ${nullableText(record.documentStatus)},
        ${nullableText(record.publisher)},
        ${nullableText(record.sourceUrl)},
        ${nullableText(record.project)},
        ${nullableText(record.discipline)},
        ${nullableText(record.reportDate)},
        ${nullableText(record.effectiveDate)},
        '${escapeSqlString(record.sourceType)}',
        ${nullableText(record.author)},
        ${nullableText(record.organization)},
        NULL,
        ${nullableText(record.keywordsJson)},
        ${nullableText(record.summary)},
        ${nullableText(record.reviewedAt)},
        '${escapeSqlString(record.createdAt)}',
        '${escapeSqlString(record.updatedAt)}'
      )
      ON CONFLICT(id) DO UPDATE SET
        source_report_id = excluded.source_report_id,
        title = excluded.title,
        document_type = excluded.document_type,
        document_number = excluded.document_number,
        edition = excluded.edition,
        jurisdiction = excluded.jurisdiction,
        authority_level = excluded.authority_level,
        document_status = excluded.document_status,
        publisher = excluded.publisher,
        source_url = excluded.source_url,
        project = excluded.project,
        discipline = excluded.discipline,
        report_date = excluded.report_date,
        effective_date = excluded.effective_date,
        source_type = excluded.source_type,
        author = excluded.author,
        organization = excluded.organization,
        keywords_json = excluded.keywords_json,
        summary = excluded.summary,
        reviewed_at = excluded.reviewed_at,
        updated_at = excluded.updated_at
    `);
  }

  upsertWord(record: {
    id: string;
    canonicalWord: string;
    normalizedWord: string;
    lemma?: string;
    partOfSpeech?: string;
    languageCategory?: string;
    chineseMeaning?: string;
    englishDefinition?: string;
    provenanceType: string;
    firstAddedAt: string;
    updatedAt: string;
  }): void {
    const id = this.findIdByNormalized("words", "normalized_word", record.normalizedWord) || record.id;

    this.db.run(`
      INSERT INTO words (id, canonical_word, normalized_word, lemma, part_of_speech, language_category, chinese_meaning, english_definition, difficulty_level, mastery_level, frequency_score, provenance_type, first_added_at, updated_at, is_starred, is_archived)
      VALUES (
        '${escapeSqlString(id)}',
        '${escapeSqlString(record.canonicalWord)}',
        '${escapeSqlString(record.normalizedWord)}',
        ${nullableText(record.lemma)},
        ${nullableText(record.partOfSpeech)},
        ${nullableText(record.languageCategory)},
        ${nullableText(record.chineseMeaning)},
        ${nullableText(record.englishDefinition)},
        NULL,
        NULL,
        NULL,
        '${escapeSqlString(record.provenanceType)}',
        '${escapeSqlString(record.firstAddedAt)}',
        '${escapeSqlString(record.updatedAt)}',
        0,
        0
      )
      ON CONFLICT(id) DO UPDATE SET
        canonical_word = excluded.canonical_word,
        normalized_word = excluded.normalized_word,
        lemma = excluded.lemma,
        part_of_speech = excluded.part_of_speech,
        language_category = excluded.language_category,
        chinese_meaning = excluded.chinese_meaning,
        english_definition = excluded.english_definition,
        provenance_type = excluded.provenance_type,
        updated_at = excluded.updated_at
    `);
  }

  upsertPhrase(record: {
    id: string;
    canonicalPhrase: string;
    normalizedPhrase: string;
    phraseType?: string;
    functionType?: string;
    scenarioType?: string;
    chineseMeaning?: string;
    explanation?: string;
    provenanceType: string;
    firstAddedAt: string;
    updatedAt: string;
  }): void {
    const id = this.findIdByNormalized("phrases", "normalized_phrase", record.normalizedPhrase) || record.id;

    this.db.run(`
      INSERT INTO phrases (id, canonical_phrase, normalized_phrase, phrase_type, function_type, scenario_type, chinese_meaning, explanation, difficulty_level, mastery_level, reusable_score, provenance_type, first_added_at, updated_at, is_starred, is_archived)
      VALUES (
        '${escapeSqlString(id)}',
        '${escapeSqlString(record.canonicalPhrase)}',
        '${escapeSqlString(record.normalizedPhrase)}',
        ${nullableText(record.phraseType)},
        ${nullableText(record.functionType)},
        ${nullableText(record.scenarioType)},
        ${nullableText(record.chineseMeaning)},
        ${nullableText(record.explanation)},
        NULL,
        NULL,
        NULL,
        '${escapeSqlString(record.provenanceType)}',
        '${escapeSqlString(record.firstAddedAt)}',
        '${escapeSqlString(record.updatedAt)}',
        0,
        0
      )
      ON CONFLICT(id) DO UPDATE SET
        canonical_phrase = excluded.canonical_phrase,
        normalized_phrase = excluded.normalized_phrase,
        phrase_type = excluded.phrase_type,
        function_type = excluded.function_type,
        scenario_type = excluded.scenario_type,
        chinese_meaning = excluded.chinese_meaning,
        explanation = excluded.explanation,
        provenance_type = excluded.provenance_type,
        updated_at = excluded.updated_at
    `);
  }

  upsertSentence(record: {
    id: string;
    canonicalSentence: string;
    normalizedSentence: string;
    sentenceType?: string;
    functionType?: string;
    scenarioType?: string;
    chineseLiteral?: string;
    chineseNatural?: string;
    sectionName?: string;
    provenanceType: string;
    firstAddedAt: string;
    updatedAt: string;
  }): void {
    const id = this.findIdByNormalized("sentences", "normalized_sentence", record.normalizedSentence) || record.id;

    this.db.run(`
      INSERT INTO sentences (id, canonical_sentence, normalized_sentence, sentence_type, function_type, scenario_type, chinese_literal, chinese_natural, section_name, reusable_flag, reusable_score, difficulty_level, mastery_level, provenance_type, first_added_at, updated_at, is_starred, is_archived)
      VALUES (
        '${escapeSqlString(id)}',
        '${escapeSqlString(record.canonicalSentence)}',
        '${escapeSqlString(record.normalizedSentence)}',
        ${nullableText(record.sentenceType)},
        ${nullableText(record.functionType)},
        ${nullableText(record.scenarioType)},
        ${nullableText(record.chineseLiteral)},
        ${nullableText(record.chineseNatural)},
        ${nullableText(record.sectionName)},
        0,
        NULL,
        NULL,
        NULL,
        '${escapeSqlString(record.provenanceType)}',
        '${escapeSqlString(record.firstAddedAt)}',
        '${escapeSqlString(record.updatedAt)}',
        0,
        0
      )
      ON CONFLICT(id) DO UPDATE SET
        canonical_sentence = excluded.canonical_sentence,
        normalized_sentence = excluded.normalized_sentence,
        sentence_type = excluded.sentence_type,
        function_type = excluded.function_type,
        scenario_type = excluded.scenario_type,
        chinese_literal = excluded.chinese_literal,
        chinese_natural = excluded.chinese_natural,
        section_name = excluded.section_name,
        provenance_type = excluded.provenance_type,
        updated_at = excluded.updated_at
    `);
  }

  private findIdByNormalized(table: string, column: string, normalizedValue: string): string | undefined {
    const row = readFirstRow(this.db, `SELECT id FROM ${table} WHERE ${column} = '${escapeSqlString(normalizedValue)}'`);
    return row?.id ? String(row.id) : undefined;
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
    const id = this.findIdByNormalized("geo_materials", "normalized_name", record.normalizedName) || record.id;

    this.db.run(`
      INSERT INTO geo_materials (id, canonical_name, normalized_name, chinese_name, geo_material_category, geo_material_subtype, description, identification_method, distinguishing_points, common_misidentifications, engineering_significance, common_risks, common_treatments, australia_context, difficulty_level, mastery_level, provenance_type, first_added_at, updated_at, is_starred, is_archived)
      VALUES (
        '${escapeSqlString(id)}',
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
    const id = this.findIdByNormalized("geo_features", "normalized_name", record.normalizedName) || record.id;

    this.db.run(`
      INSERT INTO geo_features (id, canonical_name, normalized_name, chinese_name, geo_feature_category, geo_feature_subtype, description, identification_method, distinguishing_points, common_causes, risk_implications, treatment_or_mitigation, reporting_expressions, inspection_points, difficulty_level, mastery_level, provenance_type, first_added_at, updated_at, is_starred, is_archived)
      VALUES (
        '${escapeSqlString(id)}',
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
    const id = this.findIdByNormalized("strategies", "normalized_name", record.normalizedName) || record.id;

    this.db.run(`
      INSERT INTO strategies (id, canonical_name, normalized_name, chinese_name, strategy_category, description, steps_or_method, application_conditions, limitations, linked_reporting_expression, monitoring_notes, difficulty_level, provenance_type, first_added_at, updated_at, is_starred, is_archived)
      VALUES (
        '${escapeSqlString(id)}',
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

  upsertRequirement(record: {
    id: string;
    sourceDocumentId?: string;
    canonicalName: string;
    normalizedName: string;
    requirementCategory?: string;
    jurisdiction?: string;
    authorityLevel?: string;
    clauseReference?: string;
    requirementText: string;
    plainLanguageSummary?: string;
    whyItMatters?: string;
    triggerConditions?: string;
    verificationMethod?: string;
    tagsJson?: string;
    provenanceType: string;
    firstAddedAt: string;
    updatedAt: string;
  }): void {
    const id = this.findIdByNormalized("requirements", "normalized_name", record.normalizedName) || record.id;

    this.db.run(`
      INSERT INTO requirements (id, source_document_id, canonical_name, normalized_name, requirement_category, jurisdiction, authority_level, clause_reference, requirement_text, plain_language_summary, why_it_matters, trigger_conditions, verification_method, tags_json, provenance_type, first_added_at, updated_at, is_starred, is_archived)
      VALUES (
        '${escapeSqlString(id)}',
        ${nullableText(record.sourceDocumentId)},
        '${escapeSqlString(record.canonicalName)}',
        '${escapeSqlString(record.normalizedName)}',
        ${nullableText(record.requirementCategory)},
        ${nullableText(record.jurisdiction)},
        ${nullableText(record.authorityLevel)},
        ${nullableText(record.clauseReference)},
        '${escapeSqlString(record.requirementText)}',
        ${nullableText(record.plainLanguageSummary)},
        ${nullableText(record.whyItMatters)},
        ${nullableText(record.triggerConditions)},
        ${nullableText(record.verificationMethod)},
        ${nullableText(record.tagsJson)},
        '${escapeSqlString(record.provenanceType)}',
        '${escapeSqlString(record.firstAddedAt)}',
        '${escapeSqlString(record.updatedAt)}',
        0,
        0
      )
      ON CONFLICT(id) DO UPDATE SET
        source_document_id = excluded.source_document_id,
        canonical_name = excluded.canonical_name,
        normalized_name = excluded.normalized_name,
        requirement_category = excluded.requirement_category,
        jurisdiction = excluded.jurisdiction,
        authority_level = excluded.authority_level,
        clause_reference = excluded.clause_reference,
        requirement_text = excluded.requirement_text,
        plain_language_summary = excluded.plain_language_summary,
        why_it_matters = excluded.why_it_matters,
        trigger_conditions = excluded.trigger_conditions,
        verification_method = excluded.verification_method,
        tags_json = excluded.tags_json,
        provenance_type = excluded.provenance_type,
        updated_at = excluded.updated_at
    `);
  }

  upsertMethod(record: {
    id: string;
    sourceDocumentId?: string;
    canonicalName: string;
    normalizedName: string;
    methodCategory?: string;
    jurisdiction?: string;
    authorityLevel?: string;
    purpose?: string;
    procedureSummary?: string;
    inputsOrPrerequisites?: string;
    outputsOrResults?: string;
    limitations?: string;
    tagsJson?: string;
    provenanceType: string;
    firstAddedAt: string;
    updatedAt: string;
  }): void {
    const id = this.findIdByNormalized("methods", "normalized_name", record.normalizedName) || record.id;

    this.db.run(`
      INSERT INTO methods (id, source_document_id, canonical_name, normalized_name, method_category, jurisdiction, authority_level, purpose, procedure_summary, inputs_or_prerequisites, outputs_or_results, limitations, tags_json, provenance_type, first_added_at, updated_at, is_starred, is_archived)
      VALUES (
        '${escapeSqlString(id)}',
        ${nullableText(record.sourceDocumentId)},
        '${escapeSqlString(record.canonicalName)}',
        '${escapeSqlString(record.normalizedName)}',
        ${nullableText(record.methodCategory)},
        ${nullableText(record.jurisdiction)},
        ${nullableText(record.authorityLevel)},
        ${nullableText(record.purpose)},
        ${nullableText(record.procedureSummary)},
        ${nullableText(record.inputsOrPrerequisites)},
        ${nullableText(record.outputsOrResults)},
        ${nullableText(record.limitations)},
        ${nullableText(record.tagsJson)},
        '${escapeSqlString(record.provenanceType)}',
        '${escapeSqlString(record.firstAddedAt)}',
        '${escapeSqlString(record.updatedAt)}',
        0,
        0
      )
      ON CONFLICT(id) DO UPDATE SET
        source_document_id = excluded.source_document_id,
        canonical_name = excluded.canonical_name,
        normalized_name = excluded.normalized_name,
        method_category = excluded.method_category,
        jurisdiction = excluded.jurisdiction,
        authority_level = excluded.authority_level,
        purpose = excluded.purpose,
        procedure_summary = excluded.procedure_summary,
        inputs_or_prerequisites = excluded.inputs_or_prerequisites,
        outputs_or_results = excluded.outputs_or_results,
        limitations = excluded.limitations,
        tags_json = excluded.tags_json,
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
