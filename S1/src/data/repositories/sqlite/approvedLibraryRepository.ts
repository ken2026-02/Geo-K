import type { Database } from "sql.js";

import { escapeSqlString, readFirstRow, readRows } from "./sqliteHelpers";

export type CommitItemType = "word" | "phrase" | "sentence" | "geo_material" | "geo_feature" | "strategy" | "requirement" | "method";
export type RelatedItemType = CommitItemType;
export type GeoBrowseSort = "category" | "subtype" | "recent" | "name";

export interface SourceTraceRecord {
  id: string;
  reportId?: string;
  sourceSection?: string;
  sourceSentence?: string;
  sourceExcerpt?: string;
  reportTitle?: string;
  reportDate?: string;
  reportProject?: string;
}

export interface LibraryListItem {
  id: string;
  title: string;
  subtitle?: string;
  updatedAt: string;
  category?: string;
  subtype?: string;
  description?: string;
  provenanceType?: string;
}

export interface GeoBrowseFilters {
  category?: string;
  subtype?: string;
  sortBy?: GeoBrowseSort;
}

export interface GeoBrowseFilterOptions {
  categories: string[];
  subtypes: string[];
}

export interface RelatedItemRecord {
  direction: "outgoing" | "incoming";
  relationType: string;
  itemType: RelatedItemType;
  itemId: string;
  title: string;
  subtitle?: string;
  confidenceScore?: number;
}

export interface LibraryDetailRecord {
  id: string;
  itemType: CommitItemType;
  fields: Record<string, unknown>;
  sources: SourceTraceRecord[];
}

function nowIso(): string {
  return new Date().toISOString();
}

function createId(prefix: string): string {
  return `${prefix}-${nowIso()}-${Math.random().toString(16).slice(2, 8)}`;
}

function asString(value: unknown): string | undefined {
  return value == null ? undefined : String(value);
}

function nullableText(value?: string): string {
  return value ? `'${escapeSqlString(value)}'` : "NULL";
}

function boolAsInt(value: boolean): number {
  return value ? 1 : 0;
}

function mapRelatedRows(rows: Record<string, unknown>[], direction: "outgoing" | "incoming"): RelatedItemRecord[] {
  return rows.map((row) => ({
    direction,
    relationType: String(row.relation_type),
    itemType: String(row.related_item_type) as RelatedItemType,
    itemId: String(row.related_item_id),
    title: String(row.related_title),
    subtitle: asString(row.related_subtitle),
    confidenceScore: row.confidence_score == null ? undefined : Number(row.confidence_score)
  }));
}

function buildGeoWhereClause(filters?: GeoBrowseFilters, categoryColumn?: string, subtypeColumn?: string): string {
  const conditions: string[] = [];

  if (filters?.category && categoryColumn) {
    conditions.push(`${categoryColumn} = '${escapeSqlString(filters.category)}'`);
  }

  if (filters?.subtype && subtypeColumn) {
    conditions.push(`${subtypeColumn} = '${escapeSqlString(filters.subtype)}'`);
  }

  return conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
}

function buildGeoOrderClause(filters?: GeoBrowseFilters, categoryColumn?: string, subtypeColumn?: string, nameColumn?: string): string {
  switch (filters?.sortBy) {
    case "recent":
      return "ORDER BY updated_at DESC";
    case "name":
      return `ORDER BY ${nameColumn ?? "canonical_name"} ASC`;
    case "subtype":
      return `ORDER BY COALESCE(${subtypeColumn ?? "''"}, ''), COALESCE(${categoryColumn ?? "''"}, ''), ${nameColumn ?? "canonical_name"} ASC`;
    case "category":
    default:
      return `ORDER BY COALESCE(${categoryColumn ?? "''"}, ''), COALESCE(${subtypeColumn ?? "''"}, ''), ${nameColumn ?? "canonical_name"} ASC`;
  }
}

export class SqliteApprovedLibraryRepository {
  constructor(private readonly db: Database) {}

