// --------------------------------------------------
// MEDICINE MASTER DATABASE (FDA & RxNorm Aligned)
// Clinical specifications, thermal stability limits,
// cold-chain tolerances, approved generic substitutes,
// and WHO / CDSCO regulatory classification.
// --------------------------------------------------

const medicineDatabase = [
  {
    id: "MED-INS-001",
    name: "Insulin Glargine (rDNA origin)",
    common_name: "Insulin",
    brand_names: ["Lantus", "Basaglar", "Semglee", "Toujeo"],
    category: "Biologic / Hormone (Diabetes)",
    criticality_tier: "TIER_1_LIFE_CRITICAL",
    clinical_indication: "Glycemic regulation in Type 1 & Type 2 Diabetes Mellitus",
    storage_condition: "Cold Chain (2°C to 8°C)",
    temp_range_c: [2, 8],
    max_unrefrigerated_hours: 4,
    dosage_form: "Subcutaneous Solution (100 units/mL Cartridges / Vials)",
    approved_substitutes: [
      "Semglee (Insulin glargine-yfgn biosimilar)",
      "Basaglar (Insulin glargine injection)",
      "Insulin Degludec (Tresiba - long-acting alternative)"
    ],
    regulatory_schedule: "Schedule H / WHO Model List of Essential Medicines",
    shelf_life_months: 24,
    special_handling: "Refrigerated transit mandatory. Never freeze. Protect from direct sunlight.",
    cost_per_unit_usd: 48.50,
    air_freight_eligible: true
  },
  {
    id: "MED-PCM-002",
    name: "Paracetamol 650mg (Acetaminophen)",
    common_name: "Paracetamol",
    brand_names: ["Dolo-650", "Crocin Advance", "Calpol", "Tylenol"],
    category: "Analgesic & Antipyretic",
    criticality_tier: "TIER_3_STANDARD",
    clinical_indication: "Fever reduction, post-operative analgesia, mild-to-moderate pain management",
    storage_condition: "Controlled Room Temperature (15°C to 25°C)",
    temp_range_c: [15, 25],
    max_unrefrigerated_hours: 720, // 30 days ambient stable
    dosage_form: "Oral Tablets (650mg) / IV Infusion (10mg/mL)",
    approved_substitutes: [
      "Crocin 650mg Tablet",
      "Calpol 650mg Tablet",
      "Acetaminophen USP 650mg Generic"
    ],
    regulatory_schedule: "OTC / Schedule H for IV Infusion",
    shelf_life_months: 36,
    special_handling: "Store below 30°C in moisture-resistant blister packaging.",
    cost_per_unit_usd: 4.20,
    air_freight_eligible: false
  },
  {
    id: "MED-VAC-003",
    name: "Multivalent Viral & Bacterial Vaccines",
    common_name: "Vaccines",
    brand_names: ["Covaxin", "Comirnaty", "Pneumovax 23", "Rabivax"],
    category: "Immunological / Preventive Vaccine",
    criticality_tier: "TIER_1_LIFE_CRITICAL",
    clinical_indication: "Active immunization against viral pathogens and epidemic contagion",
    storage_condition: "Ultra Cold / Cold Chain (2°C to 8°C)",
    temp_range_c: [2, 8],
    max_unrefrigerated_hours: 2,
    dosage_form: "Single-Dose Injectable Vials with Vaccine Vial Monitor (VVM)",
    approved_substitutes: [
      "WHO Prequalified Equivalent Vaccine Lots",
      "Recombinant Viral Vector Antigenic Substitute"
    ],
    regulatory_schedule: "Schedule H1 / National Immunization Schedule",
    shelf_life_months: 18,
    special_handling: "Continuous data-logger tracking mandatory. Denatures rapidly above 8°C.",
    cost_per_unit_usd: 32.00,
    air_freight_eligible: true
  },
  {
    id: "MED-ATB-004",
    name: "Broad-Spectrum Antibiotics (Meropenem / Amoxiclav)",
    common_name: "Antibiotics",
    brand_names: ["Augmentin", "Meronem", "Zosyn", "Monocef"],
    category: "Anti-Infective / Broad-Spectrum Beta-Lactam",
    criticality_tier: "TIER_2_URGENT",
    clinical_indication: "Sepsis, severe hospital-acquired pneumonia, acute bacterial infections",
    storage_condition: "Ambient Controlled (15°C to 25°C)",
    temp_range_c: [15, 25],
    max_unrefrigerated_hours: 96,
    dosage_form: "Powder for IV Injection (1g / 500mg)",
    approved_substitutes: [
      "Meropenem Trihydrate Generic IV",
      "Piperacillin-Tazobactam (Zosyn generic)",
      "Ceftriaxone Sodium 1g IV"
    ],
    regulatory_schedule: "Schedule H1 (Strict Antibiotic Stewardship Protocol)",
    shelf_life_months: 24,
    special_handling: "Desiccant protection required. Protect reconstituted solution from light.",
    cost_per_unit_usd: 19.80,
    air_freight_eligible: true
  },
  {
    id: "MED-ONC-005",
    name: "Critical Oncology & Targeted Chemotherapy Biologics",
    common_name: "Critical Oncology & Vaccines",
    brand_names: ["Herceptin (Trastuzumab)", "Keytruda", "Cisplatin", "Rituxan"],
    category: "Antineoplastic Monoclonal Antibody",
    criticality_tier: "TIER_1_LIFE_CRITICAL",
    clinical_indication: "Targeted HER2+ oncology infusion and malignant tumor containment",
    storage_condition: "Cold Chain (2°C to 8°C)",
    temp_range_c: [2, 8],
    max_unrefrigerated_hours: 3,
    dosage_form: "Lyophilized Powder for IV Infusion (440mg / 150mg)",
    approved_substitutes: [
      "Ogivri (Trastuzumab-dkst biosimilar)",
      "Herzuma (Trastuzumab-pkrb biosimilar)",
      "Kanjinti (Trastuzumab-anns biosimilar)"
    ],
    regulatory_schedule: "Schedule G / HazMat Cytotoxic Transport Protocol",
    shelf_life_months: 30,
    special_handling: "Cytotoxic biohazard container. Temperature excursion triggers auto-quarantine.",
    cost_per_unit_usd: 215.00,
    air_freight_eligible: true
  },
  {
    id: "MED-CRD-006",
    name: "Enoxaparin Sodium (Low Molecular Weight Heparin)",
    common_name: "Enoxaparin",
    brand_names: ["Lovenox", "Clexane", "Loparin"],
    category: "Anticoagulant / Cardiac Care",
    criticality_tier: "TIER_1_LIFE_CRITICAL",
    clinical_indication: "Prevention of deep vein thrombosis (DVT) and acute myocardial infarction",
    storage_condition: "Controlled Room Temperature (15°C to 25°C)",
    temp_range_c: [15, 25],
    max_unrefrigerated_hours: 48,
    dosage_form: "Pre-filled Syringes (40mg / 0.4mL)",
    approved_substitutes: [
      "Enoxaparin Sodium USP Generic Syringes",
      "Dalteparin Sodium (Fragmin alternative)"
    ],
    regulatory_schedule: "Schedule H / Critical ICU Care",
    shelf_life_months: 24,
    special_handling: "Do not store above 25°C. Protect glass pre-filled syringes from shock.",
    cost_per_unit_usd: 24.50,
    air_freight_eligible: true
  },
  {
    id: "MED-EPI-007",
    name: "Epinephrine Auto-Injector (Adrenaline 1:1000)",
    common_name: "Epinephrine",
    brand_names: ["EpiPen", "Adrenaclick", "Auvi-Q"],
    category: "Emergency Anaphylaxis Vasopressor",
    criticality_tier: "TIER_1_LIFE_CRITICAL",
    clinical_indication: "Emergency treatment of severe allergic reactions and anaphylactic shock",
    storage_condition: "Room Temperature Protected (20°C to 25°C)",
    temp_range_c: [20, 25],
    max_unrefrigerated_hours: 24,
    dosage_form: "Auto-Injector Syringe (0.3mg / 0.15mg)",
    approved_substitutes: [
      "Mylan Generic Epinephrine Auto-Injector",
      "Teva Epinephrine Injection USP"
    ],
    regulatory_schedule: "Schedule H / Emergency Crash Cart Mandatory",
    shelf_life_months: 18,
    special_handling: "Do not refrigerate. Do not expose to extreme heat. Keep inside carrier tube.",
    cost_per_unit_usd: 65.00,
    air_freight_eligible: true
  }
];

// Helper functions for querying the medicine database
function getAllMedicines() {
  return medicineDatabase;
}

function getMedicineById(id) {
  if (!id) return null;
  return medicineDatabase.find(m => m.id.toLowerCase() === id.toLowerCase()) || null;
}

function getMedicineByName(query) {
  if (!query) return null;
  const q = String(query).toLowerCase().trim();

  // Exact match on common_name or name
  let match = medicineDatabase.find(m =>
    m.common_name.toLowerCase() === q ||
    m.name.toLowerCase() === q
  );

  if (match) return match;

  // Substring match
  match = medicineDatabase.find(m =>
    m.common_name.toLowerCase().includes(q) ||
    q.includes(m.common_name.toLowerCase()) ||
    m.name.toLowerCase().includes(q) ||
    q.includes(m.name.toLowerCase()) ||
    m.brand_names.some(b => b.toLowerCase().includes(q) || q.includes(b.toLowerCase()))
  );

  return match || null;
}

function getSubstitutes(medicineName) {
  const med = getMedicineByName(medicineName);
  if (!med) return [];
  return med.approved_substitutes || [];
}

module.exports = {
  medicineDatabase,
  getAllMedicines,
  getMedicineById,
  getMedicineByName,
  getSubstitutes
};
