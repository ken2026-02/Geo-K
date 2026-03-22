import{c as a,f as ce,j as e}from"./index-B7FpDlN1.js";import{L as de,p as me}from"./learningModuleService-D-e0msCV.js";import{F as Q}from"./FeedbackBanner-DfwSGQrH.js";import{A as pe}from"./AppShell-ChzSxmTv.js";import{L as ue}from"./LearningSubnav-DNraU7Ph.js";import"./types-CRBRheTX.js";import"./enums-CKEayP-A.js";import"./types-B7DKPRWc.js";function he(c){const v={},f=[];for(const o of c){if(o.code!=="learning_optional_missing"){f.push(o);continue}const m=o.message.match(/'([^']+)'/),p=o.message.match(/^(\d+)\s+item\(s\)/),i=m==null?void 0:m[1],u=p?Number(p[1]):0;if(!i){f.push(o);continue}v[i]=u}return{byField:v,others:f}}const r="grid gap-2",xe="text-lg font-semibold text-slate-900",X="text-sm leading-6 text-slate-600",Y=`{
  "schema_version": "1.0",
  "pack_id": "learning-pack-example",
  "collection": {
    "name": "AS 1726",
    "source_type": "standard",
    "authority": "Standards Australia",
    "document_number": "AS 1726"
  },
  "items": [
    {
      "id": "learn-word-basalt",
      "type": "word",
      "content": "Basalt",
      "meaning": "A dark, fine-grained volcanic rock.",
      "example": "The oceanic crust is primarily composed of basalt.",
      "domain": "geology",
      "status": "new",
      "tags": ["igneous", "rock"]
    },
    {
      "id": "learn-rule-fines-trace",
      "type": "classification_rule",
      "content": "In coarse grained soils, fines up to 5 percent are described as trace.",
      "meaning": "Use this rule when classifying coarse soils by fines content.",
      "example": "Up to 5 percent = trace, greater than 5 and up to 12 percent = with fines.",
      "note": "Prefer classification_rule or table_entry instead of plain sentence for threshold logic.",
      "domain": "classification",
      "source_report": "AS 1726 clause/table reference"
    },
    {
      "id": "learn-req-bore-logging",
      "type": "requirement",
      "content": "Log the borehole using the project soil and rock description system.",
      "meaning": "Treat this as a compliance requirement rather than free prose.",
      "note": "Use requirement for shall/must/minimum criteria statements.",
      "domain": "logging",
      "source_report": "Project spec section 4.2"
    },
    {
      "id": "learn-method-spt",
      "type": "method",
      "content": "Record SPT depth, hammer blows, recovery, and refusal observations for each test interval.",
      "meaning": "Method items should describe an actionable procedure or field workflow.",
      "domain": "site investigation",
      "source_report": "Field method note"
    }
  ]
}`,Z=`You are generating structured study data for a React/TypeScript learning app.

Return only one valid JSON object.
Do not use markdown.
Do not wrap the JSON in code fences.
Do not add any explanation before or after the JSON.

Goal:
Convert the provided standard, manual, report, or study notes into a Learning Pack v1 JSON object for import into a personal learning library.

Output schema requirements:
- Top-level object must contain:
  - "schema_version": must be "1.0"
  - "pack_id": unique string
  - "collection": optional but preferred metadata object
  - "items": array of learning items
- Each item must contain:
  - "id": unique string within the pack
  - "type": one of:
    "word", "phrase", "sentence", "concept", "requirement", "method", "classification_rule", "table_entry"
  - "content": the exact thing to study first
- Optional item fields:
  - "meaning": concise explanation or Chinese meaning
  - "example": usage example, worked example, or companion example
  - "note": caveat, boundary case, memory hook, or exception
  - "domain": stable category label
  - "status": usually "new"
  - "tags": array of short tags
  - "source_report": precise source anchor such as document + clause/table/section

Collection object format:
- "name": document or study set name
- "source_type": one of "standard", "manual", "guide", "report", "code", "personal"
- "authority": organization or issuer if known
- "document_number": document identifier if known
- "edition": edition/year if known
- "jurisdiction": country/state/project scope if known
- "description": short summary

