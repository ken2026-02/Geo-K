export const objectTypes = [
  "word",
  "phrase",
  "sentence",
  "geo_material",
  "geo_feature",
  "strategy",
  "requirement",
  "method",
  "image",
  "report"
] as const;

export const languageCategories = [
  "geology",
  "geotechnical",
  "support",
  "concrete",
  "qa",
  "monitoring",
  "construction",
  "material",
  "defect",
  "abbreviation",
  "unit",
  "general_engineering_verb",
  "general_reporting",
  "low_value"
] as const;

export const phraseTypes = [
  "noun_phrase",
  "verb_phrase",
  "adjective_phrase",
  "prepositional_phrase",
  "reporting_phrase",
  "caution_phrase",
  "multiword_term"
] as const;

export const functionTypes = [
  "observation",
  "interpretation",
  "risk",
  "recommendation",
  "limitation",
  "conclusion",
  "definition",
  "identification",
  "treatment",
  "monitoring"
] as const;

export const scenarioTypes = [
  "mapping",
  "inspection",
  "support",
  "concrete",
  "qa",
  "design",
  "handover",
  "monitoring",
  "procurement",
  "email",
  "general"
] as const;

export const sentenceTypes = [
  "observation_sentence",
  "interpretation_sentence",
  "risk_sentence",
  "recommendation_sentence",
  "limitation_sentence",
  "conclusion_sentence",
  "definition_sentence",
  "identification_sentence",
  "treatment_sentence",
  "monitoring_sentence"
] as const;

export const geoMaterialCategories = [
  "rock",
  "soil",
  "weathering_profile",
  "infill_material",
  "mineral",
  "alteration",
  "groundwater_indicator",
  "mixed_material",
  "unknown_material"
] as const;

export const geoMaterialSubtypes = [
  "igneous",
  "sedimentary",
  "metamorphic",
  "volcanic",
  "intrusive",
  "extrusive",
  "pyroclastic",
  "porphyritic",
  "residual_rock",
  "highly_weathered_rock",
  "unknown_rock",
  "clay",
  "silt",
  "sand",
  "gravel",
  "cobble",
  "boulder",
  "mixed_soil",
  "fill",
  "colluvium",
  "alluvium",
  "residual_soil",
  "soft_ground",
  "unknown_soil",
  "fresh",
  "slightly_weathered",
  "moderately_weathered",
  "highly_weathered",
  "completely_weathered",
  "residual_profile",
  "decomposed_material",
  "unknown_weathering",
  "clay_infill",
  "silt_infill",
  "sandy_infill",
  "gouge",
  "crushed_material",
  "calcite_infill",
  "quartz_infill",
  "iron_oxide_infill",
  "mixed_infill",
  "soft_infill",
  "hard_infill",
  "unknown_infill",
  "quartz",
  "calcite",
  "pyrite",
  "chlorite",
  "clay_mineral",
  "iron_oxide",
  "sulfide",
  "unknown_mineral",
  "oxidized",
  "silicified",
  "chloritized",
  "argillic",
  "weathered_alteration",
  "unknown_alteration",
  "seepage_related",
  "staining_related",
  "softening_related",
  "leaching_related",
  "wet_zone_related",
  "unknown_groundwater_indicator"
] as const;

export const geoFeatureCategories = [
  "structural_feature",
  "discontinuity_condition",
  "instability_feature",
  "water_feature",
  "blasting_feature",
  "excavation_feature",
  "support_defect",
  "concrete_defect",
  "surface_condition",
  "unknown_feature"
] as const;

export const geoFeatureSubtypes = [
  "joint",
  "fault",
  "shear_zone",
  "bedding",
  "foliation",
  "vein",
  "slickenside",
  "fracture_network",
  "crushed_zone",
  "contact_zone",
  "unknown_structural_feature",
  "open_joint",
  "persistent_joint",
  "closely_spaced_jointing",
  "infilled_joint",
  "slickensided_surface",
  "rough_joint_surface",
  "weathered_joint_surface",
  "altered_joint_surface",
  "wide_aperture",
  "tight_joint",
  "unknown_discontinuity_condition",
  "wedge",
  "detached_block",
  "detached_rock",
  "ravelling",
  "unraveling",
  "loosened_ground",
  "blocky_ground",
  "unsupported_span",
  "scaling_hazard",
  "cavity",
  "void",
  "overhang",
  "rockfall_source",
  "unknown_instability_feature",
  "seepage",
  "dripping",
  "flowing_water",
  "wet_patch",
  "wet_zone",
  "staining",
  "leaching",
  "softened_zone",
  "water_path",
  "ponding",
  "unknown_water_feature",
  "blast_damage",
  "overbreak",
  "underbreak",
  "loosened_zone",
  "blast_induced_crack",
  "backbreak",
  "disturbed_zone",
  "unknown_blasting_feature",
  "brow_condition",
  "shoulder_condition",
  "wall_condition",
  "crown_condition",
  "invert_condition",
  "pillar_condition",
  "face_condition",
  "geometry_irregularity",
  "unknown_excavation_feature",
  "mesh_exposure",
  "poor_encapsulation",
  "debonding",
  "cracked_shotcrete",
  "damaged_plate",
  "loose_mesh",
  "bolt_issue",
  "corrosion",
  "missing_support",
  "support_gap",
  "water_behind_support",
  "unknown_support_defect",
  "honeycombing",
  "blowhole",
  "segregation",
  "void",
  "cracking",
  "delamination",
  "surface_scaling",
  "poor_finish",
  "cold_joint",
  "leakage_path",
  "unknown_concrete_defect",
  "rough_surface",
  "smooth_surface",
  "weathered_surface",
  "stained_surface",
  "soft_surface",
  "broken_surface",
  "uneven_surface",
  "altered_surface",
  "unknown_surface_condition"
] as const;

