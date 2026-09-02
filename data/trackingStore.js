// --------------------------------------------------
// TRACKING STORE
// In-memory GPS state for all active shipments.
// This is NOT a database — it is a lightweight
// in-process state object that the GPS simulator
// reads and writes on every tick.
// --------------------------------------------------

/*
 * waypointSets maps a route string keyword to a
 * named array of [lat, lng] waypoints.
 * The GPS simulator uses these to interpolate
 * smooth movement between cities.
 *
 * All coordinates are real Indian city positions.
 */
const waypointSets = {

  // SH001 — Delhi → Ambala → Chandigarh (original)
  "Delhi → Ambala → Chandigarh": [
    [28.6139, 77.2090],   // Delhi
    [29.9457, 76.8183],   // Panipat (midway)
    [30.3782, 76.7767],   // Ambala
    [30.7333, 76.7794]    // Chandigarh
  ],

  // SH001 — Delhi → Panipat → Chandigarh (rerouted - ROAD)
  "Delhi → Panipat → Chandigarh": [
    [28.6139, 77.2090],   // Delhi
    [29.3909, 76.9635],   // Panipat
    [30.1348, 76.9997],   // Kurukshetra
    [30.7333, 76.7794]    // Chandigarh
  ],

  // SH001 — Delhi → Ludhiana → Chandigarh (rerouted - HUB)
  "Delhi → Ludhiana → Chandigarh": [
    [28.6139, 77.2090],   // Delhi
    [29.9457, 76.8183],   // Panipat
    [30.9010, 75.8573],   // Ludhiana
    [30.7333, 76.7794]    // Chandigarh
  ],

  // SH001 — Delhi → Chandigarh (Air Freight)
  "Delhi → Chandigarh (Air Freight)": [
    [28.6139, 77.2090],   // Delhi
    [29.6700, 76.9800],   // Midair point
    [30.7333, 76.7794]    // Chandigarh
  ],

  // SH002 — Delhi → Ludhiana (original)
  "Delhi → Ludhiana": [
    [28.6139, 77.2090],   // Delhi
    [29.9457, 76.8183],   // Panipat
    [30.3782, 76.7767],   // Ambala
    [30.9010, 75.8573]    // Ludhiana
  ],

  // SH003 — Mumbai → Delhi (original)
  "Mumbai → Delhi": [
    [19.0760, 72.8777],   // Mumbai
    [22.3072, 73.1812],   // Vadodara
    [24.5854, 73.7125],   // Udaipur
    [26.9124, 75.7873],   // Jaipur
    [28.6139, 77.2090]    // Delhi
  ],

  // SH004 — Ambala → Amritsar (original)
  "Ambala → Amritsar": [
    [30.3782, 76.7767],   // Ambala
    [30.9010, 75.8573],   // Ludhiana
    [31.6340, 74.8723]    // Amritsar
  ],

  // SH004 — Ambala → Ludhiana → Amritsar (rerouted)
  "Ambala → Ludhiana → Amritsar": [
    [30.3782, 76.7767],   // Ambala
    [30.9010, 75.8573],   // Ludhiana
    [31.2100, 75.2000],   // Jalandhar
    [31.6340, 74.8723]    // Amritsar
  ]
};

/*
 * Default fallback waypoints — a single-segment
 * route used when no matching waypoint set is found.
 * Returns two points: origin → destination.
 */
function buildFallbackWaypoints(originLatLng, destLatLng) {
  return [originLatLng, destLatLng];
}


/*
 * resolveWaypoints — given a route string from
 * shipments.js, return the best matching waypoint set.
 */
function resolveWaypoints(routeString) {
  if (!routeString) {
    return null;
  }

  // Exact match
  if (waypointSets[routeString]) {
    return waypointSets[routeString];
  }

  // Partial match — find the key that best matches
  const keys = Object.keys(waypointSets);

  for (const key of keys) {
    if (
      routeString.includes(key) ||
      key.includes(routeString)
    ) {
      return waypointSets[key];
    }
  }

  return null;
}


/*
 * Initial tracking state per shipment.
 * progress: 0.0 → 1.0 within the current segment.
 * segmentIndex: which segment pair [i, i+1] we are on.
 */
const trackingStore = {

  SH001: {
    shipment_id:  "SH001",
    medicine:     "Insulin",
    priority:     "Critical",
    route:        "Delhi → Ambala → Chandigarh",
    latitude:     28.6139,
    longitude:    77.2090,
    speed:        75,
    heading:      330,
    eta_hours:    null,
    timestamp:    new Date().toISOString(),
    segmentIndex: 0,
    progress:     0.0
  },

  SH002: {
    shipment_id:  "SH002",
    medicine:     "Paracetamol",
    priority:     "Medium",
    route:        "Delhi → Ludhiana",
    latitude:     28.6139,
    longitude:    77.2090,
    speed:        65,
    heading:      340,
    eta_hours:    null,
    timestamp:    new Date().toISOString(),
    segmentIndex: 0,
    progress:     0.05
  },

  SH003: {
    shipment_id:  "SH003",
    medicine:     "Vaccines",
    priority:     "Critical",
    route:        "Mumbai → Delhi",
    latitude:     19.0760,
    longitude:    72.8777,
    speed:        80,
    heading:      15,
    eta_hours:    null,
    timestamp:    new Date().toISOString(),
    segmentIndex: 0,
    progress:     0.1
  },

  SH004: {
    shipment_id:  "SH004",
    medicine:     "Antibiotics",
    priority:     "High",
    route:        "Ambala → Amritsar",
    latitude:     30.3782,
    longitude:    76.7767,
    speed:        60,
    heading:      295,
    eta_hours:    null,
    timestamp:    new Date().toISOString(),
    segmentIndex: 0,
    progress:     0.08
  }
};


function getTrackingState(shipmentId) {
  return trackingStore[shipmentId] || null;
}


function getAllTrackingStates() {
  return Object.values(trackingStore);
}


function updateTrackingState(shipmentId, updates) {
  if (trackingStore[shipmentId]) {
    Object.assign(trackingStore[shipmentId], updates);
  }
}


module.exports = {
  trackingStore,
  waypointSets,
  resolveWaypoints,
  buildFallbackWaypoints,
  getTrackingState,
  getAllTrackingStates,
  updateTrackingState
};