Type selection rules:
- Use "word" for single terms, abbreviations, symbols, or compact technical words.
- Use "phrase" for short multi-word engineering expressions.
- Use "sentence" for reusable descriptive wording or report language.
- Use "concept" for definitions, explanatory ideas, or interpreted understanding.
- Use "requirement" for shall/must/should/minimum criteria/compliance obligations.
- Use "method" for procedures, tests, workflows, site steps, or inspection sequences.
- Use "classification_rule" for thresholds, if/then logic, naming boundaries, rule-based decisions.
- Use "table_entry" for one row or one explicit decision line extracted from a table.

Field semantics:
- "content" = original learning target itself, keep it short and exact.
- "meaning" = plain-language explanation, direct meaning, or Chinese meaning.
- "example" = example application, example sentence, worked case, or comparison case.
- "note" = exception, warning, edge case, or mnemonic.
- "domain" = stable grouping such as:
  "geology", "mapping", "classification", "groundwater", "logging", "site investigation", "safety", "materials", "reporting"
- "source_report" = must be specific when available, such as:
  "AS 1726 Table X", "Section 4.2", "Clause 7.3", "Project report SIR-008"

Quality rules:
- Prefer many small, clean items over long paragraphs.
- Do not invent clauses, tables, or source anchors.
- Do not create duplicate items with the same learning target.
- Do not leave "content" empty.
- Use "classification_rule" or "table_entry" instead of "sentence" for threshold logic.
- Use "requirement" instead of "sentence" for mandatory statements.
- Use consistent domains across the pack.
- Default item "status" to "new" unless instructed otherwise.
- Keep "tags" short and useful.
- If a field is unknown, omit it instead of fabricating it.

Normalization rules:
- Preserve the engineering meaning of the source.
- Rewrite into study-friendly units.
- Keep English technical wording when important.
- Chinese meaning can be used in "meaning" when helpful.
- Avoid copying long copyrighted passages verbatim; summarize and structure them.

Output size rules:
- Extract the most important study items first.
- If the source is large, prioritize:
  1. glossary terms
  2. key requirements
  3. methods and procedures
  4. classification rules
  5. table-derived decisions
  6. reusable reporting sentences

Example output shape:
{
  "schema_version": "1.0",
  "pack_id": "example-pack",
  "collection": {
    "name": "AS 1726",
    "source_type": "standard",
    "authority": "Standards Australia",
    "document_number": "AS 1726",
    "edition": "2017",
    "jurisdiction": "AU",
    "description": "Geotechnical site investigation study pack"
  },
  "items": [
    {
      "id": "as1726-word-basalt",
      "type": "word",
      "content": "basalt",
      "meaning": "A dark fine-grained volcanic rock.",
      "domain": "geology",
      "status": "new",
      "tags": ["rock", "igneous"]
    },
    {
      "id": "as1726-rule-fines-trace",
      "type": "classification_rule",
      "content": "In coarse grained soils, fines up to 5 percent are described as trace.",
      "meaning": "This rule controls coarse-soil naming based on fines content.",
      "note": "Use classification_rule for threshold logic instead of plain sentence.",
      "domain": "classification",
      "status": "new",
      "source_report": "AS 1726 table/section reference"
    }
  ]
}

