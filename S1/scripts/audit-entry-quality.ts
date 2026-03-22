import { readFileSync } from "node:fs";
import { basename, resolve } from "node:path";

type Severity = "warning" | "error";

interface Issue {
  severity: Severity;
  code: string;
  message: string;
}

interface ItemAuditResult {
  id: string;
  type: string;
  issues: Issue[];
}

function asText(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((entry) => String(entry).trim()).filter((entry) => entry.length > 0);
}

function parseJson(filePath: string): unknown {
  return JSON.parse(readFileSync(filePath, "utf8")) as unknown;
}

function issue(severity: Severity, code: string, message: string): Issue {
  return { severity, code, message };
}

function auditLearningItem(item: Record<string, unknown>, packSourceReport?: string): ItemAuditResult {
  const type = asText(item.type) ?? "unknown";
  const id = asText(item.id) ?? "(missing-id)";
  const content = asText(item.content);
  const meaning = asText(item.meaning);
  const example = asText(item.example);
  const note = asText(item.note);
  const domain = asText(item.domain);
  const tags = asStringArray(item.tags);
  const sourceReport = asText(item.source_report) ?? packSourceReport;
  const issues: Issue[] = [];

  if (!content) {
    issues.push(issue("error", "missing_content", "Missing primary content."));
  }

  if (!sourceReport) {
    issues.push(issue("warning", "missing_source_report", "Missing source report reference."));
  }

  if (tags.length === 0) {
    issues.push(issue("warning", "missing_tags", "No tags provided."));
  }

  if (!domain) {
    issues.push(issue("warning", "missing_domain", "No domain/category set."));
  }

  if (type === "word") {
    if (!meaning) issues.push(issue("warning", "missing_meaning", "Word is missing meaning."));
    if (!example && !note) issues.push(issue("warning", "missing_usage_support", "Word has neither example nor note."));
  } else if (type === "phrase") {
    if (!meaning && !note) issues.push(issue("warning", "missing_meaning", "Phrase has no meaning/explanation cue."));
    if (!example) issues.push(issue("warning", "missing_example", "Phrase is missing example usage."));
  } else if (type === "sentence") {
    if (!meaning && !note) issues.push(issue("warning", "missing_interpretation", "Sentence has no translation or usage note."));
  } else if (type === "concept") {
    if (!meaning) issues.push(issue("warning", "missing_meaning", "Concept is missing takeaway/meaning."));
    if (!note && !example) issues.push(issue("warning", "missing_application", "Concept is missing note/example application."));
  } else {
    issues.push(issue("warning", "unknown_type", `Unknown learning item type '${type}'.`));
  }

  return { id, type, issues };
}

function auditKnowledgeItems(sectionName: string, items: unknown[]): ItemAuditResult[] {
  return items.map((raw, index) => {
    const item = (raw ?? {}) as Record<string, unknown>;
    const id = asText(item.id) ?? `${sectionName}-${index + 1}`;
    const issues: Issue[] = [];

    if (sectionName === "words") {
      if (!asText(item.canonical_word)) issues.push(issue("error", "missing_content", "Missing canonical word."));
      if (!asText(item.chinese_meaning)) issues.push(issue("warning", "missing_chinese_meaning", "Missing Chinese meaning."));
      if (!asText(item.english_definition) && !asText(item.example_sentence)) issues.push(issue("warning", "missing_usage_support", "Missing definition and example."));
      if (!asText(item.language_category)) issues.push(issue("warning", "missing_language_category", "Missing language category."));
    } else if (sectionName === "phrases") {
      if (!asText(item.canonical_phrase)) issues.push(issue("error", "missing_content", "Missing canonical phrase."));
      if (!asText(item.chinese_meaning)) issues.push(issue("warning", "missing_chinese_meaning", "Missing Chinese meaning."));
      if (!asText(item.explanation) && !asText(item.example_sentence)) issues.push(issue("warning", "missing_usage_support", "Missing explanation and example."));
    } else if (sectionName === "sentences") {
      if (!asText(item.canonical_sentence)) issues.push(issue("error", "missing_content", "Missing canonical sentence."));
      if (!asText(item.chinese_literal) && !asText(item.chinese_natural)) issues.push(issue("warning", "missing_translation", "Missing Chinese translation."));
    } else if (sectionName === "strategies") {
      if (!asText(item.canonical_name)) issues.push(issue("error", "missing_content", "Missing strategy name."));
      if (!asText(item.description) && !asText(item.steps_or_method)) issues.push(issue("warning", "missing_description", "Missing description and steps."));
      if (!asText(item.strategy_category)) issues.push(issue("warning", "missing_category", "Missing strategy category."));
    }

    const sourceRef = (item.source_ref ?? {}) as Record<string, unknown>;
    if (!asText(sourceRef.section) || !asText(sourceRef.sentence)) {
      issues.push(issue("warning", "missing_source_ref", "Missing source_ref.section or source_ref.sentence."));
    }

    return { id, type: sectionName, issues };
  });
}

