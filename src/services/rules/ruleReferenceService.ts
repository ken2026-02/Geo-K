import {
  geoFeatureCategories,
  geoFeatureSubtypes,
  geoMaterialCategories,
  geoMaterialSubtypes,
  objectTypes,
  provenanceTypes,
  strategyCategories
} from "../../shared/classification";

export interface EntityRuleReference {
  entityType: "geo_materials" | "geo_features" | "strategies";
  requiredFields: string[];
  optionalFields: string[];
  enumFields: Array<{ field: string; values: readonly string[] }>;
  missingFieldBehavior: {
    required: "blocks_import";
    optional: "allowed";
    knownWarningCase?: string;
  };
}

export interface ClassificationRuleReference {
  supportedEntityTypes: readonly string[];
  browseSections: Array<{ section: string; entityTypes: string[]; notes?: string }>;
  categorySubtypeGroupings: Array<{ entityType: string; categoryField: string; subtypeField: string; categories: readonly string[]; subtypes: readonly string[] }>;
  relationSupport: {
    relatedItemTypes: readonly string[];
    knownRelationFamilies: string[];
  };
  provenance: {
    userImported: string[];
    systemKnowledge: string[];
  };
}

export interface ValidationRuleContext {
  code: string;
  ruleCategory: string;
  explanation: string;
  relevance: string;
}

export interface RuleCenterReference {
  entities: EntityRuleReference[];
  classification: ClassificationRuleReference;
  validationContexts: ValidationRuleContext[];
}

const entityRules: EntityRuleReference[] = [
  {
    entityType: "geo_materials",
    requiredFields: ["id", "canonical_name", "source_ref.section", "source_ref.sentence"],
    optionalFields: [
      "chinese_name",
      "geo_material_category",
      "geo_material_subtype",
      "description",
      "identification_method",
      "distinguishing_points",
      "common_misidentifications",
      "engineering_significance",
      "common_risks",
      "common_treatments",
      "australia_context",
      "confidence"
    ],
    enumFields: [
      { field: "geo_material_category", values: geoMaterialCategories },
      { field: "geo_material_subtype", values: geoMaterialSubtypes }
    ],
    missingFieldBehavior: {
      required: "blocks_import",
      optional: "allowed",
      knownWarningCase: "No images in pack -> warning only (not entity-specific)."
    }
  },
  {
    entityType: "geo_features",
    requiredFields: ["id", "canonical_name", "source_ref.section", "source_ref.sentence"],
    optionalFields: [
      "chinese_name",
      "geo_feature_category",
      "geo_feature_subtype",
      "description",
      "identification_method",
      "distinguishing_points",
      "common_causes",
      "risk_implications",
      "treatment_or_mitigation",
      "reporting_expressions",
      "inspection_points",
      "confidence"
    ],
    enumFields: [
      { field: "geo_feature_category", values: geoFeatureCategories },
      { field: "geo_feature_subtype", values: geoFeatureSubtypes }
    ],
    missingFieldBehavior: {
      required: "blocks_import",
      optional: "allowed",
      knownWarningCase: "No images in pack -> warning only (not entity-specific)."
    }
  },
  {
    entityType: "strategies",
    requiredFields: ["id", "canonical_name", "source_ref.section", "source_ref.sentence"],
    optionalFields: [
      "chinese_name",
      "strategy_category",
      "description",
      "steps_or_method",
      "application_conditions",
      "limitations",
      "confidence"
    ],
    enumFields: [{ field: "strategy_category", values: strategyCategories }],
    missingFieldBehavior: {
      required: "blocks_import",
      optional: "allowed",
      knownWarningCase: "No images in pack -> warning only (not entity-specific)."
    }
  }
];

const classificationRules: ClassificationRuleReference = {
  supportedEntityTypes: objectTypes,
  browseSections: [
    { section: "Library: Geo Materials", entityTypes: ["geo_material"], notes: "Category/subtype filters are active." },
    { section: "Library: Features", entityTypes: ["geo_feature"], notes: "Category/subtype filters are active." },
    { section: "Library: Strategies", entityTypes: ["strategy"], notes: "No standalone section yet; exposed via related knowledge." }
  ],
  categorySubtypeGroupings: [
    {
      entityType: "geo_material",
      categoryField: "geo_material_category",
      subtypeField: "geo_material_subtype",
      categories: geoMaterialCategories,
      subtypes: geoMaterialSubtypes
    },
    {
      entityType: "geo_feature",
      categoryField: "geo_feature_category",
      subtypeField: "geo_feature_subtype",
      categories: geoFeatureCategories,
      subtypes: geoFeatureSubtypes
    }
  ],
  relationSupport: {
    relatedItemTypes: ["word", "phrase", "sentence", "geo_material", "geo_feature", "strategy"],
    knownRelationFamilies: [
      "sentence -> phrase / word (contains_*)",
      "feature -> material (related_material)",
      "feature -> strategy (recommended_strategy)",
      "cross-item links via item_relations"
    ]
  },
  provenance: {
    userImported: ["imported_ai", "manual_user", "merged"],
    systemKnowledge: ["system_generated"].concat(provenanceTypes.includes("restored_backup") ? ["restored_backup"] : [])
  }
};

const validationContexts: ValidationRuleContext[] = [
  {
    code: "validation_error",
    ruleCategory: "Schema / Field Contract",
    explanation: "A required field, enum value, or cross-field contract from the knowledge-pack schema failed.",
    relevance: "Blocks import staging."
  },
  {
    code: "parse_error",
    ruleCategory: "JSON Structure",
    explanation: "The payload is not valid JSON or cannot be parsed into the schema contract.",
    relevance: "Blocks import staging."
  },
  {
    code: "transaction_error",
    ruleCategory: "Staging Transaction Safety",
    explanation: "Validation passed, but pending staging transaction failed and was rolled back.",
    relevance: "Blocks pending staging for that attempt."
  },
  {
    code: "missing_optional_field",
    ruleCategory: "Optional Content Rule",
    explanation: "Current validator emits this when optional image content is absent.",
    relevance: "Warning only; import remains valid_with_warnings."
  },
  {
    code: "missing_image_file",
    ruleCategory: "Image File Resolution",
    explanation: "Referenced image metadata exists but corresponding file is unavailable.",
    relevance: "Warning; image record can fail while non-image items still stage."
  },
  {
    code: "partial_image_failure",
    ruleCategory: "Image Processing",
    explanation: "Image processing or image metadata registration failed for at least one image.",
    relevance: "Warning path for partial image issues."
  }
];

export class RuleReferenceService {
  getRuleCenterReference(): RuleCenterReference {
    return {
      entities: entityRules,
      classification: classificationRules,
      validationContexts
    };
  }

  getValidationContext(code: string): ValidationRuleContext | undefined {
    return validationContexts.find((entry) => entry.code === code);
  }
}
