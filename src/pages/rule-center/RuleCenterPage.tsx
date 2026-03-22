import { AppShell } from "../../shared/ui/layout/AppShell";
import { RuleReferenceService } from "../../services/rules/ruleReferenceService";

export function RuleCenterPage() {
  const reference = new RuleReferenceService().getRuleCenterReference();

  return (
    <AppShell
      title="Rule Center"
      subtitle="Current validation and classification rules."
    >
      <section style={{ marginBottom: "1rem", padding: "0.8rem", border: "1px solid #e5e7eb", borderRadius: "0.75rem", background: "#fff" }}>
        <h3 style={{ marginTop: 0 }}>Entity Validation Rules</h3>
        <p style={{ marginTop: 0, color: "#4b5563" }}>Exposes current schema-backed rules for importable engineering entities. Required-field failures block import.</p>
        <div style={{ display: "grid", gap: "0.8rem" }}>
          {reference.entities.map((entity) => (
            <article key={entity.entityType} style={{ border: "1px solid #e5e7eb", borderRadius: "0.65rem", padding: "0.7rem", background: "#fafaf9" }}>
              <p style={{ margin: 0 }}><strong>{entity.entityType}</strong></p>
              <p style={{ margin: "0.35rem 0 0" }}><strong>Required fields:</strong> {entity.requiredFields.join(", ")}</p>
              <p style={{ margin: "0.35rem 0 0" }}><strong>Optional fields:</strong> {entity.optionalFields.join(", ")}</p>
              <p style={{ margin: "0.35rem 0 0" }}><strong>Missing required:</strong> blocks import</p>
              <p style={{ margin: "0.25rem 0 0" }}><strong>Missing optional:</strong> allowed</p>
              {entity.missingFieldBehavior.knownWarningCase ? <p style={{ margin: "0.25rem 0 0", color: "#4b5563" }}><strong>Known warning-only case:</strong> {entity.missingFieldBehavior.knownWarningCase}</p> : null}
              <div style={{ marginTop: "0.4rem" }}>
                <strong>Enum-backed fields</strong>
                <ul style={{ margin: "0.25rem 0 0", paddingLeft: "1.2rem" }}>
                  {entity.enumFields.map((field) => (
                    <li key={`${entity.entityType}-${field.field}`}>{field.field} ({field.values.length} values)</li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section style={{ marginBottom: "1rem", padding: "0.8rem", border: "1px solid #e5e7eb", borderRadius: "0.75rem", background: "#fff" }}>
        <h3 style={{ marginTop: 0 }}>Classification and Type Rules</h3>
        <p style={{ marginTop: 0, color: "#4b5563" }}>Shows currently used type system and browse/detail groupings. This section is descriptive only.</p>
        <p style={{ margin: "0.3rem 0 0" }}><strong>Supported entity types:</strong> {reference.classification.supportedEntityTypes.join(", ")}</p>
        <div style={{ marginTop: "0.6rem" }}>
          <strong>Browse / detail structure</strong>
          <ul style={{ margin: "0.25rem 0 0", paddingLeft: "1.2rem" }}>
            {reference.classification.browseSections.map((section) => (
              <li key={section.section}>{section.section} {"->"} {section.entityTypes.join(", ")}{section.notes ? ` | ${section.notes}` : ""}</li>
            ))}
          </ul>
        </div>
        <div style={{ marginTop: "0.6rem" }}>
          <strong>Category / subtype groupings</strong>
          <ul style={{ margin: "0.25rem 0 0", paddingLeft: "1.2rem" }}>
            {reference.classification.categorySubtypeGroupings.map((group) => (
              <li key={group.entityType}>
                {group.entityType}: {group.categoryField} ({group.categories.length}) + {group.subtypeField} ({group.subtypes.length})
              </li>
            ))}
          </ul>
        </div>
        <p style={{ margin: "0.55rem 0 0" }}><strong>Relation-related item types:</strong> {reference.classification.relationSupport.relatedItemTypes.join(", ")}</p>
        <ul style={{ margin: "0.25rem 0 0", paddingLeft: "1.2rem" }}>
          {reference.classification.relationSupport.knownRelationFamilies.map((family) => (
            <li key={family}>{family}</li>
          ))}
        </ul>
        <p style={{ margin: "0.55rem 0 0" }}><strong>Provenance (user/imported):</strong> {reference.classification.provenance.userImported.join(", ")}</p>
        <p style={{ margin: "0.25rem 0 0" }}><strong>Provenance (system knowledge):</strong> {reference.classification.provenance.systemKnowledge.join(", ")}</p>
      </section>

      <section style={{ padding: "0.8rem", border: "1px solid #e5e7eb", borderRadius: "0.75rem", background: "#fff" }}>
        <h3 style={{ marginTop: 0 }}>Validation Result Interpretation</h3>
        <p style={{ marginTop: 0, color: "#4b5563" }}>Use these mappings to interpret validation outcomes and decide which rule category to inspect.</p>
        <ul style={{ margin: 0, paddingLeft: "1.2rem" }}>
          {reference.validationContexts.map((context) => (
            <li key={context.code}>
              <strong>{context.code}</strong> {"->"} {context.ruleCategory}. {context.explanation} {context.relevance}
            </li>
          ))}
        </ul>
      </section>
    </AppShell>
  );
}