function auditTransformationCandidate(candidate: Record<string, unknown>): ItemAuditResult {
  const id = asText(candidate.candidate_id) ?? "(missing-candidate-id)";
  const type = asText(candidate.proposed_target_type) ?? "unknown";
  const proposedFields = ((candidate.proposed_fields ?? {}) as Record<string, unknown>);
  const issues: Issue[] = [];

  if (!asText(candidate.reviewer_decision)) {
    issues.push(issue("warning", "missing_reviewer_decision", "Missing reviewer decision field."));
  }

  if (type === "geo_feature" || type === "geo_material") {
    if (!asText(proposedFields.name)) issues.push(issue("error", "missing_name", "Missing proposed name."));
    if (!asText(proposedFields.category)) issues.push(issue("warning", "missing_category", "Missing proposed category."));
    if (!asText(proposedFields.description)) issues.push(issue("warning", "missing_description", "Missing proposed description."));
    if (asStringArray(proposedFields.reporting_expressions).length === 0) issues.push(issue("warning", "missing_reporting_expressions", "No reporting expressions proposed."));
  } else if (type === "strategy") {
    if (!asText(proposedFields.name)) issues.push(issue("error", "missing_name", "Missing strategy name."));
    if (!asText(proposedFields.category)) issues.push(issue("warning", "missing_category", "Missing strategy category."));
    if (asStringArray(proposedFields.actions).length === 0 && !asText(proposedFields.description)) issues.push(issue("warning", "missing_action_detail", "Missing actions/description for strategy."));
  }

  if (asStringArray(candidate.supporting_learning_item_ids).length === 0) {
    issues.push(issue("warning", "missing_supporting_items", "No supporting learning item ids attached."));
  }

  return { id, type: `transformation:${type}`, issues };
}

function summarize(results: ItemAuditResult[]) {
  const summary = {
    items: results.length,
    errors: 0,
    warnings: 0
  };

  for (const result of results) {
    for (const entry of result.issues) {
      if (entry.severity === "error") summary.errors += 1;
      if (entry.severity === "warning") summary.warnings += 1;
    }
  }

  return summary;
}

function auditFile(filePath: string) {
  const parsed = parseJson(filePath) as Record<string, unknown>;
  const fileName = basename(filePath);

  if (Array.isArray(parsed.items)) {
    const rootSourceReport = asText(((parsed.source_report ?? {}) as Record<string, unknown>).report_id)
      ?? asText(((parsed.source_report ?? {}) as Record<string, unknown>).title);
    const results = parsed.items.map((item) => auditLearningItem(item as Record<string, unknown>, rootSourceReport));
    return {
      file: fileName,
      kind: "learning-pack",
      summary: summarize(results),
      findings: results.filter((result) => result.issues.length > 0)
    };
  }

  if (parsed.items && typeof parsed.items === "object") {
    const itemGroups = parsed.items as Record<string, unknown>;
    const sections = ["words", "phrases", "sentences", "strategies"] as const;
    const results = sections.flatMap((section) => auditKnowledgeItems(section, Array.isArray(itemGroups[section]) ? itemGroups[section] as unknown[] : []));
    return {
      file: fileName,
      kind: "knowledge-pack",
      summary: summarize(results),
      findings: results.filter((result) => result.issues.length > 0)
    };
  }

  if (Array.isArray(parsed.candidates)) {
    const results = parsed.candidates.map((candidate) => auditTransformationCandidate(candidate as Record<string, unknown>));
    return {
      file: fileName,
      kind: "transformation-review-pack",
      summary: summarize(results),
      findings: results.filter((result) => result.issues.length > 0)
    };
  }

  throw new Error(`Unsupported file format: ${fileName}`);
}

function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    throw new Error("Usage: npx tsx scripts/audit-entry-quality.ts <json-file> [json-file...]");
  }

  const reports = args.map((arg) => auditFile(resolve(process.cwd(), arg)));
  console.log(JSON.stringify(reports, null, 2));
}

main();
