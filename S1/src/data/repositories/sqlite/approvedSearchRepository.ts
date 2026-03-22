import type { Database } from "sql.js";

import { escapeSqlString, readRows } from "./sqliteHelpers";

export type SearchItemType = "word" | "phrase" | "sentence" | "requirement" | "method" | "geo_material" | "geo_feature";

export interface ApprovedSearchFilters {
  queryText?: string;
  itemType?: SearchItemType | "all";
  category?: string;
  functionType?: string;
  scenarioType?: string;
}

export interface ApprovedSearchRow {
  itemType: SearchItemType;
  itemId: string;
  title: string;
  snippet?: string;
  category?: string;
  functionType?: string;
  scenarioType?: string;
  updatedAt: string;
}

export interface ApprovedSearchFilterOptions {
  categories: string[];
  functionTypes: string[];
  scenarioTypes: string[];
}

function nullableString(value: unknown): string | undefined {
  return value == null ? undefined : String(value);
}

export class SqliteApprovedSearchRepository {
  constructor(private readonly db: Database) {}

  private baseCombinedSql(): string {
    return `
      WITH combined AS (
        SELECT 'word' AS item_type, id AS item_id, canonical_word AS title, english_definition AS snippet, normalized_word AS normalized_text, language_category AS category, NULL AS function_type, NULL AS scenario_type, updated_at AS updated_at FROM words
        UNION ALL
        SELECT 'phrase' AS item_type, id AS item_id, canonical_phrase AS title, explanation AS snippet, normalized_phrase AS normalized_text, NULL AS category, function_type AS function_type, scenario_type AS scenario_type, updated_at AS updated_at FROM phrases
        UNION ALL
        SELECT 'sentence' AS item_type, id AS item_id, canonical_sentence AS title, chinese_natural AS snippet, normalized_sentence AS normalized_text, NULL AS category, function_type AS function_type, scenario_type AS scenario_type, updated_at AS updated_at FROM sentences
        UNION ALL
        SELECT 'requirement' AS item_type, id AS item_id, canonical_name AS title, COALESCE(plain_language_summary, requirement_text) AS snippet, normalized_name AS normalized_text, requirement_category AS category, authority_level AS function_type, jurisdiction AS scenario_type, updated_at AS updated_at FROM requirements
        UNION ALL
        SELECT 'method' AS item_type, id AS item_id, canonical_name AS title, COALESCE(purpose, procedure_summary) AS snippet, normalized_name AS normalized_text, method_category AS category, authority_level AS function_type, jurisdiction AS scenario_type, updated_at AS updated_at FROM methods
        UNION ALL
        SELECT 'geo_material' AS item_type, id AS item_id, canonical_name AS title, description AS snippet, normalized_name AS normalized_text, geo_material_category AS category, NULL AS function_type, NULL AS scenario_type, updated_at AS updated_at FROM geo_materials
        UNION ALL
        SELECT 'geo_feature' AS item_type, id AS item_id, canonical_name AS title, description AS snippet, normalized_name AS normalized_text, geo_feature_category AS category, NULL AS function_type, NULL AS scenario_type, updated_at AS updated_at FROM geo_features
      )
    `;
  }

  searchApproved(filters: ApprovedSearchFilters): ApprovedSearchRow[] {
    const whereClauses: string[] = ["1=1"];

    if (filters.queryText && filters.queryText.trim()) {
      const normalized = escapeSqlString(filters.queryText.trim().toLowerCase().replace(/\s+/g, " "));
      whereClauses.push(`normalized_text LIKE '%${normalized}%'`);
    }

    if (filters.itemType && filters.itemType !== "all") {
      whereClauses.push(`item_type = '${escapeSqlString(filters.itemType)}'`);
    }

    if (filters.category && filters.category.trim()) {
      whereClauses.push(`category = '${escapeSqlString(filters.category.trim())}'`);
    }

    if (filters.functionType && filters.functionType.trim()) {
      whereClauses.push(`function_type = '${escapeSqlString(filters.functionType.trim())}'`);
    }

    if (filters.scenarioType && filters.scenarioType.trim()) {
      whereClauses.push(`scenario_type = '${escapeSqlString(filters.scenarioType.trim())}'`);
    }

    const rows = readRows(
      this.db,
      `
      ${this.baseCombinedSql()}
      SELECT item_type, item_id, title, snippet, category, function_type, scenario_type, updated_at
      FROM combined
      WHERE ${whereClauses.join(" AND ")}
      ORDER BY item_type ASC, updated_at DESC, title ASC
      `
    );

    return rows.map((row) => ({
      itemType: row.item_type as SearchItemType,
      itemId: String(row.item_id),
      title: String(row.title),
      snippet: nullableString(row.snippet),
      category: nullableString(row.category),
      functionType: nullableString(row.function_type),
      scenarioType: nullableString(row.scenario_type),
      updatedAt: String(row.updated_at)
    }));
  }

  getFilterOptions(): ApprovedSearchFilterOptions {
    const categoryRows = readRows(
      this.db,
      `
      WITH categories AS (
        SELECT language_category AS category FROM words WHERE language_category IS NOT NULL
        UNION
        SELECT requirement_category AS category FROM requirements WHERE requirement_category IS NOT NULL
        UNION
        SELECT method_category AS category FROM methods WHERE method_category IS NOT NULL
        UNION
        SELECT geo_material_category AS category FROM geo_materials WHERE geo_material_category IS NOT NULL
        UNION
        SELECT geo_feature_category AS category FROM geo_features WHERE geo_feature_category IS NOT NULL
      )
      SELECT category FROM categories ORDER BY category ASC
      `
    );

    const functionRows = readRows(
      this.db,
      `
      WITH funcs AS (
        SELECT function_type AS function_type FROM phrases WHERE function_type IS NOT NULL
        UNION
        SELECT function_type AS function_type FROM sentences WHERE function_type IS NOT NULL
        UNION
        SELECT authority_level AS function_type FROM requirements WHERE authority_level IS NOT NULL
        UNION
        SELECT authority_level AS function_type FROM methods WHERE authority_level IS NOT NULL
      )
      SELECT function_type FROM funcs ORDER BY function_type ASC
      `
    );

    const scenarioRows = readRows(
      this.db,
      `
      WITH scenarios AS (
        SELECT scenario_type AS scenario_type FROM phrases WHERE scenario_type IS NOT NULL
        UNION
        SELECT scenario_type AS scenario_type FROM sentences WHERE scenario_type IS NOT NULL
        UNION
        SELECT jurisdiction AS scenario_type FROM requirements WHERE jurisdiction IS NOT NULL
        UNION
        SELECT jurisdiction AS scenario_type FROM methods WHERE jurisdiction IS NOT NULL
      )
      SELECT scenario_type FROM scenarios ORDER BY scenario_type ASC
      `
    );

    return {
      categories: categoryRows.map((row) => String(row.category)),
      functionTypes: functionRows.map((row) => String(row.function_type)),
      scenarioTypes: scenarioRows.map((row) => String(row.scenario_type))
    };
  }
}
