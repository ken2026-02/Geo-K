export interface SearchQuery {
  text?: string;
  itemTypes?: string[];
  tags?: string[];
  status?: string;
}

export interface SearchResultItem {
  itemType: string;
  itemId: string;
  title: string;
  snippet?: string;
}

export class SearchService {
  buildUnifiedSearchSql(query: SearchQuery): string {
    const text = query.text?.trim().toLowerCase();
    const escaped = text ? text.replace(/'/g, "''") : undefined;
    const whereClause = escaped ? `LOWER(search_text) LIKE '%${escaped}%'` : "1=1";

    return `
WITH combined AS (
  SELECT 'word' AS item_type, id AS item_id, canonical_word AS title, english_definition AS snippet, normalized_word AS search_text FROM words
  UNION ALL
  SELECT 'phrase' AS item_type, id AS item_id, canonical_phrase AS title, explanation AS snippet, normalized_phrase AS search_text FROM phrases
  UNION ALL
  SELECT 'sentence' AS item_type, id AS item_id, canonical_sentence AS title, chinese_natural AS snippet, normalized_sentence AS search_text FROM sentences
  UNION ALL
  SELECT 'geo_material' AS item_type, id AS item_id, canonical_name AS title, description AS snippet, normalized_name AS search_text FROM geo_materials
  UNION ALL
  SELECT 'geo_feature' AS item_type, id AS item_id, canonical_name AS title, description AS snippet, normalized_name AS search_text FROM geo_features
  UNION ALL
  SELECT 'strategy' AS item_type, id AS item_id, canonical_name AS title, description AS snippet, normalized_name AS search_text FROM strategies
)
SELECT item_type, item_id, title, snippet
FROM combined
WHERE ${whereClause}
ORDER BY title ASC;
    `.trim();
  }
}
