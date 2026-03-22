import{a as h,e as i,r as l,p as r,h as S}from"./index-B7FpDlN1.js";class g{constructor(e){this.db=e}async getById(e){const t=h(this.db,`SELECT * FROM import_batches WHERE id = '${i(e)}'`);return t?this.map(t):void 0}async listAll(){return l(this.db,"SELECT * FROM import_batches ORDER BY imported_at DESC").map(e=>this.map(e))}async listByStatus(e){return l(this.db,`SELECT * FROM import_batches WHERE import_status = '${i(e)}' ORDER BY imported_at DESC`).map(t=>this.map(t))}async findDuplicate(e){const t=h(this.db,`SELECT * FROM import_batches WHERE source_report_id = '${i(e)}' AND import_status = 'review_in_progress'`);return t?this.map(t):void 0}async insert(e){this.db.run(`
      INSERT INTO import_batches (
        id, batch_name, source_file_name, source_file_type, schema_version, imported_at, import_status, validation_status,
        total_items, pending_items, approved_items, rejected_items,
        source_report_id, source_report_title, source_report_project, source_report_discipline, source_report_author,
        source_report_organization, source_report_date, source_report_file_name,
        warnings_json, notes
      )
      VALUES (
        '${i(e.id)}',
        '${i(e.batchName)}',
        ${e.sourceFileName?`'${i(e.sourceFileName)}'`:"NULL"},
        ${e.sourceFileType?`'${i(e.sourceFileType)}'`:"NULL"},
        '${i(e.schemaVersion)}',
        '${i(e.importedAt)}',
        '${i(e.importStatus)}',
        '${i(e.validationStatus)}',
        ${e.totalItems},
        ${e.pendingItems},
        ${e.approvedItems},
        ${e.rejectedItems},
        ${e.sourceReportId?`'${i(e.sourceReportId)}'`:"NULL"},
        ${e.sourceReportTitle?`'${i(e.sourceReportTitle)}'`:"NULL"},
        ${e.sourceReportProject?`'${i(e.sourceReportProject)}'`:"NULL"},
        ${e.sourceReportDiscipline?`'${i(e.sourceReportDiscipline)}'`:"NULL"},
        ${e.sourceReportAuthor?`'${i(e.sourceReportAuthor)}'`:"NULL"},
        ${e.sourceReportOrganization?`'${i(e.sourceReportOrganization)}'`:"NULL"},
        ${e.sourceReportDate?`'${i(e.sourceReportDate)}'`:"NULL"},
        ${e.sourceReportFileName?`'${i(e.sourceReportFileName)}'`:"NULL"},
        ${e.warningsJson?`'${i(e.warningsJson)}'`:"NULL"},
        ${e.notes?`'${i(e.notes)}'`:"NULL"}
      )
    `)}async update(e){this.db.run(`
      UPDATE import_batches
      SET batch_name = '${i(e.batchName)}',
          source_file_name = ${e.sourceFileName?`'${i(e.sourceFileName)}'`:"NULL"},
          source_file_type = ${e.sourceFileType?`'${i(e.sourceFileType)}'`:"NULL"},
          schema_version = '${i(e.schemaVersion)}',
          imported_at = '${i(e.importedAt)}',
          import_status = '${i(e.importStatus)}',
          validation_status = '${i(e.validationStatus)}',
          total_items = ${e.totalItems},
          pending_items = ${e.pendingItems},
          approved_items = ${e.approvedItems},
          rejected_items = ${e.rejectedItems},
          source_report_id = ${e.sourceReportId?`'${i(e.sourceReportId)}'`:"NULL"},
          source_report_title = ${e.sourceReportTitle?`'${i(e.sourceReportTitle)}'`:"NULL"},
          source_report_project = ${e.sourceReportProject?`'${i(e.sourceReportProject)}'`:"NULL"},
          source_report_discipline = ${e.sourceReportDiscipline?`'${i(e.sourceReportDiscipline)}'`:"NULL"},
          source_report_author = ${e.sourceReportAuthor?`'${i(e.sourceReportAuthor)}'`:"NULL"},
          source_report_organization = ${e.sourceReportOrganization?`'${i(e.sourceReportOrganization)}'`:"NULL"},
          source_report_date = ${e.sourceReportDate?`'${i(e.sourceReportDate)}'`:"NULL"},
          source_report_file_name = ${e.sourceReportFileName?`'${i(e.sourceReportFileName)}'`:"NULL"},
          warnings_json = ${e.warningsJson?`'${i(e.warningsJson)}'`:"NULL"},
          notes = ${e.notes?`'${i(e.notes)}'`:"NULL"}
      WHERE id = '${i(e.id)}'
    `)}async delete(e){const t=i(e);this.db.run("BEGIN TRANSACTION;");try{this.db.run(`DELETE FROM pending_item_image_links WHERE pending_image_id IN (SELECT id FROM pending_images WHERE batch_id = '${t}')`),this.db.run(`DELETE FROM pending_images WHERE batch_id = '${t}'`),this.db.run(`DELETE FROM pending_words WHERE batch_id = '${t}'`),this.db.run(`DELETE FROM pending_phrases WHERE batch_id = '${t}'`),this.db.run(`DELETE FROM pending_sentences WHERE batch_id = '${t}'`),this.db.run(`DELETE FROM pending_geo_materials WHERE batch_id = '${t}'`),this.db.run(`DELETE FROM pending_geo_features WHERE batch_id = '${t}'`),this.db.run(`DELETE FROM pending_strategies WHERE batch_id = '${t}'`),this.db.run(`DELETE FROM import_batches WHERE id = '${t}'`),this.db.run("COMMIT;")}catch(s){throw this.db.run("ROLLBACK;"),s}}async deleteAll(){this.db.run("BEGIN TRANSACTION;");try{this.db.run("DELETE FROM pending_item_image_links"),this.db.run("DELETE FROM pending_images"),this.db.run("DELETE FROM pending_words"),this.db.run("DELETE FROM pending_phrases"),this.db.run("DELETE FROM pending_sentences"),this.db.run("DELETE FROM pending_geo_materials"),this.db.run("DELETE FROM pending_geo_features"),this.db.run("DELETE FROM pending_strategies"),this.db.run("DELETE FROM import_batches"),this.db.run("COMMIT;")}catch(e){throw this.db.run("ROLLBACK;"),e}}map(e){return{id:String(e.id),batchName:String(e.batch_name),sourceFileName:e.source_file_name==null?void 0:String(e.source_file_name),sourceFileType:e.source_file_type==null?void 0:String(e.source_file_type),schemaVersion:String(e.schema_version),importedAt:String(e.imported_at),importStatus:String(e.import_status),validationStatus:String(e.validation_status),totalItems:Number(e.total_items),pendingItems:Number(e.pending_items),approvedItems:Number(e.approved_items),rejectedItems:Number(e.rejected_items),sourceReportId:e.source_report_id==null?void 0:String(e.source_report_id),sourceReportTitle:e.source_report_title==null?void 0:String(e.source_report_title),sourceReportProject:e.source_report_project==null?void 0:String(e.source_report_project),sourceReportDiscipline:e.source_report_discipline==null?void 0:String(e.source_report_discipline),sourceReportAuthor:e.source_report_author==null?void 0:String(e.source_report_author),sourceReportOrganization:e.source_report_organization==null?void 0:String(e.source_report_organization),sourceReportDate:e.source_report_date==null?void 0:String(e.source_report_date),sourceReportFileName:e.source_report_file_name==null?void 0:String(e.source_report_file_name),warningsJson:e.warnings_json==null?void 0:String(e.warnings_json),notes:e.notes==null?void 0:String(e.notes)}}}class c{constructor(e){this.db=e}listByBatch(e){return l(this.db,`SELECT * FROM pending_images WHERE batch_id = '${i(e)}' ORDER BY created_at DESC`).map(t=>({id:String(t.id),batchId:String(t.batch_id),fileName:String(t.file_name),caption:t.caption==null?void 0:String(t.caption),description:t.description==null?void 0:String(t.description),processingStatus:String(t.processing_status),reviewStatus:String(t.review_status),reviewerNote:t.reviewer_note==null?void 0:String(t.reviewer_note),sourceType:t.source_type==null?void 0:String(t.source_type),tempStoragePath:t.temp_storage_path==null?void 0:String(t.temp_storage_path),hash:t.hash==null?void 0:String(t.hash)}))}listLinksByBatch(e){return l(this.db,`
      SELECT l.pending_item_type, l.pending_item_id, l.pending_image_id, l.link_role
      FROM pending_item_image_links l
      INNER JOIN pending_images i ON i.id = l.pending_image_id
      WHERE i.batch_id = '${i(e)}'
      `).map(t=>({pendingItemType:String(t.pending_item_type),pendingItemId:String(t.pending_item_id),pendingImageId:String(t.pending_image_id),linkRole:t.link_role==null?void 0:String(t.link_role)}))}updateReviewStatus(e,t){this.db.run(`UPDATE pending_images SET review_status = '${i(t)}' WHERE id = '${i(e)}'`)}updateReviewerNote(e,t){this.db.run(`UPDATE pending_images SET reviewer_note = '${i(t)}' WHERE id = '${i(e)}'`)}}const v=`
SELECT id, 'word' AS item_type, batch_id, source_report_id, raw_word AS title, normalized_word AS normalized_value, review_status, duplicate_status, confidence_score, confidence_band, reviewer_note, source_section, source_sentence FROM pending_words
UNION ALL
SELECT id, 'phrase' AS item_type, batch_id, source_report_id, raw_phrase AS title, normalized_phrase AS normalized_value, review_status, duplicate_status, confidence_score, confidence_band, reviewer_note, source_section, source_sentence FROM pending_phrases
UNION ALL
SELECT id, 'sentence' AS item_type, batch_id, source_report_id, raw_sentence AS title, normalized_sentence AS normalized_value, review_status, duplicate_status, confidence_score, confidence_band, reviewer_note, source_section, source_sentence FROM pending_sentences
UNION ALL
SELECT id, 'geo_material' AS item_type, batch_id, source_report_id, raw_name AS title, normalized_name AS normalized_value, review_status, duplicate_status, confidence_score, confidence_band, reviewer_note, source_section, source_sentence FROM pending_geo_materials
UNION ALL
SELECT id, 'geo_feature' AS item_type, batch_id, source_report_id, raw_name AS title, normalized_name AS normalized_value, review_status, duplicate_status, confidence_score, confidence_band, reviewer_note, source_section, source_sentence FROM pending_geo_features
UNION ALL
SELECT id, 'strategy' AS item_type, batch_id, source_report_id, raw_name AS title, normalized_name AS normalized_value, review_status, duplicate_status, confidence_score, confidence_band, reviewer_note, NULL AS source_section, NULL AS source_sentence FROM pending_strategies
`;class p{constructor(e){this.db=e}async listByBatch(e){return l(this.db,`SELECT * FROM (${v}) WHERE batch_id = '${i(e)}' ORDER BY item_type ASC, title ASC`).map(t=>this.map(t))}async updateReviewStatus(e,t,s){const n=this.resolveTableName(e);this.db.run(`UPDATE ${n} SET review_status = '${i(s)}' WHERE id = '${i(t)}'`)}async updateReviewerNote(e,t,s){const n=this.resolveTableName(e);this.db.run(`UPDATE ${n} SET reviewer_note = '${i(s)}' WHERE id = '${i(t)}'`)}resolveTableName(e){switch(e){case"word":return"pending_words";case"phrase":return"pending_phrases";case"sentence":return"pending_sentences";case"geo_material":return"pending_geo_materials";case"geo_feature":return"pending_geo_features";case"strategy":return"pending_strategies"}}map(e){return{id:String(e.id),itemType:e.item_type,batchId:String(e.batch_id),sourceReportId:e.source_report_id==null?void 0:String(e.source_report_id),title:String(e.title),normalizedValue:String(e.normalized_value),reviewStatus:String(e.review_status),duplicateStatus:String(e.duplicate_status),confidenceScore:e.confidence_score==null?void 0:Number(e.confidence_score),confidenceBand:e.confidence_band==null?void 0:String(e.confidence_band),reviewerNote:e.reviewer_note==null?void 0:String(e.reviewer_note),sourceSection:e.source_section==null?void 0:String(e.source_section),sourceSentence:e.source_sentence==null?void 0:String(e.source_sentence)}}}function L(u){var e,t;if(u)try{const s=JSON.parse(u),n=(e=s.variants)==null?void 0:e.find(_=>_.variant==="standard");if(n!=null&&n.storageKey)return n.storageKey;const o=(t=s.variants)==null?void 0:t.find(_=>_.variant==="thumbnail");return o==null?void 0:o.storageKey}catch{return}}class N{async listBatches(e){return new g(e).listAll()}async deleteBatch(e,t){await new g(e).delete(t),await r(e)}async clearAllBatches(e){await new g(e).deleteAll(),await r(e)}async getBatch(e,t){return new g(e).getById(t)}async listPendingItems(e,t){return new p(e).listByBatch(t)}async listPendingImages(e,t){const s=new c(e),n=s.listByBatch(t),o=s.listLinksByBatch(t),_=[];for(const d of n){const a=o.filter(m=>m.pendingImageId===d.id),E=L(d.tempStoragePath);let R;if(E){const m=await S(E);m&&(R=URL.createObjectURL(m))}_.push({image:d,links:a,previewUrl:R})}return _}async approve(e,t,s){await new p(e).updateReviewStatus(t,s,"approved"),await r(e)}async approveAll(e,t,s){const n=new p(e),o=new c(e),_=await n.listByBatch(t),d=o.listByBatch(t);e.exec("BEGIN TRANSACTION;");try{for(const a of _)(a.reviewStatus==="unreviewed"||a.reviewStatus==="deferred")&&(!s||s==="all"||a.itemType===s)&&await n.updateReviewStatus(a.itemType,a.id,"approved");if(!s||s==="all")for(const a of d)(a.reviewStatus==="unreviewed"||a.reviewStatus==="deferred")&&o.updateReviewStatus(a.id,"approved");e.exec("COMMIT;")}catch(a){throw e.exec("ROLLBACK;"),a}await r(e)}async reject(e,t,s){await new p(e).updateReviewStatus(t,s,"rejected"),await r(e)}async defer(e,t,s){await new p(e).updateReviewStatus(t,s,"deferred"),await r(e)}async updateReviewerNote(e,t,s,n){await new p(e).updateReviewerNote(t,s,n),await r(e)}async approveImage(e,t){new c(e).updateReviewStatus(t,"approved"),await r(e)}async rejectImage(e,t){new c(e).updateReviewStatus(t,"rejected"),await r(e)}async deferImage(e,t){new c(e).updateReviewStatus(t,"deferred"),await r(e)}async updateImageReviewerNote(e,t,s){new c(e).updateReviewerNote(t,s),await r(e)}}export{N as I,g as S};