  ensureReport(batch: Record<string, unknown>): string | undefined {
    const sourceReportId = asString(batch.source_report_id);
    const reportTitle = asString(batch.source_report_title);

    if (!sourceReportId && !reportTitle) {
      return undefined;
    }

    if (sourceReportId) {
      const existing = readFirstRow(this.db, `SELECT id FROM reports WHERE source_report_id = '${escapeSqlString(sourceReportId)}'`);
      if (existing?.id) {
        return String(existing.id);
      }
    }

    const reportId = createId("report");
    this.db.run(`
      INSERT INTO reports (id, source_report_id, title, project, discipline, report_date, source_type, author, organization, tags_json, summary, created_at, updated_at)
      VALUES (
        '${escapeSqlString(reportId)}',
        ${nullableText(sourceReportId)},
        ${nullableText(reportTitle)},
        ${nullableText(asString(batch.source_report_project))},
        ${nullableText(asString(batch.source_report_discipline))},
        ${nullableText(asString(batch.source_report_date))},
        ${nullableText(asString(batch.source_file_type))},
        ${nullableText(asString(batch.source_report_author))},
        ${nullableText(asString(batch.source_report_organization))},
        NULL,
        ${nullableText(asString(batch.notes))},
        '${nowIso()}',
        '${nowIso()}'
      )
    `);

    return reportId;
  }

