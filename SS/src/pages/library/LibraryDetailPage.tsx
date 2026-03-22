import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { useDatabaseRuntime } from "../../data/db/DatabaseContext";
import type { PersonalNoteRecord, PersonalNoteStatus, PersonalNoteTargetItemType, PersonalNoteType } from "../../data/repositories/interfaces";
import { AppShell } from "../../shared/ui/layout/AppShell";
import { LibraryService, type DetailEntry, type LibraryImageView, type LibraryRelationGroup, type LibrarySection } from "../../services/library/libraryService";
import { PersonalNoteService } from "../../services/personal/personalNoteService";

const sectionLabels: Record<LibrarySection, string> = {
  words: "Words",
  phrases: "Phrases",
  sentences: "Sentences",
  "geo-materials": "Geo Materials",
  features: "Features"
};

const personalNoteTypes: PersonalNoteType[] = ["observation", "risk", "action", "reminder", "lesson"];
const personalNoteStatuses: PersonalNoteStatus[] = ["active", "archived"];

function isSection(value: string): value is LibrarySection {
  return value === "words" || value === "phrases" || value === "sentences" || value === "geo-materials" || value === "features";
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

export function LibraryDetailPage() {
  const { section = "", itemId = "" } = useParams();
  const { db } = useDatabaseRuntime();
  const libraryService = useMemo(() => new LibraryService(), []);
  const personalNoteService = useMemo(() => new PersonalNoteService(), []);

  const validSection = isSection(section) ? section : undefined;
  const detailView = validSection ? libraryService.getDetailView(db, validSection, itemId) : undefined;
  const [images, setImages] = useState<LibraryImageView[]>([]);
  const [copiedPhrase, setCopiedPhrase] = useState<string>();

  const [personalNotes, setPersonalNotes] = useState<PersonalNoteRecord[]>([]);
  const [personalNoteType, setPersonalNoteType] = useState<PersonalNoteType>("observation");
  const [personalNoteBody, setPersonalNoteBody] = useState("");
  const [personalNotesSaving, setPersonalNotesSaving] = useState(false);
  const [personalNotesError, setPersonalNotesError] = useState<string>();

  const isGeoSection = validSection === "geo-materials" || validSection === "features";
  const isGeoFeature = validSection === "features";
  const personalTargetItemType = validSection ? asPersonalTargetItemType(validSection) : undefined;

  useEffect(() => {
    if (!validSection || !detailView) {
      setImages([]);
      return;
    }
    void libraryService.listDetailImages(db, validSection, itemId).then((loaded) => setImages(loaded));
  }, [db, detailView, itemId, libraryService, validSection]);

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

  return (
    <AppShell title={`${sectionLabels[validSection]} Detail`} subtitle="Approved detail with related knowledge and source traceability.">
      <p><Link to={`/library/${validSection}`}>Back to {sectionLabels[validSection]}</Link></p>

      <section style={{ border: "1px solid #e5e7eb", borderRadius: "0.8rem", padding: "0.8rem", background: "#fff", marginBottom: "1rem" }}>
        <h3 style={{ margin: 0 }}>{detailView.title}</h3>
        <p style={{ margin: "0.4rem 0 0", color: "#4b5563" }}>
          Use this page as a quick engineering reference, then capture local item context in Personal Engineering Notes.
        </p>
      </section>

      {isGeoSection ? (
        <section style={{ border: "1px solid #dbeafe", borderRadius: "0.75rem", padding: "0.8rem", background: "#eff6ff", marginBottom: "1rem" }}>
          <h3 style={{ marginTop: 0, marginBottom: "0.45rem" }}>Primary Actions</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem" }}>
            <a href="#quick-engineering-view" style={{ padding: "0.35rem 0.6rem", borderRadius: "0.5rem", border: "1px solid #bfdbfe", background: "#fff", textDecoration: "none" }}>Read Quick Engineering View</a>
            {isGeoFeature ? <a href="#reporting-expressions" style={{ padding: "0.35rem 0.6rem", borderRadius: "0.5rem", border: "1px solid #bfdbfe", background: "#fff", textDecoration: "none" }}>Reuse Reporting Phrases</a> : null}
            <a href="#personal-notes" style={{ padding: "0.35rem 0.6rem", borderRadius: "0.5rem", border: "1px solid #bfdbfe", background: "#fff", textDecoration: "none" }}>Add Or Update Personal Note</a>
          </div>
          <p style={{ margin: "0.5rem 0 0", color: "#4b5563", fontSize: "0.9rem" }}>
            Personal notes are local and item-linked only; they never modify approved system or imported knowledge.
          </p>
        </section>
      ) : null}

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

      {isGeoSection ? <section style={{ border: "1px solid #e5e7eb", borderRadius: "0.75rem", padding: "0.8rem", background: "#fff", marginBottom: "1rem" }}><h3 style={{ marginTop: 0 }}>Field Images</h3>{images.length === 0 ? <p>No linked images.</p> : images[0].previewUrl ? <img src={images[0].previewUrl} alt={images[0].caption ?? images[0].fileName ?? images[0].imageAssetId} style={{ width: "100%", maxHeight: "360px", objectFit: "contain", borderRadius: "0.5rem" }} /> : <p>No preview.</p>}</section> : null}

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
          <p style={{ margin: "0.25rem 0 0", color: "#374151" }}>User-owned local notes for this item only. These notes do not modify approved/system knowledge.</p>
          <p style={{ margin: "0.3rem 0 0", color: "#4b5563", fontSize: "0.9rem" }}>
            Use notes for field observations, local risk reminders, and planned actions for this exact item context.
          </p>
          <p style={{ margin: "0.35rem 0 0", color: "#6b7280", fontSize: "0.9rem" }}>Type/status save immediately. Body saves on blur; use Save body now to save explicitly.</p>

          <section style={{ marginTop: "0.7rem", border: "1px solid #dbeafe", borderRadius: "0.6rem", padding: "0.6rem", background: "#eff6ff" }}>
            <p style={{ margin: 0, fontWeight: 600 }}>Add personal note</p>
            <div style={{ marginTop: "0.45rem", display: "grid", gap: "0.5rem", gridTemplateColumns: "180px 1fr" }}>
              <select value={personalNoteType} onChange={(event) => setPersonalNoteType(event.target.value as PersonalNoteType)} disabled={personalNotesSaving}>
                {personalNoteTypes.map((noteType) => <option key={noteType} value={noteType}>{formatPersonalNoteType(noteType)}</option>)}
              </select>
              <textarea value={personalNoteBody} onChange={(event) => setPersonalNoteBody(event.target.value)} rows={3} placeholder="Concise site note for this item" disabled={personalNotesSaving} />
            </div>
            <div style={{ marginTop: "0.5rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <button type="button" onClick={() => void handleCreatePersonalNote()} disabled={personalNotesSaving || !personalNoteBody.trim()}>Add personal note</button>
              <button type="button" disabled>Attach personal photo (coming soon)</button>
              <button type="button" disabled>Link to other items (coming soon)</button>
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
                  <div style={{ display: "grid", gap: "0.45rem", gridTemplateColumns: "180px 150px 1fr" }}>
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
                    <div style={{ display: "flex", gap: "0.4rem" }}>
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
                  <div style={{ marginTop: "0.45rem", display: "flex", justifyContent: "space-between", color: "#6b7280", fontSize: "0.86rem" }}>
                    <span>Created: {formatPersonalNoteTimestamp(note.createdAt)}</span>
                    <button type="button" onClick={() => void handleUpdatePersonalNote(note, { noteType: note.noteType, body: note.body, status: "active" })} disabled={personalNotesSaving}>Restore to active</button>
                  </div>
                </article>
              );
            })}
          </section>
        </section>
      ) : null}

      {!isGeoSection ? <section style={{ border: "1px solid #e5e7eb", borderRadius: "0.75rem", padding: "0.8rem", background: "#fff", marginBottom: "1rem" }}><h3 style={{ marginTop: 0 }}>Images</h3>{images.length === 0 ? <p>No linked images.</p> : <p>{images.length} linked image(s).</p>}</section> : null}

      {isGeoSection ? (
        <section style={{ border: "1px solid #e5e7eb", borderRadius: "0.75rem", padding: "0.8rem", background: "#fff", marginBottom: "1rem" }}>
          <h3 style={{ marginTop: 0 }}>Related Knowledge</h3>
          {renderRelationGroups(detailView.relationGroups)}
        </section>
      ) : null}

      <section style={{ border: "1px solid #e5e7eb", borderRadius: "0.75rem", padding: "0.8rem", background: "#fff" }}>
        <h3 style={{ marginTop: 0 }}>Source Traceability</h3>
        {detailView.record.sources.length === 0 ? <p>No source trace found for this item.</p> : null}
        <div style={{ display: "grid", gap: "0.6rem" }}>
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
      </section>

      {isGeoSection ? (
        <section style={{ border: "1px solid #dbeafe", borderRadius: "0.75rem", padding: "0.8rem", background: "#eff6ff", marginTop: "1rem" }}>
          <h3 style={{ marginTop: 0, marginBottom: "0.45rem" }}>MVP Use Check (This Detail Page)</h3>
          <ol style={{ margin: 0, paddingLeft: "1.15rem", display: "grid", gap: "0.28rem" }}>
            <li>Read Quick Engineering View first for risks and recommended actions.</li>
            {isGeoFeature ? <li>Copy a reporting/inspection phrase and adapt it in your note/report.</li> : null}
            <li>Add or update one personal note linked to this item.</li>
            <li>Archive and restore one note to confirm note lifecycle behavior.</li>
            <li>Confirm source traceability and provenance remain in approved knowledge sections only.</li>
          </ol>
          <p style={{ margin: "0.45rem 0 0", color: "#6b7280", fontSize: "0.9rem" }}>
            Deferred in current MVP: personal images and global personal-note search.
          </p>
        </section>
      ) : null}
    </AppShell>
  );
}
