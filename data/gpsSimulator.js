// --------------------------------------------------
// GPS SIMULATOR
// Runs a smooth simulated GPS engine that:
//   1. Interpolates shipment positions along
//      pre-defined waypoint sequences.
//   2. Detects when the Rerouting Agent changes
//      a shipment route and switches waypoint sets.
//   3. Emits Socket.IO 'trackingUpdate' events to
//      all connected browser clients every tick.
//
// This runs inside the SAME Node.js process as
// the Express server. It does NOT create a second
// server or process.
//
// All existing agents and REST APIs are untouched.
// This module only READS shipments.js to detect
// route changes — it never modifies agent behavior.
// --------------------------------------------------

const shipments = require("./shipments");

const {
  trackingStore,
  resolveWaypoints,
  updateTrackingState,
  getAllTrackingStates
} = require("./trackingStore");


// How many seconds between each simulation tick.
const TICK_INTERVAL_MS = 3000;

// How much progress (0.0–1.0) to advance per tick
// within a single route segment.
// 0.04 means ~25 ticks per segment = smooth movement.
const PROGRESS_PER_TICK = 0.04;

let simulatorInterval = null;


// --------------------------------------------------
// LERP — Linear interpolation between two points
// --------------------------------------------------

function lerp(a, b, t) {
  return a + (b - a) * t;
}


// --------------------------------------------------
// CALCULATE HEADING between two lat/lng points
// Returns degrees (0–360, 0 = North)
// --------------------------------------------------

function calculateHeading(fromLat, fromLng, toLat, toLng) {
  const dLng = toLng - fromLng;
  const dLat = toLat - fromLat;

  const angle = Math.atan2(dLng, dLat) * (180 / Math.PI);

  return (angle + 360) % 360;
}


// --------------------------------------------------
// ADVANCE ONE SHIPMENT
// Moves the shipment marker forward along its
// current route waypoint sequence.
// --------------------------------------------------

function advanceShipment(state, liveShipment) {

  // Sync route from live shipments.js data
  // (Rerouting Agent mutates shipment.route directly)
  const liveRoute = liveShipment
    ? liveShipment.route
    : state.route;

  const routeChanged = liveRoute && liveRoute !== state.route;

  // If the route changed, reset to the new waypoints
  if (routeChanged) {
    const newWaypoints = resolveWaypoints(liveRoute);

    if (newWaypoints && newWaypoints.length >= 2) {
      updateTrackingState(state.shipment_id, {
        route:        liveRoute,
        latitude:     newWaypoints[0][0],
        longitude:    newWaypoints[0][1],
        segmentIndex: 0,
        progress:     0.0
      });

      // Re-fetch updated state
      Object.assign(state, trackingStore[state.shipment_id]);
    }
  }

  // Resolve waypoints for current route
  const waypoints = resolveWaypoints(state.route);

  if (!waypoints || waypoints.length < 2) {
    // No waypoints — hold position
    return;
  }

  const totalSegments = waypoints.length - 1;

  // If we've completed all segments, hold at destination
  if (state.segmentIndex >= totalSegments) {
    const dest = waypoints[waypoints.length - 1];

    updateTrackingState(state.shipment_id, {
      latitude:  dest[0],
      longitude: dest[1],
      speed:     0,
      timestamp: new Date().toISOString()
    });

    return;
  }

  const fromWp = waypoints[state.segmentIndex];
  const toWp   = waypoints[state.segmentIndex + 1];

  // Advance progress within this segment
  let newProgress = state.progress + PROGRESS_PER_TICK;

  let newSegmentIndex = state.segmentIndex;

  // If we've passed the end of this segment, move to next
  if (newProgress >= 1.0) {
    newProgress = 0.0;
    newSegmentIndex = state.segmentIndex + 1;
  }

  // Interpolate current lat/lng
  const interpProgress = (newSegmentIndex > state.segmentIndex)
    ? 0.0
    : newProgress;

  const activeTo = (newSegmentIndex >= totalSegments)
    ? waypoints[waypoints.length - 1]
    : waypoints[newSegmentIndex + 1] || toWp;

  const activeFrom = waypoints[newSegmentIndex] || fromWp;

  const newLat = lerp(
    activeFrom[0],
    activeTo[0],
    interpProgress
  );

  const newLng = lerp(
    activeFrom[1],
    activeTo[1],
    interpProgress
  );

  // Calculate heading
  const heading = calculateHeading(
    state.latitude,
    state.longitude,
    newLat,
    newLng
  );

  // Sync eta_hours from live shipment data
  const etaHours = liveShipment
    ? (liveShipment.eta_hours || null)
    : state.eta_hours;

  updateTrackingState(state.shipment_id, {
    latitude:     newLat,
    longitude:    newLng,
    heading:      Math.round(heading),
    speed:        state.speed || 70,
    eta_hours:    etaHours,
    timestamp:    new Date().toISOString(),
    segmentIndex: newSegmentIndex,
    progress:     newProgress
  });
}


// --------------------------------------------------
// START SIMULATION
// Called once from server.js after Socket.IO is ready.
// Receives the Socket.IO server instance (io) so it
// can broadcast updates to connected clients.
// --------------------------------------------------

function startSimulation(io) {

  if (simulatorInterval) {
    // Prevent double-starting
    clearInterval(simulatorInterval);
  }

  console.log(
    "[GPS Simulator] Starting — tick every " +
    (TICK_INTERVAL_MS / 1000) + "s"
  );

  simulatorInterval = setInterval(() => {

    // For each tracked shipment, advance position
    const allStates = getAllTrackingStates();

    allStates.forEach(state => {

      // Find the live shipment record (may have been
      // mutated by the Rerouting Agent)
      const liveShipment = shipments.find(
        s => s.id === state.shipment_id
      );

      advanceShipment(state, liveShipment);
    });

    // Emit updated state to all connected clients
    const updatedStates = getAllTrackingStates().map(s => ({
      shipment_id: s.shipment_id,
      medicine:    s.medicine,
      priority:    s.priority,
      route:       s.route,
      latitude:    s.latitude,
      longitude:   s.longitude,
      speed:       s.speed,
      heading:     s.heading,
      eta_hours:   s.eta_hours,
      timestamp:   s.timestamp
    }));

    io.emit("trackingUpdate", updatedStates);

  }, TICK_INTERVAL_MS);


  // Clean up on server shutdown
  process.on("SIGINT", () => {
    console.log("[GPS Simulator] Stopping.");
    clearInterval(simulatorInterval);
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    console.log("[GPS Simulator] Stopping.");
    clearInterval(simulatorInterval);
    process.exit(0);
  });
}


// --------------------------------------------------
// STOP SIMULATION (for testing / cleanup)
// --------------------------------------------------

function stopSimulation() {
  if (simulatorInterval) {
    clearInterval(simulatorInterval);
    simulatorInterval = null;
  }
}


module.exports = {
  startSimulation,
  stopSimulation
};
