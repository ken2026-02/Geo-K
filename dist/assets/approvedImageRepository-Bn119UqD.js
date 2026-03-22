import{e as t,a as d,r as g}from"./index-B7FpDlN1.js";function a(s){return s?`'${t(s)}'`:"NULL"}class ${constructor(i){this.db=i}insertImageVariant(i){this.db.run(`
      INSERT INTO images (id, asset_group_id, file_name, mime_type, original_width, original_height, original_size_bytes, hash, variant_type, storage_path, caption, description, tags_json, source_type, provenance_type, added_by_user, created_at, updated_at)
      VALUES ('${t(i.id)}', '${t(i.assetGroupId)}', '${t(i.fileName)}', ${a(i.mimeType)}, ${i.originalWidth??"NULL"}, ${i.originalHeight??"NULL"}, ${i.originalSizeBytes??"NULL"}, ${a(i.hash)}, '${t(i.variantType)}', '${t(i.storagePath)}', ${a(i.caption)}, ${a(i.description)}, ${a(i.tagsJson)}, ${a(i.sourceType)}, '${t(i.provenanceType)}', ${i.addedByUser?1:0}, '${t(i.createdAt)}', '${t(i.updatedAt)}')
    `)}ensureItemImageLink(i,n,e,p){const _=d(this.db,`SELECT id FROM item_image_links WHERE item_type = '${t(i)}' AND item_id = '${t(n)}' AND image_asset_id = '${t(e)}'`);if(_!=null&&_.id)return;const m=`item-image-link-${Date.now()}-${Math.random().toString(16).slice(2,8)}`;this.db.run(`
      INSERT INTO item_image_links (id, item_type, item_id, image_asset_id, display_order, link_role, created_at)
      VALUES ('${m}', '${t(i)}', '${t(n)}', '${t(e)}', 0, ${a(p)}, '${new Date().toISOString()}')
    `)}listByItem(i,n){return g(this.db,`
      SELECT i.id AS image_asset_id, i.asset_group_id, i.file_name, i.variant_type, i.storage_path, i.mime_type, i.caption, i.description
      FROM item_image_links l
      INNER JOIN images i ON i.id = l.image_asset_id
      WHERE l.item_type = '${t(i)}' AND l.item_id = '${t(n)}'
      ORDER BY CASE i.variant_type WHEN 'standard' THEN 0 WHEN 'thumbnail' THEN 1 ELSE 2 END, l.created_at DESC
      `).map(e=>({imageAssetId:String(e.image_asset_id),assetGroupId:e.asset_group_id==null?void 0:String(e.asset_group_id),fileName:e.file_name==null?void 0:String(e.file_name),variantType:String(e.variant_type),storagePath:String(e.storage_path),mimeType:e.mime_type==null?void 0:String(e.mime_type),caption:e.caption==null?void 0:String(e.caption),description:e.description==null?void 0:String(e.description)}))}}export{$ as S};
