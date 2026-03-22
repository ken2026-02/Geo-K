import { useEffect, useMemo, useState, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";

import { useDatabaseRuntime } from "../../data/db/DatabaseContext";
import type { PersonalNoteRecord, PersonalNoteStatus, PersonalNoteTargetItemType, PersonalNoteType } from "../../data/repositories/interfaces";
import { AppShell } from "../../shared/ui/layout/AppShell";
import { ConfirmDialog } from "../../shared/ui/feedback/ConfirmDialog";
import { FeedbackBanner } from "../../shared/ui/feedback/FeedbackBanner";
import { LibraryService, type DetailEntry, type LibraryImageView, type LibraryRelationGroup, type LibrarySection } from "../../services/library/libraryService";
import { PersonalNoteService } from "../../services/personal/personalNoteService";

const sectionLabels: Record<LibrarySection, string> = {
  words: "Words",
  phrases: "Phrases",
  sentences: "Sentences",
  requirements: "Requirements",
  methods: "Methods",
  "geo-materials": "Geo Materials",
  features: "Features"
};

const detailSectionLabels: Record<LibrarySection, string> = {
  words: "Word",
  phrases: "Phrase",
  sentences: "Sentence",
  requirements: "Requirement",
  methods: "Method",
  "geo-materials": "Geo Material",
  features: "Feature"
};

const personalNoteTypes: PersonalNoteType[] = ["observation", "risk", "action", "reminder", "lesson"];
const personalNoteStatuses: PersonalNoteStatus[] = ["active", "archived"];

function isSection(value: string): value is LibrarySection {
  return value === "words" || value === "phrases" || value === "sentences" || value === "requirements" || value === "methods" || value === "geo-materials" || value === "features";
}

function asPersonalTargetItemType(section: LibrarySection): PersonalNoteTargetItemType | undefined {
  if (section === "geo-materials") return "geo_material";
  if (section === "features") return "geo_feature";
  return undefined;
}

function formatPersonalNoteType(noteType: PersonalNoteType): string {
  return noteType.charAt(0).toUpperCase() + noteType.slice(1);
}

function formatPersonalNoteTimestamp(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString(undefined, { year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function comparePersonalNotes(left: PersonalNoteRecord, right: PersonalNoteRecord): number {
  const rank = (status: PersonalNoteStatus) => (status === "active" ? 0 : 1);
  const statusDelta = rank(left.status) - rank(right.status);
  if (statusDelta !== 0) return statusDelta;
  return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
}

function personalNoteTypeTone(noteType: PersonalNoteType): { background: string; border: string; color: string } {
  switch (noteType) {
    case "risk":
      return { background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b" };
    case "action":
      return { background: "#ecfeff", border: "1px solid #a5f3fc", color: "#155e75" };
    case "reminder":
      return { background: "#fffbeb", border: "1px solid #fde68a", color: "#92400e" };
    case "lesson":
      return { background: "#f5f3ff", border: "1px solid #ddd6fe", color: "#5b21b6" };
    default:
      return { background: "#eff6ff", border: "1px solid #bfdbfe", color: "#1d4ed8" };
  }
}

function renderEntryValue(entry: DetailEntry) {
  if (Array.isArray(entry.value)) {
    return (
      <ul style={{ margin: "0.35rem 0 0", paddingLeft: "1.1rem" }}>
        {entry.value.map((item) => (
          <li key={`${entry.label}-${item}`}>{item}</li>
        ))}
      </ul>
    );
  }

  return <p style={{ margin: "0.35rem 0 0", color: "#111827" }}>{entry.value}</p>;
}

function renderRelationGroups(groups: LibraryRelationGroup[]) {
  if (groups.length === 0) return <p>No related approved items yet.</p>;
  return (
    <div style={{ display: "grid", gap: "0.8rem" }}>
      {groups.map((group) => (
        <section key={group.key}>
          <h4 style={{ margin: "0 0 0.35rem" }}>{group.title}</h4>
          <div style={{ display: "grid", gap: "0.5rem" }}>
            {group.items.map((relation, index) => (
              <article key={`${relation.itemType}-${relation.itemId}-${relation.relationType}-${index}`} style={{ border: "1px solid #e5e7eb", borderRadius: "0.5rem", padding: "0.55rem", background: "#f9fafb" }}>
                <p style={{ margin: 0 }}><strong>{relation.title}</strong>{relation.subtitle ? ` | ${relation.subtitle}` : ""}</p>
                <p style={{ margin: "0.2rem 0 0", color: "#4b5563" }}>{relation.direction} | {relation.relationType}</p>
                {relation.detailPath ? <p style={{ margin: "0.25rem 0 0" }}><Link to={relation.detailPath}>Open related detail</Link></p> : null}
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function parseListField(value: unknown): string[] {
  if (value == null) return [];
  const raw = String(value).trim();
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) return parsed.map((item) => String(item).trim()).filter((item) => item.length > 0);
  } catch {
    // no-op
  }
  return raw.split(/[\n;|]/).map((item) => item.trim()).filter((item) => item.length > 0);
}

function firstItems(items: string[], limit: number): string[] {
  return items.filter((entry) => entry.trim().length > 0).slice(0, limit);
}

function asText(value: unknown): string | undefined {
  if (value == null) return undefined;
  const text = String(value).trim();
  return text.length > 0 ? text : undefined;
}

function compactValue(value: unknown, maxLength = 140): string | undefined {
  const text = asText(value);
  if (!text) return undefined;
  return text.length <= maxLength ? text : `${text.slice(0, maxLength - 3)}...`;
}

function summaryChips(section: LibrarySection, fields: Record<string, unknown>): string[] {
  if (section === "words") {
    return [asText(fields.language_category), asText(fields.part_of_speech)].filter((value): value is string => Boolean(value));
  }
  if (section === "phrases") {
    return [asText(fields.function_type), asText(fields.phrase_type), asText(fields.scenario_type)].filter((value): value is string => Boolean(value));
  }
  if (section === "sentences") {
    return [asText(fields.sentence_type), asText(fields.function_type), asText(fields.section_name)].filter((value): value is string => Boolean(value));
  }
  if (section === "requirements") {
    return [asText(fields.requirement_category), asText(fields.authority_level), asText(fields.jurisdiction)].filter((value): value is string => Boolean(value));
  }
  if (section === "methods") {
    return [asText(fields.method_category), asText(fields.authority_level), asText(fields.jurisdiction)].filter((value): value is string => Boolean(value));
  }
  return [];
}

export function LibraryDetailPage() {
  const { section = "", itemId = "" } = useParams();
  const { db } = useDatabaseRuntime();
  const libraryService = useMemo(() => new LibraryService(), []);
  const personalNoteService = useMemo(() => new PersonalNoteService(), []);
  const navigate = useNavigate();

  const [refreshKey, setRefreshKey] = useState(0);
  const validSection = isSection(section) ? section : undefined;
  const detailView = useMemo(() => validSection ? libraryService.getDetailView(db, validSection, itemId) : undefined, [db, validSection, itemId, libraryService, refreshKey]);
  const [images, setImages] = useState<LibraryImageView[]>([]);
  const [copiedPhrase, setCopiedPhrase] = useState<string>();

  const [personalNotes, setPersonalNotes] = useState<PersonalNoteRecord[]>([]);
  const [personalNoteType, setPersonalNoteType] = useState<PersonalNoteType>("observation");
  const [personalNoteBody, setPersonalNoteBody] = useState("");
  const [personalNotesSaving, setPersonalNotesSaving] = useState(false);
  const [personalNotesError, setPersonalNotesError] = useState<string>();

  const [isEditing, setIsEditing] = useState(false);
  const [editFields, setEditFields] = useState<Record<string, unknown>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState<string>();
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showSourceDetails, setShowSourceDetails] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isGeoSection = validSection === "geo-materials" || validSection === "features";
  const isGeoFeature = validSection === "features";
  const personalTargetItemType = validSection ? asPersonalTargetItemType(validSection) : undefined;

  useEffect(() => {
    if (!validSection || !detailView) {
      setImages([]);
      return;
    }
    void libraryService.listDetailImages(db, validSection, itemId).then((loaded) => setImages(loaded));
  }, [db, detailView, itemId, libraryService, validSection, refreshKey]);

  useEffect(() => {
    if (!personalTargetItemType || !detailView) {
      setPersonalNotes([]);
      return;
    }
    void personalNoteService.listForItem(db, personalTargetItemType, detailView.record.id).then((notes) => setPersonalNotes(notes));
  }, [db, detailView, personalNoteService, personalTargetItemType]);

  async function handleCopyPhrase(text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedPhrase(text);
      setTimeout(() => setCopiedPhrase(undefined), 1200);
    } catch {
      setCopiedPhrase(undefined);
    }
  }

  async function handleCreatePersonalNote(): Promise<void> {
    if (!personalTargetItemType || !detailView) return;
    setPersonalNotesSaving(true);
    setPersonalNotesError(undefined);
    try {
      const created = await personalNoteService.createForItem(db, {
        targetItemType: personalTargetItemType,
        targetItemId: detailView.record.id,
        noteType: personalNoteType,
        body: personalNoteBody
      });
      setPersonalNotes((current) => [created, ...current]);
      setPersonalNoteBody("");
      setPersonalNoteType("observation");
    } catch (error) {
      setPersonalNotesError(error instanceof Error ? error.message : "Failed to create personal note.");
    } finally {
      setPersonalNotesSaving(false);
    }
  }

  async function handleUpdatePersonalNote(note: PersonalNoteRecord, next: { noteType: PersonalNoteType; body: string; status: PersonalNoteStatus }): Promise<void> {
    setPersonalNotesSaving(true);
    setPersonalNotesError(undefined);
    try {
      const updated = await personalNoteService.updateNote(db, { id: note.id, noteType: next.noteType, body: next.body, status: next.status });
      setPersonalNotes((current) => current.map((entry) => (entry.id === updated.id ? updated : entry)));
    } catch (error) {
      setPersonalNotesError(error instanceof Error ? error.message : "Failed to update personal note.");
    } finally {
      setPersonalNotesSaving(false);
    }
  }

  async function handleArchivePersonalNote(note: PersonalNoteRecord): Promise<void> {
    setPersonalNotesSaving(true);
    setPersonalNotesError(undefined);
    try {
      await personalNoteService.archiveNote(db, note.id);
      setPersonalNotes((current) => current.map((entry) => (entry.id === note.id ? { ...entry, status: "archived", updatedAt: new Date().toISOString() } : entry)));
    } catch (error) {
      setPersonalNotesError(error instanceof Error ? error.message : "Failed to archive personal note.");
    } finally {
      setPersonalNotesSaving(false);
    }
  }

  function handleStartEdit() {
    if (!detailView) return;
    setEditFields({ ...detailView.record.fields });
    setIsEditing(true);
    setEditError(undefined);
  }

  async function handleSaveEdit() {
    if (!validSection || !detailView) return;
    setIsSaving(true);
    setEditError(undefined);
    try {
      await libraryService.updateItem(db, validSection, itemId, editFields);
      setIsEditing(false);
      setRefreshKey((k) => k + 1);
    } catch (error) {
      setEditError(error instanceof Error ? error.message : "Failed to save changes.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteItem() {
    if (!validSection || !detailView) return;

    setIsSaving(true);
    try {
      await libraryService.deleteItem(db, validSection, itemId);
      navigate(`/library/${validSection}`);
    } catch (error) {
      setEditError(error instanceof Error ? error.message : "Failed to delete item.");
      setIsSaving(false);
    }
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !validSection || !detailView) return;

    setIsUploadingImage(true);
    try {
      await libraryService.attachImage(db, validSection, itemId, file);
      setRefreshKey((k) => k + 1);
    } catch (error) {
      setEditError(error instanceof Error ? error.message : "Failed to upload image.");
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  if (!validSection) return <AppShell title="Library Detail" subtitle="Invalid section."><p>Unknown library section.</p><Link to="/library">Back to Library</Link></AppShell>;
  if (!detailView) return <AppShell title="Library Detail" subtitle="Item not found."><p>Could not find this approved item.</p><Link to={`/library/${validSection}`}>Back to {sectionLabels[validSection]}</Link></AppShell>;

  const sortedPersonalNotes = [...personalNotes].sort(comparePersonalNotes);
  const activePersonalNotes = sortedPersonalNotes.filter((note) => note.status === "active");
  const archivedPersonalNotes = sortedPersonalNotes.filter((note) => note.status === "archived");
  const reportingExpressions = isGeoFeature ? parseListField(detailView.record.fields.reporting_expressions) : [];

  const quickRiskSummary = isGeoFeature
    ? firstItems(parseListField(detailView.record.fields.risk_implications), 3)
    : firstItems(parseListField(detailView.record.fields.common_risks), 3);
  const quickFailureBehavior = isGeoFeature ? firstItems(parseListField(detailView.record.fields.common_causes), 2) : [];
  const relationStrategies = firstItems(
    detailView.relationGroups
      .find((group) => group.key === "strategies")
      ?.items.map((item) => item.title) ?? [],
    3
  );
  const fallbackActions = isGeoFeature
    ? firstItems(parseListField(detailView.record.fields.treatment_or_mitigation), 3)
    : firstItems(parseListField(detailView.record.fields.common_treatments), 3);
  const quickActions = relationStrategies.length > 0 ? relationStrategies : fallbackActions;
  const nonGeoChips = validSection && !isGeoSection ? summaryChips(validSection, detailView.record.fields) : [];
  const nonGeoPrimarySummary =
    !isGeoSection
      ? compactValue(
          detailView.record.fields.chinese_meaning ??
          detailView.record.fields.chinese_natural ??
          detailView.record.fields.chinese_literal ??
          detailView.record.fields.plain_language_summary ??
          detailView.record.fields.requirement_text ??
          detailView.record.fields.purpose ??
          detailView.record.fields.procedure_summary ??
          detailView.record.fields.english_definition ??
          detailView.record.fields.explanation ??
          detailView.record.fields.description,
          180
        )
      : undefined;
  const nonGeoSecondarySummary =
    !isGeoSection
      ? compactValue(
          detailView.record.fields.english_definition ??
          detailView.record.fields.explanation ??
          detailView.record.fields.why_it_matters ??
          detailView.record.fields.verification_method ??
          detailView.record.fields.inputs_or_prerequisites ??
          detailView.record.fields.outputs_or_results ??
          detailView.record.fields.notes ??
          detailView.record.fields.example_sentence,
          180
        )
      : undefined;
  const nonGeoTags = !isGeoSection ? firstItems(parseListField(detailView.record.fields.tags), 4) : [];

  const fieldLabels: Record<string, string> = {
    canonical_word: "Content",
    canonical_phrase: "Content",
    canonical_sentence: "Content",
    canonical_name: "Content",
    english_definition: "Meaning",
    explanation: "Meaning",
    description: "Meaning",
    chinese_natural: "Meaning",
    requirement_text: "Requirement Text",
    plain_language_summary: "Summary",
    purpose: "Purpose",
    procedure_summary: "Procedure Summary",
    example_sentence: "Example",
    identification_method: "Example / Method",
    chinese_meaning: "Chinese Meaning",
    chinese_literal: "Literal Chinese",
    engineering_significance: "Engineering Note",
    risk_implications: "Risk Note",
    why_it_matters: "Why It Matters",
    verification_method: "Verification Method",
    trigger_conditions: "Trigger Conditions",
    inputs_or_prerequisites: "Inputs / Prerequisites",
    outputs_or_results: "Outputs / Results",
    limitations: "Limitations",
    notes: "Note",
    reviewer_note: "Reviewer Note",
    language_category: "Domain",
    phrase_type: "Phrase Type",
    sentence_type: "Sentence Type",
    requirement_category: "Requirement Category",
    method_category: "Method Category",
    authority_level: "Authority Level",
    jurisdiction: "Jurisdiction",
    clause_reference: "Clause Reference",
    geo_material_category: "Category",
    geo_feature_category: "Category",
    tags: "Tags",
    sourceReport: "Source Report",
  };

  const editFieldKeys = useMemo(() => {
    if (!detailView) return [];
    const itemType = detailView.record.itemType;
    const keys: string[] = [];
    
    // Content
    if (itemType === "word") keys.push("canonical_word");
    else if (itemType === "phrase") keys.push("canonical_phrase");
    else if (itemType === "sentence") keys.push("canonical_sentence");
    else keys.push("canonical_name");

    // Meaning
    if (itemType === "word") keys.push("english_definition");
    else if (itemType === "phrase") keys.push("explanation");
    else if (itemType === "sentence") keys.push("chinese_natural");
    else if (itemType === "requirement") keys.push("requirement_text", "plain_language_summary");
    else if (itemType === "method") keys.push("purpose", "procedure_summary");
    else keys.push("description");

    // Example
    if (itemType === "sentence") keys.push("example_sentence");
    else if (itemType === "geo_material" || itemType === "geo_feature") keys.push("identification_method");
    else if (itemType === "requirement") keys.push("verification_method");
    else if (itemType === "method") keys.push("inputs_or_prerequisites");

    // Note
    if (itemType === "word" || itemType === "phrase") keys.push("chinese_meaning");
    else if (itemType === "sentence") keys.push("chinese_literal");
    else if (itemType === "requirement") keys.push("why_it_matters", "trigger_conditions");
    else if (itemType === "method") keys.push("outputs_or_results", "limitations");
    else if (itemType === "geo_material") keys.push("engineering_significance");
    else if (itemType === "geo_feature") keys.push("risk_implications");
    else keys.push("notes");

    // Domain
    if (itemType === "word") keys.push("language_category");
    else if (itemType === "phrase") keys.push("phrase_type");
    else if (itemType === "sentence") keys.push("sentence_type");
    else if (itemType === "requirement") keys.push("requirement_category", "authority_level", "jurisdiction", "clause_reference");
    else if (itemType === "method") keys.push("method_category", "authority_level", "jurisdiction");
    else if (itemType === "geo_material") keys.push("geo_material_category");
    else if (itemType === "geo_feature") keys.push("geo_feature_category");

    // Tags
    keys.push("tags");

    // Source Report
    keys.push("sourceReport");

    return keys;
  }, [detailView]);

  const editSections = useMemo(() => {
    if (!detailView) return [];

    const itemType = detailView.record.itemType;
    const contentField = itemType === "word"
      ? "canonical_word"
      : itemType === "phrase"
        ? "canonical_phrase"
        : itemType === "sentence"
          ? "canonical_sentence"
          : "canonical_name";
    const meaningFields = itemType === "word"
      ? ["english_definition", "chinese_meaning"]
      : itemType === "phrase"
        ? ["explanation", "chinese_meaning"]
        : itemType === "sentence"
          ? ["chinese_natural", "chinese_literal", "example_sentence"]
          : itemType === "requirement"
            ? ["requirement_text", "plain_language_summary"]
            : itemType === "method"
              ? ["purpose", "procedure_summary"]
          : ["description"];
    const usageFields = itemType === "geo_material" || itemType === "geo_feature"
      ? ["identification_method", itemType === "geo_material" ? "engineering_significance" : "risk_implications"]
      : itemType === "requirement"
        ? ["verification_method", "why_it_matters", "trigger_conditions"]
        : itemType === "method"
          ? ["inputs_or_prerequisites", "outputs_or_results", "limitations"]
      : ["notes"];
    const classificationFields = itemType === "word"
      ? ["language_category", "tags"]
      : itemType === "phrase"
        ? ["phrase_type", "tags"]
        : itemType === "sentence"
          ? ["sentence_type", "tags"]
          : itemType === "requirement"
            ? ["requirement_category", "authority_level", "jurisdiction", "clause_reference", "tags"]
            : itemType === "method"
              ? ["method_category", "authority_level", "jurisdiction", "tags"]
          : [itemType === "geo_material" ? "geo_material_category" : "geo_feature_category", "tags"];

    const sections = [
      { title: "Content", description: "Primary term or phrase shown in the library.", fields: [contentField] },
      { title: "Meaning", description: "What this entry means or how it should be read.", fields: meaningFields },
      { title: "Usage", description: "Example, note, or engineering context for actual use.", fields: usageFields.filter((field) => editFieldKeys.includes(field)) },
      { title: "Classification", description: "Domain, type, and tags used to group this entry.", fields: classificationFields.filter((field) => editFieldKeys.includes(field)) },
      { title: "Source", description: "Traceability is read-only here and follows the linked source record.", fields: ["sourceReport"] }
    ];

    return sections.filter((section) => section.fields.length > 0);
  }, [detailView, editFieldKeys]);

  const getLabel = (key: string) => fieldLabels[key] || key.replace(/_/g, " ").toUpperCase();

  return (
    <AppShell title={detailSectionLabels[validSection]} subtitle="Approved library entry." pageDescription={null}>
      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete approved item?"
        body="This removes the approved item together with its relations, source links, and review logs."
        confirmLabel="Delete item"
        tone="danger"
        busy={isSaving}
        onConfirm={() => {
          setShowDeleteConfirm(false);
          void handleDeleteItem();
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />
      <p><Link to={`/library/${validSection}`}>Back to {sectionLabels[validSection]}</Link></p>
      {editError ? <div style={{ marginBottom: "1rem" }}><FeedbackBanner tone="error" message={editError} /></div> : null}

      {isGeoSection ? (
        <section style={{ border: "1px solid #e5e7eb", borderRadius: "0.8rem", padding: "0.8rem", background: "#fff", marginBottom: "1rem" }}>
          <h3 style={{ margin: 0 }}>{detailView.title}</h3>
          <p style={{ margin: "0.35rem 0 0", color: "#64748b", fontSize: "0.92rem", lineHeight: 1.45 }}>
            {detailView.subtitle ? `${detailView.subtitle} · ` : ""}
            {detailView.record.sources.length > 0
              ? `${detailView.record.sources.length} source record${detailView.record.sources.length === 1 ? "" : "s"} linked.`
              : "No source record linked yet."}
          </p>
        </section>
      ) : (
        <section style={{ border: "1px solid #dbe5f3", borderRadius: "1rem", padding: "1rem", background: "linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)", marginBottom: "1rem" }}>
          <div style={{ display: "grid", gap: "0.75rem" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem", alignItems: "center" }}>
              {nonGeoChips.map((chip) => (
                <span key={chip} style={{ padding: "0.18rem 0.55rem", borderRadius: "999px", background: "#eef4ff", color: "#1e3a8a", fontSize: "0.82rem", fontWeight: 600 }}>
                  {chip}
                </span>
              ))}
              <span style={{ padding: "0.18rem 0.55rem", borderRadius: "999px", background: "#f8fafc", color: "#475569", fontSize: "0.82rem", fontWeight: 600 }}>
                {detailView.record.sources.length > 0 ? `${detailView.record.sources.length} source${detailView.record.sources.length === 1 ? "" : "s"}` : "No source"}
              </span>
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.6rem", lineHeight: 1.1 }}>{detailView.title}</h3>
              {nonGeoPrimarySummary ? (
                <p style={{ margin: "0.45rem 0 0", color: "#0f172a", fontSize: "1.02rem", lineHeight: 1.5 }}>{nonGeoPrimarySummary}</p>
              ) : null}
              {nonGeoSecondarySummary && nonGeoSecondarySummary !== nonGeoPrimarySummary ? (
                <p style={{ margin: "0.3rem 0 0", color: "#475569", fontSize: "0.94rem", lineHeight: 1.5 }}>{nonGeoSecondarySummary}</p>
              ) : null}
            </div>
            {nonGeoTags.length > 0 ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                {nonGeoTags.map((tag) => (
                  <span key={tag} style={{ padding: "0.15rem 0.5rem", borderRadius: "999px", background: "#f1f5f9", color: "#334155", fontSize: "0.8rem" }}>
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </section>
      )}
      {isGeoSection ? (
        <section style={{ border: "1px solid #dbeafe", borderRadius: "0.75rem", padding: "0.8rem", background: "#eff6ff", marginBottom: "1rem" }}>
          <h3 style={{ marginTop: 0, marginBottom: "0.45rem" }}>Actions</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem" }}>
            <a href="#quick-engineering-view" style={{ padding: "0.35rem 0.6rem", borderRadius: "0.5rem", border: "1px solid #bfdbfe", background: "#fff", textDecoration: "none", color: "inherit" }}>Read Quick Engineering View</a>
            {isGeoFeature ? <a href="#reporting-expressions" style={{ padding: "0.35rem 0.6rem", borderRadius: "0.5rem", border: "1px solid #bfdbfe", background: "#fff", textDecoration: "none", color: "inherit" }}>Reuse Reporting Phrases</a> : null}
            <a href="#personal-notes" style={{ padding: "0.35rem 0.6rem", borderRadius: "0.5rem", border: "1px solid #bfdbfe", background: "#fff", textDecoration: "none", color: "inherit" }}>Add Or Update Personal Note</a>
            <button type="button" onClick={handleStartEdit} style={{ padding: "0.35rem 0.6rem", borderRadius: "0.5rem", border: "1px solid #bfdbfe", background: "#fff", cursor: "pointer" }}>Edit Item</button>
            <button type="button" onClick={() => setShowDeleteConfirm(true)} style={{ padding: "0.35rem 0.6rem", borderRadius: "0.5rem", border: "1px solid #fecaca", background: "#fff", color: "#dc2626", cursor: "pointer" }}>Delete Item</button>
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploadingImage} style={{ padding: "0.35rem 0.6rem", borderRadius: "0.5rem", border: "1px solid #bfdbfe", background: "#fff", cursor: "pointer" }}>
              {isUploadingImage ? "Uploading..." : "Upload Image"}
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: "none" }} accept="image/*" />
          </div>
          <p style={{ margin: "0.5rem 0 0", color: "#64748b", fontSize: "0.88rem" }}>
            Personal notes stay local to this item.
          </p>
        </section>
      ) : (
        <section style={{ border: "1px solid #e5e7eb", borderRadius: "0.75rem", padding: "0.7rem 0.8rem", background: "#fcfcfd", marginBottom: "1rem" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem", alignItems: "center", justifyContent: "space-between" }}>
            <p style={{ margin: 0, color: "#64748b", fontSize: "0.88rem" }}>Quick actions</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem" }}>
              <button type="button" onClick={handleStartEdit} style={{ padding: "0.32rem 0.58rem", borderRadius: "0.45rem", border: "1px solid #d1d5db", background: "#fff", cursor: "pointer", fontSize: "0.9rem" }}>Edit</button>
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploadingImage} style={{ padding: "0.32rem 0.58rem", borderRadius: "0.45rem", border: "1px solid #d1d5db", background: "#fff", cursor: "pointer", fontSize: "0.9rem" }}>
                {isUploadingImage ? "Uploading..." : "Upload Image"}
              </button>
              <button type="button" onClick={() => setShowDeleteConfirm(true)} style={{ padding: "0.32rem 0.58rem", borderRadius: "0.45rem", border: "1px solid #fecaca", background: "#fff", color: "#dc2626", cursor: "pointer", fontSize: "0.9rem" }}>Delete</button>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: "none" }} accept="image/*" />
            </div>
          </div>
        </section>
      )}

      {isEditing && (
        <section style={{ border: "2px solid #3b82f6", borderRadius: "0.75rem", padding: "1rem", background: "#f0f9ff", marginBottom: "1rem" }}>
          <h3 style={{ marginTop: 0 }}>Edit Approved Item</h3>
          <div style={{ display: "grid", gap: "1rem" }}>
            <section style={{ border: "1px solid #bfdbfe", borderRadius: "0.65rem", padding: "0.75rem", background: "#ffffff" }}>
              <p style={{ margin: 0, fontSize: "0.82rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>Entry Type</p>
              <p style={{ margin: "0.3rem 0 0", fontWeight: 700, color: "#0f172a" }}>{detailView.record.itemType}</p>
            </section>
            {editSections.map((section) => (
              <section key={section.title} style={{ border: "1px solid #bfdbfe", borderRadius: "0.65rem", padding: "0.85rem", background: "#ffffff" }}>
                <h4 style={{ margin: 0, color: "#0f172a" }}>{section.title}</h4>
                <p style={{ margin: "0.25rem 0 0.75rem", color: "#64748b", fontSize: "0.9rem", lineHeight: 1.45 }}>{section.description}</p>
                <div style={{ display: "grid", gap: "0.85rem" }}>
                  {section.fields.map((key) => (
                    <label key={`${section.title}-${key}`} style={{ display: "block" }}>
                      <span style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#334155", marginBottom: "0.25rem" }}>{getLabel(key)}</span>
                      <textarea
                        value={String(editFields[key] ?? "")}
                        onChange={(event) => setEditFields((prev) => ({ ...prev, [key]: event.target.value }))}
                        readOnly={key === "sourceReport"}
                        style={{
                          width: "100%",
                          padding: "0.55rem",
                          borderRadius: "0.45rem",
                          border: "1px solid #d1d5db",
                          minHeight: key === "tags" || key === "sourceReport" ? "44px" : key === "canonical_word" || key === "canonical_phrase" || key === "canonical_sentence" || key === "canonical_name" ? "56px" : "88px",
                          background: key === "sourceReport" ? "#f8fafc" : "white"
                        }}
                      />
                    </label>
                  ))}
                </div>
              </section>
            ))}
          </div>
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "1.5rem" }}>
            <button type="button" onClick={handleSaveEdit} disabled={isSaving} style={{ padding: "0.5rem 1rem", borderRadius: "0.5rem", background: "#3b82f6", color: "#fff", border: "none", cursor: "pointer" }}>
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
            <button type="button" onClick={() => setIsEditing(false)} style={{ padding: "0.5rem 1rem", borderRadius: "0.5rem", background: "#e5e7eb", color: "#374151", border: "none", cursor: "pointer" }}>
              Cancel
            </button>
          </div>
        </section>
      )}

      {isGeoSection ? (
        <section id="quick-engineering-view" style={{ border: "1px solid #e5e7eb", borderRadius: "0.75rem", padding: "0.8rem", background: "#fff", marginBottom: "1rem" }}>
          <h3 style={{ marginTop: 0 }}>Quick Engineering View</h3>
          <div style={{ display: "grid", gap: "0.7rem", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
            <article>
              <strong>Key Risk Summary</strong>
              {quickRiskSummary.length > 0 ? <ul style={{ margin: "0.35rem 0 0", paddingLeft: "1.1rem" }}>{quickRiskSummary.map((item) => <li key={item}>{item}</li>)}</ul> : <p style={{ margin: "0.35rem 0 0", color: "#6b7280" }}>No explicit risk summary in current fields.</p>}
            </article>
            {isGeoFeature ? (
              <article>
                <strong>Typical Failure Behavior</strong>
                {quickFailureBehavior.length > 0 ? <ul style={{ margin: "0.35rem 0 0", paddingLeft: "1.1rem" }}>{quickFailureBehavior.map((item) => <li key={item}>{item}</li>)}</ul> : <p style={{ margin: "0.35rem 0 0", color: "#6b7280" }}>No explicit behavior cues in current fields.</p>}
              </article>
            ) : null}
            <article>
              <strong>Top Recommended Actions</strong>
              {quickActions.length > 0 ? <ul style={{ margin: "0.35rem 0 0", paddingLeft: "1.1rem" }}>{quickActions.map((item) => <li key={item}>{item}</li>)}</ul> : <p style={{ margin: "0.35rem 0 0", color: "#6b7280" }}>No explicit action cues in current fields/relations.</p>}
            </article>
          </div>
        </section>
      ) : null}

      {images.length > 0 && (
        <section style={{ border: "1px solid #e5e7eb", borderRadius: "0.75rem", padding: "0.8rem", background: "#fff", marginBottom: "1rem" }}>
          <h3 style={{ marginTop: 0 }}>{isGeoSection ? "Field Images" : "Images"}</h3>
          <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
            {images.map((img) => (
              <div key={img.imageAssetId} style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {img.previewUrl ? (
                  <img
                    src={img.previewUrl}
                    alt={img.caption ?? img.fileName ?? img.imageAssetId}
                    referrerPolicy="no-referrer"
                    style={{ width: "100%", maxHeight: "360px", objectFit: "contain", borderRadius: "0.5rem", border: "1px solid #f3f4f6" }}
                  />
                ) : (
                  <div style={{ width: "100%", height: "200px", background: "#f3f4f6", borderRadius: "0.5rem", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280" }}>
                    No preview available
                  </div>
                )}
                {img.caption && <p style={{ margin: 0, fontSize: "0.9rem", color: "#4b5563", textAlign: "center" }}>{img.caption}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {isGeoFeature && reportingExpressions.length > 0 ? (
        <section id="reporting-expressions" style={{ border: "1px solid #e5e7eb", borderRadius: "0.75rem", padding: "0.8rem", background: "#f8fafc", marginBottom: "1rem" }}>
          <h3 style={{ marginTop: 0 }}>Reporting Expressions</h3>
          <p style={{ margin: "0 0 0.45rem", color: "#4b5563" }}>Copy concise reporting/inspection phrases, then adapt in your report or note.</p>
          <div style={{ display: "grid", gap: "0.45rem" }}>
            {reportingExpressions.map((phrase) => (
              <div key={phrase} style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", border: "1px solid #d1d5db", borderRadius: "0.5rem", padding: "0.45rem", background: "#fff" }}>
                <code>{phrase}</code>
                <button type="button" onClick={() => void handleCopyPhrase(phrase)}>{copiedPhrase === phrase ? "Copied" : "Copy"}</button>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <div style={{ display: "grid", gap: "0.8rem", marginBottom: "1rem" }}>
        {detailView.sections.map((sectionView) => (
          <section key={sectionView.title} style={{ border: "1px solid #e5e7eb", borderRadius: "0.75rem", padding: "0.8rem", background: "#fff" }}>
            <h3 style={{ marginTop: 0 }}>{sectionView.title}</h3>
            {sectionView.entries.map((entry) => (
              <article key={`${sectionView.title}-${entry.label}`}>
                <strong>{entry.label}</strong>
                {renderEntryValue(entry)}
              </article>
            ))}
          </section>
        ))}
      </div>

      {isGeoSection ? (
        <section id="personal-notes" style={{ border: "1px solid #d1d5db", borderRadius: "0.75rem", padding: "0.8rem", background: "#f8fafc", marginBottom: "1rem" }}>
          <h3 style={{ marginTop: 0 }}>Personal Engineering Notes</h3>
          <p style={{ margin: "0.25rem 0 0", color: "#64748b", fontSize: "0.92rem", lineHeight: 1.45 }}>
            Local notes for this item only. They do not change approved knowledge.
          </p>

          <section style={{ marginTop: "0.7rem", border: "1px solid #dbeafe", borderRadius: "0.6rem", padding: "0.6rem", background: "#eff6ff" }}>
            <p style={{ margin: 0, fontWeight: 600 }}>Add personal note</p>
            <div style={{ marginTop: "0.45rem", display: "grid", gap: "0.5rem", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
              <select value={personalNoteType} onChange={(event) => setPersonalNoteType(event.target.value as PersonalNoteType)} disabled={personalNotesSaving}>
                {personalNoteTypes.map((noteType) => <option key={noteType} value={noteType}>{formatPersonalNoteType(noteType)}</option>)}
              </select>
              <textarea value={personalNoteBody} onChange={(event) => setPersonalNoteBody(event.target.value)} rows={3} placeholder="Concise site note for this item" disabled={personalNotesSaving} />
            </div>
            <div style={{ marginTop: "0.5rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <button type="button" onClick={() => void handleCreatePersonalNote()} disabled={personalNotesSaving || !personalNoteBody.trim()} style={{ padding: "0.5rem 1rem" }}>Add personal note</button>
            </div>
            {personalNotesError ? <p style={{ margin: "0.45rem 0 0", color: "#b91c1c" }}>{personalNotesError}</p> : null}
          </section>

          <section style={{ marginTop: "0.7rem", display: "grid", gap: "0.55rem" }}>
            <p style={{ margin: 0, fontWeight: 600 }}>Notes for this item ({sortedPersonalNotes.length})</p>
            {sortedPersonalNotes.length === 0 ? <p style={{ margin: 0, color: "#6b7280" }}>No notes yet. Start with an observation or risk note for next inspection context.</p> : null}

            {activePersonalNotes.length > 0 ? <p style={{ margin: "0.2rem 0 0", fontWeight: 600 }}>Active notes ({activePersonalNotes.length})</p> : null}
            {activePersonalNotes.map((note) => {
              const tone = personalNoteTypeTone(note.noteType);
              return (
                <article key={note.id} style={{ border: "1px solid #d1d5db", borderRadius: "0.6rem", padding: "0.6rem", background: "#fff" }}>
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.4rem", flexWrap: "wrap" }}>
                    <span style={{ padding: "0.15rem 0.45rem", borderRadius: "999px", fontSize: "0.78rem", ...tone }}>{formatPersonalNoteType(note.noteType)}</span>
                    <span style={{ fontSize: "0.84rem", color: "#64748b" }}>Updated: {formatPersonalNoteTimestamp(note.updatedAt)}</span>
                  </div>
                  <div style={{ display: "grid", gap: "0.45rem", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
                    <select value={note.noteType} onChange={(event) => void handleUpdatePersonalNote(note, { noteType: event.target.value as PersonalNoteType, body: note.body, status: note.status })} disabled={personalNotesSaving}>
                      {personalNoteTypes.map((noteType) => <option key={noteType} value={noteType}>{formatPersonalNoteType(noteType)}</option>)}
                    </select>
                    <select value={note.status} onChange={(event) => void handleUpdatePersonalNote(note, { noteType: note.noteType, body: note.body, status: event.target.value as PersonalNoteStatus })} disabled={personalNotesSaving}>
                      {personalNoteStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>
                    <textarea
                      value={note.body}
                      rows={3}
                      onChange={(event) => setPersonalNotes((current) => current.map((entry) => (entry.id === note.id ? { ...entry, body: event.target.value } : entry)))}
                      onBlur={(event) => void handleUpdatePersonalNote(note, { noteType: note.noteType, body: event.target.value, status: note.status })}
                      disabled={personalNotesSaving}
                    />
                  </div>
                  <div style={{ marginTop: "0.45rem", display: "flex", justifyContent: "space-between", gap: "0.5rem", flexWrap: "wrap", color: "#6b7280", fontSize: "0.86rem" }}>
                    <span>Created: {formatPersonalNoteTimestamp(note.createdAt)}</span>
                    <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                      <button type="button" onClick={() => void handleUpdatePersonalNote(note, { noteType: note.noteType, body: note.body, status: note.status })} disabled={personalNotesSaving || !note.body.trim()}>Save body now</button>
                      <button type="button" onClick={() => void handleArchivePersonalNote(note)} disabled={personalNotesSaving || note.status === "archived"}>Archive note</button>
                    </div>
                  </div>
                </article>
              );
            })}

            {archivedPersonalNotes.length > 0 ? <p style={{ margin: "0.2rem 0 0", fontWeight: 600, color: "#475569" }}>Archived notes ({archivedPersonalNotes.length})</p> : null}
            {archivedPersonalNotes.map((note) => {
              const tone = personalNoteTypeTone(note.noteType);
              return (
                <article key={note.id} style={{ border: "1px dashed #cbd5e1", borderRadius: "0.6rem", padding: "0.6rem", background: "#f8fafc", opacity: 0.8 }}>
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.4rem", flexWrap: "wrap" }}>
                    <span style={{ padding: "0.15rem 0.45rem", borderRadius: "999px", fontSize: "0.78rem", ...tone }}>{formatPersonalNoteType(note.noteType)}</span>
                    <span style={{ fontSize: "0.84rem", color: "#64748b" }}>Updated: {formatPersonalNoteTimestamp(note.updatedAt)}</span>
                  </div>
                  <p style={{ margin: 0, color: "#475569" }}>{note.body}</p>
                  <div style={{ marginTop: "0.45rem", display: "flex", justifyContent: "space-between", gap: "0.5rem", flexWrap: "wrap", color: "#6b7280", fontSize: "0.86rem" }}>
                    <span>Created: {formatPersonalNoteTimestamp(note.createdAt)}</span>
                    <button type="button" onClick={() => void handleUpdatePersonalNote(note, { noteType: note.noteType, body: note.body, status: "active" })} disabled={personalNotesSaving}>Restore to active</button>
                  </div>
                </article>
              );
            })}
          </section>
        </section>
      ) : null}


      {isGeoSection ? (
        <section style={{ border: "1px solid #e5e7eb", borderRadius: "0.75rem", padding: "0.8rem", background: "#fff", marginBottom: "1rem" }}>
          <h3 style={{ marginTop: 0 }}>Related Knowledge</h3>
          {renderRelationGroups(detailView.relationGroups)}
        </section>
      ) : null}

      <details style={{ border: "1px solid #e5e7eb", borderRadius: "0.75rem", padding: "0.8rem", background: "#fff" }} open={showSourceDetails} onToggle={(event) => setShowSourceDetails((event.currentTarget as HTMLDetailsElement).open)}>
        <summary style={{ cursor: "pointer", fontWeight: 700, color: "#0f172a" }}>Source Traceability</summary>
        {detailView.record.sources.length === 0 ? <p style={{ marginBottom: 0 }}>No source trace found for this item.</p> : null}
        <div style={{ display: "grid", gap: "0.6rem", marginTop: detailView.record.sources.length > 0 ? "0.75rem" : "0" }}>
          {detailView.record.sources.map((source) => (
            <article key={source.id} style={{ border: "1px solid #e5e7eb", borderRadius: "0.5rem", padding: "0.55rem", background: "#f9fafb" }}>
              <p style={{ margin: 0 }}><strong>Report:</strong> {source.reportTitle ?? source.reportId ?? "N/A"}</p>
              <p style={{ margin: "0.2rem 0 0" }}><strong>Project:</strong> {source.reportProject ?? "N/A"}</p>
              <p style={{ margin: "0.2rem 0 0" }}><strong>Date:</strong> {source.reportDate ?? "N/A"}</p>
              <p style={{ margin: "0.2rem 0 0" }}><strong>Section:</strong> {source.sourceSection ?? "N/A"}</p>
              <p style={{ margin: "0.2rem 0 0" }}><strong>Sentence:</strong> {source.sourceSentence ?? source.sourceExcerpt ?? "N/A"}</p>
            </article>
          ))}
        </div>
      </details>
    </AppShell>
  );
}