Now generate the JSON from the source material I provide.`;function ke(){const c=a.useMemo(()=>new de,[]),v=c.getSuggestedDomains(),[f,o]=ce(),[m,p]=a.useState(),[i,u]=a.useState(""),[S,ee]=a.useState(""),[C,se]=a.useState(""),[_,te]=a.useState(!1),[y,ae]=a.useState([]),[P,L]=a.useState(!1),[A,O]=a.useState(""),[I,ne]=a.useState("standard"),[J,D]=a.useState(""),[E,T]=a.useState(""),[U,q]=a.useState(""),[F,R]=a.useState(""),[$,z]=a.useState(""),[V,M]=a.useState([]),[B,N]=a.useState([]),[G,b]=a.useState(),[H,d]=a.useState(),[h,x]=a.useState(!1),g=f.get("collection")??"";async function W(){const s=await c.listCollections();ae(s),!g&&s[0]&&o(t=>{const n=new URLSearchParams(t);return n.set("collection",s[0].id),n})}a.useEffect(()=>{W()},[]);function j(){b(void 0),d(void 0)}function w(){M([]),N([])}async function K(s,t){j();try{await navigator.clipboard.writeText(s),b(`${t} copied to clipboard.`)}catch(n){d(n instanceof Error?n.message:`Failed to copy ${t.toLowerCase()}.`)}}async function ie(){if(!h){x(!0),j();try{const s=await c.createCollection({name:A,sourceType:I,authority:J,documentNumber:E,edition:U,jurisdiction:F,description:$});await W(),o(t=>{const n=new URLSearchParams(t);return n.set("collection",s.id),n}),L(!1),O(""),D(""),T(""),q(""),R(""),z(""),b(`Created learning list: ${s.name}.`)}catch(s){d(s instanceof Error?s.message:"Failed to create learning list.")}finally{x(!1)}}}async function re(s){var n;j(),w();const t=(n=s.target.files)==null?void 0:n[0];if(!t){p(void 0),u("");return}p(t),u(await t.text())}async function oe(){if(!h){x(!0),j(),w();try{if(!i.trim()){d("Select a JSON file or paste Learning Pack JSON first.");return}const s=c.validatePack(i);if(s.state==="invalid"){M(s.errors);return}N(s.warnings),b("Learning Pack v1 validation passed.")}catch(s){d(s instanceof Error?s.message:"Validation failed.")}finally{x(!1)}}}async function le(){if(!h){x(!0),j(),w();try{if(!i.trim()){d("Select a JSON file or paste Learning Pack JSON first.");return}const s=await c.importPack(i,{collectionId:g||void 0,defaultDomain:S,defaultTags:me(C)}),t=y.find(n=>n.id===g);b(`Imported pack ${s.packId} into ${(t==null?void 0:t.name)??"selected list"}. Items=${s.imported}, inserted=${s.inserted}, updated=${s.updated}.`),N(s.warnings),p(void 0),u("")}catch(s){d(s instanceof Error?s.message:"Learning import failed.")}finally{x(!1)}}}const k=he(B),l=y.find(s=>s.id===g);return e.jsxs(pe,{title:"Learning Import",subtitle:"Import one learning pack into one list at a time.",pageDescription:null,children:[e.jsx(ue,{}),e.jsxs("div",{className:"mt-4 space-y-4",children:[G?e.jsx(Q,{tone:"success",message:G}):null,H?e.jsx(Q,{tone:"error",message:H}):null]}),e.jsxs("section",{className:"ekv-card mt-4 p-4 sm:p-5",children:[e.jsxs("div",{className:"space-y-1",children:[e.jsx("h3",{className:xe,children:"Import JSON"}),e.jsx("p",{className:X,children:"Choose a target learning list first, then upload or paste a Learning Pack v1 JSON file."})]}),e.jsxs("div",{className:"mt-4 rounded-3xl border border-indigo-100 bg-indigo-50/70 p-4",children:[e.jsxs("div",{className:"grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end",children:[e.jsxs("label",{className:r,children:[e.jsx("span",{className:"ekv-label",children:"Target learning list"}),e.jsx("select",{value:g,onChange:s=>o(t=>{const n=new URLSearchParams(t);return n.set("collection",s.target.value),n}),className:"ekv-select",children:y.map(s=>e.jsx("option",{value:s.id,children:s.name},s.id))})]}),e.jsx("button",{type:"button",onClick:()=>L(s=>!s),className:"ekv-button-compact w-full lg:w-auto",children:P?"Hide New List Form":"Create New List"})]}),l?e.jsxs("div",{className:"mt-3 rounded-2xl border border-white/80 bg-white/90 p-3",children:[e.jsxs("div",{className:"flex flex-wrap items-center gap-2",children:[e.jsx("span",{className:"inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-200",children:l.sourceType}),l.documentNumber?e.jsx("span",{className:"inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200",children:l.documentNumber}):null,l.authority?e.jsx("span",{className:"inline-flex items-center rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-semibold text-cyan-700 ring-1 ring-cyan-200",children:l.authority}):null]}),e.jsx("p",{className:"mt-2 text-sm font-semibold text-slate-900",children:l.name}),l.description?e.jsx("p",{className:"mt-1 text-sm leading-5 text-slate-600",children:l.description}):null]}):null,P?e.jsxs("div",{className:"mt-3 grid grid-cols-1 gap-3 rounded-2xl border border-indigo-200 bg-white p-4 sm:grid-cols-2",children:[e.jsxs("label",{className:r,children:[e.jsx("span",{className:"ekv-label",children:"List name"}),e.jsx("input",{value:A,onChange:s=>O(s.target.value),placeholder:"AS 1726: Site Investigations",className:"ekv-input"})]}),e.jsxs("label",{className:r,children:[e.jsx("span",{className:"ekv-label",children:"Source type"}),e.jsxs("select",{value:I,onChange:s=>ne(s.target.value),className:"ekv-select",children:[e.jsx("option",{value:"standard",children:"standard"}),e.jsx("option",{value:"manual",children:"manual"}),e.jsx("option",{value:"guide",children:"guide"}),e.jsx("option",{value:"report",children:"report"}),e.jsx("option",{value:"code",children:"code"}),e.jsx("option",{value:"personal",children:"personal"})]})]}),e.jsxs("label",{className:r,children:[e.jsx("span",{className:"ekv-label",children:"Authority"}),e.jsx("input",{value:J,onChange:s=>D(s.target.value),placeholder:"Standards Australia",className:"ekv-input"})]}),e.jsxs("label",{className:r,children:[e.jsx("span",{className:"ekv-label",children:"Document number"}),e.jsx("input",{value:E,onChange:s=>T(s.target.value),placeholder:"AS 1726",className:"ekv-input"})]}),e.jsxs("label",{className:r,children:[e.jsx("span",{className:"ekv-label",children:"Edition"}),e.jsx("input",{value:U,onChange:s=>q(s.target.value),placeholder:"2017",className:"ekv-input"})]}),e.jsxs("label",{className:r,children:[e.jsx("span",{className:"ekv-label",children:"Jurisdiction"}),e.jsx("input",{value:F,onChange:s=>R(s.target.value),placeholder:"AU / QLD",className:"ekv-input"})]}),e.jsxs("label",{className:"grid gap-2 sm:col-span-2",children:[e.jsx("span",{className:"ekv-label",children:"Notes"}),e.jsx("textarea",{value:$,onChange:s=>z(s.target.value),rows:3,className:"ekv-textarea"})]}),e.jsx("div",{className:"sm:col-span-2",children:e.jsx("button",{type:"button",onClick:()=>void ie(),disabled:h,className:"ekv-button-primary",children:"Create List"})})]}):null]}),e.jsxs("div",{className:"mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_300px]",children:[e.jsxs("div",{className:"space-y-3",children:[e.jsxs("label",{className:r,children:[e.jsx("span",{className:"ekv-label",children:"Upload file"}),e.jsx("input",{type:"file",accept:"application/json,.json",onChange:s=>void re(s),className:"ekv-input file:mr-4 file:rounded-xl file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100"})]}),m?e.jsxs("p",{className:"text-sm text-slate-500",children:["Selected: ",m.name]}):null,e.jsxs("label",{className:"grid gap-2",children:[e.jsx("span",{className:"ekv-label",children:"Paste JSON"}),e.jsx("textarea",{value:i,onChange:s=>u(s.target.value),rows:11,placeholder:"Paste Learning Pack v1 JSON here",className:"ekv-textarea min-h-[260px]"})]}),e.jsxs("div",{className:"flex flex-wrap gap-2",children:[e.jsx("button",{type:"button",onClick:()=>void oe(),disabled:!i.trim()||h,className:"ekv-button-compact",children:"Validate"}),e.jsx("button",{type:"button",onClick:()=>void le(),disabled:!i.trim()||!g||h,className:"ekv-button-primary",children:"Import"})]})]}),e.jsxs("div",{className:"rounded-3xl border border-slate-200 bg-slate-50 p-4",children:[e.jsxs("button",{type:"button",onClick:()=>te(s=>!s),className:"flex w-full items-center justify-between text-left",children:[e.jsxs("span",{children:[e.jsx("span",{className:"block text-sm font-semibold uppercase tracking-[0.18em] text-slate-500",children:"Optional defaults"}),e.jsx("span",{className:"mt-1 block text-sm leading-5 text-slate-600",children:"Fill blank domains or tags during import."})]}),e.jsx("span",{className:"text-sm font-semibold text-slate-500",children:_?"Hide":"Show"})]}),_?e.jsxs("div",{className:"mt-3 grid gap-3",children:[e.jsxs("label",{className:r,children:[e.jsx("span",{className:"ekv-label",children:"Default domain"}),e.jsxs("select",{value:S,onChange:s=>ee(s.target.value),className:"ekv-select",children:[e.jsx("option",{value:"",children:"none"}),v.map(s=>e.jsx("option",{value:s,children:s},s))]})]}),e.jsxs("label",{className:r,children:[e.jsx("span",{className:"ekv-label",children:"Default tags"}),e.jsx("input",{value:C,onChange:s=>se(s.target.value),placeholder:"comma, separated, tags",className:"ekv-input"})]})]}):null]})]}),V.length>0?e.jsxs("div",{className:"mt-4 rounded-2xl border border-red-200 bg-red-50 p-4",children:[e.jsx("strong",{className:"text-sm font-semibold text-red-800",children:"Blocking errors"}),e.jsx("ul",{className:"mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-red-700",children:V.map((s,t)=>e.jsxs("li",{children:[s.code,": ",s.message]},`${s.code}-${t}`))})]}):null,B.length>0?e.jsxs("div",{className:"mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4",children:[e.jsx("strong",{className:"text-sm font-semibold text-amber-900",children:"Optional fields missing"}),e.jsx("ul",{className:"mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-amber-800",children:Object.entries(k.byField).map(([s,t])=>e.jsxs("li",{children:[s,": ",t," item(s)"]},s))}),k.others.length>0?e.jsx("ul",{className:"mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-amber-800",children:k.others.map((s,t)=>e.jsxs("li",{children:[s.code,": ",s.message]},`${s.code}-${t}`))}):null,e.jsx("p",{className:"mt-3 text-sm text-amber-900",children:"These warnings do not block import."})]}):null,e.jsxs("details",{className:"mt-6 rounded-3xl border border-slate-200 bg-slate-50",children:[e.jsx("summary",{className:"cursor-pointer px-4 py-3 text-sm font-semibold text-slate-800",children:"JSON Format Requirements & Sample"}),e.jsxs("div",{className:"grid gap-4 px-4 pb-4",children:[e.jsxs("p",{className:X,children:["Learning import expects a Learning Pack v1 object with ",e.jsx("code",{children:"schema_version"}),", ",e.jsx("code",{children:"pack_id"}),", and an ",e.jsx("code",{children:"items"})," array. This schema is shared by standards/manual study packs and ordinary personal word or phrase packs, so imported data stays consistent with the personal learning library."]}),e.jsxs("ul",{className:"list-disc space-y-2 pl-5 text-sm leading-6 text-slate-600",children:[e.jsxs("li",{children:[e.jsx("strong",{children:"schema_version"}),": must be ",e.jsx("code",{children:"1.0"}),"."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"pack_id"}),": required export/import batch id."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"collection"}),": optional metadata block for the target standard, manual, code, or report."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"items"}),": array of learning items."]}),e.jsxs("li",{children:["Each item needs ",e.jsx("strong",{children:"id"}),", ",e.jsx("strong",{children:"type"}),", and ",e.jsx("strong",{children:"content"}),"."]}),e.jsxs("li",{children:["Supported item types include ",e.jsx("code",{children:"word"}),", ",e.jsx("code",{children:"phrase"}),", ",e.jsx("code",{children:"sentence"}),", ",e.jsx("code",{children:"concept"}),", ",e.jsx("code",{children:"requirement"}),", ",e.jsx("code",{children:"method"}),", ",e.jsx("code",{children:"classification_rule"}),", and ",e.jsx("code",{children:"table_entry"}),"."]}),e.jsxs("li",{children:["Optional fields include ",e.jsx("strong",{children:"meaning"}),", ",e.jsx("strong",{children:"example"}),", ",e.jsx("strong",{children:"note"}),", ",e.jsx("strong",{children:"domain"}),", ",e.jsx("strong",{children:"tags"}),", ",e.jsx("strong",{children:"status"}),", and ",e.jsx("strong",{children:"source_report"}),"."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"meaning/example/note"})," stay available for every type, but for standards and manuals they should be used with stable semantics instead of as random free text."]})]}),e.jsxs("div",{className:"rounded-2xl border border-cyan-100 bg-cyan-50/70 p-4 text-sm leading-6 text-slate-700",children:[e.jsx("strong",{className:"block text-slate-900",children:"Recommended item mapping for standards, manuals, reports, and personal study"}),e.jsxs("div",{className:"mt-2 grid gap-1",children:[e.jsxs("span",{children:[e.jsx("code",{children:"word / phrase"}),": glossary terms, abbreviations, short engineering expressions."]}),e.jsxs("span",{children:[e.jsx("code",{children:"sentence"}),": reusable wording, report descriptions, standard prose fragments."]}),e.jsxs("span",{children:[e.jsx("code",{children:"concept"}),": definitions or explanatory ideas that need interpretation, not just recall."]}),e.jsxs("span",{children:[e.jsx("code",{children:"requirement"}),": must / shall / minimum acceptance criteria / compliance conditions."]}),e.jsxs("span",{children:[e.jsx("code",{children:"method"}),": steps, tests, inspection workflows, procedures, or field methods."]}),e.jsxs("span",{children:[e.jsx("code",{children:"classification_rule"}),": threshold logic, if/then boundaries, naming rules, decision logic."]}),e.jsxs("span",{children:[e.jsx("code",{children:"table_entry"}),": one structured row or one explicit decision line extracted from a table."]})]})]}),e.jsxs("div",{className:"rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4 text-sm leading-6 text-slate-700",children:[e.jsx("strong",{className:"block text-slate-900",children:"Recommended field semantics"}),e.jsxs("div",{className:"mt-2 grid gap-1",children:[e.jsxs("span",{children:[e.jsx("code",{children:"content"}),": the exact thing to study first."]}),e.jsxs("span",{children:[e.jsx("code",{children:"meaning"}),": plain-language explanation, interpretation, or direct Chinese meaning."]}),e.jsxs("span",{children:[e.jsx("code",{children:"example"}),": worked example, usage example, or companion row/value."]}),e.jsxs("span",{children:[e.jsx("code",{children:"note"}),": edge case, caveat, exception, comparison, or memory hook."]}),e.jsxs("span",{children:[e.jsx("code",{children:"domain"}),": stable grouping like geology, classification, mapping, groundwater, safety."]}),e.jsxs("span",{children:[e.jsx("code",{children:"source_report"}),": clause/table/report anchor that keeps later imports and exports traceable."]})]})]}),e.jsx("div",{className:"flex justify-end",children:e.jsx("button",{type:"button",onClick:()=>void K(Y,"JSON sample"),className:"ekv-button-compact",children:"Copy JSON sample"})}),e.jsx("pre",{className:"overflow-x-auto rounded-2xl bg-slate-900 p-4 text-xs leading-6 text-slate-100 sm:text-sm",children:Y})]})]}),e.jsxs("details",{className:"mt-4 rounded-3xl border border-slate-200 bg-slate-50",children:[e.jsx("summary",{className:"cursor-pointer px-4 py-3 text-sm font-semibold text-slate-800",children:"AI Prompt For Generating Learning Pack JSON"}),e.jsxs("div",{className:"px-4 pb-4",children:[e.jsx("p",{className:"mb-3 text-sm leading-6 text-slate-600",children:"Copy this prompt into your AI workflow when you want standards, manuals, reports, or personal notes summarized into import-ready Learning Pack v1 JSON."}),e.jsx("div",{className:"mb-3 flex justify-end",children:e.jsx("button",{type:"button",onClick:()=>void K(Z,"AI prompt"),className:"ekv-button-compact",children:"Copy AI prompt"})}),e.jsx("pre",{className:"overflow-x-auto rounded-2xl bg-slate-900 p-4 text-xs leading-6 text-slate-100 sm:text-sm",children:Z})]})]})]})]})}export{ke as LearningImportPage};
