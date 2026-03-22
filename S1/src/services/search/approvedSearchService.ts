import type { Database } from "sql.js";

import {
  SqliteApprovedSearchRepository,
  type ApprovedSearchFilterOptions,
  type ApprovedSearchFilters,
  type ApprovedSearchRow,
  type SearchItemType
} from "../../data/repositories/sqlite/approvedSearchRepository";

export interface GroupedSearchResults {
  word: ApprovedSearchRow[];
  phrase: ApprovedSearchRow[];
  sentence: ApprovedSearchRow[];
  requirement: ApprovedSearchRow[];
  method: ApprovedSearchRow[];
  geo_material: ApprovedSearchRow[];
  geo_feature: ApprovedSearchRow[];
}

export interface SearchResultViewModel {
  grouped: GroupedSearchResults;
  total: number;
}

export class ApprovedSearchService {
  search(db: Database, filters: ApprovedSearchFilters): SearchResultViewModel {
    const rows = new SqliteApprovedSearchRepository(db).searchApproved(filters);

    const grouped: GroupedSearchResults = {
      word: [],
      phrase: [],
      sentence: [],
      requirement: [],
      method: [],
      geo_material: [],
      geo_feature: []
    };

    for (const row of rows) {
      grouped[row.itemType].push(row);
    }

    return {
      grouped,
      total: rows.length
    };
  }

  getFilterOptions(db: Database): ApprovedSearchFilterOptions {
    return new SqliteApprovedSearchRepository(db).getFilterOptions();
  }

  getDetailPath(itemType: SearchItemType, itemId: string): string {
    const sectionMap: Record<SearchItemType, string> = {
      word: "words",
      phrase: "phrases",
      sentence: "sentences",
      requirement: "requirements",
      method: "methods",
      geo_material: "geo-materials",
      geo_feature: "features"
    };

    return `/library/${sectionMap[itemType]}/${itemId}`;
  }
}
