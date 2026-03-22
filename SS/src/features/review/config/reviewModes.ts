export interface ReviewModeDefinition {
  id: "word-review" | "phrase-review" | "sentence-review" | "geo-material-review" | "geo-feature-review";
  label: string;
  description: string;
}

export const reviewModes: ReviewModeDefinition[] = [
  {
    id: "word-review",
    label: "Word Review",
    description: "Recall meaning, recognize category, and see example sentence for approved word items."
  },
  {
    id: "phrase-review",
    label: "Phrase Review",
    description: "Recall phrase meaning, identify usage scenario, and review related context."
  },
  {
    id: "sentence-review",
    label: "Sentence Review",
    description: "Identify sentence function, scenario, and reusable reporting patterns."
  },
  {
    id: "geo-material-review",
    label: "Geo Material Review",
    description: "Review identification methods, risks, and treatments for approved geo materials."
  },
  {
    id: "geo-feature-review",
    label: "Geo Feature Review",
    description: "Review distinguishing points, engineering risks, and treatments for approved geo features."
  }
];
