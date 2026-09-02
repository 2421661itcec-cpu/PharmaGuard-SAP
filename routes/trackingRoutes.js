// --------------------------------------------------
// TRACKING ROUTES
// REST endpoints for the Network Map initial paint.
//
// These are ADDITIONAL routes — they do not replace
// or overlap with any existing REST API.
//
// GET /api/tracking/all   — all shipment positions
// GET /api/tracking/:id   — one shipment's position
// --------------------------------------------------

const express = require("express");
const router = express.Router();

const {
  getTrackingState,
  getAllTrackingStates
} = require("../data/trackingStore");

const shipments = require("../data/shipments");


// --------------------------------------------------
// GET /api/tracking/all
// Returns current simulated GPS state for every
// tracked shipment. Used by the Network Map on
// initial load before Socket.IO updates begin.
// --------------------------------------------------

router.get("/all", (req, res) => {

  const states = getAllTrackingStates();

  // Merge with live shipment data (status, route)
  // so the map always reflects the latest agent state
  const enriched = states.map(state => {

    const liveShipment = shipments.find(
      s => s.id === state.shipment_id
    );

    return {
      shipment_id: state.shipment_id,
      medicine:    state.medicine,
      priority:    state.priority,
      origin:      liveShipment ? liveShipment.origin      : null,
      destination: liveShipment ? liveShipment.destination : null,
      route:       liveShipment ? liveShipment.route       : state.route,
      status:      liveShipment ? liveShipment.status      : "In Transit",
      latitude:    state.latitude,
      longitude:   state.longitude,
      speed:       state.speed,
      heading:     state.heading,
      eta_hours:   liveShipment
        ? (liveShipment.eta_hours || state.eta_hours)
        : state.eta_hours,
      timestamp:   state.timestamp
    };
  });

  res.json({
    success: true,
    count:   enriched.length,
    tracking: enriched
  });
});


// --------------------------------------------------
// GET /api/tracking/:id
// Returns GPS state for a single shipment.
// --------------------------------------------------

router.get("/:id", (req, res) => {

  const id = String(req.params.id).toUpperCase();

  const state = getTrackingState(id);

  if (!state) {
    return res.status(404).json({
      success: false,
      message: `No tracking data found for shipment ${id}.`
    });
  }

  const liveShipment = shipments.find(s => s.id === id);

  res.json({
    success: true,
    tracking: {
      shipment_id: state.shipment_id,
      medicine:    state.medicine,
      priority:    state.priority,
      origin:      liveShipment ? liveShipment.origin      : null,
      destination: liveShipment ? liveShipment.destination : null,
      route:       liveShipment ? liveShipment.route       : state.route,
      status:      liveShipment ? liveShipment.status      : "In Transit",
      latitude:    state.latitude,
      longitude:   state.longitude,
      speed:       state.speed,
      heading:     state.heading,
      eta_hours:   liveShipment
        ? (liveShipment.eta_hours || state.eta_hours)
        : state.eta_hours,
      timestamp:   state.timestamp
    }
  });
});


module.exports = router;
