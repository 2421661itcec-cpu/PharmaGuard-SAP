const shipments = require("../data/shipments");
const inventory = require("../data/inventory");
const { getMedicineByName } = require("../data/medicines");

function analyzeImpact(disruptionResult) {
  const affectedShipmentIds = disruptionResult.affected_shipments || [];

  // Find shipments affected by the disruption
  const affectedShipments = shipments.filter((shipment) =>
    affectedShipmentIds.includes(shipment.id)
  );

  // Analyze each affected shipment with clinical Medicine Master integration
  const analyzedShipments = affectedShipments.map((shipment) => {
    const medSpec = getMedicineByName(shipment.medicine);
    const isColdChain = medSpec ? medSpec.temp_range_c[0] <= 8 : false;
    const maxThermalHours = medSpec ? medSpec.max_unrefrigerated_hours : 24;
    const substitutes = medSpec ? medSpec.approved_substitutes : [];

    let impactLevel = "MEDIUM";
    let delayRisk = "MEDIUM";
    let risk = "Potential delivery delay";

    if (shipment.priority === "Critical" || (medSpec && medSpec.criticality_tier === "TIER_1_LIFE_CRITICAL")) {
      impactLevel = "CRITICAL";
      delayRisk = "CRITICAL";
      risk = isColdChain
        ? `Critical cold-chain biologic (${shipment.medicine}) at severe spoilage risk beyond ${maxThermalHours}h`
        : "Critical life-saving medicine shipment delayed";
    } else if (shipment.priority === "High") {
      impactLevel = "HIGH";
      delayRisk = "HIGH";
      risk = "High-priority medicine shipment may be delayed";
    }

    // Find inventory at the shipment destination
    const destClean = (shipment.destination || "").toLowerCase().trim();
    const medClean = (shipment.medicine || "").toLowerCase().trim();

    const destinationInventory = inventory.find(
      (item) =>
        item.location.toLowerCase() === destClean &&
        (item.medicine.toLowerCase() === medClean ||
         item.medicine.toLowerCase().includes(medClean) ||
         medClean.includes(item.medicine.toLowerCase()))
    );

    let inventoryRisk = "LOW";
    let daysOfCoverage = null;
    let stockStatus = "Healthy stock buffer";
    let isDeficit = false;
    let isEmergency = false;

    // Check if this shipment route or destination is flagged as emergency/disaster
    const routeLower = (shipment.route || "").toLowerCase();
    const destRationaleLower = (shipment.destination_rationale || "").toLowerCase();
    if (
      routeLower.includes("emergency") ||
      routeLower.includes("relief") ||
      destRationaleLower.includes("emergency") ||
      destRationaleLower.includes("disaster") ||
      destRationaleLower.includes("casualt")
    ) {
      isEmergency = true;
    }

    if (destinationInventory) {
      daysOfCoverage =
        destinationInventory.daily_demand > 0
          ? destinationInventory.current_stock / destinationInventory.daily_demand
          : 5.0;

      if (
        destinationInventory.current_stock <= destinationInventory.safety_stock ||
        daysOfCoverage <= 3.0
      ) {
        isDeficit = true;
        inventoryRisk = "HIGH";
        stockStatus = `Critical deficit (${daysOfCoverage.toFixed(1)} days left — below safety threshold)`;
      } else if (daysOfCoverage <= 5.0) {
        inventoryRisk = "MEDIUM";
        stockStatus = `Moderate stock buffer (${daysOfCoverage.toFixed(1)} days coverage)`;
      } else {
        inventoryRisk = "LOW";
        stockStatus = `Abundant stock buffer (${daysOfCoverage.toFixed(1)} days coverage)`;
      }
    } else {
      inventoryRisk = isEmergency ? "HIGH" : "LOW";
      stockStatus = isEmergency ? "Emergency disaster relief zone" : "Standard buffer assumed";
    }

    // Explicit Priority Designation for Deficiencies & Emergencies
    let urgencyTier = "LESS_PRIOR_ROUTINE";
    let urgencyLabel = "ℹ️ LESS PRIOR: ROUTINE BUFFER";
    let priorityNote = `Less Prior: ${shipment.destination} maintains safe stock levels (> 3 days coverage).`;
    let shipmentPriority = shipment.priority || "Medium";

    if (isEmergency) {
      urgencyTier = "PRIORITY_1_EMERGENCY";
      urgencyLabel = "🚨 PRIORITY: EMERGENCY RELIEF";
      priorityNote = `Top Priority: Urgent disaster/emergency relief rushed to ${shipment.destination}.`;
      impactLevel = "CRITICAL";
      delayRisk = "CRITICAL";
      shipmentPriority = "Critical";
    } else if (isDeficit) {
      urgencyTier = "PRIORITY_1_DEFICIENCY";
      urgencyLabel = "🚨 PRIORITY: STOCK DEFICIENCY";
      priorityNote = `Top Priority: Critical stock deficiency at ${shipment.destination} (${stockStatus}).`;
      impactLevel = "CRITICAL";
      delayRisk = "HIGH";
      shipmentPriority = "Critical";
    } else {
      // Non-deficit, non-emergency destinations are designated as LESS PRIOR
      urgencyTier = "LESS_PRIOR_ROUTINE";
      urgencyLabel = "ℹ️ LESS PRIOR: ROUTINE BUFFER";
      priorityNote = `Less Prior: Destination has healthy stock (${stockStatus}).`;
      if (shipmentPriority === "Critical" && !isColdChain) {
        shipmentPriority = "Medium";
      }
    }

    return {
      shipment_id: shipment.id,
      medicine: shipment.medicine,
      priority: shipmentPriority,
      origin: shipment.origin,
      destination: shipment.destination,
      current_route: shipment.route,
      status: shipment.status,

      impact_level: impactLevel,
      delay_risk: delayRisk,
      inventory_risk: inventoryRisk,

      urgency_tier: urgencyTier,
      urgency_label: urgencyLabel,
      priority_note: priorityNote,
      is_emergency: isEmergency,
      is_deficit: isDeficit,

      inventory_status: stockStatus,
      days_of_inventory_coverage: daysOfCoverage
        ? Number(daysOfCoverage.toFixed(1))
        : null,

      clinical_tier: medSpec ? medSpec.criticality_tier : "TIER_2_URGENT",
      storage_condition: medSpec ? medSpec.storage_condition : "Controlled Room Temperature",
      cold_chain_required: isColdChain,
      max_thermal_hours: maxThermalHours,
      approved_substitutes: substitutes,

      risk
    };
  });



  // Get unique affected destinations
  const affectedDestinations = [
    ...new Set(analyzedShipments.map((shipment) => shipment.destination))
  ];

  // Calculate overall impact
  let overallImpact = "LOW";

  if (
    analyzedShipments.some(
      (shipment) => shipment.impact_level === "CRITICAL"
    )
  ) {
    overallImpact = "CRITICAL";
  } else if (
    analyzedShipments.some((shipment) => shipment.impact_level === "HIGH")
  ) {
    overallImpact = "HIGH";
  } else if (analyzedShipments.length > 0) {
    overallImpact = "MEDIUM";
  }

  // Calculate overall delay risk
  let overallDelayRisk = "LOW";

  if (
    analyzedShipments.some(
      (shipment) => shipment.delay_risk === "CRITICAL"
    )
  ) {
    overallDelayRisk = "CRITICAL";
  } else if (
    analyzedShipments.some((shipment) => shipment.delay_risk === "HIGH")
  ) {
    overallDelayRisk = "HIGH";
  } else if (
    analyzedShipments.some((shipment) => shipment.delay_risk === "MEDIUM")
  ) {
    overallDelayRisk = "MEDIUM";
  }

  // Calculate overall inventory risk
  let overallInventoryRisk = "LOW";

  if (
    analyzedShipments.some(
      (shipment) => shipment.inventory_risk === "HIGH"
    )
  ) {
    overallInventoryRisk = "HIGH";
  } else if (
    analyzedShipments.some(
      (shipment) => shipment.inventory_risk === "MEDIUM"
    )
  ) {
    overallInventoryRisk = "MEDIUM";
  } else if (
    analyzedShipments.some(
      (shipment) => shipment.inventory_risk === "UNKNOWN"
    )
  ) {
    overallInventoryRisk = "UNKNOWN";
  }

  // Overall priority
  const priority =
    overallImpact === "CRITICAL"
      ? "CRITICAL"
      : overallImpact === "HIGH"
      ? "HIGH"
      : overallImpact === "MEDIUM"
      ? "MEDIUM"
      : "LOW";

  // Human-readable summary
  const impactSummary =
    analyzedShipments.length === 0
      ? "No shipments were identified as affected by the disruption."
      : `${analyzedShipments.length} shipment(s) are affected by the disruption. ` +
        `${affectedDestinations.length} destination(s) may experience delivery impact. ` +
        `Overall impact is ${overallImpact} with ${overallDelayRisk.toLowerCase()} delay risk ` +
        `and ${overallInventoryRisk.toLowerCase()} inventory risk.`;

  return {
    disruption: disruptionResult.disruption,

    overall_impact: overallImpact,
    priority,

    affected_shipment_count: analyzedShipments.length,
    affected_destination_count: affectedDestinations.length,

    affected_destinations: affectedDestinations,

    overall_delay_risk: overallDelayRisk,
    overall_inventory_risk: overallInventoryRisk,

    impact_summary: impactSummary,

    affected_shipments: analyzedShipments
  };
}

module.exports = { analyzeImpact };