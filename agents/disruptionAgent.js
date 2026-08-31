const shipments = require("../data/shipments");

function detectDisruption(disruption) {
  const disruptionText = disruption.toLowerCase();

  let disruptedLocation = null;

  if (disruptionText.includes("ambala")) {
    disruptedLocation = "Ambala";
  }

  const affectedShipments = disruptedLocation
    ? shipments.filter((shipment) => {
        const route = shipment.route.toLowerCase();

        return route.includes(disruptedLocation.toLowerCase());
      })
    : [];

  let severity = "MEDIUM";

  if (affectedShipments.some(
    (shipment) => shipment.priority === "Critical"
  )) {
    severity = "CRITICAL";
  } else if (affectedShipments.some(
    (shipment) => shipment.priority === "High"
  )) {
    severity = "HIGH";
  } else if (affectedShipments.length > 0) {
    severity = "MEDIUM";
  }

  return {
    disruption,
    disrupted_location: disruptedLocation,
    severity,
    affected_shipments: affectedShipments.map(
      (shipment) => shipment.id
    ),
    affected_shipment_details: affectedShipments.map(
      (shipment) => ({
        shipment_id: shipment.id,
        medicine: shipment.medicine,
        priority: shipment.priority,
        origin: shipment.origin,
        destination: shipment.destination,
        route: shipment.route
      })
    ),
    reason: disruptedLocation
      ? `${disruptedLocation} hub is unavailable`
      : "No known disrupted location detected"
  };
}

module.exports = {
  detectDisruption
};