export const strategyCategories = [
  "identification_method",
  "inspection_method",
  "temporary_control",
  "permanent_treatment",
  "monitoring_requirement",
  "reporting_strategy",
  "sampling_method",
  "testing_method",
  "maintenance_action",
  "unknown_strategy"
] as const;

export const requirementCategories = [
  "design_requirement",
  "investigation_requirement",
  "classification_requirement",
  "testing_requirement",
  "reporting_requirement",
  "safety_requirement",
  "documentation_requirement",
  "compliance_requirement",
  "acceptance_requirement",
  "unknown_requirement"
] as const;

export const methodCategories = [
  "field_method",
  "laboratory_method",
  "classification_method",
  "investigation_method",
  "inspection_method",
  "analysis_method",
  "reporting_method",
  "sampling_method",
  "verification_method",
  "unknown_method"
] as const;

export const authorityLevels = [
  "mandatory",
  "adopted_standard",
  "agency_requirement",
  "agency_guidance",
  "industry_guidance",
  "reference_only"
] as const;

export const sourceDocumentTypes = [
  "standard",
  "manual",
  "code_of_practice",
  "specification",
  "guideline",
  "technical_note",
  "reference_pack",
  "other"
] as const;

export const sourceDocumentStatuses = [
  "current",
  "superseded",
  "draft",
  "archived"
] as const;

export const provenanceTypes = [
  "imported_ai",
  "manual_user",
  "merged",
  "system_generated",
  "restored_backup"
] as const;

export const duplicateStatuses = [
  "none",
  "exact_duplicate",
  "likely_duplicate",
  "normalized_match",
  "possible_related"
] as const;

export const reviewStatuses = [
  "unreviewed",
  "approved",
  "rejected",
  "edited",
  "merged",
  "deferred"
] as const;

export const confidenceBands = ["high", "medium", "low", "unknown"] as const;

export const imageVariantTypes = ["thumbnail", "standard", "original_optional"] as const;

export const imageLinkRoles = [
  "primary_image",
  "gallery_image",
  "source_image",
  "comparison_image",
  "annotation_reference",
  "user_reference"
] as const;

export const imageSourceTypes = [
  "imported_from_pack",
  "user_added",
  "generated_from_original",
  "restored_from_backup"
] as const;

export const noteTypes = [
  "general",
  "field_tip",
  "confusion_point",
  "project_specific",
  "learning_note",
  "caution_note"
] as const;

export const reviewResults = [
  "correct",
  "incorrect",
  "skipped",
  "partial",
  "familiar",
  "needs_review"
] as const;

export const ruleTypes = [
  "extraction_rule",
  "classification_rule",
  "json_schema_rule",
  "prompt_template",
  "image_processing_rule",
  "duplicate_rule",
  "review_rule"
] as const;

export type ObjectType = (typeof objectTypes)[number];
export type LanguageCategory = (typeof languageCategories)[number];
export type PhraseType = (typeof phraseTypes)[number];
export type FunctionType = (typeof functionTypes)[number];
export type ScenarioType = (typeof scenarioTypes)[number];
export type SentenceType = (typeof sentenceTypes)[number];
export type GeoMaterialCategory = (typeof geoMaterialCategories)[number];
export type GeoMaterialSubtype = (typeof geoMaterialSubtypes)[number];
export type GeoFeatureCategory = (typeof geoFeatureCategories)[number];
export type GeoFeatureSubtype = (typeof geoFeatureSubtypes)[number];
export type StrategyCategory = (typeof strategyCategories)[number];
export type RequirementCategory = (typeof requirementCategories)[number];
export type MethodCategory = (typeof methodCategories)[number];
export type AuthorityLevel = (typeof authorityLevels)[number];
export type SourceDocumentType = (typeof sourceDocumentTypes)[number];
export type SourceDocumentStatus = (typeof sourceDocumentStatuses)[number];
export type ProvenanceType = (typeof provenanceTypes)[number];
export type DuplicateStatus = (typeof duplicateStatuses)[number];
export type ReviewStatus = (typeof reviewStatuses)[number];
export type ConfidenceBand = (typeof confidenceBands)[number];
export type ImageVariantType = (typeof imageVariantTypes)[number];
export type ImageLinkRole = (typeof imageLinkRoles)[number];
export type ImageSourceType = (typeof imageSourceTypes)[number];
export type NoteType = (typeof noteTypes)[number];
export type ReviewResult = (typeof reviewResults)[number];
export type RuleType = (typeof ruleTypes)[number];

export const languageQuickFilters = [
  "report_words",
  "technical_terms",
  "abbreviations",
  "units",
  "reporting_verbs",
  "low_value_candidates"
] as const;

export const phraseQuickFilters = [
  "observation_phrases",
  "risk_phrases",
  "recommendation_phrases",
  "limitation_phrases",
  "support_phrases",
  "qa_phrases"
] as const;

export const sentenceQuickFilters = [
  "mapping_sentences",
  "inspection_sentences",
  "risk_sentences",
  "recommendation_sentences",
  "reusable_sentences"
] as const;

export const geoMaterialQuickFilters = [
  "rock_types",
  "soil_types",
  "infill_types",
  "weathering_items",
  "minerals",
  "groundwater_signs"
] as const;

export const geoFeatureQuickFilters = [
  "instability_signs",
  "blasting_effects",
  "support_issues",
  "concrete_defects",
  "water_issues",
  "structural_features"
] as const;
