const shipments = require("../data/shipments");

function executeReroute(approvalResult) {
  if (
    approvalResult.status !== "APPROVED" &&
    approvalResult.status !== "MODIFIED"
  ) {
    return {
      success: false,
      status: "BLOCKED",
      message: "Rerouting requires an approved or modified plan."
    };
  }

  const plan =
    approvalResult.modified_plan ||
    approvalResult.selected_plan;

  if (!plan) {
    return {
      success: false,
      status: "BLOCKED",
      message: "No recovery plan available."
    };
  }

  /*
   * The approved recovery can specify a shipment_id.
   * If it is not provided, use the first affected shipment.
   * If neither is available, retain compatibility with
   * the original SH001 demo scenario.
   */
  const shipmentId =
    approvalResult.shipment_id ||
    (approvalResult.affected_shipments &&
      approvalResult.affected_shipments[0]) ||
    "SH001";

  const shipment = shipments.find(
    (item) => item.id === shipmentId
  );

  if (!shipment) {
    return {
      success: false,
      status: "FAILED",
      message: `Shipment ${shipmentId} not found.`
    };
  }

  const originalRoute = shipment.route;

  // Apply the approved recovery plan
  shipment.route = plan.route;
  shipment.status = "Rerouted";
  shipment.eta_hours = plan.eta_hours;

  return {
    success: true,
    status: "REROUTED",
    shipment_id: shipment.id,
    medicine: shipment.medicine,
    original_route: originalRoute,
    new_route: shipment.route,
    new_eta_hours: shipment.eta_hours,
    shipment_status: shipment.status,
    recovery_plan: {
      id: plan.id,
      name: plan.name,
      risk: plan.risk,
      cost_level: plan.cost_level
    },
    message: "Shipment successfully rerouted."
  };
}

module.exports = {
  executeReroute
};