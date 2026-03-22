var Ae=Object.defineProperty;var Re=(d,e,l)=>e in d?Ae(d,e,{enumerable:!0,configurable:!0,writable:!0,value:l}):d[e]=l;var B=(d,e,l)=>Re(d,typeof e!="symbol"?e+"":e,l);import{e as o,a as ze,p as Ce,h as Le,s as Ee,i as Pe,b as Oe,c as x,j as i,L as Be}from"./index-B7FpDlN1.js";import{F as re}from"./FeedbackBanner-DfwSGQrH.js";import{I as Me}from"./InlineInfo-DdB6iuWp.js";import{A as qe}from"./AppShell-ChzSxmTv.js";import{h as De,d as G,m as Ue,p as F,s as Fe,c as Ve,e as Ke}from"./pageChrome-DPZul3p5.js";import{B as me}from"./backupOrchestrationService-BPJnW-gd.js";import{S as We}from"./systemDiagnosticsService-CkoW1iRW.js";import{I as Ge,a as Je}from"./imageVariantStorageService-CeNBgYpn.js";import{P as He}from"./performanceMetricsService-DkYvukSA.js";import{i as Qe,o as Ze,d as Ye,m as Xe,r as et,s as tt,b as it,c as nt,g as at,a as st,e as rt,f as ot,h as ct,j as dt,l as lt,k as mt,n as ut,q as pt}from"./enums-CKEayP-A.js";import{o as j,a as b,s,l as oe,b as C,n as _t,e as f}from"./types-B7DKPRWc.js";function a(d){return d?`'${o(d)}'`:"NULL"}function J(d){return d==null?"NULL":String(d)}function gt(d){return d?1:0}class yt{constructor(e){this.db=e}upsertReport(e){this.db.run(`
      INSERT INTO reports (id, source_report_id, title, document_type, document_number, edition, jurisdiction, authority_level, document_status, publisher, source_url, project, discipline, report_date, effective_date, source_type, author, organization, tags_json, keywords_json, summary, reviewed_at, created_at, updated_at)
      VALUES (
        '${o(e.id)}',
        '${o(e.sourceReportId)}',
        '${o(e.title)}',
        ${a(e.documentType)},
        ${a(e.documentNumber)},
        ${a(e.edition)},
        ${a(e.jurisdiction)},
        ${a(e.authorityLevel)},
        ${a(e.documentStatus)},
        ${a(e.publisher)},
        ${a(e.sourceUrl)},
        ${a(e.project)},
        ${a(e.discipline)},
        ${a(e.reportDate)},
        ${a(e.effectiveDate)},
        '${o(e.sourceType)}',
        ${a(e.author)},
        ${a(e.organization)},
        NULL,
        ${a(e.keywordsJson)},
        ${a(e.summary)},
        ${a(e.reviewedAt)},
        '${o(e.createdAt)}',
        '${o(e.updatedAt)}'
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
    `)}upsertWord(e){const l=this.findIdByNormalized("words","normalized_word",e.normalizedWord)||e.id;this.db.run(`
      INSERT INTO words (id, canonical_word, normalized_word, lemma, part_of_speech, language_category, chinese_meaning, english_definition, difficulty_level, mastery_level, frequency_score, provenance_type, first_added_at, updated_at, is_starred, is_archived)
      VALUES (
        '${o(l)}',
        '${o(e.canonicalWord)}',
        '${o(e.normalizedWord)}',
        ${a(e.lemma)},
        ${a(e.partOfSpeech)},
        ${a(e.languageCategory)},
        ${a(e.chineseMeaning)},
        ${a(e.englishDefinition)},
        NULL,
        NULL,
        NULL,
        '${o(e.provenanceType)}',
        '${o(e.firstAddedAt)}',
        '${o(e.updatedAt)}',
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
    `)}upsertPhrase(e){const l=this.findIdByNormalized("phrases","normalized_phrase",e.normalizedPhrase)||e.id;this.db.run(`
      INSERT INTO phrases (id, canonical_phrase, normalized_phrase, phrase_type, function_type, scenario_type, chinese_meaning, explanation, difficulty_level, mastery_level, reusable_score, provenance_type, first_added_at, updated_at, is_starred, is_archived)
      VALUES (
        '${o(l)}',
        '${o(e.canonicalPhrase)}',
        '${o(e.normalizedPhrase)}',
        ${a(e.phraseType)},
        ${a(e.functionType)},
        ${a(e.scenarioType)},
        ${a(e.chineseMeaning)},
        ${a(e.explanation)},
        NULL,
        NULL,
        NULL,
        '${o(e.provenanceType)}',
        '${o(e.firstAddedAt)}',
        '${o(e.updatedAt)}',
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
    `)}upsertSentence(e){const l=this.findIdByNormalized("sentences","normalized_sentence",e.normalizedSentence)||e.id;this.db.run(`
      INSERT INTO sentences (id, canonical_sentence, normalized_sentence, sentence_type, function_type, scenario_type, chinese_literal, chinese_natural, section_name, reusable_flag, reusable_score, difficulty_level, mastery_level, provenance_type, first_added_at, updated_at, is_starred, is_archived)
      VALUES (
        '${o(l)}',
        '${o(e.canonicalSentence)}',
        '${o(e.normalizedSentence)}',
        ${a(e.sentenceType)},
        ${a(e.functionType)},
        ${a(e.scenarioType)},
        ${a(e.chineseLiteral)},
        ${a(e.chineseNatural)},
        ${a(e.sectionName)},
        0,
        NULL,
        NULL,
        NULL,
        '${o(e.provenanceType)}',
        '${o(e.firstAddedAt)}',
        '${o(e.updatedAt)}',
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
    `)}findIdByNormalized(e,l,m){const p=ze(this.db,`SELECT id FROM ${e} WHERE ${l} = '${o(m)}'`);return p!=null&&p.id?String(p.id):void 0}upsertGeoMaterial(e){const l=this.findIdByNormalized("geo_materials","normalized_name",e.normalizedName)||e.id;this.db.run(`
      INSERT INTO geo_materials (id, canonical_name, normalized_name, chinese_name, geo_material_category, geo_material_subtype, description, identification_method, distinguishing_points, common_misidentifications, engineering_significance, common_risks, common_treatments, australia_context, difficulty_level, mastery_level, provenance_type, first_added_at, updated_at, is_starred, is_archived)
      VALUES (
        '${o(l)}',
        '${o(e.canonicalName)}',
        '${o(e.normalizedName)}',
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
        '${o(e.provenanceType)}',
        '${o(e.firstAddedAt)}',
        '${o(e.updatedAt)}',
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
    `)}upsertGeoFeature(e){const l=this.findIdByNormalized("geo_features","normalized_name",e.normalizedName)||e.id;this.db.run(`
      INSERT INTO geo_features (id, canonical_name, normalized_name, chinese_name, geo_feature_category, geo_feature_subtype, description, identification_method, distinguishing_points, common_causes, risk_implications, treatment_or_mitigation, reporting_expressions, inspection_points, difficulty_level, mastery_level, provenance_type, first_added_at, updated_at, is_starred, is_archived)
      VALUES (
        '${o(l)}',
        '${o(e.canonicalName)}',
        '${o(e.normalizedName)}',
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
        '${o(e.provenanceType)}',
        '${o(e.firstAddedAt)}',
        '${o(e.updatedAt)}',
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
    `)}upsertStrategy(e){const l=this.findIdByNormalized("strategies","normalized_name",e.normalizedName)||e.id;this.db.run(`
      INSERT INTO strategies (id, canonical_name, normalized_name, chinese_name, strategy_category, description, steps_or_method, application_conditions, limitations, linked_reporting_expression, monitoring_notes, difficulty_level, provenance_type, first_added_at, updated_at, is_starred, is_archived)
      VALUES (
        '${o(l)}',
        '${o(e.canonicalName)}',
        '${o(e.normalizedName)}',
        ${a(e.chineseName)},
        ${a(e.strategyCategory)},
        ${a(e.description)},
        ${a(e.stepsOrMethod)},
        ${a(e.applicationConditions)},
        ${a(e.limitations)},
        ${a(e.linkedReportingExpression)},
        ${a(e.monitoringNotes)},
        NULL,
        '${o(e.provenanceType)}',
        '${o(e.firstAddedAt)}',
        '${o(e.updatedAt)}',
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
    `)}upsertRequirement(e){const l=this.findIdByNormalized("requirements","normalized_name",e.normalizedName)||e.id;this.db.run(`
      INSERT INTO requirements (id, source_document_id, canonical_name, normalized_name, requirement_category, jurisdiction, authority_level, clause_reference, requirement_text, plain_language_summary, why_it_matters, trigger_conditions, verification_method, tags_json, provenance_type, first_added_at, updated_at, is_starred, is_archived)
      VALUES (
        '${o(l)}',
        ${a(e.sourceDocumentId)},
        '${o(e.canonicalName)}',
        '${o(e.normalizedName)}',
        ${a(e.requirementCategory)},
        ${a(e.jurisdiction)},
        ${a(e.authorityLevel)},
        ${a(e.clauseReference)},
        '${o(e.requirementText)}',
        ${a(e.plainLanguageSummary)},
        ${a(e.whyItMatters)},
        ${a(e.triggerConditions)},
        ${a(e.verificationMethod)},
        ${a(e.tagsJson)},
        '${o(e.provenanceType)}',
        '${o(e.firstAddedAt)}',
        '${o(e.updatedAt)}',
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
    `)}upsertMethod(e){const l=this.findIdByNormalized("methods","normalized_name",e.normalizedName)||e.id;this.db.run(`
      INSERT INTO methods (id, source_document_id, canonical_name, normalized_name, method_category, jurisdiction, authority_level, purpose, procedure_summary, inputs_or_prerequisites, outputs_or_results, limitations, tags_json, provenance_type, first_added_at, updated_at, is_starred, is_archived)
      VALUES (
        '${o(l)}',
        ${a(e.sourceDocumentId)},
        '${o(e.canonicalName)}',
        '${o(e.normalizedName)}',
        ${a(e.methodCategory)},
        ${a(e.jurisdiction)},
        ${a(e.authorityLevel)},
        ${a(e.purpose)},
        ${a(e.procedureSummary)},
        ${a(e.inputsOrPrerequisites)},
        ${a(e.outputsOrResults)},
        ${a(e.limitations)},
        ${a(e.tagsJson)},
        '${o(e.provenanceType)}',
        '${o(e.firstAddedAt)}',
        '${o(e.updatedAt)}',
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
    `)}upsertImage(e){this.db.run(`
      INSERT INTO images (id, asset_group_id, file_name, mime_type, original_width, original_height, original_size_bytes, hash, variant_type, storage_path, caption, description, tags_json, source_type, provenance_type, added_by_user, created_at, updated_at)
      VALUES (
        '${o(e.id)}',
        '${o(e.assetGroupId)}',
        '${o(e.fileName)}',
        ${a(e.mimeType)},
        ${J(e.originalWidth)},
        ${J(e.originalHeight)},
        ${J(e.originalSizeBytes)},
        ${a(e.hash)},
        '${o(e.variantType)}',
        '${o(e.storagePath)}',
        ${a(e.caption)},
        ${a(e.description)},
        ${a(e.tagsJson)},
        ${a(e.sourceType)},
        '${o(e.provenanceType)}',
        ${gt(e.addedByUser)},
        '${o(e.createdAt)}',
        '${o(e.updatedAt)}'
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
    `)}upsertItemSource(e){this.db.run(`
      INSERT INTO item_sources (id, item_type, item_id, report_id, source_section, source_sentence, source_excerpt, source_page_ref, source_paragraph_ref, created_at)
      VALUES (
        '${o(e.id)}',
        '${o(e.itemType)}',
        '${o(e.itemId)}',
        '${o(e.reportId)}',
        ${a(e.sourceSection)},
        ${a(e.sourceSentence)},
        ${a(e.sourceExcerpt)},
        ${a(e.sourcePageRef)},
        ${a(e.sourceParagraphRef)},
        '${o(e.createdAt)}'
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
    `)}upsertRelation(e){this.db.run(`
      INSERT INTO item_relations (id, from_item_type, from_item_id, relation_type, to_item_type, to_item_id, confidence_score, created_by, created_at)
      VALUES (
        '${o(e.id)}',
        '${o(e.fromItemType)}',
        '${o(e.fromItemId)}',
        '${o(e.relationType)}',
        '${o(e.toItemType)}',
        '${o(e.toItemId)}',
        ${J(e.confidenceScore)},
        '${o(e.createdBy)}',
        '${o(e.createdAt)}'
      )
      ON CONFLICT(id) DO UPDATE SET
        from_item_type = excluded.from_item_type,
        from_item_id = excluded.from_item_id,
        relation_type = excluded.relation_type,
        to_item_type = excluded.to_item_type,
        to_item_id = excluded.to_item_id,
        confidence_score = excluded.confidence_score,
        created_by = excluded.created_by
    `)}upsertItemImageLink(e){this.db.run(`
      INSERT INTO item_image_links (id, item_type, item_id, image_asset_id, display_order, link_role, created_at)
      VALUES (
        '${o(e.id)}',
        '${o(e.itemType)}',
        '${o(e.itemId)}',
        '${o(e.imageAssetId)}',
        ${e.displayOrder},
        ${a(e.linkRole)},
        '${o(e.createdAt)}'
      )
      ON CONFLICT(id) DO UPDATE SET
        item_type = excluded.item_type,
        item_id = excluded.item_id,
        image_asset_id = excluded.image_asset_id,
        display_order = excluded.display_order,
        link_role = excluded.link_role
    `)}}const X={schema_version:"1.1",pack_id:"system-geo-mini-library-v1",pack_name:"Built-in Geo Reference Mini Library",ownership:"system",source_report:{id:"system-report:geo-mini-library-v1",source_report_id:"system.geo.mini_library.v1",title:"Built-in Geo Reference Mini Library",project:"System Knowledge Library",discipline:"geotechnical",author:"Engineering Knowledge Vault",organization:"Engineering Knowledge Vault",date:"2026-03-18",file_name:"system-geo-mini-library-v1",notes:"First real system-owned geo reference content batch for controlled direct approved injection."},source_documents:[{id:"source:as1726-2017",source_report_id:"AS1726-2017",title:"Geotechnical Site Investigations",document_type:"standard",document_number:"AS 1726:2017",edition:"2017",jurisdiction:"AU",authority_level:"adopted_standard",document_status:"current",publisher:"Standards Australia",url:"https://store.standards.org.au/product/as-1726-2017",discipline:"geotechnical",organization:"Standards Australia",date:"2017-08-31",effective_date:"2017-08-31",reviewed_at:"2026-03-21",keywords:["site investigation","classification","reporting"],notes:"Primary Australian baseline for site investigation terminology and minimum investigation expectations."},{id:"source:qld-tmr-geotech-minreq-2024",source_report_id:"QLD.TMR.GEOTECH.MINREQ.2024",title:"Geotechnical Design Standard - Minimum Requirements",document_type:"manual",document_number:"TMR Geotechnical Design Standard",edition:"October 2024",jurisdiction:"QLD",authority_level:"agency_requirement",document_status:"current",publisher:"Department of Transport and Main Roads",url:"https://www.tmr.qld.gov.au/_/media/busind/techstdpubs/geotechnical/geotechdesignstandardminreq.pdf",discipline:"geotechnical",organization:"TMR Queensland",date:"2024-10-01",effective_date:"2024-10-01",reviewed_at:"2026-03-21",keywords:["minimum requirements","design","queensland"],notes:"Queensland transport owner-side minimum geotechnical design requirements."}],items:{words:[{id:"system-word:site-investigation",canonical_word:"site investigation",language_category:"geotechnical",english_definition:"Planned investigation to define ground conditions, risks, and design-relevant parameters.",example_sentence:"The scope of the site investigation should match the project stage and geotechnical risk.",source_ref:{source_document_id:"source:as1726-2017",section:"Purpose and scope",sentence:"Site investigation scope should match project risk and design needs."}}],phrases:[{id:"system-phrase:engineering-geological-model",canonical_phrase:"engineering geological model",phrase_type:"multiword_term",function_type:"definition",scenario_type:"design",explanation:"Ground model describing materials, structures, hazards, and their engineering relevance.",example_sentence:"Update the engineering geological model as new exposures become available.",source_ref:{source_document_id:"source:as1726-2017",section:"Interpretation and model development",sentence:"The engineering geological model should evolve with new investigation data."}}],sentences:[{id:"system-sentence:investigation-scope-risk-based",canonical_sentence:"Investigation effort should be proportionate to geotechnical complexity and consequence.",sentence_type:"recommendation_sentence",function_type:"recommendation",scenario_type:"design",chinese_natural:"勘察工作量应与岩土复杂性和后果等级相匹配。",section_name:"Investigation planning",source_ref:{source_document_id:"source:as1726-2017",section:"Planning investigations",sentence:"Investigation effort should reflect complexity and consequence."}}],geo_materials:[{id:"system-geo-material:fault-gouge",canonical_name:"fault gouge",geo_material_category:"infill_material",geo_material_subtype:"gouge",description:"Soft sheared infill along a fault plane.",source_ref:{section:"System Mini Library",sentence:"Fault gouge is included as a core weak infill material reference."}},{id:"system-geo-material:clay-infill",canonical_name:"clay infill",geo_material_category:"infill_material",geo_material_subtype:"clay_infill",description:"Clay-rich joint infill that can lower friction.",source_ref:{section:"System Mini Library",sentence:"Clay infill is included as a common discontinuity infill material."}},{id:"system-geo-material:highly-weathered-rock",canonical_name:"highly weathered rock",geo_material_category:"weathering_profile",geo_material_subtype:"highly_weathered_rock",description:"Rock mass with advanced weathering and reduced competence.",source_ref:{section:"System Mini Library",sentence:"Highly weathered rock is included as a weathering profile reference."}},{id:"system-geo-material:andesite",canonical_name:"andesite",geo_material_category:"rock",geo_material_subtype:"volcanic",description:"Volcanic rock type commonly encountered in excavation mapping.",source_ref:{section:"System Mini Library",sentence:"Andesite is included as a representative volcanic rock reference."}},{id:"system-geo-material:colluvium",canonical_name:"colluvium",geo_material_category:"soil",geo_material_subtype:"colluvium",description:"Loose slope-derived mixed soil and rock fragments.",source_ref:{section:"System Mini Library",sentence:"Colluvium is included as a common surficial soil material reference."}},{id:"system-geo-material:quartz-vein",canonical_name:"quartz vein",geo_material_category:"mineral",geo_material_subtype:"quartz",description:"Quartz-rich vein material along structural planes.",source_ref:{section:"System Batch 1",sentence:"Quartz vein is included as a high-value structural mineral reference."}},{id:"system-geo-material:calcite-infill",canonical_name:"calcite infill",geo_material_category:"infill_material",geo_material_subtype:"calcite_infill",description:"Calcite-filled discontinuity infill with variable hardness.",source_ref:{section:"System Batch 1",sentence:"Calcite infill is included as a common discontinuity infill variant."}},{id:"system-geo-material:oxidized-zone",canonical_name:"oxidized zone",geo_material_category:"alteration",geo_material_subtype:"oxidized",description:"Oxidized alteration zone often linked to weathered structure.",source_ref:{section:"System Batch 1",sentence:"Oxidized zone is included as an alteration indicator material."}},{id:"system-geo-material:residual-soil",canonical_name:"residual soil",geo_material_category:"soil",geo_material_subtype:"residual_soil",description:"In-situ weathering product soil over parent rock.",source_ref:{section:"System Batch 1",sentence:"Residual soil is included as a weathering-derived soil reference."}},{id:"system-geo-material:weathered-volcanics",canonical_name:"weathered volcanics",geo_material_category:"weathering_profile",geo_material_subtype:"highly_weathered_rock",description:"Highly weathered volcanic rock mass with reduced stand-up time.",source_ref:{section:"System Batch 1",sentence:"Weathered volcanics are included as a high-risk weathered rock reference."}}],geo_features:[{id:"system-geo-feature:detached-block",canonical_name:"detached block",geo_feature_category:"instability_feature",geo_feature_subtype:"detached_block",description:"Block separated by visible discontinuities and potential movement.",reporting_expressions:["Detached block observed with visible separation."],source_ref:{section:"System Mini Library",sentence:"Detached block is included as a key local instability feature."}},{id:"system-geo-feature:open-joint",canonical_name:"open joint",geo_feature_category:"discontinuity_condition",geo_feature_subtype:"open_joint",description:"Joint with visible aperture and limited interlock.",reporting_expressions:["Open joint noted with measurable aperture."],source_ref:{section:"System Mini Library",sentence:"Open joint is included as a core discontinuity condition feature."}},{id:"system-geo-feature:infilled-joint",canonical_name:"infilled joint",geo_feature_category:"discontinuity_condition",geo_feature_subtype:"infilled_joint",description:"Joint aperture partly or fully filled by softer material.",reporting_expressions:["Infilled joint observed along mapped plane."],source_ref:{section:"System Mini Library",sentence:"Infilled joint is included as a material-controlled joint condition feature."}},{id:"system-geo-feature:wedge",canonical_name:"wedge",geo_feature_category:"instability_feature",geo_feature_subtype:"wedge",description:"Rock wedge formed by intersecting discontinuities.",reporting_expressions:["Potential wedge formed by intersecting joints."],source_ref:{section:"System Mini Library",sentence:"Wedge is included as a representative kinematic instability feature."}},{id:"system-geo-feature:seepage",canonical_name:"seepage",geo_feature_category:"water_feature",geo_feature_subtype:"seepage",description:"Localized water ingress through joints or rock mass.",reporting_expressions:["Seepage observed on wall and crown."],source_ref:{section:"System Mini Library",sentence:"Seepage is included as a common groundwater-related feature."}},{id:"system-geo-feature:foliation-plane",canonical_name:"foliation plane",geo_feature_category:"structural_feature",geo_feature_subtype:"foliation",description:"Persistent foliation surface influencing anisotropic behavior.",reporting_expressions:["Foliation plane controls visible block shape and breakage."],source_ref:{section:"System Batch 1",sentence:"Foliation plane is included as a high-value structural control feature."}},{id:"system-geo-feature:bedding-plane",canonical_name:"bedding plane",geo_feature_category:"structural_feature",geo_feature_subtype:"bedding",description:"Bedding surface acting as potential release plane.",reporting_expressions:["Bedding plane daylights toward excavation."],source_ref:{section:"System Batch 1",sentence:"Bedding plane is included as a key stratigraphic structural feature."}},{id:"system-geo-feature:ravelling",canonical_name:"ravelling",geo_feature_category:"instability_feature",geo_feature_subtype:"ravelling",description:"Progressive small-piece loss from exposed ground surface.",reporting_expressions:["Ravelling observed from crown and shoulder."],source_ref:{section:"System Batch 1",sentence:"Ravelling is included as a progressive instability degradation feature."}},{id:"system-geo-feature:blast-damaged-zone",canonical_name:"blast damaged zone",geo_feature_category:"blasting_feature",geo_feature_subtype:"blast_damage",description:"Disturbed rock zone around excavation perimeter from blasting.",reporting_expressions:["Blast damaged zone mapped along perimeter."],source_ref:{section:"System Batch 1",sentence:"Blast damaged zone is included as a key excavation damage feature."}},{id:"system-geo-feature:scaling-hazard",canonical_name:"scaling hazard",geo_feature_category:"instability_feature",geo_feature_subtype:"scaling_hazard",description:"Loose surface rock likely to detach under vibration or disturbance.",reporting_expressions:["Scaling hazard identified above active access."],source_ref:{section:"System Batch 1",sentence:"Scaling hazard is included as an immediate loose-rock risk feature."}}],strategies:[{id:"system-strategy:hand-scaling",canonical_name:"hand scaling",strategy_category:"temporary_control",description:"Remove loose fragments from accessible surfaces.",steps_or_method:"Scale loose pieces from a protected position before reopening access.",source_ref:{section:"System Mini Library",sentence:"Hand scaling is included as a direct loose-rock control strategy."}},{id:"system-strategy:spot-bolting",canonical_name:"spot bolting",strategy_category:"temporary_control",description:"Install localized bolts at identified unstable blocks.",steps_or_method:"Target bolt locations where mapped structure indicates local instability.",source_ref:{section:"System Mini Library",sentence:"Spot bolting is included as a targeted local support strategy."}},{id:"system-strategy:mesh-installation",canonical_name:"mesh installation",strategy_category:"permanent_treatment",description:"Install mesh where distributed small block fallout risk exists.",steps_or_method:"Fix mesh with appropriate anchorage to retain small detached fragments.",source_ref:{section:"System Mini Library",sentence:"Mesh installation is included as a surface retention support strategy."}},{id:"system-strategy:re-inspection",canonical_name:"re-inspection",strategy_category:"monitoring_requirement",description:"Repeat inspection after change triggers such as rain or blasting.",steps_or_method:"Recheck mapped areas at defined intervals and after triggering events.",source_ref:{section:"System Mini Library",sentence:"Re-inspection is included as a follow-up monitoring strategy."}},{id:"system-strategy:exclusion-zone",canonical_name:"exclusion zone",strategy_category:"temporary_control",description:"Restrict access below identified instability hazard areas.",steps_or_method:"Mark and enforce no-entry boundary until risk controls are complete.",source_ref:{section:"System Mini Library",sentence:"Exclusion zone is included as an immediate exposure-control strategy."}},{id:"system-strategy:shotcrete-extension",canonical_name:"shotcrete extension",strategy_category:"permanent_treatment",description:"Extend shotcrete coverage over newly loosened or weathered surfaces.",steps_or_method:"Apply additional coverage where mapping confirms unsupported deteriorated ground.",source_ref:{section:"System Batch 1",sentence:"Shotcrete extension is included as a support continuity treatment strategy."}},{id:"system-strategy:detailed-mapping",canonical_name:"detailed mapping",strategy_category:"identification_method",description:"Perform detailed structural and condition mapping before treatment updates.",steps_or_method:"Capture orientation, persistence, condition, and controlling discontinuity sets.",source_ref:{section:"System Batch 1",sentence:"Detailed mapping is included as a first-pass structural decision strategy."}},{id:"system-strategy:support-upgrade",canonical_name:"support upgrade",strategy_category:"permanent_treatment",description:"Increase support level where existing controls are insufficient.",steps_or_method:"Upgrade support pattern and elements after reassessment of instability demand.",source_ref:{section:"System Batch 1",sentence:"Support upgrade is included as a response to escalating instability risk."}}],requirements:[{id:"system-requirement:tmr-geotech-baseline",canonical_name:"meet minimum geotechnical design requirements",requirement_category:"design_requirement",jurisdiction:"QLD",authority_level:"agency_requirement",clause_reference:"Minimum Requirements",requirement_text:"Geotechnical deliverables must satisfy the owner minimum requirements for investigation, interpretation, design inputs, and documentation.",plain_language_summary:"Do not treat owner geotechnical requirements as optional background reading.",why_it_matters:"Owner acceptance and downstream design quality both depend on a complete minimum-requirements baseline.",verification_method:"Check deliverables against the minimum-requirements checklist before issue.",tags:["queensland","design","compliance"],source_ref:{source_document_id:"source:qld-tmr-geotech-minreq-2024",section:"Minimum requirements",sentence:"Deliverables are expected to meet the published minimum requirements."}}],methods:[{id:"system-method:ground-model-update-cycle",canonical_name:"ground model update cycle",method_category:"analysis_method",jurisdiction:"AU",authority_level:"adopted_standard",purpose:"Keep the working ground model aligned with newly exposed and tested conditions.",procedure_summary:"Review new investigation results, revise interpreted units and structures, then update risks and design implications.",inputs_or_prerequisites:"Current investigation data, mapped exposures, and existing model assumptions.",outputs_or_results:"Revised ground model and updated design/reporting assumptions.",limitations:"Model quality is constrained by data density and interpretation quality.",tags:["ground-model","interpretation","update"],source_ref:{source_document_id:"source:as1726-2017",section:"Interpretation and model development",sentence:"Interpretation should be refined as new information becomes available."}}]},relations:[{id:"system-relation:infilled-joint-to-clay-infill",from_item_type:"geo_feature",from_item_id:"system-geo-feature:infilled-joint",relation_type:"related_material",to_item_type:"geo_material",to_item_id:"system-geo-material:clay-infill",confidence_score:.9},{id:"system-relation:infilled-joint-to-calcite-infill",from_item_type:"geo_feature",from_item_id:"system-geo-feature:infilled-joint",relation_type:"related_material",to_item_type:"geo_material",to_item_id:"system-geo-material:calcite-infill",confidence_score:.8},{id:"system-relation:foliation-plane-to-quartz-vein",from_item_type:"geo_feature",from_item_id:"system-geo-feature:foliation-plane",relation_type:"related_material",to_item_type:"geo_material",to_item_id:"system-geo-material:quartz-vein",confidence_score:.7},{id:"system-relation:ravelling-to-weathered-volcanics",from_item_type:"geo_feature",from_item_id:"system-geo-feature:ravelling",relation_type:"related_material",to_item_type:"geo_material",to_item_id:"system-geo-material:weathered-volcanics",confidence_score:.75},{id:"system-relation:blast-damaged-zone-to-weathered-volcanics",from_item_type:"geo_feature",from_item_id:"system-geo-feature:blast-damaged-zone",relation_type:"related_material",to_item_type:"geo_material",to_item_id:"system-geo-material:weathered-volcanics",confidence_score:.7},{id:"system-relation:detached-block-to-hand-scaling",from_item_type:"geo_feature",from_item_id:"system-geo-feature:detached-block",relation_type:"recommended_strategy",to_item_type:"strategy",to_item_id:"system-strategy:hand-scaling",confidence_score:.9},{id:"system-relation:open-joint-to-spot-bolting",from_item_type:"geo_feature",from_item_id:"system-geo-feature:open-joint",relation_type:"recommended_strategy",to_item_type:"strategy",to_item_id:"system-strategy:spot-bolting",confidence_score:.8},{id:"system-relation:wedge-to-mesh-installation",from_item_type:"geo_feature",from_item_id:"system-geo-feature:wedge",relation_type:"recommended_strategy",to_item_type:"strategy",to_item_id:"system-strategy:mesh-installation",confidence_score:.8},{id:"system-relation:seepage-to-re-inspection",from_item_type:"geo_feature",from_item_id:"system-geo-feature:seepage",relation_type:"recommended_strategy",to_item_type:"strategy",to_item_id:"system-strategy:re-inspection",confidence_score:.8},{id:"system-relation:detached-block-to-exclusion-zone",from_item_type:"geo_feature",from_item_id:"system-geo-feature:detached-block",relation_type:"recommended_strategy",to_item_type:"strategy",to_item_id:"system-strategy:exclusion-zone",confidence_score:.85},{id:"system-relation:scaling-hazard-to-hand-scaling",from_item_type:"geo_feature",from_item_id:"system-geo-feature:scaling-hazard",relation_type:"recommended_strategy",to_item_type:"strategy",to_item_id:"system-strategy:hand-scaling",confidence_score:.88},{id:"system-relation:ravelling-to-shotcrete-extension",from_item_type:"geo_feature",from_item_id:"system-geo-feature:ravelling",relation_type:"recommended_strategy",to_item_type:"strategy",to_item_id:"system-strategy:shotcrete-extension",confidence_score:.8},{id:"system-relation:blast-damaged-zone-to-support-upgrade",from_item_type:"geo_feature",from_item_id:"system-geo-feature:blast-damaged-zone",relation_type:"recommended_strategy",to_item_type:"strategy",to_item_id:"system-strategy:support-upgrade",confidence_score:.82},{id:"system-relation:foliation-plane-to-detailed-mapping",from_item_type:"geo_feature",from_item_id:"system-geo-feature:foliation-plane",relation_type:"recommended_strategy",to_item_type:"strategy",to_item_id:"system-strategy:detailed-mapping",confidence_score:.9},{id:"system-relation:bedding-plane-to-detailed-mapping",from_item_type:"geo_feature",from_item_id:"system-geo-feature:bedding-plane",relation_type:"recommended_strategy",to_item_type:"strategy",to_item_id:"system-strategy:detailed-mapping",confidence_score:.88}],images:[]},ue=[{id:X.pack_id,packName:X.pack_name,description:"Trusted built-in geo reference content batch for direct approved system injection.",rawJson:JSON.stringify(X,null,2),createImageFiles(){return new Map}}];function ce(d){const e=ue.find(l=>l.id===d);if(!e)throw new Error(`Unknown bundled system knowledge pack: ${d}`);return e}const H="1.1",v=s().min(1).regex(/^[a-zA-Z0-9._:-]+$/),ht=f(Ze.filter(d=>d!=="image"&&d!=="report")),ft=f(st),vt=f(at),xt=f(nt),bt=f(it),St=f(tt),jt=f(lt),wt=f(dt),pe=f(ot),_e=f(rt),kt=f(ct),$t=f(et),Tt=f(Xe),te=f(Ye),It=f(mt),Nt=f(ut),At=f(Qe),Rt=f(pt),P=j({source_document_id:v.optional(),section:s().min(1),sentence:s().min(1),excerpt:s().optional(),paragraph:s().optional(),page:s().optional()}),zt=j({id:v,source_report_id:v,title:s().min(1),document_type:It,document_number:s().optional(),edition:s().optional(),jurisdiction:s().optional(),authority_level:te.optional(),document_status:Nt.optional(),publisher:s().optional(),url:s().url().optional(),project:s().optional(),discipline:s().optional(),author:s().optional(),organization:s().optional(),date:s().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),effective_date:s().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),reviewed_at:s().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),keywords:b(s()).default([]),notes:s().optional()}),Ct=j({id:v,canonical_word:s().min(1),lemma:s().optional(),part_of_speech:s().optional(),language_category:jt.optional(),chinese_meaning:s().optional(),english_definition:s().optional(),example_sentence:s().optional(),source_ref:P}),Lt=j({id:v,canonical_phrase:s().min(1),phrase_type:wt.optional(),function_type:pe.optional(),scenario_type:_e.optional(),chinese_meaning:s().optional(),explanation:s().optional(),example_sentence:s().optional(),source_ref:P}),Et=j({id:v,canonical_sentence:s().min(1),sentence_type:kt.optional(),function_type:pe.optional(),scenario_type:_e.optional(),chinese_literal:s().optional(),chinese_natural:s().optional(),section_name:s().optional(),source_ref:P}),Pt=j({id:v,canonical_name:s().min(1),chinese_name:s().optional(),geo_material_category:ft.optional(),geo_material_subtype:vt.optional(),description:s().optional(),identification_method:s().optional(),distinguishing_points:s().optional(),common_misidentifications:s().optional(),engineering_significance:s().optional(),common_risks:s().optional(),common_treatments:s().optional(),australia_context:s().optional(),source_ref:P}),Ot=j({id:v,canonical_name:s().min(1),chinese_name:s().optional(),geo_feature_category:xt.optional(),geo_feature_subtype:bt.optional(),description:s().optional(),identification_method:s().optional(),distinguishing_points:s().optional(),common_causes:s().optional(),risk_implications:s().optional(),treatment_or_mitigation:s().optional(),reporting_expressions:b(s()).default([]),inspection_points:s().optional(),source_ref:P}),Bt=j({id:v,canonical_name:s().min(1),chinese_name:s().optional(),strategy_category:St.optional(),description:s().optional(),steps_or_method:s().optional(),application_conditions:s().optional(),limitations:s().optional(),linked_reporting_expression:s().optional(),monitoring_notes:s().optional(),source_ref:P}),Mt=j({id:v,canonical_name:s().min(1),requirement_category:$t.optional(),jurisdiction:s().optional(),authority_level:te.optional(),clause_reference:s().optional(),requirement_text:s().min(1),plain_language_summary:s().optional(),why_it_matters:s().optional(),trigger_conditions:s().optional(),verification_method:s().optional(),tags:b(s()).default([]),source_ref:P}),qt=j({id:v,canonical_name:s().min(1),method_category:Tt.optional(),jurisdiction:s().optional(),authority_level:te.optional(),purpose:s().optional(),procedure_summary:s().optional(),inputs_or_prerequisites:s().optional(),outputs_or_results:s().optional(),limitations:s().optional(),tags:b(s()).default([]),source_ref:P}),Dt=j({item_type:f(["geo_material","geo_feature","strategy"]),item_id:v,link_role:Rt.optional()}),Ut=j({id:v,file_name:s().min(1),caption:s().optional(),description:s().optional(),tags:b(s()).default([]),source_type:At.optional(),linked_items:b(Dt).default([])}),Ft=j({id:v,from_item_type:f(["geo_material","geo_feature","strategy"]),from_item_id:v,relation_type:s().min(1),to_item_type:ht,to_item_id:v,confidence_score:_t().min(0).max(1).optional()}),de=j({schema_version:oe(H),pack_id:v,pack_name:s().min(1),ownership:oe("system"),source_report:j({id:v,source_report_id:v,title:s().min(1),project:s().min(1),discipline:s().min(1),author:s().min(1),organization:s().min(1),date:s().regex(/^\d{4}-\d{2}-\d{2}$/),file_name:s().min(1),notes:s().optional()}),source_documents:b(zt).default([]),items:j({words:b(Ct).default([]),phrases:b(Lt).default([]),sentences:b(Et).default([]),geo_materials:b(Pt).default([]),geo_features:b(Ot).default([]),strategies:b(Bt).default([]),requirements:b(Mt).default([]),methods:b(qt).default([])}),relations:b(Ft).default([]),images:b(Ut).default([])}).superRefine((d,e)=>{const l=new Set,m=new Set,p=new Set(d.source_documents.map(n=>n.id));for(const n of d.source_documents)l.has(n.id)&&e.addIssue({code:C.custom,message:`Duplicate source document id: ${n.id}`}),l.add(n.id);for(const n of[...d.items.words,...d.items.phrases,...d.items.sentences,...d.items.geo_materials,...d.items.geo_features,...d.items.strategies,...d.items.requirements,...d.items.methods])l.has(n.id)&&e.addIssue({code:C.custom,message:`Duplicate system item id: ${n.id}`}),l.add(n.id),m.add(n.id),n.source_ref.source_document_id&&!p.has(n.source_ref.source_document_id)&&e.addIssue({code:C.custom,message:`Item ${n.id} references missing source document ${n.source_ref.source_document_id}`});for(const n of d.images){l.has(n.id)&&e.addIssue({code:C.custom,message:`Duplicate system image id: ${n.id}`}),l.add(n.id);for(const N of n.linked_items)m.has(N.item_id)||e.addIssue({code:C.custom,message:`System image ${n.id} links to missing pack item ${N.item_id}`})}for(const n of d.relations)l.has(n.id)&&e.addIssue({code:C.custom,message:`Duplicate system relation id: ${n.id}`}),l.add(n.id),m.has(n.from_item_id)||e.addIssue({code:C.custom,message:`Relation ${n.id} references missing source item ${n.from_item_id}`}),m.has(n.to_item_id)||e.addIssue({code:C.custom,message:`Relation ${n.id} references missing target item ${n.to_item_id}`})});class Vt{validate(e){try{const l=JSON.parse(e),m=de.safeParse(l);return m.success?{state:"valid",errors:[],warnings:[],supportedSchemaVersion:H}:{state:"invalid",errors:m.error.issues.map(p=>p.message),warnings:[],supportedSchemaVersion:H}}catch(l){return{state:"invalid",errors:[l instanceof Error?l.message:"System knowledge pack could not be parsed."],warnings:[],supportedSchemaVersion:H}}}parse(e){return de.parse(JSON.parse(e))}}class Kt extends Error{constructor(e){super(e.errors[0]??"System knowledge injection failed."),this.validationReport=e,this.name="SystemKnowledgeInjectionError"}}function Wt(){return new Date().toISOString()}function L(d){return d.trim().replace(/\s+/g," ").toLowerCase()}function le(d){const e=(d??"").trim().toLowerCase();let l=0;for(let m=0;m<e.length;m+=1)l=l*31+e.charCodeAt(m)>>>0;return l.toString(16).padStart(8,"0")}function E(d,e,l,m,p){return`system-source:${d}:${e}:${l}:${le(m)}:${le(p)}`}function Gt(d,e){return`system-image:${d}:${e}`}function Jt(d,e,l,m){return`system-image-link:${d}:${e}:${l}:${m??"source_image"}`}async function Ht(d){const e=await d.arrayBuffer(),l=await crypto.subtle.digest("SHA-256",e);return Array.from(new Uint8Array(l)).map(m=>m.toString(16).padStart(2,"0")).join("")}class Qt{constructor(e){B(this,"validationService");B(this,"backupService");B(this,"imagePipeline");B(this,"imageStorageService");B(this,"performanceService");B(this,"pendingVariantBlobs",new Map);this.validationService=(e==null?void 0:e.validationService)??new Vt,this.backupService=(e==null?void 0:e.backupService)??new me,this.imagePipeline=(e==null?void 0:e.imagePipeline)??new Ge,this.imageStorageService=(e==null?void 0:e.imageStorageService)??new Je,this.performanceService=(e==null?void 0:e.performanceService)??new He}validate(e){return this.validationService.validate(e)}async inject(e,l,m=new Map){return this.performanceService.measure("commit",{mode:"system_knowledge_injection"},async()=>{const p=this.validate(l);if(p.state==="invalid")throw new Kt(p);const n=this.validationService.parse(l);this.pendingVariantBlobs.clear();const N=await this.backupService.createPreSystemInjectionSnapshot(e),$=await this.prepareImages(n,m),T=new Map,u=new yt(e),_=Wt();try{e.exec("BEGIN TRANSACTION;");try{u.upsertReport({id:n.source_report.id,sourceReportId:n.source_report.source_report_id,title:n.source_report.title,documentType:"reference_pack",project:n.source_report.project,discipline:n.source_report.discipline,reportDate:n.source_report.date,sourceType:"system_knowledge_pack",author:n.source_report.author,organization:n.source_report.organization,summary:n.source_report.notes,createdAt:_,updatedAt:_});for(const t of n.source_documents)u.upsertReport({id:t.id,sourceReportId:t.source_report_id,title:t.title,documentType:t.document_type,documentNumber:t.document_number,edition:t.edition,jurisdiction:t.jurisdiction,authorityLevel:t.authority_level,documentStatus:t.document_status,publisher:t.publisher,sourceUrl:t.url,project:t.project,discipline:t.discipline,reportDate:t.date,effectiveDate:t.effective_date,sourceType:"system_source_register",author:t.author,organization:t.organization,keywordsJson:t.keywords.length>0?JSON.stringify(t.keywords):void 0,summary:t.notes,reviewedAt:t.reviewed_at,createdAt:_,updatedAt:_});for(const t of n.items.words)u.upsertWord({id:t.id,canonicalWord:t.canonical_word,normalizedWord:L(t.canonical_word),lemma:t.lemma,partOfSpeech:t.part_of_speech,languageCategory:t.language_category,chineseMeaning:t.chinese_meaning,englishDefinition:t.english_definition,provenanceType:"system_generated",firstAddedAt:_,updatedAt:_}),u.upsertItemSource({id:E("word",t.id,t.source_ref.source_document_id??n.source_report.id,t.source_ref.section,t.source_ref.sentence),itemType:"word",itemId:t.id,reportId:t.source_ref.source_document_id??n.source_report.id,sourceSection:t.source_ref.section,sourceSentence:t.source_ref.sentence,sourceExcerpt:t.source_ref.excerpt,sourcePageRef:t.source_ref.page,sourceParagraphRef:t.source_ref.paragraph,createdAt:_});for(const t of n.items.phrases)u.upsertPhrase({id:t.id,canonicalPhrase:t.canonical_phrase,normalizedPhrase:L(t.canonical_phrase),phraseType:t.phrase_type,functionType:t.function_type,scenarioType:t.scenario_type,chineseMeaning:t.chinese_meaning,explanation:t.explanation,provenanceType:"system_generated",firstAddedAt:_,updatedAt:_}),u.upsertItemSource({id:E("phrase",t.id,t.source_ref.source_document_id??n.source_report.id,t.source_ref.section,t.source_ref.sentence),itemType:"phrase",itemId:t.id,reportId:t.source_ref.source_document_id??n.source_report.id,sourceSection:t.source_ref.section,sourceSentence:t.source_ref.sentence,sourceExcerpt:t.source_ref.excerpt,sourcePageRef:t.source_ref.page,sourceParagraphRef:t.source_ref.paragraph,createdAt:_});for(const t of n.items.sentences)u.upsertSentence({id:t.id,canonicalSentence:t.canonical_sentence,normalizedSentence:L(t.canonical_sentence),sentenceType:t.sentence_type,functionType:t.function_type,scenarioType:t.scenario_type,chineseLiteral:t.chinese_literal,chineseNatural:t.chinese_natural,sectionName:t.section_name,provenanceType:"system_generated",firstAddedAt:_,updatedAt:_}),u.upsertItemSource({id:E("sentence",t.id,t.source_ref.source_document_id??n.source_report.id,t.source_ref.section,t.source_ref.sentence),itemType:"sentence",itemId:t.id,reportId:t.source_ref.source_document_id??n.source_report.id,sourceSection:t.source_ref.section,sourceSentence:t.source_ref.sentence,sourceExcerpt:t.source_ref.excerpt,sourcePageRef:t.source_ref.page,sourceParagraphRef:t.source_ref.paragraph,createdAt:_});for(const t of n.items.geo_materials)u.upsertGeoMaterial({id:t.id,canonicalName:t.canonical_name,normalizedName:L(t.canonical_name),chineseName:t.chinese_name,category:t.geo_material_category,subtype:t.geo_material_subtype,description:t.description,identificationMethod:t.identification_method,distinguishingPoints:t.distinguishing_points,commonMisidentifications:t.common_misidentifications,engineeringSignificance:t.engineering_significance,commonRisks:t.common_risks,commonTreatments:t.common_treatments,australiaContext:t.australia_context,provenanceType:"system_generated",firstAddedAt:_,updatedAt:_}),u.upsertItemSource({id:E("geo_material",t.id,t.source_ref.source_document_id??n.source_report.id,t.source_ref.section,t.source_ref.sentence),itemType:"geo_material",itemId:t.id,reportId:t.source_ref.source_document_id??n.source_report.id,sourceSection:t.source_ref.section,sourceSentence:t.source_ref.sentence,sourceExcerpt:t.source_ref.excerpt,sourcePageRef:t.source_ref.page,sourceParagraphRef:t.source_ref.paragraph,createdAt:_});for(const t of n.items.geo_features)u.upsertGeoFeature({id:t.id,canonicalName:t.canonical_name,normalizedName:L(t.canonical_name),chineseName:t.chinese_name,category:t.geo_feature_category,subtype:t.geo_feature_subtype,description:t.description,identificationMethod:t.identification_method,distinguishingPoints:t.distinguishing_points,commonCauses:t.common_causes,riskImplications:t.risk_implications,treatmentOrMitigation:t.treatment_or_mitigation,reportingExpressions:t.reporting_expressions.length>0?JSON.stringify(t.reporting_expressions):void 0,inspectionPoints:t.inspection_points,provenanceType:"system_generated",firstAddedAt:_,updatedAt:_}),u.upsertItemSource({id:E("geo_feature",t.id,t.source_ref.source_document_id??n.source_report.id,t.source_ref.section,t.source_ref.sentence),itemType:"geo_feature",itemId:t.id,reportId:t.source_ref.source_document_id??n.source_report.id,sourceSection:t.source_ref.section,sourceSentence:t.source_ref.sentence,sourceExcerpt:t.source_ref.excerpt,sourcePageRef:t.source_ref.page,sourceParagraphRef:t.source_ref.paragraph,createdAt:_});for(const t of n.items.strategies)u.upsertStrategy({id:t.id,canonicalName:t.canonical_name,normalizedName:L(t.canonical_name),chineseName:t.chinese_name,strategyCategory:t.strategy_category,description:t.description,stepsOrMethod:t.steps_or_method,applicationConditions:t.application_conditions,limitations:t.limitations,linkedReportingExpression:t.linked_reporting_expression,monitoringNotes:t.monitoring_notes,provenanceType:"system_generated",firstAddedAt:_,updatedAt:_}),u.upsertItemSource({id:E("strategy",t.id,t.source_ref.source_document_id??n.source_report.id,t.source_ref.section,t.source_ref.sentence),itemType:"strategy",itemId:t.id,reportId:t.source_ref.source_document_id??n.source_report.id,sourceSection:t.source_ref.section,sourceSentence:t.source_ref.sentence,sourceExcerpt:t.source_ref.excerpt,sourcePageRef:t.source_ref.page,sourceParagraphRef:t.source_ref.paragraph,createdAt:_});for(const t of n.items.requirements)u.upsertRequirement({id:t.id,sourceDocumentId:t.source_ref.source_document_id,canonicalName:t.canonical_name,normalizedName:L(t.canonical_name),requirementCategory:t.requirement_category,jurisdiction:t.jurisdiction,authorityLevel:t.authority_level,clauseReference:t.clause_reference,requirementText:t.requirement_text,plainLanguageSummary:t.plain_language_summary,whyItMatters:t.why_it_matters,triggerConditions:t.trigger_conditions,verificationMethod:t.verification_method,tagsJson:t.tags.length>0?JSON.stringify(t.tags):void 0,provenanceType:"system_generated",firstAddedAt:_,updatedAt:_}),u.upsertItemSource({id:E("requirement",t.id,t.source_ref.source_document_id??n.source_report.id,t.source_ref.section,t.source_ref.sentence),itemType:"requirement",itemId:t.id,reportId:t.source_ref.source_document_id??n.source_report.id,sourceSection:t.source_ref.section,sourceSentence:t.source_ref.sentence,sourceExcerpt:t.source_ref.excerpt,sourcePageRef:t.source_ref.page,sourceParagraphRef:t.source_ref.paragraph,createdAt:_});for(const t of n.items.methods)u.upsertMethod({id:t.id,sourceDocumentId:t.source_ref.source_document_id,canonicalName:t.canonical_name,normalizedName:L(t.canonical_name),methodCategory:t.method_category,jurisdiction:t.jurisdiction,authorityLevel:t.authority_level,purpose:t.purpose,procedureSummary:t.procedure_summary,inputsOrPrerequisites:t.inputs_or_prerequisites,outputsOrResults:t.outputs_or_results,limitations:t.limitations,tagsJson:t.tags.length>0?JSON.stringify(t.tags):void 0,provenanceType:"system_generated",firstAddedAt:_,updatedAt:_}),u.upsertItemSource({id:E("method",t.id,t.source_ref.source_document_id??n.source_report.id,t.source_ref.section,t.source_ref.sentence),itemType:"method",itemId:t.id,reportId:t.source_ref.source_document_id??n.source_report.id,sourceSection:t.source_ref.section,sourceSentence:t.source_ref.sentence,sourceExcerpt:t.source_ref.excerpt,sourcePageRef:t.source_ref.page,sourceParagraphRef:t.source_ref.paragraph,createdAt:_});for(const t of n.relations)u.upsertRelation({id:t.id,fromItemType:t.from_item_type,fromItemId:t.from_item_id,relationType:t.relation_type,toItemType:t.to_item_type,toItemId:t.to_item_id,confidenceScore:t.confidence_score,createdBy:"system",createdAt:_});for(const t of $){for(const y of t.variants)await this.persistPreparedVariant(n.pack_id,t.imageId,y,T),u.upsertImage({id:y.rowId,assetGroupId:t.imageId,fileName:t.fileName,mimeType:y.mimeType,originalWidth:y.width,originalHeight:y.height,originalSizeBytes:y.sizeBytes,hash:t.hash,variantType:y.variant,storagePath:y.storageKey,caption:t.caption,description:t.description,tagsJson:t.tagsJson,sourceType:t.sourceType,provenanceType:"system_generated",addedByUser:!1,createdAt:_,updatedAt:_});const g=t.variants.find(y=>y.variant==="standard")??t.variants[0];for(const y of t.linkedItems)u.upsertItemImageLink({id:Jt(y.itemType,y.itemId,t.imageId,y.linkRole),itemType:y.itemType,itemId:y.itemId,imageAssetId:g.rowId,displayOrder:0,linkRole:y.linkRole??"source_image",createdAt:_})}e.exec("COMMIT;")}catch(t){throw e.exec("ROLLBACK;"),t}}catch(t){throw await this.restoreTouchedBlobs(T),this.pendingVariantBlobs.clear(),t}return this.pendingVariantBlobs.clear(),await Ce(e),{packId:n.pack_id,reportId:n.source_report.id,snapshotRecord:N,injected:{sourceDocuments:n.source_documents.length,words:n.items.words.length,phrases:n.items.phrases.length,sentences:n.items.sentences.length,geoMaterials:n.items.geo_materials.length,geoFeatures:n.items.geo_features.length,strategies:n.items.strategies.length,requirements:n.items.requirements.length,methods:n.items.methods.length,images:$.reduce((t,g)=>t+g.variants.length,0),itemSources:n.items.words.length+n.items.phrases.length+n.items.sentences.length+n.items.geo_materials.length+n.items.geo_features.length+n.items.strategies.length+n.items.requirements.length+n.items.methods.length,itemRelations:n.relations.length,itemImageLinks:$.reduce((t,g)=>t+g.linkedItems.length,0)},validationReport:p}})}async prepareImages(e,l){const m=[];for(const p of e.images){const n=l.get(p.file_name);if(!n)throw new Error(`Missing system image file: ${p.file_name}`);const N=await this.imagePipeline.process({id:p.id,fileName:p.file_name,mimeType:n.type||"image/jpeg",blob:n},!1),$=await Ht(n),T=N.variants.filter(u=>u.variant==="thumbnail"||u.variant==="standard").map(u=>({rowId:Gt(p.id,u.variant),storageKey:`image:system:${e.pack_id}:${p.id}:${u.variant}`,variant:u.variant,mimeType:u.mimeType,width:u.width,height:u.height,sizeBytes:u.blob.size,blob:u.blob}));if(T.length===0)throw new Error(`No approved image variants were generated for ${p.file_name}.`);m.push({imageId:p.id,fileName:p.file_name,hash:$,caption:p.caption,description:p.description,tagsJson:p.tags.length>0?JSON.stringify(p.tags):void 0,sourceType:p.source_type??"imported_from_pack",linkedItems:p.linked_items.map(u=>({itemType:u.item_type,itemId:u.item_id,linkRole:u.link_role})),variants:T.map(({blob:u,..._})=>_)});for(const u of T)this.pendingVariantBlobs.set(u.storageKey,u.blob)}return m}async persistPreparedVariant(e,l,m,p){const n=this.pendingVariantBlobs.get(m.storageKey);if(!n)throw new Error(`Missing prepared variant blob for ${m.storageKey}`);p.has(m.storageKey)||p.set(m.storageKey,await Le(m.storageKey)),await this.imageStorageService.saveVariant(`system:${e}`,l,m.variant,n,m.mimeType,m.width,m.height)}async restoreTouchedBlobs(e){for(const[l,m]of e.entries())m?await Ee(l,m):await Pe(l)}}class Zt{constructor(e=new Qt){this.injectionService=e}listTrustedPacks(){return ue.map(e=>({id:e.id,packName:e.packName,description:e.description}))}validateTrustedPack(e){const l=ce(e);return{packId:l.id,packName:l.packName,validationReport:this.injectionService.validate(l.rawJson)}}async injectTrustedPack(e,l){const m=ce(l),p=this.injectionService.validate(m.rawJson);if(p.state==="invalid"){const N=p.errors[0]??"Bundled system knowledge pack validation failed.";throw new Error(N)}const n=await this.injectionService.inject(e,m.rawJson,m.createImageFiles());return{packId:m.id,packName:m.packName,validationReport:p,snapshotCreated:!0,snapshotName:n.snapshotRecord.snapshotName,injection:n}}}function M(d){return i.jsx("ul",{style:{margin:"0.5rem 0 0",paddingLeft:"1.25rem"},children:Object.entries(d).map(([e,l])=>i.jsxs("li",{children:[e,": ",l]},e))})}function ee(d){return d<1024?`${d} B`:d<1024*1024?`${(d/1024).toFixed(1)} KB`:`${(d/(1024*1024)).toFixed(2)} MB`}function Yt(d){return d.split("_").map(e=>e.charAt(0).toUpperCase()+e.slice(1)).join(" ")}function Xt(d){if(!d)return"unknown";const e=d.match(/(v\d+(?:\.\d+)*)$/i);return e?e[1]:"derived-from-id"}function ei(d){switch(d){case"validation_failed":return"Blocked by validation";case"validation_passed":return"Ready to apply";case"applying":return"Applying trusted pack";case"apply_failed":return"Injection failed";case"applied":return"Injection succeeded";default:return"Not run"}}const ti=["fault gouge","clay infill","quartz vein","detached block","foliation plane","ravelling"];function _i(){const{db:d,schemaVersion:e}=Oe(),[l,m]=x.useState([]),[p,n]=x.useState(),[N,$]=x.useState(),[T,u]=x.useState(),[_,t]=x.useState(),[g,y]=x.useState(),[c,ge]=x.useState(),[R,Q]=x.useState(),[S,Z]=x.useState(),[D,A]=x.useState("idle"),[ie,O]=x.useState(),[I,w]=x.useState(!1),[ye,he]=x.useState(!1),V=new me,fe=new We,K=new Zt,h=K.listTrustedPacks()[0],[ve,ne]=x.useState(navigator.onLine),[xe,be]=x.useState(!!(navigator.serviceWorker&&navigator.serviceWorker.controller));x.useEffect(()=>{const r=()=>ne(!0),k=()=>ne(!1),z=()=>be(!!(navigator.serviceWorker&&navigator.serviceWorker.controller));return window.addEventListener("online",r),window.addEventListener("offline",k),"serviceWorker"in navigator&&navigator.serviceWorker.addEventListener("controllerchange",z),()=>{window.removeEventListener("online",r),window.removeEventListener("offline",k),"serviceWorker"in navigator&&navigator.serviceWorker.removeEventListener("controllerchange",z)}},[]);async function Y(){m(await V.listSnapshots(d))}async function W(r=!1){ge(await fe.loadDiagnostics(d,r))}x.useEffect(()=>{Y(),W(!1)},[d]);function q(){n(void 0),$(void 0)}function Se(){Z(void 0),O(void 0),A("idle")}async function je(){if(!I){w(!0),q();try{const r=await V.exportFullBackup(d),k=URL.createObjectURL(r.blob),z=document.createElement("a");z.href=k,z.download=r.fileName,z.click(),setTimeout(()=>URL.revokeObjectURL(k),2e3),u(r.manifest),n(`Full backup exported: ${r.fileName}`),await Y(),await W(!1)}catch(r){$(r instanceof Error?r.message:"Backup export failed.")}finally{w(!1)}}}async function we(r){var z;if(I)return;w(!0),q();const k=(z=r.target.files)==null?void 0:z[0];if(t(k),y(void 0),!k){w(!1);return}try{const U=await V.previewRestore(k);y(U),U.state==="invalid"&&$("Restore preview failed. Review the validation errors below.")}catch(U){$(U instanceof Error?U.message:"Restore preview failed.")}finally{w(!1)}}async function ke(){if(!I){if(w(!0),q(),!_){$("Select a backup ZIP file first."),w(!1);return}if(!g||g.state==="invalid"){$("Restore preview must be valid before replace restore can run."),w(!1);return}try{const r=await V.restoreFullReplace(d,_);n(`Restore completed from ${_.name}. Pre-restore snapshot: ${r.snapshotRecord.snapshotName}. Reloading app...`),setTimeout(()=>window.location.reload(),1200)}catch(r){$(r instanceof Error?r.message:"Restore failed.")}finally{w(!1)}}}async function $e(){if(!I){w(!0),q();try{await W(!0),n("Integrity checks completed.")}catch(r){$(r instanceof Error?r.message:"Integrity check failed.")}finally{w(!1)}}}async function Te(){if(!I){w(!0),q(),Se(),Q(void 0);try{if(!h){O("No trusted bundled system knowledge pack is configured."),A("validation_failed");return}const r=K.validateTrustedPack(h.id);if(Q(r),r.validationReport.state==="invalid"){A("validation_failed");return}A("validation_passed")}catch(r){A("validation_failed"),O(r instanceof Error?r.message:"System knowledge validation failed.")}finally{w(!1)}}}async function Ie(){if(!I){w(!0),q(),Z(void 0),O(void 0);try{if(!h){O("No trusted bundled system knowledge pack is configured."),A("apply_failed");return}const r=K.validateTrustedPack(h.id);if(Q(r),r.validationReport.state==="invalid"){A("validation_failed"),O("Built-in pack validation failed. Injection was not run.");return}A("applying");const k=await K.injectTrustedPack(d,h.id);Z(k),A("applied"),n(`System knowledge injected: ${k.packName}. Snapshot created: ${k.snapshotName}.`),await Y(),await W(!1)}catch(r){A("apply_failed"),O(r instanceof Error?r.message:"System knowledge injection failed.")}finally{w(!1)}}}const ae=S?{source_documents:S.injection.injected.sourceDocuments,words:S.injection.injected.words,phrases:S.injection.injected.phrases,sentences:S.injection.injected.sentences,geo_materials:S.injection.injected.geoMaterials,geo_features:S.injection.injected.geoFeatures,strategies:S.injection.injected.strategies,requirements:S.injection.injected.requirements,methods:S.injection.injected.methods,relations:S.injection.injected.itemRelations,item_sources:S.injection.injected.itemSources,images:S.injection.injected.images}:void 0,Ne=R?R.validationReport.state==="valid"?"success":"failure":void 0,se=D==="applied"?"success":D==="apply_failed"?"failure":void 0;return i.jsxs(qe,{title:"Settings",subtitle:"Diagnostics, backups, restore tools, and internal admin actions.",pageDescription:null,children:[i.jsx("section",{style:De,children:i.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",gap:"0.75rem",flexWrap:"wrap"},children:[i.jsxs("div",{style:{flex:"1 1 320px"},children:[i.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"0.5rem",flexWrap:"wrap"},children:[i.jsx("h3",{style:{margin:0},children:"Runtime Status"}),i.jsx(Me,{title:"Settings runtime",children:"Use this page for diagnostics, backups, restore validation, and bundled system knowledge maintenance."})]}),i.jsxs("p",{style:{margin:"0.25rem 0 0",color:"#64748b",fontSize:"0.92rem"},children:[ve?"Online":"Offline"," | ",xe?"Offline ready":"Service worker starting"]})]}),i.jsx(Be,{to:"/audit",style:G,children:"Open Audit"})]})}),p?i.jsx(re,{tone:"success",message:p}):null,N?i.jsx(re,{tone:"error",message:N}):null,i.jsxs("details",{style:{...Ue,border:"1px solid #bfdbfe",background:"#eff6ff"},open:ye,onToggle:r=>he(r.currentTarget.open),children:[i.jsx("summary",{style:{cursor:"pointer",fontWeight:700,color:"#1e3a8a"},children:"Contract help"}),i.jsx("p",{style:{margin:"0.6rem 0 0",color:"#1f2937",lineHeight:1.45},children:"Learning Pack v1 is the fast-ingest path. System Pack v1 is the strict structured path used by internal tools."}),i.jsxs("p",{style:{margin:"0.45rem 0 0",color:"#475569",fontSize:"0.92rem",lineHeight:1.45},children:["Samples: ",i.jsx("a",{href:"/pack-samples/learning-pack-v1.sample.json",target:"_blank",rel:"noreferrer",children:"Learning Pack v1"})," | ",i.jsx("a",{href:"/pack-samples/system-pack-v1.sample.json",target:"_blank",rel:"noreferrer",children:"System Pack v1"})]})]}),i.jsxs("section",{style:F,children:[i.jsxs("div",{style:{display:"flex",justifyContent:"space-between",gap:"0.75rem",alignItems:"flex-start",flexWrap:"wrap"},children:[i.jsxs("div",{style:{flex:"1 1 300px"},children:[i.jsx("h3",{style:{marginTop:0,marginBottom:"0.3rem"},children:"Diagnostics"}),i.jsx("p",{style:{margin:0,color:"#64748b",lineHeight:1.5},children:"Inspect schema state, storage usage, integrity signals, and recent runtime metrics."})]}),i.jsx("button",{onClick:()=>void $e(),style:Fe,disabled:I,children:"Run Integrity Checks"})]}),i.jsxs("p",{style:{marginTop:0},children:[i.jsx("strong",{children:"Schema version:"})," ",e]}),i.jsxs("p",{style:{marginTop:0},children:[i.jsx("strong",{children:"Migration count:"})," ",(c==null?void 0:c.migrationCount)??0]}),c!=null&&c.latestMigration?i.jsxs("p",{style:{marginTop:0},children:[i.jsx("strong",{children:"Latest migration:"})," ",`${c.latestMigration.migrationName} -> ${c.latestMigration.toVersion} at ${c.latestMigration.appliedAt}`]}):null,c?i.jsxs("div",{style:{marginTop:"0.75rem"},children:[i.jsxs("p",{style:{margin:0},children:[i.jsx("strong",{children:"Database size:"})," ",ee(c.storageUsage.databaseBytes)]}),i.jsxs("p",{style:{margin:"0.25rem 0 0"},children:[i.jsx("strong",{children:"Image resources:"})," ",c.storageUsage.imageResourceCount," (",ee(c.storageUsage.imageResourceBytes),")"]}),i.jsxs("p",{style:{margin:"0.25rem 0 0"},children:[i.jsx("strong",{children:"Backup blobs:"})," ",c.storageUsage.backupResourceCount," (",ee(c.storageUsage.backupResourceBytes),")"]}),i.jsxs("p",{style:{margin:"0.25rem 0 0"},children:[i.jsx("strong",{children:"Total local keys:"})," ",c.storageUsage.totalKeys]})]}):null,c?i.jsxs("div",{style:{marginTop:"0.75rem",padding:"0.75rem",border:"1px solid #e5e7eb",borderRadius:"0.5rem",background:"#fff"},children:[i.jsx("strong",{children:"Hardening State Summary"}),i.jsxs("p",{style:{margin:"0.35rem 0 0"},children:[i.jsx("strong",{children:"Built-in system pack:"})," ",(h==null?void 0:h.packName)??"N/A"]}),i.jsxs("p",{style:{margin:"0.25rem 0 0"},children:[i.jsx("strong",{children:"Pack id:"})," ",(h==null?void 0:h.id)??"N/A"]}),i.jsxs("p",{style:{margin:"0.25rem 0 0"},children:[i.jsx("strong",{children:"Pack version:"})," ",Xt(h==null?void 0:h.id)]}),i.jsxs("div",{style:{marginTop:"0.6rem"},children:[i.jsx("strong",{children:"Flow Availability"}),i.jsxs("ul",{style:{margin:"0.35rem 0 0",paddingLeft:"1.2rem"},children:[i.jsxs("li",{children:["System built-in validate/apply: ",c.dataState.flowAvailability.systemBuiltInValidateApply]}),i.jsxs("li",{children:["User import -> pending -> review -> commit: ",c.dataState.flowAvailability.userImportPendingReviewCommit]}),i.jsxs("li",{children:["Governance diagnostics: ",c.dataState.flowAvailability.governanceIntegrityDiagnostics]}),i.jsxs("li",{children:["Geo library/detail read-side: ",c.dataState.flowAvailability.geoLibraryDetailRead]})]})]}),i.jsxs("div",{style:{marginTop:"0.55rem"},children:[i.jsx("strong",{children:"Approved Counts (current)"}),M({words:c.dataState.approvedCounts.words,phrases:c.dataState.approvedCounts.phrases,sentences:c.dataState.approvedCounts.sentences,geo_materials:c.dataState.approvedCounts.geoMaterials,geo_features:c.dataState.approvedCounts.geoFeatures,strategies:c.dataState.approvedCounts.strategies,requirements:c.dataState.approvedCounts.requirements,methods:c.dataState.approvedCounts.methods,relations:c.dataState.approvedCounts.relations,images:c.dataState.approvedCounts.images,reports:c.dataState.approvedCounts.reports,item_sources:c.dataState.approvedCounts.sources})]}),i.jsxs("div",{style:{marginTop:"0.55rem"},children:[i.jsx("strong",{children:"Pending Counts (current)"}),M({pending_words:c.dataState.pendingCounts.words,pending_phrases:c.dataState.pendingCounts.phrases,pending_sentences:c.dataState.pendingCounts.sentences,pending_geo_materials:c.dataState.pendingCounts.geoMaterials,pending_geo_features:c.dataState.pendingCounts.geoFeatures,pending_strategies:c.dataState.pendingCounts.strategies,pending_images:c.dataState.pendingCounts.images,pending_item_image_links:c.dataState.pendingCounts.itemImageLinks,inbox_total:c.dataState.pendingCounts.inboxTotal,inbox_unreviewed:c.dataState.pendingCounts.inboxUnreviewed,inbox_approved:c.dataState.pendingCounts.inboxApproved,inbox_rejected:c.dataState.pendingCounts.inboxRejected,inbox_deferred:c.dataState.pendingCounts.inboxDeferred})]}),i.jsxs("div",{style:{marginTop:"0.55rem"},children:[i.jsx("strong",{children:"Approved Provenance Snapshot"}),M({system_generated:c.dataState.approvedProvenance.systemGenerated,imported_ai:c.dataState.approvedProvenance.importedAi,manual_user:c.dataState.approvedProvenance.manualUser,merged:c.dataState.approvedProvenance.merged,user_owned_total:c.dataState.approvedProvenance.userOwned,other:c.dataState.approvedProvenance.other,total:c.dataState.approvedProvenance.total})]}),c.integrity?i.jsxs("p",{style:{margin:"0.55rem 0 0",color:"#374151"},children:[i.jsx("strong",{children:"Governance status:"})," checked at ",c.integrity.checkedAt," | issues=",c.integrity.summary.totalIssues]}):i.jsx("p",{style:{margin:"0.55rem 0 0",color:"#6b7280"},children:"Governance status: run integrity checks to refresh."})]}):null,c!=null&&c.integrity?i.jsxs("div",{style:{marginTop:"0.75rem",padding:"0.75rem",border:"1px solid #e5e7eb",borderRadius:"0.5rem",background:"#fff"},children:[i.jsxs("p",{style:{margin:0},children:[i.jsx("strong",{children:"Checked:"})," ",c.integrity.checkedAt]}),i.jsxs("p",{style:{margin:"0.25rem 0 0"},children:[i.jsx("strong",{children:"Total issues:"})," ",c.integrity.summary.totalIssues]}),i.jsxs("p",{style:{margin:"0.25rem 0 0"},children:[i.jsx("strong",{children:"Errors:"})," ",c.integrity.summary.errorCount," | ",i.jsx("strong",{children:"Warnings:"})," ",c.integrity.summary.warningCount]}),i.jsxs("div",{style:{marginTop:"0.5rem"},children:[i.jsx("strong",{children:"Integrity Summary Counts"}),M(c.integrity.summary.byCategory)]}),i.jsxs("div",{style:{marginTop:"0.75rem"},children:[i.jsx("strong",{children:"Duplicate Normalized Names"}),i.jsxs("p",{style:{margin:"0.25rem 0 0"},children:["Detected duplicates: ",c.integrity.duplicateNormalizedNames.length]}),c.integrity.duplicateNormalizedNames.length>0?i.jsx("ul",{children:c.integrity.duplicateNormalizedNames.slice(0,12).map(r=>i.jsxs("li",{children:[r.itemType," | ",r.normalizedName," | count=",r.count," | provenance=",r.provenanceTypes.join(", ")||"unknown"]},`${r.itemType}:${r.normalizedName}`))}):i.jsx("p",{style:{margin:"0.25rem 0 0",color:"#166534"},children:"No duplicate normalized names detected."})]}),i.jsxs("div",{style:{marginTop:"0.75rem"},children:[i.jsx("strong",{children:"System/User Collision Summary"}),i.jsxs("p",{style:{margin:"0.25rem 0 0"},children:["Potential normalized-name collisions: ",c.integrity.systemUserCollisions.length]}),c.integrity.systemUserCollisions.length>0?i.jsx("ul",{children:c.integrity.systemUserCollisions.slice(0,12).map(r=>i.jsxs("li",{children:[r.itemType," | ",r.normalizedName," | system=",r.systemCount," | user=",r.userCount]},`${r.itemType}:${r.normalizedName}`))}):i.jsx("p",{style:{margin:"0.25rem 0 0",color:"#166534"},children:"No system/user collisions detected."})]}),i.jsxs("div",{style:{marginTop:"0.75rem"},children:[i.jsx("strong",{children:"Approved Provenance Counts"}),i.jsxs("p",{style:{margin:"0.25rem 0 0"},children:["system_generated: ",c.integrity.approvedProvenance.systemGenerated]}),i.jsxs("p",{style:{margin:"0.25rem 0 0"},children:["imported_ai: ",c.integrity.approvedProvenance.importedAi]}),i.jsxs("p",{style:{margin:"0.25rem 0 0"},children:["manual_user: ",c.integrity.approvedProvenance.manualUser]}),i.jsxs("p",{style:{margin:"0.25rem 0 0"},children:["merged: ",c.integrity.approvedProvenance.merged]}),i.jsxs("p",{style:{margin:"0.25rem 0 0"},children:["user-owned total: ",c.integrity.approvedProvenance.userOwned]})]}),c.integrity.issues.length>0?i.jsxs("div",{style:{marginTop:"0.75rem"},children:[i.jsx("strong",{children:"Detailed Issues"}),i.jsx("ul",{children:c.integrity.issues.slice(0,30).map((r,k)=>i.jsxs("li",{children:[r.severity," | ",Yt(r.category)," | ",r.message]},`${r.category}-${r.entityId??k}`))})]}):i.jsx("p",{style:{margin:"0.75rem 0 0",color:"#166534"},children:"No integrity issues detected."})]}):null,c!=null&&c.recentMetrics&&c.recentMetrics.length>0?i.jsxs("div",{style:{marginTop:"0.75rem",padding:"0.75rem",border:"1px solid #e5e7eb",borderRadius:"0.5rem",background:"#fff"},children:[i.jsx("strong",{children:"Recent Performance Metrics"}),i.jsx("ul",{children:c.recentMetrics.slice(0,8).map(r=>i.jsxs("li",{children:[r.metricType," | ",r.durationMs??0," ms | ",r.finishedAt??r.startedAt]},r.id))})]}):null]}),i.jsxs("section",{style:F,children:[i.jsx("h3",{style:{marginTop:0,marginBottom:"0.3rem"},children:"Internal System Knowledge"}),i.jsx("p",{style:{marginTop:0,color:"#64748b",lineHeight:1.5},children:"Loads a trusted bundled system pack directly into approved data. This path is internal-only, skips pending review, and always creates a pre-injection snapshot first. In the frozen contract model, this remains the structured System Pack path (strict fields, strict typing, no extra fields)."}),h?i.jsxs("div",{style:{marginBottom:"0.75rem",padding:"0.75rem",border:"1px solid #e5e7eb",borderRadius:"0.5rem",background:"#fff"},children:[i.jsxs("p",{style:{margin:0},children:[i.jsx("strong",{children:"Trusted pack:"})," ",h.packName]}),i.jsxs("p",{style:{margin:"0.25rem 0 0"},children:[i.jsx("strong",{children:"Pack id:"})," ",h.id]}),i.jsx("p",{style:{margin:"0.25rem 0 0"},children:h.description})]}):null,i.jsxs("div",{style:Ve,children:[i.jsx("button",{onClick:()=>void Te(),disabled:!h||I,style:Ke,children:"Validate Built-in Pack"}),i.jsx("button",{onClick:()=>void Ie(),disabled:!h||I,style:G,children:"Apply Built-in Pack"})]}),R?i.jsxs("div",{style:{marginTop:"0.75rem",padding:"0.75rem",border:"1px solid #d1d5db",borderRadius:"0.5rem",background:"#fff"},children:[i.jsxs("p",{style:{margin:0},children:[i.jsx("strong",{children:"Validation outcome:"})," ",Ne]}),i.jsxs("p",{style:{margin:"0.25rem 0 0"},children:[i.jsx("strong",{children:"Validation state:"})," ",R.validationReport.state]}),i.jsxs("p",{style:{margin:"0.25rem 0 0"},children:[i.jsx("strong",{children:"Supported schema:"})," ",R.validationReport.supportedSchemaVersion]}),R.validationReport.errors.length>0?i.jsxs("div",{style:{marginTop:"0.5rem",color:"#b91c1c"},children:[i.jsx("strong",{children:"Errors"}),i.jsx("ul",{children:R.validationReport.errors.map(r=>i.jsx("li",{children:r},r))})]}):null,R.validationReport.warnings.length>0?i.jsxs("div",{style:{marginTop:"0.5rem",color:"#92400e"},children:[i.jsx("strong",{children:"Warnings"}),i.jsx("ul",{children:R.validationReport.warnings.map(r=>i.jsx("li",{children:r},r))})]}):null]}):null,i.jsxs("div",{style:{marginTop:"0.75rem",padding:"0.75rem",border:"1px solid #d1d5db",borderRadius:"0.5rem",background:"#fff"},children:[i.jsxs("p",{style:{margin:0},children:[i.jsx("strong",{children:"Apply status:"})," ",ei(D)]}),se?i.jsxs("p",{style:{margin:"0.25rem 0 0"},children:[i.jsx("strong",{children:"Injection outcome:"})," ",se]}):null,ie?i.jsxs("p",{style:{margin:"0.35rem 0 0",color:"#b91c1c"},children:[i.jsx("strong",{children:"Injection error:"})," ",ie]}):null,S&&ae?i.jsxs("div",{style:{marginTop:"0.5rem"},children:[i.jsxs("p",{style:{margin:"0.25rem 0 0"},children:[i.jsx("strong",{children:"Snapshot created:"})," ",S.snapshotName]}),i.jsxs("p",{style:{margin:"0.25rem 0 0"},children:[i.jsx("strong",{children:"Report/source id:"})," ",S.injection.reportId]}),M(ae)]}):null,D==="applied"?i.jsxs("div",{style:{marginTop:"0.75rem",padding:"0.75rem",border:"1px solid #e5e7eb",borderRadius:"0.5rem",background:"#f9fafb"},children:[i.jsx("p",{style:{margin:0},children:i.jsx("strong",{children:"Library verification search terms"})}),i.jsx("ul",{style:{margin:"0.4rem 0 0",paddingLeft:"1.25rem"},children:ti.map(r=>i.jsx("li",{children:r},r))}),i.jsx("p",{style:{margin:"0.5rem 0 0",color:"#374151"},children:"Verify in Library Search first. Strategies are not standalone Library items yet, so verify them through Related Knowledge on feature detail pages such as detached block, foliation plane, ravelling, and blast damaged zone."})]}):null,D==="idle"?i.jsx("p",{style:{margin:"0.35rem 0 0",color:"#4b5563"},children:"No system injection has been run yet in this session."}):null]})]}),i.jsxs("section",{style:F,children:[i.jsx("h3",{style:{marginTop:0,marginBottom:"0.3rem"},children:"Full Backup Export"}),i.jsx("p",{style:{marginTop:0,color:"#64748b",lineHeight:1.5},children:"Create a local ZIP package with manifest, SQLite content, and stored image resources."}),i.jsx("button",{onClick:()=>void je(),disabled:I,style:G,children:"Create Full Backup ZIP"}),T?i.jsxs("div",{style:{marginTop:"0.75rem"},children:[i.jsx("strong",{children:"Latest Backup Manifest"}),i.jsxs("p",{style:{margin:"0.35rem 0 0"},children:["schema_version: ",T.schema_version]}),i.jsxs("p",{style:{margin:"0.25rem 0 0"},children:["backup_type: ",T.backup_type]}),i.jsxs("p",{style:{margin:"0.25rem 0 0"},children:["created_at: ",T.created_at]}),M(T.item_counts)]}):null]}),i.jsxs("section",{style:F,children:[i.jsx("h3",{style:{marginTop:0,marginBottom:"0.3rem"},children:"Restore Preview"}),i.jsx("p",{style:{marginTop:0,color:"#64748b",lineHeight:1.5},children:"Select a backup ZIP and validate it before any replace restore runs."}),i.jsx("input",{type:"file",accept:"application/zip,.zip",onChange:r=>void we(r),disabled:I,style:{padding:"0.5rem 0"}}),g?i.jsxs("div",{style:{marginTop:"0.75rem",padding:"0.75rem",border:"1px solid #d1d5db",borderRadius:"0.5rem",background:"#fff"},children:[i.jsxs("p",{style:{margin:0},children:[i.jsx("strong",{children:"state:"})," ",g.state]}),i.jsxs("p",{style:{margin:"0.25rem 0 0"},children:[i.jsx("strong",{children:"file:"})," ",g.fileName]}),g.manifest?i.jsxs("p",{style:{margin:"0.25rem 0 0"},children:[i.jsx("strong",{children:"schema:"})," ",g.manifest.schema_version]}):null,g.imageCounts?i.jsxs("p",{style:{margin:"0.25rem 0 0"},children:[i.jsx("strong",{children:"image resources:"})," ",g.imageCounts.image_resources]}):null,M(g.itemCounts),g.errors.length>0?i.jsxs("div",{style:{marginTop:"0.75rem",color:"#b91c1c"},children:[i.jsx("strong",{children:"Errors"}),i.jsx("ul",{children:g.errors.map(r=>i.jsx("li",{children:r},r))})]}):null,g.warnings.length>0?i.jsxs("div",{style:{marginTop:"0.75rem",color:"#92400e"},children:[i.jsx("strong",{children:"Warnings"}),i.jsx("ul",{children:g.warnings.map(r=>i.jsx("li",{children:r},r))})]}):null,i.jsx("button",{onClick:()=>void ke(),disabled:g.state==="invalid"||I,style:{...G,marginTop:"0.75rem"},children:"Create Pre-Restore Snapshot and Replace Local Data"})]}):null]}),i.jsxs("section",{style:F,children:[i.jsx("h3",{style:{marginTop:0},children:"Snapshots"}),l.length===0?i.jsx("p",{children:"No local snapshots recorded yet."}):null,i.jsx("ul",{children:l.map(r=>i.jsxs("li",{style:{marginBottom:"0.5rem"},children:[i.jsx("div",{children:r.snapshotName}),i.jsxs("div",{style:{color:"#4b5563",fontSize:"0.95rem"},children:[r.snapshotType," | schema: ",r.schemaVersion," | created: ",r.createdAt]})]},r.id))})]})]})}export{_i as SettingsPage};
