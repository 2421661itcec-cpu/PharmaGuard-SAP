const {
  detectDisruption
} = require("./disruptionAgent");

const {
  analyzeImpact
} = require("./impactAnalysisAgent");

const {
  generateScenarios
} = require("./scenarioPlanningAgent");

const {
  executeReroute
} = require("./reroutingAgent");

const {
  analyzeInventory,
  executeInventoryTransfer
} = require("./inventoryRebalancingAgent");

const shipments = require("../data/shipments");

function createRecoveryPlan(disruption) {
  const disruptionResult =
    detectDisruption(disruption);

  const impactResult =
    analyzeImpact(disruptionResult);

  const scenarioResult =
    generateScenarios(impactResult);

  return {
    stage: "AWAITING_HUMAN_APPROVAL",

    disruption: disruptionResult,

    impact: impactResult,

    scenarios: scenarioResult,

    next_action:
      "Human approval required before recovery execution."
  };
}

function executeApprovedRecovery(approvalResult) {
  if (
    approvalResult.status !== "APPROVED" &&
    approvalResult.status !== "MODIFIED"
  ) {
    return {
      stage: "RECOVERY_BLOCKED",
      success: false,
      message:
        "Recovery execution requires an approved or modified plan.",
      approval: approvalResult,
      rerouting: null,
      inventory: []
    };
  }

  const plan =
    approvalResult.modified_plan ||
    approvalResult.selected_plan;

  if (!plan) {
    return {
      stage: "RECOVERY_BLOCKED",
      success: false,
      message:
        "No approved recovery plan was provided.",
      approval: approvalResult,
      rerouting: null,
      inventory: []
    };
  }

  const shipmentId =
    approvalResult.shipment_id ||
    plan.shipment_id;

  if (!shipmentId) {
    return {
      stage: "RECOVERY_BLOCKED",
      success: false,
      message:
        "Approved plan is not associated with a shipment.",
      approval: approvalResult,
      rerouting: null,
      inventory: []
    };
  }

  const shipment =
    shipments.find(
      (item) => item.id === shipmentId
    );

  if (!shipment) {
    return {
      stage: "RECOVERY_BLOCKED",
      success: false,
      message:
        `Shipment ${shipmentId} was not found.`,
      approval: approvalResult,
      rerouting: null,
      inventory: []
    };
  }

  /*
   * PG5 receives the approved shipment-specific plan.
   */
  const rerouteInput = {
    ...approvalResult,
    shipment_id: shipmentId,
    selected_plan:
      approvalResult.selected_plan || plan,
    modified_plan:
      approvalResult.modified_plan || null
  };

  const rerouteResult =
    executeReroute(rerouteInput);

  if (!rerouteResult.success) {
    return {
      stage: "RECOVERY_BLOCKED",
      success: false,
      message:
        "Rerouting could not be completed.",
      approval: approvalResult,
      rerouting: rerouteResult,
      inventory: []
    };
  }

  /*
   * PG6 analyzes inventory for the same shipment
   * that was approved and rerouted.
   */
  const inventoryAnalysis =
    analyzeInventory(
      shipment.medicine,
      shipment.destination
    );

  let transferResult = null;

  if (
    inventoryAnalysis.success &&
    inventoryAnalysis.status ===
      "REBALANCE_RECOMMENDED"
  ) {
    transferResult =
      executeInventoryTransfer(
        inventoryAnalysis.medicine,
        inventoryAnalysis.source,
        inventoryAnalysis.destination,
        inventoryAnalysis.recommended_transfer
      );
  }

  const inventoryResult = {
    shipment_id: shipmentId,
    medicine: shipment.medicine,
    destination: shipment.destination,
    analysis: inventoryAnalysis,
    transfer: transferResult
  };

  try {
    const { addHistoryEntry } = require("../data/recoveryHistoryStore");
    const isCold = Boolean(
      (shipment.medicine || "").toLowerCase().includes("vaccine") ||
      (shipment.medicine || "").toLowerCase().includes("insulin")
    );
    addHistoryEntry({
      shipment_id: shipmentId,
      medicine: shipment.medicine,
      priority: shipment.priority,
      cold_chain: isCold,
      disruption_event: approvalResult.decision_reason || "Dynamic Supply Chain Recovery Execution",
      disrupted_location: shipment.origin,
      decision: approvalResult.status || "APPROVED",
      decision_by: approvalResult.decision_by || "Supply Chain Manager",
      original_route: rerouteResult.original_route || shipment.route,
      recovery_route: rerouteResult.new_route || plan.route,
      origin: shipment.origin,
      destination: shipment.destination,
      eta_hours: plan.eta_hours || rerouteResult.new_eta_hours || 3.5,
      eta_saved_hours: 2.0,
      status: "EXECUTED & REROUTED",
      inventory_action: inventoryAnalysis?.message || "Inventory position evaluated",
      urgency_label: plan.urgency_label || (shipment.priority === "Critical" ? "🚨 PRIORITY: DEFICIT / EMERGENCY" : "ℹ️ LESS PRIOR: ROUTINE BUFFER"),
      audit_notes: `Plan ${plan.id || 'Custom'} (${plan.name || 'Emergency Diversion'}) authorized by ${approvalResult.decision_by || 'controller'}.`
    });
  } catch (e) {
    console.error("Failed to log recovery history:", e);
  }

  return {
    stage: "RECOVERY_EXECUTED",

    success: true,

    approval: approvalResult,

    rerouting: rerouteResult,

    inventory: [
      inventoryResult
    ],

    message:
      "Approved recovery plan executed, shipment rerouted, and inventory rebalancing completed."
  };
}

module.exports = {
  createRecoveryPlan,
  executeApprovedRecovery
};