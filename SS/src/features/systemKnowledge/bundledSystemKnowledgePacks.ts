import type { SystemKnowledgePack } from "./types";

export interface BundledSystemKnowledgePackDefinition {
  id: string;
  packName: string;
  description: string;
  rawJson: string;
  createImageFiles(): Map<string, Blob>;
}

const systemGeoReferencePack: SystemKnowledgePack = {
  schema_version: "1.0",
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
  items: {
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
