const shipments = require("../data/shipments");
const inventory = require("../data/inventory");

function analyzeImpact(disruptionResult) {
  const affectedShipmentIds = disruptionResult.affected_shipments || [];

  // Find shipments affected by the disruption
  const affectedShipments = shipments.filter((shipment) =>
    affectedShipmentIds.includes(shipment.id)
  );

  // Analyze each affected shipment
  const analyzedShipments = affectedShipments.map((shipment) => {
    let impactLevel = "MEDIUM";
    let delayRisk = "MEDIUM";
    let risk = "Potential delivery delay";

    if (shipment.priority === "Critical") {
      impactLevel = "CRITICAL";
      delayRisk = "CRITICAL";
      risk = "Critical medicine shipment may be delayed";
    } else if (shipment.priority === "High") {
      impactLevel = "HIGH";
      delayRisk = "HIGH";
      risk = "High-priority medicine shipment may be delayed";
    }

    // Find inventory at the shipment destination
    const destinationInventory = inventory.find(
      (item) =>
        item.location === shipment.destination &&
        item.medicine === shipment.medicine
    );

    let inventoryRisk = "LOW";
    let daysOfCoverage = null;
    let stockStatus = "Stock available";

    if (destinationInventory) {
      daysOfCoverage =
        destinationInventory.current_stock /
        destinationInventory.daily_demand;

      if (
        destinationInventory.current_stock <=
        destinationInventory.safety_stock
      ) {
        inventoryRisk = "HIGH";
        stockStatus = "Below safety stock";
      } else if (daysOfCoverage <= 4) {
        inventoryRisk = "MEDIUM";
        stockStatus = "Limited stock coverage";
      } else {
        inventoryRisk = "LOW";
        stockStatus = "Healthy stock coverage";
      }
    } else {
      inventoryRisk = "UNKNOWN";
      stockStatus = "No inventory data available";
    }

    return {
      shipment_id: shipment.id,
      medicine: shipment.medicine,
      priority: shipment.priority,
      origin: shipment.origin,
      destination: shipment.destination,
      current_route: shipment.route,
      status: shipment.status,

      impact_level: impactLevel,
      delay_risk: delayRisk,
      inventory_risk: inventoryRisk,

      inventory_status: stockStatus,
      days_of_inventory_coverage: daysOfCoverage
        ? Number(daysOfCoverage.toFixed(1))
        : null,

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