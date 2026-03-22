import type { Database } from "sql.js";

import { escapeSqlString, readFirstRow, readRows } from "./sqliteHelpers";

export interface ApprovedImageVariantRecord {
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
}

export interface ApprovedItemImageView {
  imageAssetId: string;
  assetGroupId?: string;
  fileName?: string;
  variantType: string;
  storagePath: string;
  mimeType?: string;
  caption?: string;
  description?: string;
}

function nullableText(value?: string): string {
  return value ? `'${escapeSqlString(value)}'` : "NULL";
}

export class SqliteApprovedImageRepository {
  constructor(private readonly db: Database) {}

  insertImageVariant(record: ApprovedImageVariantRecord): void {
    this.db.run(`
      INSERT INTO images (id, asset_group_id, file_name, mime_type, original_width, original_height, original_size_bytes, hash, variant_type, storage_path, caption, description, tags_json, source_type, provenance_type, added_by_user, created_at, updated_at)
      VALUES ('${escapeSqlString(record.id)}', '${escapeSqlString(record.assetGroupId)}', '${escapeSqlString(record.fileName)}', ${nullableText(record.mimeType)}, ${record.originalWidth ?? "NULL"}, ${record.originalHeight ?? "NULL"}, ${record.originalSizeBytes ?? "NULL"}, ${nullableText(record.hash)}, '${escapeSqlString(record.variantType)}', '${escapeSqlString(record.storagePath)}', ${nullableText(record.caption)}, ${nullableText(record.description)}, ${nullableText(record.tagsJson)}, ${nullableText(record.sourceType)}, '${escapeSqlString(record.provenanceType)}', ${record.addedByUser ? 1 : 0}, '${escapeSqlString(record.createdAt)}', '${escapeSqlString(record.updatedAt)}')
    `);
  }

  ensureItemImageLink(itemType: string, itemId: string, imageAssetId: string, linkRole?: string): void {
    const existing = readFirstRow(
      this.db,
      `SELECT id FROM item_image_links WHERE item_type = '${escapeSqlString(itemType)}' AND item_id = '${escapeSqlString(itemId)}' AND image_asset_id = '${escapeSqlString(imageAssetId)}'`
    );

    if (existing?.id) {
      return;
    }

    const id = `item-image-link-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    this.db.run(`
      INSERT INTO item_image_links (id, item_type, item_id, image_asset_id, display_order, link_role, created_at)
      VALUES ('${id}', '${escapeSqlString(itemType)}', '${escapeSqlString(itemId)}', '${escapeSqlString(imageAssetId)}', 0, ${nullableText(linkRole)}, '${new Date().toISOString()}')
    `);
  }

  listByItem(itemType: string, itemId: string): ApprovedItemImageView[] {
    return readRows(
      this.db,
      `
      SELECT i.id AS image_asset_id, i.asset_group_id, i.file_name, i.variant_type, i.storage_path, i.mime_type, i.caption, i.description
      FROM item_image_links l
      INNER JOIN images i ON i.id = l.image_asset_id
      WHERE l.item_type = '${escapeSqlString(itemType)}' AND l.item_id = '${escapeSqlString(itemId)}'
      ORDER BY CASE i.variant_type WHEN 'standard' THEN 0 WHEN 'thumbnail' THEN 1 ELSE 2 END, l.created_at DESC
      `
    ).map((row) => ({
      imageAssetId: String(row.image_asset_id),
      assetGroupId: row.asset_group_id == null ? undefined : String(row.asset_group_id),
      fileName: row.file_name == null ? undefined : String(row.file_name),
      variantType: String(row.variant_type),
      storagePath: String(row.storage_path),
      mimeType: row.mime_type == null ? undefined : String(row.mime_type),
      caption: row.caption == null ? undefined : String(row.caption),
      description: row.description == null ? undefined : String(row.description)
    }));
  }
}
