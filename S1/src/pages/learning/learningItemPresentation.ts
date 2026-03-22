import type { LearningItemRecord, LearningItemType } from "../../data/repositories/interfaces";

export interface LearningFieldConfig {
  contentLabel: string;
  contentPlaceholder: string;
  meaningLabel: string;
  meaningPlaceholder: string;
  exampleLabel: string;
  examplePlaceholder: string;
  noteLabel: string;
  notePlaceholder: string;
}

export interface LearningDetailRow {
  label: string;
  value: string;
}

export interface LearningSignalChip {
  label: string;
  className: string;
}

const genericFieldConfig: LearningFieldConfig = {
  contentLabel: "Content",
  contentPlaceholder: "Enter the main learning content",
  meaningLabel: "Meaning",
  meaningPlaceholder: "Add a concise explanation",
  exampleLabel: "Example",
  examplePlaceholder: "Add an example or use case",
  noteLabel: "Note",
  notePlaceholder: "Add an optional note"
};

const fieldConfigByType: Partial<Record<LearningItemType, LearningFieldConfig>> = {
  requirement: {
    contentLabel: "Requirement Text",
    contentPlaceholder: "Paste the rule, clause, or minimum requirement",
    meaningLabel: "Plain-Language Summary",
    meaningPlaceholder: "Summarize what the requirement means in practice",
    exampleLabel: "Trigger Or Verification",
    examplePlaceholder: "Describe when it applies or how it is checked",
    noteLabel: "Governance Note",
    notePlaceholder: "Record exceptions, references, or related cautions"
  },
  method: {
    contentLabel: "Method Title Or Step",
    contentPlaceholder: "Name the test, procedure, or workflow",
    meaningLabel: "Purpose",
    meaningPlaceholder: "Describe what this method is for",
    exampleLabel: "Key Steps",
    examplePlaceholder: "Capture the sequence, setup, or workflow highlights",
    noteLabel: "Execution Note",
    notePlaceholder: "Record cautions, constraints, or interpretation notes"
  },
  classification_rule: {
    contentLabel: "Rule Statement",
    contentPlaceholder: "Write the threshold or naming rule",
    meaningLabel: "Interpretation",
    meaningPlaceholder: "Explain what the rule is deciding",
    exampleLabel: "Threshold Or Outcome",
    examplePlaceholder: "Record the boundary, range, or resulting label",
    noteLabel: "Exception Or Edge Case",
    notePlaceholder: "Capture edge cases, table references, or exceptions"
  },
  table_entry: {
    contentLabel: "Table Row",
    contentPlaceholder: "Describe the row heading or decision line",
    meaningLabel: "Row Meaning",
    meaningPlaceholder: "Summarize what the row represents",
    exampleLabel: "Condition To Result",
    examplePlaceholder: "Capture the input condition and resulting output",
    noteLabel: "Table Note",
    notePlaceholder: "Store footnotes, assumptions, or caveats"
  }
};

export function getLearningFieldConfig(type: LearningItemType): LearningFieldConfig {
  return fieldConfigByType[type] ?? genericFieldConfig;
}

export function getLearningTypeBadgeClasses(type: LearningItemType): string {
  switch (type) {
    case "requirement":
      return "bg-rose-50 text-rose-700 ring-1 ring-rose-200";
    case "method":
      return "bg-sky-50 text-sky-700 ring-1 ring-sky-200";
    case "classification_rule":
      return "bg-violet-50 text-violet-700 ring-1 ring-violet-200";
    case "table_entry":
      return "bg-teal-50 text-teal-700 ring-1 ring-teal-200";
    case "concept":
      return "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200";
    case "sentence":
      return "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200";
    case "phrase":
      return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
    case "word":
    default:
      return "bg-slate-100 text-slate-700 ring-1 ring-slate-200";
  }
}

export function getLearningSummaryText(item: LearningItemRecord): string | undefined {
  if (item.meaning) {
    return item.meaning;
  }
  if (item.example) {
    return item.example;
  }
  if (item.note) {
    return item.note;
  }
  return undefined;
}

export function getLearningDetailRows(item: LearningItemRecord): LearningDetailRow[] {
  const config = getLearningFieldConfig(item.type);
  const rows: LearningDetailRow[] = [
    { label: "Original", value: item.content }
  ];

  if (item.meaning) {
    rows.push({ label: config.meaningLabel, value: item.meaning });
  }
  if (item.example) {
    rows.push({ label: config.exampleLabel, value: item.example });
  }
  if (item.note) {
    rows.push({ label: config.noteLabel, value: item.note });
  }
  if (item.tags && item.tags.length > 0) {
    rows.push({ label: "Tags", value: item.tags.join(", ") });
  }
  if (item.sourceReport) {
    rows.push({ label: "Source", value: item.sourceReport });
  }

  return rows;
}

export function getLearningSignalChips(item: LearningItemRecord): LearningSignalChip[] {
  const config = getLearningFieldConfig(item.type);
  const chips: LearningSignalChip[] = [];

  if (item.meaning) {
    chips.push({
      label: config.meaningLabel,
      className: "bg-indigo-50 text-indigo-700"
    });
  }
  if (item.example) {
    chips.push({
      label: config.exampleLabel,
      className: "bg-amber-50 text-amber-700"
    });
  }
  if (item.note) {
    chips.push({
      label: config.noteLabel,
      className: "bg-cyan-50 text-cyan-700"
    });
  }
  if (item.tags && item.tags.length > 0) {
    chips.push({
      label: "Tags",
      className: "bg-emerald-50 text-emerald-700"
    });
  }
  if (item.sourceReport) {
    chips.push({
      label: "Source",
      className: "bg-slate-100 text-slate-600"
    });
  }

  return chips;
}
