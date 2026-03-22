import{a as y,e as i,r as m}from"./index-B7FpDlN1.js";function c(){return new Date().toISOString()}function u(_){return`${_}-${c()}-${Math.random().toString(16).slice(2,8)}`}function r(_){return _==null?void 0:String(_)}function a(_){return _?`'${i(_)}'`:"NULL"}function S(_){return _?1:0}function h(_,e){return _.map(t=>({direction:e,relationType:String(t.relation_type),itemType:String(t.related_item_type),itemId:String(t.related_item_id),title:String(t.related_title),subtitle:r(t.related_subtitle),confidenceScore:t.confidence_score==null?void 0:Number(t.confidence_score)}))}function f(_,e,t){const n=[];return _!=null&&_.category&&e&&n.push(`${e} = '${i(_.category)}'`),_!=null&&_.subtype&&t&&n.push(`${t} = '${i(_.subtype)}'`),n.length>0?`WHERE ${n.join(" AND ")}`:""}function $(_,e,t,n){switch(_==null?void 0:_.sortBy){case"recent":return"ORDER BY updated_at DESC";case"name":return`ORDER BY ${n} ASC`;case"subtype":return`ORDER BY COALESCE(${t??"''"}, ''), COALESCE(${e??"''"}, ''), ${n} ASC`;case"category":default:return`ORDER BY COALESCE(${e??"''"}, ''), COALESCE(${t??"''"}, ''), ${n} ASC`}}class L{constructor(e){this.db=e}ensureReport(e){const t=r(e.source_report_id),n=r(e.source_report_title);if(!t&&!n)return;if(t){const o=y(this.db,`SELECT id FROM reports WHERE source_report_id = '${i(t)}'`);if(o!=null&&o.id)return String(o.id)}const s=u("report");return this.db.run(`
      INSERT INTO reports (id, source_report_id, title, project, discipline, report_date, source_type, author, organization, tags_json, summary, created_at, updated_at)
      VALUES (
        '${i(s)}',
        ${a(t)},
        ${a(n)},
        ${a(r(e.source_report_project))},
        ${a(r(e.source_report_discipline))},
        ${a(r(e.source_report_date))},
        ${a(r(e.source_file_type))},
        ${a(r(e.source_report_author))},
        ${a(r(e.source_report_organization))},
        NULL,
        ${a(r(e.notes))},
        '${c()}',
        '${c()}'
      )
    `),s}findIdByNormalized(e,t,n){const s=y(this.db,`SELECT id FROM ${e} WHERE ${t} = '${i(n)}'`);return s!=null&&s.id?String(s.id):void 0}upsertWord(e){const t=this.findIdByNormalized("words","normalized_word",e.normalizedWord);if(t)return t;const n=u("word");return this.db.run(`
      INSERT INTO words (id, canonical_word, normalized_word, lemma, part_of_speech, language_category, chinese_meaning, english_definition, difficulty_level, mastery_level, frequency_score, provenance_type, first_added_at, updated_at, is_starred, is_archived)
      VALUES (
        '${i(n)}',
        '${i(e.canonicalWord)}',
        '${i(e.normalizedWord)}',
        ${a(e.lemma)},
        ${a(e.partOfSpeech)},
        ${a(e.languageCategory)},
        ${a(e.chineseMeaning)},
        ${a(e.englishDefinition)},
        NULL,
        NULL,
        NULL,
        'imported_ai',
        '${c()}',
        '${c()}',
        0,
        0
      )
    `),n}upsertPhrase(e){const t=this.findIdByNormalized("phrases","normalized_phrase",e.normalizedPhrase);if(t)return t;const n=u("phrase");return this.db.run(`
      INSERT INTO phrases (id, canonical_phrase, normalized_phrase, phrase_type, function_type, scenario_type, chinese_meaning, explanation, difficulty_level, mastery_level, reusable_score, provenance_type, first_added_at, updated_at, is_starred, is_archived)
      VALUES (
        '${i(n)}',
        '${i(e.canonicalPhrase)}',
        '${i(e.normalizedPhrase)}',
        ${a(e.phraseType)},
        ${a(e.functionType)},
        ${a(e.scenarioType)},
        ${a(e.chineseMeaning)},
        ${a(e.explanation)},
        NULL,
        NULL,
        NULL,
        'imported_ai',
        '${c()}',
        '${c()}',
        0,
        0
      )
    `),n}upsertSentence(e){const t=this.findIdByNormalized("sentences","normalized_sentence",e.normalizedSentence);if(t)return t;const n=u("sentence");return this.db.run(`
      INSERT INTO sentences (id, canonical_sentence, normalized_sentence, sentence_type, function_type, scenario_type, chinese_literal, chinese_natural, section_name, reusable_flag, reusable_score, difficulty_level, mastery_level, provenance_type, first_added_at, updated_at, is_starred, is_archived)
      VALUES (
        '${i(n)}',
        '${i(e.canonicalSentence)}',
        '${i(e.normalizedSentence)}',
        ${a(e.sentenceType)},
        ${a(e.functionType)},
        ${a(e.scenarioType)},
        ${a(e.chineseLiteral)},
        ${a(e.chineseNatural)},
        ${a(e.sectionName)},
        ${S((e.reusableScore??0)>.5)},
        ${e.reusableScore==null?"NULL":String(e.reusableScore)},
        NULL,
        NULL,
        'imported_ai',
        '${c()}',
        '${c()}',
        0,
        0
      )
    `),n}upsertGeoMaterial(e){const t=this.findIdByNormalized("geo_materials","normalized_name",e.normalizedName);if(t)return t;const n=u("geo-material");return this.db.run(`
      INSERT INTO geo_materials (id, canonical_name, normalized_name, chinese_name, geo_material_category, geo_material_subtype, description, identification_method, distinguishing_points, common_misidentifications, engineering_significance, common_risks, common_treatments, australia_context, difficulty_level, mastery_level, provenance_type, first_added_at, updated_at, is_starred, is_archived)
      VALUES (
        '${i(n)}',
        '${i(e.canonicalName)}',
        '${i(e.normalizedName)}',
        ${a(e.chineseName)},
        ${a(e.category)},
        ${a(e.subtype)},
        ${a(e.description)},
        ${a(e.identificationMethod)},
        ${a(e.distinguishingPoints)},
        ${a(e.commonMisidentifications)},
        ${a(e.engineeringSignificance)},
        ${a(e.commonRisks)},
        ${a(e.commonTreatments)},
        ${a(e.australiaContext)},
        NULL,
        NULL,
        'imported_ai',
        '${c()}',
        '${c()}',
        0,
        0
      )
    `),n}upsertGeoFeature(e){const t=this.findIdByNormalized("geo_features","normalized_name",e.normalizedName);if(t)return t;const n=u("geo-feature");return this.db.run(`
      INSERT INTO geo_features (id, canonical_name, normalized_name, chinese_name, geo_feature_category, geo_feature_subtype, description, identification_method, distinguishing_points, common_causes, risk_implications, treatment_or_mitigation, reporting_expressions, inspection_points, difficulty_level, mastery_level, provenance_type, first_added_at, updated_at, is_starred, is_archived)
      VALUES (
        '${i(n)}',
        '${i(e.canonicalName)}',
        '${i(e.normalizedName)}',
        ${a(e.chineseName)},
        ${a(e.category)},
        ${a(e.subtype)},
        ${a(e.description)},
        ${a(e.identificationMethod)},
        ${a(e.distinguishingPoints)},
        ${a(e.commonCauses)},
        ${a(e.riskImplications)},
        ${a(e.treatmentOrMitigation)},
        ${a(e.reportingExpressions)},
        ${a(e.inspectionPoints)},
        NULL,
        NULL,
        'imported_ai',
        '${c()}',
        '${c()}',
        0,
        0
      )
    `),n}upsertStrategy(e){const t=this.findIdByNormalized("strategies","normalized_name",e.normalizedName);if(t)return t;const n=u("strategy");return this.db.run(`
      INSERT INTO strategies (id, canonical_name, normalized_name, chinese_name, strategy_category, description, steps_or_method, application_conditions, limitations, linked_reporting_expression, monitoring_notes, difficulty_level, provenance_type, first_added_at, updated_at, is_starred, is_archived)
      VALUES (
        '${i(n)}',
        '${i(e.canonicalName)}',
        '${i(e.normalizedName)}',
        ${a(e.chineseName)},
        ${a(e.category)},
        ${a(e.description)},
        ${a(e.stepsOrMethod)},
        ${a(e.applicationConditions)},
        ${a(e.limitations)},
        ${a(e.linkedReportingExpression)},
        ${a(e.monitoringNotes)},
        NULL,
        'imported_ai',
        '${c()}',
        '${c()}',
        0,
        0
      )
    `),n}ensureItemSource(e,t,n,s,o){const l=y(this.db,`SELECT id FROM item_sources WHERE item_type = '${i(e)}' AND item_id = '${i(t)}' AND COALESCE(report_id, '') = COALESCE(${a(n)}, '') AND COALESCE(source_section, '') = COALESCE(${a(s)}, '') AND COALESCE(source_sentence, '') = COALESCE(${a(o)}, '')`);l!=null&&l.id||this.db.run(`
      INSERT INTO item_sources (id, item_type, item_id, report_id, source_section, source_sentence, source_excerpt, source_page_ref, source_paragraph_ref, created_at)
      VALUES ('${u("item-source")}', '${i(e)}', '${i(t)}', ${a(n)}, ${a(s)}, ${a(o)}, NULL, NULL, NULL, '${c()}')
    `)}ensureRelation(e,t,n,s,o,l){const p=y(this.db,`SELECT id FROM item_relations WHERE from_item_type = '${i(e)}' AND from_item_id = '${i(t)}' AND relation_type = '${i(n)}' AND to_item_type = '${i(s)}' AND to_item_id = '${i(o)}'`);p!=null&&p.id||this.db.run(`
      INSERT INTO item_relations (id, from_item_type, from_item_id, relation_type, to_item_type, to_item_id, confidence_score, created_by, created_at)
      VALUES ('${u("item-relation")}', '${i(e)}', '${i(t)}', '${i(n)}', '${i(s)}', '${i(o)}', ${l}, 'system', '${c()}')
    `)}listWordHeads(){return m(this.db,"SELECT id, normalized_word FROM words").map(e=>({id:String(e.id),normalizedWord:String(e.normalized_word)}))}listPhraseHeads(){return m(this.db,"SELECT id, normalized_phrase FROM phrases").map(e=>({id:String(e.id),normalizedPhrase:String(e.normalized_phrase)}))}listGeoMaterialHeads(){return m(this.db,"SELECT id, normalized_name FROM geo_materials").map(e=>({id:String(e.id),normalizedName:String(e.normalized_name)}))}listWords(){return m(this.db,"SELECT id, canonical_word, language_category, chinese_meaning, english_definition, provenance_type, updated_at FROM words ORDER BY updated_at DESC").map(e=>({id:String(e.id),title:String(e.canonical_word),subtitle:r(e.language_category),description:r(e.chinese_meaning)??r(e.english_definition),provenanceType:r(e.provenance_type),updatedAt:String(e.updated_at)}))}listPhrases(){return m(this.db,"SELECT id, canonical_phrase, function_type, chinese_meaning, explanation, provenance_type, updated_at FROM phrases ORDER BY updated_at DESC").map(e=>({id:String(e.id),title:String(e.canonical_phrase),subtitle:r(e.function_type),description:r(e.chinese_meaning)??r(e.explanation),provenanceType:r(e.provenance_type),updatedAt:String(e.updated_at)}))}listSentences(){return m(this.db,"SELECT id, canonical_sentence, sentence_type, chinese_natural, chinese_literal, provenance_type, updated_at FROM sentences ORDER BY updated_at DESC").map(e=>({id:String(e.id),title:String(e.canonical_sentence),subtitle:r(e.sentence_type),description:r(e.chinese_natural)??r(e.chinese_literal),provenanceType:r(e.provenance_type),updatedAt:String(e.updated_at)}))}listRequirements(){return m(this.db,"SELECT id, canonical_name, requirement_category, authority_level, plain_language_summary, requirement_text, provenance_type, updated_at FROM requirements ORDER BY updated_at DESC").map(e=>({id:String(e.id),title:String(e.canonical_name),subtitle:[r(e.requirement_category),r(e.authority_level)].filter(Boolean).join(" | ")||void 0,category:r(e.requirement_category),description:r(e.plain_language_summary)??r(e.requirement_text),provenanceType:r(e.provenance_type),updatedAt:String(e.updated_at)}))}listMethods(){return m(this.db,"SELECT id, canonical_name, method_category, authority_level, purpose, procedure_summary, provenance_type, updated_at FROM methods ORDER BY updated_at DESC").map(e=>({id:String(e.id),title:String(e.canonical_name),subtitle:[r(e.method_category),r(e.authority_level)].filter(Boolean).join(" | ")||void 0,category:r(e.method_category),description:r(e.purpose)??r(e.procedure_summary),provenanceType:r(e.provenance_type),updatedAt:String(e.updated_at)}))}listGeoMaterials(e){const t=f(e,"geo_material_category","geo_material_subtype"),n=$(e,"geo_material_category","geo_material_subtype","canonical_name");return m(this.db,`SELECT id, canonical_name, geo_material_category, geo_material_subtype, description, provenance_type, updated_at FROM geo_materials ${t} ${n}`).map(s=>({id:String(s.id),title:String(s.canonical_name),subtitle:[r(s.geo_material_category),r(s.geo_material_subtype)].filter(Boolean).join(" | ")||void 0,category:r(s.geo_material_category),subtype:r(s.geo_material_subtype),description:r(s.description),provenanceType:r(s.provenance_type),updatedAt:String(s.updated_at)}))}listGeoFeatures(e){const t=f(e,"geo_feature_category","geo_feature_subtype"),n=$(e,"geo_feature_category","geo_feature_subtype","canonical_name");return m(this.db,`SELECT id, canonical_name, geo_feature_category, geo_feature_subtype, description, provenance_type, updated_at FROM geo_features ${t} ${n}`).map(s=>({id:String(s.id),title:String(s.canonical_name),subtitle:[r(s.geo_feature_category),r(s.geo_feature_subtype)].filter(Boolean).join(" | ")||void 0,category:r(s.geo_feature_category),subtype:r(s.geo_feature_subtype),description:r(s.description),provenanceType:r(s.provenance_type),updatedAt:String(s.updated_at)}))}getGeoMaterialFilterOptions(){const e=m(this.db,"SELECT DISTINCT geo_material_category AS value FROM geo_materials WHERE geo_material_category IS NOT NULL AND geo_material_category != '' ORDER BY geo_material_category ASC").map(n=>String(n.value)),t=m(this.db,"SELECT DISTINCT geo_material_subtype AS value FROM geo_materials WHERE geo_material_subtype IS NOT NULL AND geo_material_subtype != '' ORDER BY geo_material_subtype ASC").map(n=>String(n.value));return{categories:e,subtypes:t}}getGeoFeatureFilterOptions(){const e=m(this.db,"SELECT DISTINCT geo_feature_category AS value FROM geo_features WHERE geo_feature_category IS NOT NULL AND geo_feature_category != '' ORDER BY geo_feature_category ASC").map(n=>String(n.value)),t=m(this.db,"SELECT DISTINCT geo_feature_subtype AS value FROM geo_features WHERE geo_feature_subtype IS NOT NULL AND geo_feature_subtype != '' ORDER BY geo_feature_subtype ASC").map(n=>String(n.value));return{categories:e,subtypes:t}}getDetail(e,t){const n={word:{table:"words",idField:"id"},phrase:{table:"phrases",idField:"id"},sentence:{table:"sentences",idField:"id"},geo_material:{table:"geo_materials",idField:"id"},geo_feature:{table:"geo_features",idField:"id"},strategy:{table:"strategies",idField:"id"},requirement:{table:"requirements",idField:"id"},method:{table:"methods",idField:"id"}},s=y(this.db,`SELECT * FROM ${n[e].table} WHERE ${n[e].idField} = '${i(t)}'`);if(!s)return;const o=m(this.db,`
      SELECT s.id, s.report_id, s.source_section, s.source_sentence, s.source_excerpt,
             r.title AS report_title, r.report_date, r.project
      FROM item_sources s
      LEFT JOIN reports r ON r.id = s.report_id
      WHERE s.item_type = '${i(e)}' AND s.item_id = '${i(t)}'
      ORDER BY s.created_at DESC
      `).map(d=>({id:String(d.id),reportId:r(d.report_id),sourceSection:r(d.source_section),sourceSentence:r(d.source_sentence),sourceExcerpt:r(d.source_excerpt),reportTitle:r(d.report_title),reportDate:r(d.report_date),reportProject:r(d.project)})),l=m(this.db,`SELECT tag_name FROM custom_tags WHERE item_type = '${i(e)}' AND item_id = '${i(t)}'`).map(d=>String(d.tag_name)),p={...s};return p.tags=l.join(", "),o.length>0&&(p.sourceReport=o[0].reportTitle),{id:t,itemType:e,fields:p,sources:o}}listRelations(e,t){const n=m(this.db,`
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
      WHERE r.from_item_type = '${i(e)}' AND r.from_item_id = '${i(t)}'
        AND COALESCE(w.id, p.id, s.id, gm.id, gf.id, st.id, rq.id, md.id) IS NOT NULL
      ORDER BY r.relation_type ASC, related_title ASC
      `),s=m(this.db,`
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
      WHERE r.to_item_type = '${i(e)}' AND r.to_item_id = '${i(t)}'
        AND COALESCE(w.id, p.id, s.id, gm.id, gf.id, st.id, rq.id, md.id) IS NOT NULL
      ORDER BY r.relation_type ASC, related_title ASC
      `);return[...h(n,"outgoing"),...h(s,"incoming")]}updateItem(e,t,n){var p;const s=e==="word"?"words":e==="phrase"?"phrases":e==="sentence"?"sentences":e==="geo_material"?"geo_materials":e==="geo_feature"?"geo_features":e==="strategy"?"strategies":e==="requirement"?"requirements":e==="method"?"methods":void 0;if(!s)return;const o={...n};if(o.tags!==void 0){const d=String(o.tags).split(/[,;]/).map(g=>g.trim()).filter(Boolean);this.db.run(`DELETE FROM custom_tags WHERE item_type = '${i(e)}' AND item_id = '${i(t)}'`);for(const g of d){const E=Math.random().toString(36).substring(2,15);this.db.run(`INSERT INTO custom_tags (id, item_type, item_id, tag_name, created_at) VALUES ('${E}', '${i(e)}', '${i(t)}', '${i(g)}', '${c()}')`)}delete o.tags}delete o.sourceReport;const l=[];for(const[d,g]of Object.entries(o)){if(d==="id"||d==="created_at"||d==="updated_at"||d==="first_added_at")continue;(p={words:["canonical_word","normalized_word","lemma","part_of_speech","language_category","chinese_meaning","english_definition","difficulty_level","mastery_level","frequency_score","provenance_type","is_starred","is_archived"],phrases:["canonical_phrase","normalized_phrase","phrase_type","function_type","scenario_type","chinese_meaning","explanation","difficulty_level","mastery_level","reusable_score","provenance_type","is_starred","is_archived"],sentences:["canonical_sentence","normalized_sentence","sentence_type","function_type","scenario_type","chinese_literal","chinese_natural","section_name","reusable_flag","reusable_score","difficulty_level","mastery_level","provenance_type","is_starred","is_archived"],geo_materials:["canonical_name","normalized_name","chinese_name","geo_material_category","geo_material_subtype","description","identification_method","distinguishing_points","common_misidentifications","engineering_significance","common_risks","common_treatments","australia_context","difficulty_level","mastery_level","provenance_type","is_starred","is_archived"],geo_features:["canonical_name","normalized_name","chinese_name","geo_feature_category","geo_feature_subtype","description","identification_method","distinguishing_points","common_causes","risk_implications","treatment_or_mitigation","reporting_expressions","inspection_points","difficulty_level","mastery_level","provenance_type","is_starred","is_archived"],strategies:["canonical_name","normalized_name","chinese_name","strategy_category","description","steps_or_method","application_conditions","limitations","linked_reporting_expression","monitoring_notes","difficulty_level","provenance_type","is_starred","is_archived"],requirements:["canonical_name","normalized_name","source_document_id","requirement_category","jurisdiction","authority_level","clause_reference","requirement_text","plain_language_summary","why_it_matters","trigger_conditions","verification_method","tags_json","provenance_type","is_starred","is_archived"],methods:["canonical_name","normalized_name","source_document_id","method_category","jurisdiction","authority_level","purpose","procedure_summary","inputs_or_prerequisites","outputs_or_results","limitations","tags_json","provenance_type","is_starred","is_archived"]}[s])!=null&&p.includes(d)&&l.push(`"${d}" = ${a(r(g))}`)}l.length>0&&(l.push(`updated_at = '${c()}'`),this.db.run(`UPDATE ${s} SET ${l.join(", ")} WHERE id = '${i(t)}'`))}deleteItem(e,t){const n=e==="word"?"words":e==="phrase"?"phrases":e==="sentence"?"sentences":e==="geo_material"?"geo_materials":e==="geo_feature"?"geo_features":e==="strategy"?"strategies":e==="requirement"?"requirements":e==="method"?"methods":void 0;n&&(this.db.run(`DELETE FROM ${n} WHERE id = '${i(t)}'`),this.db.run(`DELETE FROM item_relations WHERE (from_item_type = '${i(e)}' AND from_item_id = '${i(t)}') OR (to_item_type = '${i(e)}' AND to_item_id = '${i(t)}')`),this.db.run(`DELETE FROM item_sources WHERE item_type = '${i(e)}' AND item_id = '${i(t)}'`),this.db.run(`DELETE FROM favorites WHERE item_type = '${i(e)}' AND item_id = '${i(t)}'`),this.db.run(`DELETE FROM review_logs WHERE item_type = '${i(e)}' AND item_id = '${i(t)}'`))}}export{L as S};
