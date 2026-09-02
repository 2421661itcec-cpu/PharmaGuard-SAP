// --------------------------------------------------
// TRACKING ROUTES
// REST endpoints for the Network Map initial paint,
// live shipment positions, route polylines, and
// State Mega-Warehouses & Central Hubs directory.
// --------------------------------------------------

const express = require("express");
const router = express.Router();

const {
  getTrackingState,
  getAllTrackingStates,
  resolveWaypoints,
  getCoordinates
} = require("../data/trackingStore");

const {
  getAllWarehouses,
  getWarehouseByCity
} = require("../data/warehouses");

const shipments = require("../data/shipments");


// --------------------------------------------------
// GET /api/tracking/warehouses
// Returns all State Mega-Warehouses & Central Hubs
// --------------------------------------------------

router.get("/warehouses", (req, res) => {
  const warehouses = getAllWarehouses();
  res.json({
    success: true,
    count: warehouses.length,
    warehouses
  });
});


// --------------------------------------------------
// GET /api/tracking/all
// Returns current simulated GPS state, waypoints (for
// Zomato-style path lines), and named origin/destination
// state mega-warehouses for every shipment.
// --------------------------------------------------

router.get("/all", (req, res) => {

  const states = getAllTrackingStates();
  const allWarehouses = getAllWarehouses();

  // Merge with live shipment data (status, route)
  // so the map always reflects the latest agent state
  const enriched = states.map(state => {

    const liveShipment = shipments.find(
      s => s.id === state.shipment_id
    );

    const currentRoute = liveShipment ? liveShipment.route : state.route;
    const waypoints = resolveWaypoints(currentRoute) || [];

    const originCity = liveShipment ? liveShipment.origin : null;
    const destCity = liveShipment ? liveShipment.destination : null;

    const originWh = originCity ? getWarehouseByCity(originCity) : null;
    const destWh = destCity ? getWarehouseByCity(destCity) : null;

    const originCoords = liveShipment?.origin_coords || (originCity ? getCoordinates(originCity) : (waypoints[0] || [state.latitude, state.longitude]));
    const destCoords = liveShipment?.destination_coords || (destCity ? getCoordinates(destCity) : (waypoints[waypoints.length - 1] || [state.latitude, state.longitude]));

    return {
      shipment_id: state.shipment_id,
      medicine:    state.medicine,
      priority:    state.priority,
      origin:      originCity,
      origin_hub:  liveShipment?.origin_hub || (originWh ? originWh.hub_name : `${originCity} Central Logistics Hub`),
      origin_warehouse: liveShipment?.origin_warehouse || (originWh ? `${originWh.warehouse_name} (${originWh.location_address})` : `${originCity} State Central Pharma Warehouse`),
      origin_coords: originCoords,

      destination: destCity,
      destination_hub: liveShipment?.destination_hub || (destWh ? destWh.hub_name : `${destCity} Regional Pharma Depot`),
      destination_warehouse: liveShipment?.destination_warehouse || (destWh ? `${destWh.warehouse_name} (${destWh.location_address})` : `${destCity} State Buffer Depot`),
      destination_coords: destCoords,

      route:       currentRoute,
      waypoints:   waypoints,
      status:      liveShipment ? liveShipment.status : "In Transit",
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
    tracking: enriched,
    warehouses: allWarehouses
  });
});


// --------------------------------------------------
// GET /api/tracking/:id
// Returns GPS state for a single shipment with waypoints.
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
  const currentRoute = liveShipment ? liveShipment.route : state.route;
  const waypoints = resolveWaypoints(currentRoute) || [];

  const originCity = liveShipment ? liveShipment.origin : null;
  const destCity = liveShipment ? liveShipment.destination : null;

  const originWh = originCity ? getWarehouseByCity(originCity) : null;
  const destWh = destCity ? getWarehouseByCity(destCity) : null;

  res.json({
    success: true,
    tracking: {
      shipment_id: state.shipment_id,
      medicine:    state.medicine,
      priority:    state.priority,
      origin:      originCity,
      origin_hub:  liveShipment?.origin_hub || (originWh ? originWh.hub_name : `${originCity} Central Hub`),
      origin_warehouse: liveShipment?.origin_warehouse || (originWh ? `${originWh.warehouse_name} (${originWh.location_address})` : `${originCity} Central Warehouse`),
      origin_coords: liveShipment?.origin_coords || (waypoints[0] || [state.latitude, state.longitude]),

      destination: destCity,
      destination_hub: liveShipment?.destination_hub || (destWh ? destWh.hub_name : `${destCity} Regional Depot`),
      destination_warehouse: liveShipment?.destination_warehouse || (destWh ? `${destWh.warehouse_name} (${destWh.location_address})` : `${destCity} State Depot`),
      destination_coords: liveShipment?.destination_coords || (waypoints[waypoints.length - 1] || [state.latitude, state.longitude]),

      route:       currentRoute,
      waypoints:   waypoints,
      status:      liveShipment ? liveShipment.status : "In Transit",
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
