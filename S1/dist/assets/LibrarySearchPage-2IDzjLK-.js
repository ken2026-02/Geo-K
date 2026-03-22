import{e as p,r as S,b as x,c,j as e,L as h}from"./index-B7FpDlN1.js";import{I as f}from"./InlineInfo-DdB6iuWp.js";import{A as R}from"./AppShell-ChzSxmTv.js";function m(o){return o==null?void 0:String(o)}class A{constructor(t){this.db=t}baseCombinedSql(){return`
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
    `}searchApproved(t){const n=["1=1"];if(t.queryText&&t.queryText.trim()){const a=p(t.queryText.trim().toLowerCase().replace(/\s+/g," "));n.push(`normalized_text LIKE '%${a}%'`)}return t.itemType&&t.itemType!=="all"&&n.push(`item_type = '${p(t.itemType)}'`),t.category&&t.category.trim()&&n.push(`category = '${p(t.category.trim())}'`),t.functionType&&t.functionType.trim()&&n.push(`function_type = '${p(t.functionType.trim())}'`),t.scenarioType&&t.scenarioType.trim()&&n.push(`scenario_type = '${p(t.scenarioType.trim())}'`),S(this.db,`
      ${this.baseCombinedSql()}
      SELECT item_type, item_id, title, snippet, category, function_type, scenario_type, updated_at
      FROM combined
      WHERE ${n.join(" AND ")}
      ORDER BY item_type ASC, updated_at DESC, title ASC
      `).map(a=>({itemType:a.item_type,itemId:String(a.item_id),title:String(a.title),snippet:m(a.snippet),category:m(a.category),functionType:m(a.function_type),scenarioType:m(a.scenario_type),updatedAt:String(a.updated_at)}))}getFilterOptions(){const t=S(this.db,`
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
      `),n=S(this.db,`
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
      `),r=S(this.db,`
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
      `);return{categories:t.map(a=>String(a.category)),functionTypes:n.map(a=>String(a.function_type)),scenarioTypes:r.map(a=>String(a.scenario_type))}}}class b{search(t,n){const r=new A(t).searchApproved(n),a={word:[],phrase:[],sentence:[],requirement:[],method:[],geo_material:[],geo_feature:[]};for(const l of r)a[l.itemType].push(l);return{grouped:a,total:r.length}}getFilterOptions(t){return new A(t).getFilterOptions()}getDetailPath(t,n){return`/library/${{word:"words",phrase:"phrases",sentence:"sentences",requirement:"requirements",method:"methods",geo_material:"geo-materials",geo_feature:"features"}[t]}/${n}`}}const E=[{key:"word",label:"Words"},{key:"phrase",label:"Phrases"},{key:"sentence",label:"Sentences"},{key:"requirement",label:"Requirements"},{key:"method",label:"Methods"},{key:"geo_material",label:"Geo Materials"},{key:"geo_feature",label:"Features"}];function U(){const{db:o}=x(),t=new b,n=c.useMemo(()=>t.getFilterOptions(o),[o]),[r,a]=c.useState(""),[l,L]=c.useState("all"),[d,T]=c.useState("all"),[y,N]=c.useState("all"),[u,O]=c.useState("all"),g=c.useMemo(()=>t.search(o,{queryText:r,itemType:l,category:d==="all"?void 0:d,functionType:y==="all"?void 0:y,scenarioType:u==="all"?void 0:u}),[o,r,l,d,y,u]);return e.jsxs(R,{title:"Library Search",subtitle:"Search approved knowledge.",pageDescription:null,children:[e.jsx("p",{children:e.jsx(h,{to:"/library",children:"Back to Library"})}),e.jsxs("section",{style:{border:"1px solid #e5e7eb",borderRadius:"0.75rem",padding:"0.75rem",marginBottom:"1rem",background:"#fff"},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"0.5rem",flexWrap:"wrap",marginBottom:"0.5rem"},children:[e.jsx("h3",{style:{margin:0},children:"Search Filters"}),e.jsx(f,{title:"Library search",children:"Search covers approved library items only, including requirements and methods. Personal notes stay inside each item detail page."})]}),e.jsxs("div",{style:{display:"grid",gap:"0.5rem"},children:[e.jsxs("label",{children:["Query",e.jsx("input",{value:r,onChange:i=>a(i.target.value),placeholder:"Search normalized approved text",style:{width:"100%"}})]}),e.jsxs("label",{children:["Item Type",e.jsxs("select",{value:l,onChange:i=>L(i.target.value),style:{width:"100%"},children:[e.jsx("option",{value:"all",children:"All"}),E.map(i=>e.jsx("option",{value:i.key,children:i.label},i.key))]})]}),e.jsxs("label",{children:["Category",e.jsxs("select",{value:d,onChange:i=>T(i.target.value),style:{width:"100%"},children:[e.jsx("option",{value:"all",children:"All"}),n.categories.map(i=>e.jsx("option",{value:i,children:i},i))]})]}),e.jsxs("label",{children:["Function Type",e.jsxs("select",{value:y,onChange:i=>N(i.target.value),style:{width:"100%"},children:[e.jsx("option",{value:"all",children:"All"}),n.functionTypes.map(i=>e.jsx("option",{value:i,children:i},i))]})]}),e.jsxs("label",{children:["Scenario Type",e.jsxs("select",{value:u,onChange:i=>O(i.target.value),style:{width:"100%"},children:[e.jsx("option",{value:"all",children:"All"}),n.scenarioTypes.map(i=>e.jsx("option",{value:i,children:i},i))]})]})]}),e.jsxs("p",{style:{marginBottom:0,color:"#4b5563"},children:["Total results: ",g.total]})]}),e.jsx("div",{style:{display:"grid",gap:"1rem"},children:E.map(i=>{const _=g.grouped[i.key];return _.length===0?null:e.jsxs("section",{children:[e.jsxs("h3",{style:{marginBottom:"0.5rem"},children:[i.label," (",_.length,")"]}),e.jsx("div",{style:{display:"grid",gap:"0.5rem"},children:_.map(s=>e.jsxs("article",{style:{border:"1px solid #e5e7eb",borderRadius:"0.75rem",padding:"0.75rem",background:"#fff"},children:[e.jsx(h,{to:t.getDetailPath(s.itemType,s.itemId),style:{display:"block",fontWeight:600,paddingBottom:"0.25rem"},children:s.title}),e.jsx("p",{style:{margin:"0.3rem 0 0",color:"#4b5563"},children:s.snippet??"No snippet"}),e.jsxs("p",{style:{margin:"0.25rem 0 0",color:"#4b5563"},children:["category: ",s.category??"N/A"," | function / authority: ",s.functionType??"N/A"," | scenario / jurisdiction: ",s.scenarioType??"N/A"]})]},`${s.itemType}-${s.itemId}`))})]},i.key)})})]})}export{U as LibrarySearchPage};
