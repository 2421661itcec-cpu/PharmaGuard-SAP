let approvalState = {
  status: "PENDING",
  shipment_id: null,
  selected_plan: null,
  modified_plan: null,
  decision_by: null,
  decision_reason: null,
  timestamp: null
};

function approvePlan(
  plan,
  decisionBy = "Supply Chain Manager"
) {
  if (!plan || !plan.id) {
    return {
      status: "INVALID",
      message: "A valid recovery plan is required."
    };
  }

  approvalState = {
    status: "APPROVED",

    shipment_id:
      plan.shipment_id || null,

    selected_plan: plan,

    modified_plan: null,

    decision_by: decisionBy,

    decision_reason:
      "Plan approved by human decision-maker",

    timestamp:
      new Date().toISOString()
  };

  return approvalState;
}

function rejectPlan(
  plan,
  reason,
  decisionBy = "Supply Chain Manager"
) {
  if (!plan || !plan.id) {
    return {
      status: "INVALID",
      message: "A valid recovery plan is required."
    };
  }

  if (!reason) {
    return {
      status: "INVALID",
      message: "A rejection reason is required."
    };
  }

  approvalState = {
    status: "REJECTED",

    shipment_id:
      plan.shipment_id || null,

    selected_plan: plan,

    modified_plan: null,

    decision_by: decisionBy,

    decision_reason: reason,

    timestamp:
      new Date().toISOString()
  };

  return approvalState;
}

function modifyPlan(
  plan,
  modifications,
  decisionBy = "Supply Chain Manager"
) {
  if (!plan || !plan.id) {
    return {
      status: "INVALID",
      message: "A valid recovery plan is required."
    };
  }

  if (!modifications) {
    return {
      status: "INVALID",
      message: "Modifications are required."
    };
  }

  const shipments = require("../data/shipments");
  const { getCoordinates } = require("../data/trackingStore");
  const { getWarehouseByCity } = require("../data/warehouses");
  const { analyzeImpact } = require("./impactAnalysisAgent");
  const { generateScenarios } = require("./scenarioPlanningAgent");

  // Determine the new destination
  let newDestination = modifications.destination ? modifications.destination.trim() : null;
  if (!newDestination && modifications.route) {
    const segments = modifications.route.split(/→|->/).map(s => s.trim()).filter(Boolean);
    if (segments.length > 0) {
      newDestination = segments[segments.length - 1];
    }
  }

  const shipmentId = modifications.shipment_id || plan.shipment_id;
  const shipment = shipments.find(s => s.id === shipmentId);

  if (shipment && newDestination) {
    shipment.destination = newDestination;
    shipment.destination_coords = getCoordinates(newDestination);
    const destWh = getWarehouseByCity(newDestination);
    shipment.destination_hub = destWh ? destWh.hub_name : `${newDestination} Regional Healthcare & Emergency Depot`;
    shipment.destination_warehouse = destWh ? `${destWh.warehouse_name} (${destWh.location_address})` : `${newDestination} Strategic Medical Facility`;
    if (modifications.route) {
      shipment.route = modifications.route;
    }
  }

  // Recalculate operational impact and AI scenarios for the modified destination
  const affectedShipmentIds = shipmentId ? [shipmentId] : shipments.map(s => s.id);
  const updatedImpact = analyzeImpact({ affected_shipments: affectedShipmentIds });
  const updatedScenarios = generateScenarios(updatedImpact);

  const matchedAnalyzed = updatedImpact.affected_shipments.find(s => s.shipment_id === shipmentId);

  const modifiedPlan = {
    ...plan,
    ...modifications,
    destination: newDestination || plan.destination,
    priority: matchedAnalyzed ? matchedAnalyzed.priority : plan.priority,
    urgency_tier: matchedAnalyzed ? matchedAnalyzed.urgency_tier : (plan.urgency_tier || "LESS_PRIOR_ROUTINE"),
    urgency_label: matchedAnalyzed ? matchedAnalyzed.urgency_label : (plan.urgency_label || "ℹ️ LESS PRIOR: ROUTINE BUFFER"),
    priority_note: matchedAnalyzed ? matchedAnalyzed.priority_note : ""
  };

  approvalState = {
    status: "MODIFIED",

    shipment_id: shipmentId || null,

    selected_plan: plan,

    modified_plan: modifiedPlan,

    updated_impact: updatedImpact,

    updated_scenarios: updatedScenarios,

    decision_by: decisionBy,

    decision_reason: `Plan modified by human decision-maker: Destination adjusted to ${newDestination || 'updated hub'}.`,

    timestamp: new Date().toISOString()
  };

  return approvalState;
}

function getApprovalState() {
  return approvalState;
}

module.exports = {
  approvePlan,
  rejectPlan,
  modifyPlan,
  getApprovalState
};