  private findIdByNormalized(table: string, column: string, normalizedValue: string): string | undefined {
    const row = readFirstRow(this.db, `SELECT id FROM ${table} WHERE ${column} = '${escapeSqlString(normalizedValue)}'`);
    return row?.id ? String(row.id) : undefined;
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
  }): string {
    const existingId = this.findIdByNormalized("words", "normalized_word", record.normalizedWord);
    if (existingId) {
      return existingId;
    }

    const id = createId("word");
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
        'imported_ai',
        '${nowIso()}',
        '${nowIso()}',
        0,
        0
      )
    `);
    return id;
  }

  upsertPhrase(record: {
    canonicalPhrase: string;
    normalizedPhrase: string;
    phraseType?: string;
    functionType?: string;
    scenarioType?: string;
    chineseMeaning?: string;
    explanation?: string;
  }): string {
    const existingId = this.findIdByNormalized("phrases", "normalized_phrase", record.normalizedPhrase);
    if (existingId) {
      return existingId;
    }

    const id = createId("phrase");
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
        'imported_ai',
        '${nowIso()}',
        '${nowIso()}',
        0,
        0
      )
    `);
    return id;
  }

  upsertSentence(record: {
    canonicalSentence: string;
    normalizedSentence: string;
    sentenceType?: string;
    functionType?: string;
    scenarioType?: string;
    chineseLiteral?: string;
    chineseNatural?: string;
    sectionName?: string;
    reusableScore?: number;
  }): string {
    const existingId = this.findIdByNormalized("sentences", "normalized_sentence", record.normalizedSentence);
    if (existingId) {
      return existingId;
    }

    const id = createId("sentence");
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
        ${boolAsInt((record.reusableScore ?? 0) > 0.5)},
        ${record.reusableScore == null ? "NULL" : String(record.reusableScore)},
        NULL,
        NULL,
        'imported_ai',
        '${nowIso()}',
        '${nowIso()}',
        0,
        0
      )
    `);
    return id;
  }

  upsertGeoMaterial(record: {
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
  }): string {
    const existingId = this.findIdByNormalized("geo_materials", "normalized_name", record.normalizedName);
    if (existingId) {
      return existingId;
    }

    const id = createId("geo-material");
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
        'imported_ai',
        '${nowIso()}',
        '${nowIso()}',
        0,
        0
      )
    `);
    return id;
  }

  upsertGeoFeature(record: {
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
  }): string {
    const existingId = this.findIdByNormalized("geo_features", "normalized_name", record.normalizedName);
    if (existingId) {
      return existingId;
    }

    const id = createId("geo-feature");
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
        'imported_ai',
        '${nowIso()}',
        '${nowIso()}',
        0,
        0
      )
    `);
    return id;
  }

  upsertStrategy(record: {
    canonicalName: string;
    normalizedName: string;
    chineseName?: string;
    category?: string;
    description?: string;
    stepsOrMethod?: string;
    applicationConditions?: string;
    limitations?: string;
    linkedReportingExpression?: string;
    monitoringNotes?: string;
  }): string {
    const existingId = this.findIdByNormalized("strategies", "normalized_name", record.normalizedName);
    if (existingId) {
      return existingId;
    }

    const id = createId("strategy");
    this.db.run(`
      INSERT INTO strategies (id, canonical_name, normalized_name, chinese_name, strategy_category, description, steps_or_method, application_conditions, limitations, linked_reporting_expression, monitoring_notes, difficulty_level, provenance_type, first_added_at, updated_at, is_starred, is_archived)
      VALUES (
        '${escapeSqlString(id)}',
        '${escapeSqlString(record.canonicalName)}',
        '${escapeSqlString(record.normalizedName)}',
        ${nullableText(record.chineseName)},
        ${nullableText(record.category)},
        ${nullableText(record.description)},
        ${nullableText(record.stepsOrMethod)},
        ${nullableText(record.applicationConditions)},
        ${nullableText(record.limitations)},
        ${nullableText(record.linkedReportingExpression)},
        ${nullableText(record.monitoringNotes)},
        NULL,
        'imported_ai',
        '${nowIso()}',
        '${nowIso()}',
        0,
        0
      )
    `);
    return id;
  }

  ensureItemSource(itemType: CommitItemType, itemId: string, reportId: string | undefined, sourceSection?: string, sourceSentence?: string): void {
    const existing = readFirstRow(
      this.db,
      `SELECT id FROM item_sources WHERE item_type = '${escapeSqlString(itemType)}' AND item_id = '${escapeSqlString(itemId)}' AND COALESCE(report_id, '') = COALESCE(${nullableText(reportId)}, '') AND COALESCE(source_section, '') = COALESCE(${nullableText(sourceSection)}, '') AND COALESCE(source_sentence, '') = COALESCE(${nullableText(sourceSentence)}, '')`
    );

    if (existing?.id) {
      return;
    }

    this.db.run(`
      INSERT INTO item_sources (id, item_type, item_id, report_id, source_section, source_sentence, source_excerpt, source_page_ref, source_paragraph_ref, created_at)
      VALUES ('${createId("item-source")}', '${escapeSqlString(itemType)}', '${escapeSqlString(itemId)}', ${nullableText(reportId)}, ${nullableText(sourceSection)}, ${nullableText(sourceSentence)}, NULL, NULL, NULL, '${nowIso()}')
    `);
  }

  ensureRelation(fromItemType: CommitItemType, fromItemId: string, relationType: string, toItemType: CommitItemType, toItemId: string, confidenceScore: number): void {
    const existing = readFirstRow(
      this.db,
      `SELECT id FROM item_relations WHERE from_item_type = '${escapeSqlString(fromItemType)}' AND from_item_id = '${escapeSqlString(fromItemId)}' AND relation_type = '${escapeSqlString(relationType)}' AND to_item_type = '${escapeSqlString(toItemType)}' AND to_item_id = '${escapeSqlString(toItemId)}'`
    );

    if (existing?.id) {
      return;
    }

    this.db.run(`
      INSERT INTO item_relations (id, from_item_type, from_item_id, relation_type, to_item_type, to_item_id, confidence_score, created_by, created_at)
      VALUES ('${createId("item-relation")}', '${escapeSqlString(fromItemType)}', '${escapeSqlString(fromItemId)}', '${escapeSqlString(relationType)}', '${escapeSqlString(toItemType)}', '${escapeSqlString(toItemId)}', ${confidenceScore}, 'system', '${nowIso()}')
    `);
  }

  listWordHeads(): Array<{ id: string; normalizedWord: string }> {
    return readRows(this.db, "SELECT id, normalized_word FROM words").map((row) => ({ id: String(row.id), normalizedWord: String(row.normalized_word) }));
  }

  listPhraseHeads(): Array<{ id: string; normalizedPhrase: string }> {
    return readRows(this.db, "SELECT id, normalized_phrase FROM phrases").map((row) => ({ id: String(row.id), normalizedPhrase: String(row.normalized_phrase) }));
  }

  listGeoMaterialHeads(): Array<{ id: string; normalizedName: string }> {
    return readRows(this.db, "SELECT id, normalized_name FROM geo_materials").map((row) => ({ id: String(row.id), normalizedName: String(row.normalized_name) }));
  }

  listWords(): LibraryListItem[] {
    return readRows(this.db, "SELECT id, canonical_word, language_category, chinese_meaning, english_definition, provenance_type, updated_at FROM words ORDER BY updated_at DESC").map((row) => ({
      id: String(row.id),
      title: String(row.canonical_word),
      subtitle: asString(row.language_category),
      description: asString(row.chinese_meaning) ?? asString(row.english_definition),
      provenanceType: asString(row.provenance_type),
      updatedAt: String(row.updated_at)
    }));
  }

  listPhrases(): LibraryListItem[] {
    return readRows(this.db, "SELECT id, canonical_phrase, function_type, chinese_meaning, explanation, provenance_type, updated_at FROM phrases ORDER BY updated_at DESC").map((row) => ({
      id: String(row.id),
      title: String(row.canonical_phrase),
      subtitle: asString(row.function_type),
      description: asString(row.chinese_meaning) ?? asString(row.explanation),
      provenanceType: asString(row.provenance_type),
      updatedAt: String(row.updated_at)
    }));
  }

  listSentences(): LibraryListItem[] {
    return readRows(this.db, "SELECT id, canonical_sentence, sentence_type, chinese_natural, chinese_literal, provenance_type, updated_at FROM sentences ORDER BY updated_at DESC").map((row) => ({
      id: String(row.id),
      title: String(row.canonical_sentence),
      subtitle: asString(row.sentence_type),
      description: asString(row.chinese_natural) ?? asString(row.chinese_literal),
      provenanceType: asString(row.provenance_type),
      updatedAt: String(row.updated_at)
    }));
  }

  listRequirements(): LibraryListItem[] {
    return readRows(
      this.db,
      "SELECT id, canonical_name, requirement_category, authority_level, plain_language_summary, requirement_text, provenance_type, updated_at FROM requirements ORDER BY updated_at DESC"
    ).map((row) => ({
      id: String(row.id),
      title: String(row.canonical_name),
      subtitle: [asString(row.requirement_category), asString(row.authority_level)].filter(Boolean).join(" | ") || undefined,
      category: asString(row.requirement_category),
      description: asString(row.plain_language_summary) ?? asString(row.requirement_text),
      provenanceType: asString(row.provenance_type),
      updatedAt: String(row.updated_at)
    }));
  }

  listMethods(): LibraryListItem[] {
    return readRows(
      this.db,
      "SELECT id, canonical_name, method_category, authority_level, purpose, procedure_summary, provenance_type, updated_at FROM methods ORDER BY updated_at DESC"
    ).map((row) => ({
      id: String(row.id),
      title: String(row.canonical_name),
      subtitle: [asString(row.method_category), asString(row.authority_level)].filter(Boolean).join(" | ") || undefined,
      category: asString(row.method_category),
      description: asString(row.purpose) ?? asString(row.procedure_summary),
      provenanceType: asString(row.provenance_type),
      updatedAt: String(row.updated_at)
    }));
  }

  listGeoMaterials(filters?: GeoBrowseFilters): LibraryListItem[] {
    const whereClause = buildGeoWhereClause(filters, "geo_material_category", "geo_material_subtype");
    const orderClause = buildGeoOrderClause(filters, "geo_material_category", "geo_material_subtype", "canonical_name");

    return readRows(
      this.db,
      `SELECT id, canonical_name, geo_material_category, geo_material_subtype, description, provenance_type, updated_at FROM geo_materials ${whereClause} ${orderClause}`
    ).map((row) => ({
      id: String(row.id),
      title: String(row.canonical_name),
      subtitle: [asString(row.geo_material_category), asString(row.geo_material_subtype)].filter(Boolean).join(" | ") || undefined,
      category: asString(row.geo_material_category),
      subtype: asString(row.geo_material_subtype),
      description: asString(row.description),
      provenanceType: asString(row.provenance_type),
      updatedAt: String(row.updated_at)
    }));
  }

  listGeoFeatures(filters?: GeoBrowseFilters): LibraryListItem[] {
    const whereClause = buildGeoWhereClause(filters, "geo_feature_category", "geo_feature_subtype");
    const orderClause = buildGeoOrderClause(filters, "geo_feature_category", "geo_feature_subtype", "canonical_name");

    return readRows(
      this.db,
      `SELECT id, canonical_name, geo_feature_category, geo_feature_subtype, description, provenance_type, updated_at FROM geo_features ${whereClause} ${orderClause}`
    ).map((row) => ({
      id: String(row.id),
      title: String(row.canonical_name),
      subtitle: [asString(row.geo_feature_category), asString(row.geo_feature_subtype)].filter(Boolean).join(" | ") || undefined,
      category: asString(row.geo_feature_category),
      subtype: asString(row.geo_feature_subtype),
      description: asString(row.description),
      provenanceType: asString(row.provenance_type),
      updatedAt: String(row.updated_at)
    }));
  }

  getGeoMaterialFilterOptions(): GeoBrowseFilterOptions {
    const categories = readRows(this.db, "SELECT DISTINCT geo_material_category AS value FROM geo_materials WHERE geo_material_category IS NOT NULL AND geo_material_category != '' ORDER BY geo_material_category ASC")
      .map((row) => String(row.value));
    const subtypes = readRows(this.db, "SELECT DISTINCT geo_material_subtype AS value FROM geo_materials WHERE geo_material_subtype IS NOT NULL AND geo_material_subtype != '' ORDER BY geo_material_subtype ASC")
      .map((row) => String(row.value));

    return { categories, subtypes };
  }

  getGeoFeatureFilterOptions(): GeoBrowseFilterOptions {
    const categories = readRows(this.db, "SELECT DISTINCT geo_feature_category AS value FROM geo_features WHERE geo_feature_category IS NOT NULL AND geo_feature_category != '' ORDER BY geo_feature_category ASC")
      .map((row) => String(row.value));
    const subtypes = readRows(this.db, "SELECT DISTINCT geo_feature_subtype AS value FROM geo_features WHERE geo_feature_subtype IS NOT NULL AND geo_feature_subtype != '' ORDER BY geo_feature_subtype ASC")
      .map((row) => String(row.value));

    return { categories, subtypes };
  }

  getDetail(itemType: CommitItemType, id: string): LibraryDetailRecord | undefined {
    const mapping: Record<CommitItemType, { table: string; idField: string }> = {
      word: { table: "words", idField: "id" },
      phrase: { table: "phrases", idField: "id" },
      sentence: { table: "sentences", idField: "id" },
      geo_material: { table: "geo_materials", idField: "id" },
      geo_feature: { table: "geo_features", idField: "id" },
      strategy: { table: "strategies", idField: "id" },
      requirement: { table: "requirements", idField: "id" },
      method: { table: "methods", idField: "id" }
    };

    const row = readFirstRow(this.db, `SELECT * FROM ${mapping[itemType].table} WHERE ${mapping[itemType].idField} = '${escapeSqlString(id)}'`);
    if (!row) {
      return undefined;
    }

    const sources = readRows(
      this.db,
      `
      SELECT s.id, s.report_id, s.source_section, s.source_sentence, s.source_excerpt,
             r.title AS report_title, r.report_date, r.project
      FROM item_sources s
      LEFT JOIN reports r ON r.id = s.report_id
      WHERE s.item_type = '${escapeSqlString(itemType)}' AND s.item_id = '${escapeSqlString(id)}'
      ORDER BY s.created_at DESC
      `
    ).map((source) => ({
      id: String(source.id),
      reportId: asString(source.report_id),
      sourceSection: asString(source.source_section),
      sourceSentence: asString(source.source_sentence),
      sourceExcerpt: asString(source.source_excerpt),
      reportTitle: asString(source.report_title),
      reportDate: asString(source.report_date),
      reportProject: asString(source.project)
    }));

    const tags = readRows(this.db, `SELECT tag_name FROM custom_tags WHERE item_type = '${escapeSqlString(itemType)}' AND item_id = '${escapeSqlString(id)}'`)
      .map(r => String(r.tag_name));

    const fields = { ...row };
    fields.tags = tags.join(", ");
    if (sources.length > 0) {
      fields.sourceReport = sources[0].reportTitle;
    }

    return {
      id,
      itemType,
      fields,
      sources
    };
  }

  listRelations(itemType: CommitItemType, id: string): RelatedItemRecord[] {
    const outgoing = readRows(
      this.db,
      `
      SELECT r.relation_type, r.confidence_score,
             r.to_item_type AS related_item_type,
             r.to_item_id AS related_item_id,
             COALESCE(w.canonical_word, p.canonical_phrase, s.canonical_sentence, gm.canonical_name, gf.canonical_name, st.canonical_name, rq.canonical_name, md.canonical_name) AS related_title,
             COALESCE(w.language_category, p.function_type, s.sentence_type, gm.geo_material_category, gf.geo_feature_category, st.strategy_category, rq.requirement_category, md.method_category) AS related_subtitle
      FROM item_relations r
      LEFT JOIN words w ON r.to_item_type = 'word' AND w.id = r.to_item_id
      LEFT JOIN phrases p ON r.to_item_type = 'phrase' AND p.id = r.to_item_id
      LEFT JOIN sentences s ON r.to_item_type = 'sentence' AND s.id = r.to_item_id
      LEFT JOIN geo_materials gm ON r.to_item_type = 'geo_material' AND gm.id = r.to_item_id
      LEFT JOIN geo_features gf ON r.to_item_type = 'geo_feature' AND gf.id = r.to_item_id
      LEFT JOIN strategies st ON r.to_item_type = 'strategy' AND st.id = r.to_item_id
      LEFT JOIN requirements rq ON r.to_item_type = 'requirement' AND rq.id = r.to_item_id
      LEFT JOIN methods md ON r.to_item_type = 'method' AND md.id = r.to_item_id
      WHERE r.from_item_type = '${escapeSqlString(itemType)}' AND r.from_item_id = '${escapeSqlString(id)}'
        AND COALESCE(w.id, p.id, s.id, gm.id, gf.id, st.id, rq.id, md.id) IS NOT NULL
      ORDER BY r.relation_type ASC, related_title ASC
      `
    );

    const incoming = readRows(
      this.db,
      `
      SELECT r.relation_type, r.confidence_score,
             r.from_item_type AS related_item_type,
             r.from_item_id AS related_item_id,
             COALESCE(w.canonical_word, p.canonical_phrase, s.canonical_sentence, gm.canonical_name, gf.canonical_name, st.canonical_name, rq.canonical_name, md.canonical_name) AS related_title,
             COALESCE(w.language_category, p.function_type, s.sentence_type, gm.geo_material_category, gf.geo_feature_category, st.strategy_category, rq.requirement_category, md.method_category) AS related_subtitle
      FROM item_relations r
      LEFT JOIN words w ON r.from_item_type = 'word' AND w.id = r.from_item_id
      LEFT JOIN phrases p ON r.from_item_type = 'phrase' AND p.id = r.from_item_id
      LEFT JOIN sentences s ON r.from_item_type = 'sentence' AND s.id = r.from_item_id
      LEFT JOIN geo_materials gm ON r.from_item_type = 'geo_material' AND gm.id = r.from_item_id
      LEFT JOIN geo_features gf ON r.from_item_type = 'geo_feature' AND gf.id = r.from_item_id
      LEFT JOIN strategies st ON r.from_item_type = 'strategy' AND st.id = r.from_item_id
      LEFT JOIN requirements rq ON r.from_item_type = 'requirement' AND rq.id = r.from_item_id
      LEFT JOIN methods md ON r.from_item_type = 'method' AND md.id = r.from_item_id
      WHERE r.to_item_type = '${escapeSqlString(itemType)}' AND r.to_item_id = '${escapeSqlString(id)}'
        AND COALESCE(w.id, p.id, s.id, gm.id, gf.id, st.id, rq.id, md.id) IS NOT NULL
      ORDER BY r.relation_type ASC, related_title ASC
      `
    );

    return [...mapRelatedRows(outgoing, "outgoing"), ...mapRelatedRows(incoming, "incoming")];
  }

  updateItem(itemType: CommitItemType, id: string, fields: Record<string, unknown>): void {
    const tableName = itemType === "word" ? "words"
      : itemType === "phrase" ? "phrases"
      : itemType === "sentence" ? "sentences"
      : itemType === "geo_material" ? "geo_materials"
      : itemType === "geo_feature" ? "geo_features"
      : itemType === "strategy" ? "strategies"
      : itemType === "requirement" ? "requirements"
      : itemType === "method" ? "methods"
      : undefined;

    if (!tableName) return;

    const updateFields = { ...fields };

    // Handle tags
    if (updateFields.tags !== undefined) {
      const tags = String(updateFields.tags).split(/[,;]/).map(t => t.trim()).filter(Boolean);
      this.db.run(`DELETE FROM custom_tags WHERE item_type = '${escapeSqlString(itemType)}' AND item_id = '${escapeSqlString(id)}'`);
      for (const tag of tags) {
        const tagId = Math.random().toString(36).substring(2, 15);
        this.db.run(`INSERT INTO custom_tags (id, item_type, item_id, tag_name, created_at) VALUES ('${tagId}', '${escapeSqlString(itemType)}', '${escapeSqlString(id)}', '${escapeSqlString(tag)}', '${nowIso()}')`);
      }
      delete updateFields.tags;
    }

    // Handle sourceReport (readonly for now as it maps to reports table)
    delete updateFields.sourceReport;

    const setClauses: string[] = [];
    for (const [key, value] of Object.entries(updateFields)) {
      if (key === "id" || key === "created_at" || key === "updated_at" || key === "first_added_at") continue;
      
      // Check if column exists in table (simple check based on schema knowledge)
      const allowedColumns: Record<string, string[]> = {
        words: ["canonical_word", "normalized_word", "lemma", "part_of_speech", "language_category", "chinese_meaning", "english_definition", "difficulty_level", "mastery_level", "frequency_score", "provenance_type", "is_starred", "is_archived"],
        phrases: ["canonical_phrase", "normalized_phrase", "phrase_type", "function_type", "scenario_type", "chinese_meaning", "explanation", "difficulty_level", "mastery_level", "reusable_score", "provenance_type", "is_starred", "is_archived"],
        sentences: ["canonical_sentence", "normalized_sentence", "sentence_type", "function_type", "scenario_type", "chinese_literal", "chinese_natural", "section_name", "reusable_flag", "reusable_score", "difficulty_level", "mastery_level", "provenance_type", "is_starred", "is_archived"],
        geo_materials: ["canonical_name", "normalized_name", "chinese_name", "geo_material_category", "geo_material_subtype", "description", "identification_method", "distinguishing_points", "common_misidentifications", "engineering_significance", "common_risks", "common_treatments", "australia_context", "difficulty_level", "mastery_level", "provenance_type", "is_starred", "is_archived"],
        geo_features: ["canonical_name", "normalized_name", "chinese_name", "geo_feature_category", "geo_feature_subtype", "description", "identification_method", "distinguishing_points", "common_causes", "risk_implications", "treatment_or_mitigation", "reporting_expressions", "inspection_points", "difficulty_level", "mastery_level", "provenance_type", "is_starred", "is_archived"],
        strategies: ["canonical_name", "normalized_name", "chinese_name", "strategy_category", "description", "steps_or_method", "application_conditions", "limitations", "linked_reporting_expression", "monitoring_notes", "difficulty_level", "provenance_type", "is_starred", "is_archived"],
        requirements: ["canonical_name", "normalized_name", "source_document_id", "requirement_category", "jurisdiction", "authority_level", "clause_reference", "requirement_text", "plain_language_summary", "why_it_matters", "trigger_conditions", "verification_method", "tags_json", "provenance_type", "is_starred", "is_archived"],
        methods: ["canonical_name", "normalized_name", "source_document_id", "method_category", "jurisdiction", "authority_level", "purpose", "procedure_summary", "inputs_or_prerequisites", "outputs_or_results", "limitations", "tags_json", "provenance_type", "is_starred", "is_archived"]
      };

      if (allowedColumns[tableName]?.includes(key)) {
        setClauses.push(`"${key}" = ${nullableText(asString(value))}`);
      }
    }
    
    if (setClauses.length > 0) {
      setClauses.push(`updated_at = '${nowIso()}'`);
      this.db.run(`UPDATE ${tableName} SET ${setClauses.join(", ")} WHERE id = '${escapeSqlString(id)}'`);
    }
  }

  deleteItem(itemType: CommitItemType, id: string): void {
    const tableName = itemType === "word" ? "words"
      : itemType === "phrase" ? "phrases"
      : itemType === "sentence" ? "sentences"
      : itemType === "geo_material" ? "geo_materials"
      : itemType === "geo_feature" ? "geo_features"
      : itemType === "strategy" ? "strategies"
      : itemType === "requirement" ? "requirements"
      : itemType === "method" ? "methods"
      : undefined;

    if (!tableName) return;

    this.db.run(`DELETE FROM ${tableName} WHERE id = '${escapeSqlString(id)}'`);
    this.db.run(`DELETE FROM item_relations WHERE (from_item_type = '${escapeSqlString(itemType)}' AND from_item_id = '${escapeSqlString(id)}') OR (to_item_type = '${escapeSqlString(itemType)}' AND to_item_id = '${escapeSqlString(id)}')`);
    this.db.run(`DELETE FROM item_sources WHERE item_type = '${escapeSqlString(itemType)}' AND item_id = '${escapeSqlString(id)}'`);
    this.db.run(`DELETE FROM favorites WHERE item_type = '${escapeSqlString(itemType)}' AND item_id = '${escapeSqlString(id)}'`);
    this.db.run(`DELETE FROM review_logs WHERE item_type = '${escapeSqlString(itemType)}' AND item_id = '${escapeSqlString(id)}'`);
  }
}








