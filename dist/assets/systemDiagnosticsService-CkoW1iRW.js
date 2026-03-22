var S=Object.defineProperty;var E=(t,i,e)=>i in t?S(t,i,{enumerable:!0,configurable:!0,writable:!0,value:e}):t[i]=e;var O=(t,i,e)=>E(t,typeof i!="symbol"?i+"":i,e);import{r as g,h as N,w as T,o as A,D as I,x as R,S as v}from"./index-B7FpDlN1.js";import{P as U}from"./performanceMetricsService-DkYvukSA.js";function w(){return new Date().toISOString()}function C(t){if(!t)return[];try{return(JSON.parse(t).variants??[]).map(e=>e.storageKey).filter(e=>typeof e=="string"&&e.length>0)}catch{return[]}}function f(t){if(t==null)return[];const i=String(t).trim();return i?Array.from(new Set(i.split(",").map(e=>e.trim()).filter(e=>e.length>0))):[]}function h(t){const i={};for(const e of t)i[e.category]=(i[e.category]??0)+1;return{totalIssues:t.length,errorCount:t.filter(e=>e.severity==="error").length,warningCount:t.filter(e=>e.severity==="warning").length,byCategory:i}}function L(t){return`LOWER(TRIM(REPLACE(${t}, '  ', ' ')))`}function D(t){let i=0,e=0,s=0,o=0,c=0;for(const r of t){const m=String(r.provenance_type??"").trim(),a=Number(r.record_count??0);m==="system_generated"?i+=a:m==="imported_ai"?e+=a:m==="manual_user"?s+=a:m==="merged"?o+=a:c+=a}const d=e+s+o,p=i+d+c;return{systemGenerated:i,importedAi:e,manualUser:s,merged:o,userOwned:d,other:c,total:p}}class F{async runBasicChecks(i){const e=[];for(const r of["word","phrase","sentence","geo_material","geo_feature","strategy"]){const a=g(i,`
        SELECT t.id
        FROM ${r==="word"?"words":r==="phrase"?"phrases":r==="sentence"?"sentences":r==="geo_material"?"geo_materials":r==="geo_feature"?"geo_features":"strategies"} t
        LEFT JOIN item_sources s ON s.item_type = '${r}' AND s.item_id = t.id
        WHERE s.id IS NULL
        `);for(const _ of a)e.push({severity:"warning",category:"missing_source_ref",message:`${r} item has no source traceability record.`,entityType:r,entityId:String(_.id)})}for(const r of g(i,`
      SELECT s.id, s.item_type, s.item_id
      FROM item_sources s
      LEFT JOIN words w ON s.item_type = 'word' AND w.id = s.item_id
      LEFT JOIN phrases p ON s.item_type = 'phrase' AND p.id = s.item_id
      LEFT JOIN sentences sn ON s.item_type = 'sentence' AND sn.id = s.item_id
      LEFT JOIN geo_materials gm ON s.item_type = 'geo_material' AND gm.id = s.item_id
      LEFT JOIN geo_features gf ON s.item_type = 'geo_feature' AND gf.id = s.item_id
      LEFT JOIN strategies st ON s.item_type = 'strategy' AND st.id = s.item_id
      WHERE (s.item_type = 'word' AND w.id IS NULL)
         OR (s.item_type = 'phrase' AND p.id IS NULL)
         OR (s.item_type = 'sentence' AND sn.id IS NULL)
         OR (s.item_type = 'geo_material' AND gm.id IS NULL)
         OR (s.item_type = 'geo_feature' AND gf.id IS NULL)
         OR (s.item_type = 'strategy' AND st.id IS NULL)
    `))e.push({severity:"error",category:"broken_source_ref",message:"item_source points to a missing approved item.",entityType:String(r.item_type),entityId:String(r.item_id)});for(const r of g(i,`
      SELECT s.id, s.item_type, s.item_id, s.report_id
      FROM item_sources s
      LEFT JOIN reports r ON r.id = s.report_id
      WHERE s.report_id IS NOT NULL AND r.id IS NULL
    `))e.push({severity:"error",category:"missing_report_reference",message:"item_source references a missing report.",entityType:String(r.item_type),entityId:String(r.item_id)});for(const r of g(i,`
      SELECT l.id, l.item_type, l.item_id, l.image_asset_id
      FROM item_image_links l
      LEFT JOIN images i ON i.id = l.image_asset_id
      LEFT JOIN words w ON l.item_type = 'word' AND w.id = l.item_id
      LEFT JOIN phrases p ON l.item_type = 'phrase' AND p.id = l.item_id
      LEFT JOIN sentences s ON l.item_type = 'sentence' AND s.id = l.item_id
      LEFT JOIN geo_materials gm ON l.item_type = 'geo_material' AND gm.id = l.item_id
      LEFT JOIN geo_features gf ON l.item_type = 'geo_feature' AND gf.id = l.item_id
      LEFT JOIN strategies st ON l.item_type = 'strategy' AND st.id = l.item_id
      WHERE i.id IS NULL
         OR (l.item_type = 'word' AND w.id IS NULL)
         OR (l.item_type = 'phrase' AND p.id IS NULL)
         OR (l.item_type = 'sentence' AND s.id IS NULL)
         OR (l.item_type = 'geo_material' AND gm.id IS NULL)
         OR (l.item_type = 'geo_feature' AND gf.id IS NULL)
         OR (l.item_type = 'strategy' AND st.id IS NULL)
    `))e.push({severity:"error",category:"broken_item_image_link",message:"approved item_image_link points to a missing item or image asset.",entityType:String(r.item_type),entityId:String(r.item_id)});for(const r of g(i,`
      SELECT r.id, r.from_item_type, r.from_item_id, r.to_item_type, r.to_item_id
      FROM item_relations r
      LEFT JOIN words fw ON r.from_item_type = 'word' AND fw.id = r.from_item_id
      LEFT JOIN phrases fp ON r.from_item_type = 'phrase' AND fp.id = r.from_item_id
      LEFT JOIN sentences fs ON r.from_item_type = 'sentence' AND fs.id = r.from_item_id
      LEFT JOIN geo_materials fgm ON r.from_item_type = 'geo_material' AND fgm.id = r.from_item_id
      LEFT JOIN geo_features fgf ON r.from_item_type = 'geo_feature' AND fgf.id = r.from_item_id
      LEFT JOIN strategies fst ON r.from_item_type = 'strategy' AND fst.id = r.from_item_id
      LEFT JOIN words tw ON r.to_item_type = 'word' AND tw.id = r.to_item_id
      LEFT JOIN phrases tp ON r.to_item_type = 'phrase' AND tp.id = r.to_item_id
      LEFT JOIN sentences ts ON r.to_item_type = 'sentence' AND ts.id = r.to_item_id
      LEFT JOIN geo_materials tgm ON r.to_item_type = 'geo_material' AND tgm.id = r.to_item_id
      LEFT JOIN geo_features tgf ON r.to_item_type = 'geo_feature' AND tgf.id = r.to_item_id
      LEFT JOIN strategies tst ON r.to_item_type = 'strategy' AND tst.id = r.to_item_id
      WHERE (r.from_item_type = 'word' AND fw.id IS NULL)
         OR (r.from_item_type = 'phrase' AND fp.id IS NULL)
         OR (r.from_item_type = 'sentence' AND fs.id IS NULL)
         OR (r.from_item_type = 'geo_material' AND fgm.id IS NULL)
         OR (r.from_item_type = 'geo_feature' AND fgf.id IS NULL)
         OR (r.from_item_type = 'strategy' AND fst.id IS NULL)
         OR (r.to_item_type = 'word' AND tw.id IS NULL)
         OR (r.to_item_type = 'phrase' AND tp.id IS NULL)
         OR (r.to_item_type = 'sentence' AND ts.id IS NULL)
         OR (r.to_item_type = 'geo_material' AND tgm.id IS NULL)
         OR (r.to_item_type = 'geo_feature' AND tgf.id IS NULL)
         OR (r.to_item_type = 'strategy' AND tst.id IS NULL)
    `))e.push({severity:"error",category:"broken_item_relation",message:"item_relation points to a missing source or target item.",entityType:String(r.from_item_type),entityId:String(r.from_item_id)});for(const r of g(i,"SELECT id, storage_path FROM images")){const m=String(r.storage_path);await N(m)||e.push({severity:"error",category:"missing_image_file",message:"approved image resource is missing from local storage.",entityType:"image",entityId:String(r.id)})}for(const r of g(i,"SELECT id, temp_storage_path FROM pending_images WHERE temp_storage_path IS NOT NULL")){const m=C(r.temp_storage_path==null?void 0:String(r.temp_storage_path));for(const a of m)await N(a)||e.push({severity:"warning",category:"missing_image_file",message:"pending image variant resource is missing from local storage.",entityType:"pending_image",entityId:String(r.id)})}const s=[],o=[{itemType:"word",tableName:"words",normalizedColumn:"normalized_word"},{itemType:"phrase",tableName:"phrases",normalizedColumn:"normalized_phrase"},{itemType:"sentence",tableName:"sentences",normalizedColumn:"normalized_sentence"},{itemType:"geo_material",tableName:"geo_materials",normalizedColumn:"normalized_name"},{itemType:"geo_feature",tableName:"geo_features",normalizedColumn:"normalized_name"},{itemType:"strategy",tableName:"strategies",normalizedColumn:"normalized_name"}];for(const r of o){const m=L(r.normalizedColumn),a=g(i,`
        SELECT ${m} AS normalized_name,
               COUNT(*) AS duplicate_count,
               GROUP_CONCAT(DISTINCT provenance_type) AS provenance_types
        FROM ${r.tableName}
        WHERE TRIM(${r.normalizedColumn}) != ''
        GROUP BY ${m}
        HAVING COUNT(*) > 1
        `);for(const _ of a){const y=String(_.normalized_name),u={itemType:r.itemType,normalizedName:y,count:Number(_.duplicate_count??0),provenanceTypes:f(_.provenance_types)};s.push(u),e.push({severity:"warning",category:"duplicate_normalized_name",message:`${r.itemType} has duplicate normalized name '${y}'.`,entityType:r.itemType,entityId:y})}}const c=[],d=[{itemType:"geo_material",tableName:"geo_materials"},{itemType:"geo_feature",tableName:"geo_features"},{itemType:"strategy",tableName:"strategies"}];for(const r of d){const m=L("normalized_name"),a=g(i,`
        SELECT ${m} AS normalized_name,
               SUM(CASE WHEN provenance_type = 'system_generated' THEN 1 ELSE 0 END) AS system_count,
               SUM(CASE WHEN provenance_type IN ('imported_ai', 'manual_user', 'merged') THEN 1 ELSE 0 END) AS user_count,
               GROUP_CONCAT(DISTINCT provenance_type) AS provenance_types
        FROM ${r.tableName}
        WHERE TRIM(normalized_name) != ''
        GROUP BY ${m}
        HAVING system_count > 0 AND user_count > 0
        `);for(const _ of a){const y=String(_.normalized_name),u={itemType:r.itemType,normalizedName:y,systemCount:Number(_.system_count??0),userCount:Number(_.user_count??0),provenanceTypes:f(_.provenance_types)};c.push(u),e.push({severity:"warning",category:"system_user_name_collision",message:`${r.itemType} normalized name '${y}' appears in both system and user-owned content.`,entityType:r.itemType,entityId:y})}}const p=g(i,`
      SELECT provenance_type, SUM(record_count) AS record_count
      FROM (
        SELECT provenance_type, COUNT(*) AS record_count FROM words GROUP BY provenance_type
        UNION ALL
        SELECT provenance_type, COUNT(*) AS record_count FROM phrases GROUP BY provenance_type
        UNION ALL
        SELECT provenance_type, COUNT(*) AS record_count FROM sentences GROUP BY provenance_type
        UNION ALL
        SELECT provenance_type, COUNT(*) AS record_count FROM geo_materials GROUP BY provenance_type
        UNION ALL
        SELECT provenance_type, COUNT(*) AS record_count FROM geo_features GROUP BY provenance_type
        UNION ALL
        SELECT provenance_type, COUNT(*) AS record_count FROM strategies GROUP BY provenance_type
      ) grouped
      GROUP BY provenance_type
      `);return{checkedAt:w(),issues:e,summary:h(e),duplicateNormalizedNames:s,systemUserCollisions:c,approvedProvenance:D(p)}}async getStorageUsageSummary(){const i=await T(I),e=await A(),s=e.filter(p=>p.startsWith("image:")),o=e.filter(p=>p.startsWith("backup:"));let c=0;for(const p of s){const r=await N(p);c+=(r==null?void 0:r.size)??0}let d=0;for(const p of o){const r=await N(p);d+=(r==null?void 0:r.size)??0}return{databaseBytes:(i==null?void 0:i.byteLength)??0,imageResourceCount:s.length,imageResourceBytes:c,backupResourceCount:o.length,backupResourceBytes:d,totalKeys:e.length}}}function n(t,i){var e;return Number(((e=g(t,`SELECT COUNT(*) AS c FROM ${i}`)[0])==null?void 0:e.c)??0)}function l(t,i){var e;return Number(((e=g(t,`
      SELECT COUNT(*) AS c
      FROM (
        SELECT review_status FROM pending_words
        UNION ALL SELECT review_status FROM pending_phrases
        UNION ALL SELECT review_status FROM pending_sentences
        UNION ALL SELECT review_status FROM pending_geo_materials
        UNION ALL SELECT review_status FROM pending_geo_features
        UNION ALL SELECT review_status FROM pending_strategies
      ) inbox
      WHERE review_status = '${i}'
      `)[0])==null?void 0:e.c)??0)}function M(t){const i=g(t,`
    SELECT provenance_type, SUM(record_count) AS record_count
    FROM (
      SELECT provenance_type, COUNT(*) AS record_count FROM words GROUP BY provenance_type
      UNION ALL
      SELECT provenance_type, COUNT(*) AS record_count FROM phrases GROUP BY provenance_type
      UNION ALL
      SELECT provenance_type, COUNT(*) AS record_count FROM sentences GROUP BY provenance_type
      UNION ALL
      SELECT provenance_type, COUNT(*) AS record_count FROM geo_materials GROUP BY provenance_type
      UNION ALL
      SELECT provenance_type, COUNT(*) AS record_count FROM geo_features GROUP BY provenance_type
      UNION ALL
      SELECT provenance_type, COUNT(*) AS record_count FROM strategies GROUP BY provenance_type
      UNION ALL
      SELECT provenance_type, COUNT(*) AS record_count FROM requirements GROUP BY provenance_type
      UNION ALL
      SELECT provenance_type, COUNT(*) AS record_count FROM methods GROUP BY provenance_type
    ) grouped
    GROUP BY provenance_type
    `);let e=0,s=0,o=0,c=0,d=0;for(const m of i){const a=String(m.provenance_type??""),_=Number(m.record_count??0);a==="system_generated"?e+=_:a==="imported_ai"?s+=_:a==="manual_user"?o+=_:a==="merged"?c+=_:d+=_}const p=s+o+c,r=e+p+d;return{systemGenerated:e,importedAi:s,manualUser:o,merged:c,userOwned:p,other:d,total:r}}function z(t){const i=l(t,"approved"),e=l(t,"rejected"),s=l(t,"deferred"),o=l(t,"unreviewed");return{approvedCounts:{words:n(t,"words"),phrases:n(t,"phrases"),sentences:n(t,"sentences"),geoMaterials:n(t,"geo_materials"),geoFeatures:n(t,"geo_features"),strategies:n(t,"strategies"),requirements:n(t,"requirements"),methods:n(t,"methods"),images:n(t,"images"),relations:n(t,"item_relations"),sources:n(t,"item_sources"),reports:n(t,"reports")},pendingCounts:{words:n(t,"pending_words"),phrases:n(t,"pending_phrases"),sentences:n(t,"pending_sentences"),geoMaterials:n(t,"pending_geo_materials"),geoFeatures:n(t,"pending_geo_features"),strategies:n(t,"pending_strategies"),images:n(t,"pending_images"),itemImageLinks:n(t,"pending_item_image_links"),inboxTotal:i+e+s+o,inboxApproved:i,inboxRejected:e,inboxDeferred:s,inboxUnreviewed:o},approvedProvenance:M(t),flowAvailability:{systemBuiltInValidateApply:"available",userImportPendingReviewCommit:"available",governanceIntegrityDiagnostics:"available",geoLibraryDetailRead:"available"}}}class G{constructor(){O(this,"integrityService",new F);O(this,"performanceService",new U)}async loadDiagnostics(i,e=!1){const s=await new R(i).listAll(),o=s.length>0?s[s.length-1]:void 0;return{schemaVersion:v,migrationCount:s.length,latestMigration:o?{migrationName:o.migrationName,toVersion:o.toVersion,appliedAt:o.appliedAt}:void 0,storageUsage:await this.integrityService.getStorageUsageSummary(),dataState:z(i),integrity:e?await this.integrityService.runBasicChecks(i):void 0,recentMetrics:await this.performanceService.listRecent()}}}export{G as S};
