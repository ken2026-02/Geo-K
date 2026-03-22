import type { SystemKnowledgePack } from "./types";

export interface BundledSystemKnowledgePackDefinition {
  id: string;
  packName: string;
  description: string;
  rawJson: string;
  createImageFiles(): Map<string, Blob>;
}

const systemGeoReferencePack: SystemKnowledgePack = {
  schema_version: "1.1",
  pack_id: "system-geo-mini-library-v1",
  pack_name: "Built-in Geo Reference Mini Library",
  ownership: "system",
  source_report: {
    id: "system-report:geo-mini-library-v1",
    source_report_id: "system.geo.mini_library.v1",
    title: "Built-in Geo Reference Mini Library",
    project: "System Knowledge Library",
    discipline: "geotechnical",
    author: "Engineering Knowledge Vault",
    organization: "Engineering Knowledge Vault",
    date: "2026-03-18",
    file_name: "system-geo-mini-library-v1",
    notes: "First real system-owned geo reference content batch for controlled direct approved injection."
  },
  source_documents: [
    {
      id: "source:as1726-2017",
      source_report_id: "AS1726-2017",
      title: "Geotechnical Site Investigations",
      document_type: "standard",
      document_number: "AS 1726:2017",
      edition: "2017",
      jurisdiction: "AU",
      authority_level: "adopted_standard",
      document_status: "current",
      publisher: "Standards Australia",
      url: "https://store.standards.org.au/product/as-1726-2017",
      discipline: "geotechnical",
      organization: "Standards Australia",
      date: "2017-08-31",
      effective_date: "2017-08-31",
      reviewed_at: "2026-03-21",
      keywords: ["site investigation", "classification", "reporting"],
      notes: "Primary Australian baseline for site investigation terminology and minimum investigation expectations."
    },
    {
      id: "source:qld-tmr-geotech-minreq-2024",
      source_report_id: "QLD.TMR.GEOTECH.MINREQ.2024",
      title: "Geotechnical Design Standard - Minimum Requirements",
      document_type: "manual",
      document_number: "TMR Geotechnical Design Standard",
      edition: "October 2024",
      jurisdiction: "QLD",
      authority_level: "agency_requirement",
      document_status: "current",
      publisher: "Department of Transport and Main Roads",
      url: "https://www.tmr.qld.gov.au/_/media/busind/techstdpubs/geotechnical/geotechdesignstandardminreq.pdf",
      discipline: "geotechnical",
      organization: "TMR Queensland",
      date: "2024-10-01",
      effective_date: "2024-10-01",
      reviewed_at: "2026-03-21",
      keywords: ["minimum requirements", "design", "queensland"],
      notes: "Queensland transport owner-side minimum geotechnical design requirements."
    }
  ],
  items: {
    words: [
      {
        id: "system-word:site-investigation",
        canonical_word: "site investigation",
        language_category: "geotechnical",
        english_definition: "Planned investigation to define ground conditions, risks, and design-relevant parameters.",
        example_sentence: "The scope of the site investigation should match the project stage and geotechnical risk.",
        source_ref: {
          source_document_id: "source:as1726-2017",
          section: "Purpose and scope",
          sentence: "Site investigation scope should match project risk and design needs."
        }
      }
    ],
    phrases: [
      {
        id: "system-phrase:engineering-geological-model",
        canonical_phrase: "engineering geological model",
        phrase_type: "multiword_term",
        function_type: "definition",
        scenario_type: "design",
        explanation: "Ground model describing materials, structures, hazards, and their engineering relevance.",
        example_sentence: "Update the engineering geological model as new exposures become available.",
        source_ref: {
          source_document_id: "source:as1726-2017",
          section: "Interpretation and model development",
          sentence: "The engineering geological model should evolve with new investigation data."
        }
      }
    ],
    sentences: [
      {
        id: "system-sentence:investigation-scope-risk-based",
        canonical_sentence: "Investigation effort should be proportionate to geotechnical complexity and consequence.",
        sentence_type: "recommendation_sentence",
        function_type: "recommendation",
        scenario_type: "design",
        chinese_natural: "勘察工作量应与岩土复杂性和后果等级相匹配。",
        section_name: "Investigation planning",
        source_ref: {
          source_document_id: "source:as1726-2017",
          section: "Planning investigations",
          sentence: "Investigation effort should reflect complexity and consequence."
        }
      }
    ],
    geo_materials: [
      {
        id: "system-geo-material:fault-gouge",
        canonical_name: "fault gouge",
        geo_material_category: "infill_material",
        geo_material_subtype: "gouge",
        description: "Soft sheared infill along a fault plane.",
        source_ref: {
          section: "System Mini Library",
          sentence: "Fault gouge is included as a core weak infill material reference."
        }
      },
      {
        id: "system-geo-material:clay-infill",
        canonical_name: "clay infill",
        geo_material_category: "infill_material",
        geo_material_subtype: "clay_infill",
        description: "Clay-rich joint infill that can lower friction.",
        source_ref: {
          section: "System Mini Library",
          sentence: "Clay infill is included as a common discontinuity infill material."
        }
      },
      {
        id: "system-geo-material:highly-weathered-rock",
        canonical_name: "highly weathered rock",
        geo_material_category: "weathering_profile",
        geo_material_subtype: "highly_weathered_rock",
        description: "Rock mass with advanced weathering and reduced competence.",
        source_ref: {
          section: "System Mini Library",
          sentence: "Highly weathered rock is included as a weathering profile reference."
        }
      },
      {
        id: "system-geo-material:andesite",
        canonical_name: "andesite",
        geo_material_category: "rock",
        geo_material_subtype: "volcanic",
        description: "Volcanic rock type commonly encountered in excavation mapping.",
        source_ref: {
          section: "System Mini Library",
          sentence: "Andesite is included as a representative volcanic rock reference."
        }
      },
      {
        id: "system-geo-material:colluvium",
        canonical_name: "colluvium",
        geo_material_category: "soil",
        geo_material_subtype: "colluvium",
        description: "Loose slope-derived mixed soil and rock fragments.",
        source_ref: {
          section: "System Mini Library",
          sentence: "Colluvium is included as a common surficial soil material reference."
        }
      },
      {
        id: "system-geo-material:quartz-vein",
        canonical_name: "quartz vein",
        geo_material_category: "mineral",
        geo_material_subtype: "quartz",
        description: "Quartz-rich vein material along structural planes.",
        source_ref: {
          section: "System Batch 1",
          sentence: "Quartz vein is included as a high-value structural mineral reference."
        }
      },
      {
        id: "system-geo-material:calcite-infill",
        canonical_name: "calcite infill",
        geo_material_category: "infill_material",
        geo_material_subtype: "calcite_infill",
        description: "Calcite-filled discontinuity infill with variable hardness.",
        source_ref: {
          section: "System Batch 1",
          sentence: "Calcite infill is included as a common discontinuity infill variant."
        }
      },
      {
        id: "system-geo-material:oxidized-zone",
        canonical_name: "oxidized zone",
        geo_material_category: "alteration",
        geo_material_subtype: "oxidized",
        description: "Oxidized alteration zone often linked to weathered structure.",
        source_ref: {
          section: "System Batch 1",
          sentence: "Oxidized zone is included as an alteration indicator material."
        }
      },
      {
        id: "system-geo-material:residual-soil",
        canonical_name: "residual soil",
        geo_material_category: "soil",
        geo_material_subtype: "residual_soil",
        description: "In-situ weathering product soil over parent rock.",
        source_ref: {
          section: "System Batch 1",
          sentence: "Residual soil is included as a weathering-derived soil reference."
        }
      },
      {
        id: "system-geo-material:weathered-volcanics",
        canonical_name: "weathered volcanics",
        geo_material_category: "weathering_profile",
        geo_material_subtype: "highly_weathered_rock",
        description: "Highly weathered volcanic rock mass with reduced stand-up time.",
        source_ref: {
          section: "System Batch 1",
          sentence: "Weathered volcanics are included as a high-risk weathered rock reference."
        }
      }
    ],
    geo_features: [
      {
        id: "system-geo-feature:detached-block",
        canonical_name: "detached block",
        geo_feature_category: "instability_feature",
        geo_feature_subtype: "detached_block",
        description: "Block separated by visible discontinuities and potential movement.",
        reporting_expressions: ["Detached block observed with visible separation."],
        source_ref: {
          section: "System Mini Library",
          sentence: "Detached block is included as a key local instability feature."
        }
      },
      {
        id: "system-geo-feature:open-joint",
        canonical_name: "open joint",
        geo_feature_category: "discontinuity_condition",
        geo_feature_subtype: "open_joint",
        description: "Joint with visible aperture and limited interlock.",
        reporting_expressions: ["Open joint noted with measurable aperture."],
        source_ref: {
          section: "System Mini Library",
          sentence: "Open joint is included as a core discontinuity condition feature."
        }
      },
      {
        id: "system-geo-feature:infilled-joint",
        canonical_name: "infilled joint",
        geo_feature_category: "discontinuity_condition",
        geo_feature_subtype: "infilled_joint",
        description: "Joint aperture partly or fully filled by softer material.",
        reporting_expressions: ["Infilled joint observed along mapped plane."],
        source_ref: {
          section: "System Mini Library",
          sentence: "Infilled joint is included as a material-controlled joint condition feature."
        }
      },
      {
        id: "system-geo-feature:wedge",
        canonical_name: "wedge",
        geo_feature_category: "instability_feature",
        geo_feature_subtype: "wedge",
        description: "Rock wedge formed by intersecting discontinuities.",
        reporting_expressions: ["Potential wedge formed by intersecting joints."],
        source_ref: {
          section: "System Mini Library",
          sentence: "Wedge is included as a representative kinematic instability feature."
        }
      },
      {
        id: "system-geo-feature:seepage",
        canonical_name: "seepage",
        geo_feature_category: "water_feature",
        geo_feature_subtype: "seepage",
        description: "Localized water ingress through joints or rock mass.",
        reporting_expressions: ["Seepage observed on wall and crown."],
        source_ref: {
          section: "System Mini Library",
          sentence: "Seepage is included as a common groundwater-related feature."
        }
      },
      {
        id: "system-geo-feature:foliation-plane",
        canonical_name: "foliation plane",
        geo_feature_category: "structural_feature",
        geo_feature_subtype: "foliation",
        description: "Persistent foliation surface influencing anisotropic behavior.",
        reporting_expressions: ["Foliation plane controls visible block shape and breakage."],
        source_ref: {
          section: "System Batch 1",
          sentence: "Foliation plane is included as a high-value structural control feature."
        }
      },
      {
        id: "system-geo-feature:bedding-plane",
        canonical_name: "bedding plane",
        geo_feature_category: "structural_feature",
        geo_feature_subtype: "bedding",
        description: "Bedding surface acting as potential release plane.",
        reporting_expressions: ["Bedding plane daylights toward excavation."],
        source_ref: {
          section: "System Batch 1",
          sentence: "Bedding plane is included as a key stratigraphic structural feature."
        }
      },
      {
        id: "system-geo-feature:ravelling",
        canonical_name: "ravelling",
        geo_feature_category: "instability_feature",
        geo_feature_subtype: "ravelling",
        description: "Progressive small-piece loss from exposed ground surface.",
        reporting_expressions: ["Ravelling observed from crown and shoulder."],
        source_ref: {
          section: "System Batch 1",
          sentence: "Ravelling is included as a progressive instability degradation feature."
        }
      },
      {
        id: "system-geo-feature:blast-damaged-zone",
        canonical_name: "blast damaged zone",
        geo_feature_category: "blasting_feature",
        geo_feature_subtype: "blast_damage",
        description: "Disturbed rock zone around excavation perimeter from blasting.",
        reporting_expressions: ["Blast damaged zone mapped along perimeter."],
        source_ref: {
          section: "System Batch 1",
          sentence: "Blast damaged zone is included as a key excavation damage feature."
        }
      },
      {
        id: "system-geo-feature:scaling-hazard",
        canonical_name: "scaling hazard",
        geo_feature_category: "instability_feature",
        geo_feature_subtype: "scaling_hazard",
        description: "Loose surface rock likely to detach under vibration or disturbance.",
        reporting_expressions: ["Scaling hazard identified above active access."],
        source_ref: {
          section: "System Batch 1",
          sentence: "Scaling hazard is included as an immediate loose-rock risk feature."
        }
      }
    ],
    strategies: [
      {
        id: "system-strategy:hand-scaling",
        canonical_name: "hand scaling",
        strategy_category: "temporary_control",
        description: "Remove loose fragments from accessible surfaces.",
        steps_or_method: "Scale loose pieces from a protected position before reopening access.",
        source_ref: {
          section: "System Mini Library",
          sentence: "Hand scaling is included as a direct loose-rock control strategy."
        }
      },
      {
        id: "system-strategy:spot-bolting",
        canonical_name: "spot bolting",
        strategy_category: "temporary_control",
        description: "Install localized bolts at identified unstable blocks.",
        steps_or_method: "Target bolt locations where mapped structure indicates local instability.",
        source_ref: {
          section: "System Mini Library",
          sentence: "Spot bolting is included as a targeted local support strategy."
        }
      },
      {
        id: "system-strategy:mesh-installation",
        canonical_name: "mesh installation",
        strategy_category: "permanent_treatment",
        description: "Install mesh where distributed small block fallout risk exists.",
        steps_or_method: "Fix mesh with appropriate anchorage to retain small detached fragments.",
        source_ref: {
          section: "System Mini Library",
          sentence: "Mesh installation is included as a surface retention support strategy."
        }
      },
      {
        id: "system-strategy:re-inspection",
        canonical_name: "re-inspection",
        strategy_category: "monitoring_requirement",
        description: "Repeat inspection after change triggers such as rain or blasting.",
        steps_or_method: "Recheck mapped areas at defined intervals and after triggering events.",
        source_ref: {
          section: "System Mini Library",
          sentence: "Re-inspection is included as a follow-up monitoring strategy."
        }
      },
      {
        id: "system-strategy:exclusion-zone",
        canonical_name: "exclusion zone",
        strategy_category: "temporary_control",
        description: "Restrict access below identified instability hazard areas.",
        steps_or_method: "Mark and enforce no-entry boundary until risk controls are complete.",
        source_ref: {
          section: "System Mini Library",
          sentence: "Exclusion zone is included as an immediate exposure-control strategy."
        }
      },
      {
        id: "system-strategy:shotcrete-extension",
        canonical_name: "shotcrete extension",
        strategy_category: "permanent_treatment",
        description: "Extend shotcrete coverage over newly loosened or weathered surfaces.",
        steps_or_method: "Apply additional coverage where mapping confirms unsupported deteriorated ground.",
        source_ref: {
          section: "System Batch 1",
          sentence: "Shotcrete extension is included as a support continuity treatment strategy."
        }
      },
      {
        id: "system-strategy:detailed-mapping",
        canonical_name: "detailed mapping",
        strategy_category: "identification_method",
        description: "Perform detailed structural and condition mapping before treatment updates.",
        steps_or_method: "Capture orientation, persistence, condition, and controlling discontinuity sets.",
        source_ref: {
          section: "System Batch 1",
          sentence: "Detailed mapping is included as a first-pass structural decision strategy."
        }
      },
      {
        id: "system-strategy:support-upgrade",
        canonical_name: "support upgrade",
        strategy_category: "permanent_treatment",
        description: "Increase support level where existing controls are insufficient.",
        steps_or_method: "Upgrade support pattern and elements after reassessment of instability demand.",
        source_ref: {
          section: "System Batch 1",
          sentence: "Support upgrade is included as a response to escalating instability risk."
        }
      }
    ],
    requirements: [
      {
        id: "system-requirement:tmr-geotech-baseline",
        canonical_name: "meet minimum geotechnical design requirements",
        requirement_category: "design_requirement",
        jurisdiction: "QLD",
        authority_level: "agency_requirement",
        clause_reference: "Minimum Requirements",
        requirement_text: "Geotechnical deliverables must satisfy the owner minimum requirements for investigation, interpretation, design inputs, and documentation.",
        plain_language_summary: "Do not treat owner geotechnical requirements as optional background reading.",
        why_it_matters: "Owner acceptance and downstream design quality both depend on a complete minimum-requirements baseline.",
        verification_method: "Check deliverables against the minimum-requirements checklist before issue.",
        tags: ["queensland", "design", "compliance"],
        source_ref: {
          source_document_id: "source:qld-tmr-geotech-minreq-2024",
          section: "Minimum requirements",
          sentence: "Deliverables are expected to meet the published minimum requirements."
        }
      }
    ],
    methods: [
      {
        id: "system-method:ground-model-update-cycle",
        canonical_name: "ground model update cycle",
        method_category: "analysis_method",
        jurisdiction: "AU",
        authority_level: "adopted_standard",
        purpose: "Keep the working ground model aligned with newly exposed and tested conditions.",
        procedure_summary: "Review new investigation results, revise interpreted units and structures, then update risks and design implications.",
        inputs_or_prerequisites: "Current investigation data, mapped exposures, and existing model assumptions.",
        outputs_or_results: "Revised ground model and updated design/reporting assumptions.",
        limitations: "Model quality is constrained by data density and interpretation quality.",
        tags: ["ground-model", "interpretation", "update"],
        source_ref: {
          source_document_id: "source:as1726-2017",
          section: "Interpretation and model development",
          sentence: "Interpretation should be refined as new information becomes available."
        }
      }
    ]
  },
  relations: [
    {
      id: "system-relation:infilled-joint-to-clay-infill",
      from_item_type: "geo_feature",
      from_item_id: "system-geo-feature:infilled-joint",
      relation_type: "related_material",
      to_item_type: "geo_material",
      to_item_id: "system-geo-material:clay-infill",
      confidence_score: 0.9
    },
    {
      id: "system-relation:infilled-joint-to-calcite-infill",
      from_item_type: "geo_feature",
      from_item_id: "system-geo-feature:infilled-joint",
      relation_type: "related_material",
      to_item_type: "geo_material",
      to_item_id: "system-geo-material:calcite-infill",
      confidence_score: 0.8
    },
    {
      id: "system-relation:foliation-plane-to-quartz-vein",
      from_item_type: "geo_feature",
      from_item_id: "system-geo-feature:foliation-plane",
      relation_type: "related_material",
      to_item_type: "geo_material",
      to_item_id: "system-geo-material:quartz-vein",
      confidence_score: 0.7
    },
    {
      id: "system-relation:ravelling-to-weathered-volcanics",
      from_item_type: "geo_feature",
      from_item_id: "system-geo-feature:ravelling",
      relation_type: "related_material",
      to_item_type: "geo_material",
      to_item_id: "system-geo-material:weathered-volcanics",
      confidence_score: 0.75
    },
    {
      id: "system-relation:blast-damaged-zone-to-weathered-volcanics",
      from_item_type: "geo_feature",
      from_item_id: "system-geo-feature:blast-damaged-zone",
      relation_type: "related_material",
      to_item_type: "geo_material",
      to_item_id: "system-geo-material:weathered-volcanics",
      confidence_score: 0.7
    },
    {
      id: "system-relation:detached-block-to-hand-scaling",
      from_item_type: "geo_feature",
      from_item_id: "system-geo-feature:detached-block",
      relation_type: "recommended_strategy",
      to_item_type: "strategy",
      to_item_id: "system-strategy:hand-scaling",
      confidence_score: 0.9
    },
    {
      id: "system-relation:open-joint-to-spot-bolting",
      from_item_type: "geo_feature",
      from_item_id: "system-geo-feature:open-joint",
      relation_type: "recommended_strategy",
      to_item_type: "strategy",
      to_item_id: "system-strategy:spot-bolting",
      confidence_score: 0.8
    },
    {
      id: "system-relation:wedge-to-mesh-installation",
      from_item_type: "geo_feature",
      from_item_id: "system-geo-feature:wedge",
      relation_type: "recommended_strategy",
      to_item_type: "strategy",
      to_item_id: "system-strategy:mesh-installation",
      confidence_score: 0.8
    },
    {
      id: "system-relation:seepage-to-re-inspection",
      from_item_type: "geo_feature",
      from_item_id: "system-geo-feature:seepage",
      relation_type: "recommended_strategy",
      to_item_type: "strategy",
      to_item_id: "system-strategy:re-inspection",
      confidence_score: 0.8
    },
    {
      id: "system-relation:detached-block-to-exclusion-zone",
      from_item_type: "geo_feature",
      from_item_id: "system-geo-feature:detached-block",
      relation_type: "recommended_strategy",
      to_item_type: "strategy",
      to_item_id: "system-strategy:exclusion-zone",
      confidence_score: 0.85
    },
    {
      id: "system-relation:scaling-hazard-to-hand-scaling",
      from_item_type: "geo_feature",
      from_item_id: "system-geo-feature:scaling-hazard",
      relation_type: "recommended_strategy",
      to_item_type: "strategy",
      to_item_id: "system-strategy:hand-scaling",
      confidence_score: 0.88
    },
    {
      id: "system-relation:ravelling-to-shotcrete-extension",
      from_item_type: "geo_feature",
      from_item_id: "system-geo-feature:ravelling",
      relation_type: "recommended_strategy",
      to_item_type: "strategy",
      to_item_id: "system-strategy:shotcrete-extension",
      confidence_score: 0.8
    },
    {
      id: "system-relation:blast-damaged-zone-to-support-upgrade",
      from_item_type: "geo_feature",
      from_item_id: "system-geo-feature:blast-damaged-zone",
      relation_type: "recommended_strategy",
      to_item_type: "strategy",
      to_item_id: "system-strategy:support-upgrade",
      confidence_score: 0.82
    },
    {
      id: "system-relation:foliation-plane-to-detailed-mapping",
      from_item_type: "geo_feature",
      from_item_id: "system-geo-feature:foliation-plane",
      relation_type: "recommended_strategy",
      to_item_type: "strategy",
      to_item_id: "system-strategy:detailed-mapping",
      confidence_score: 0.9
    },
    {
      id: "system-relation:bedding-plane-to-detailed-mapping",
      from_item_type: "geo_feature",
      from_item_id: "system-geo-feature:bedding-plane",
      relation_type: "recommended_strategy",
      to_item_type: "strategy",
      to_item_id: "system-strategy:detailed-mapping",
      confidence_score: 0.88
    }
  ],
  images: []
};

export const bundledSystemKnowledgePacks: BundledSystemKnowledgePackDefinition[] = [
  {
    id: systemGeoReferencePack.pack_id,
    packName: systemGeoReferencePack.pack_name,
    description: "Trusted built-in geo reference content batch for direct approved system injection.",
    rawJson: JSON.stringify(systemGeoReferencePack, null, 2),
    createImageFiles() {
      return new Map();
    }
  }
];

export function getBundledSystemKnowledgePack(packId: string): BundledSystemKnowledgePackDefinition {
  const pack = bundledSystemKnowledgePacks.find((entry) => entry.id === packId);
  if (!pack) {
    throw new Error(`Unknown bundled system knowledge pack: ${packId}`);
  }
  return pack;
}
