// --------------------------------------------------
// TRACKING STORE
// In-memory GPS state for all active shipments.
// This is NOT a database — it is a lightweight
// in-process state object that the GPS simulator
// reads and writes on every tick.
// --------------------------------------------------

// City coordinates directory (Indian and major global pharma logistics hubs)
const cityCoordinates = {
  // India North & Central
  "delhi":       [28.6139, 77.2090],
  "new delhi":   [28.6139, 77.2090],
  "chandigarh":  [30.7333, 76.7794],
  "ambala":      [30.3782, 76.7767],
  "ludhiana":    [30.9010, 75.8573],
  "amritsar":    [31.6340, 74.8723],
  "panipat":     [29.3909, 76.9635],
  "kurukshetra": [30.1348, 76.9997],
  "jalandhar":   [31.3260, 75.5762],
  "jaipur":      [26.9124, 75.7873],
  "lucknow":     [26.8467, 80.9462],
  "kanpur":      [26.4499, 80.3319],
  "agra":        [27.1767, 78.0081],
  "bhopal":      [23.2599, 77.4126],
  "indore":      [22.7196, 75.8577],
  "nagpur":      [21.1458, 79.0882],
  "patna":       [25.5941, 85.1376],

  // India West & South & East
  "mumbai":      [19.0760, 72.8777],
  "pune":        [18.5204, 73.8567],
  "ahmedabad":   [23.0225, 72.5714],
  "surat":       [21.1702, 72.8311],
  "vadodara":    [22.3072, 73.1812],
  "udaipur":     [24.5854, 73.7125],
  "bangalore":   [12.9716, 77.5946],
  "bengaluru":   [12.9716, 77.5946],
  "chennai":     [13.0827, 80.2707],
  "hyderabad":   [17.3850, 78.4867],
  "kolkata":     [22.5726, 88.3639],
  "coimbatore":  [11.0168, 76.9558],
  "kochi":       [9.9312, 76.2673],
  "cochin":      [9.9312, 76.2673],
  "visakhapatnam": [17.6868, 83.2185],
  "vizag":       [17.6868, 83.2185],
  "goa":         [15.2993, 74.1240],
  "guwahati":    [26.1445, 91.7362],
  "bhubaneswar": [20.2961, 85.8245],

  // Global Hubs
  "london":      [51.5074, -0.1278],
  "frankfurt":   [50.1109, 8.6821],
  "singapore":   [1.3521, 103.8198],
  "dubai":       [25.2048, 55.2708],
  "new york":    [40.7128, -74.0060],
  "tokyo":       [35.6762, 139.6503],
  "basel":       [47.5596, 7.5886],
  "zurich":      [47.3769, 8.5417],
  "chicago":     [41.8781, -87.6298],
  "paris":       [48.8566, 2.3522],
  "berlin":      [52.5200, 13.4050],
  "amsterdam":   [52.3676, 4.9041]
};

// Deterministic coordinate generator for any arbitrary unknown location
function getCoordinates(name) {
  if (!name) return [28.6139, 77.2090]; // Delhi fallback
  const clean = name.trim().toLowerCase();
  if (cityCoordinates[clean]) {
    return cityCoordinates[clean];
  }
  // Check partial matches
  for (const [k, v] of Object.entries(cityCoordinates)) {
    if (clean.includes(k) || k.includes(clean)) {
      return v;
    }
  }
  // Deterministic hash to valid lat/lng in India bounds
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = (hash << 5) - hash + clean.charCodeAt(i);
    hash |= 0;
  }
  const lat = 12.0 + (Math.abs(hash) % 1800) / 100; // 12 to 30 N
  const lng = 73.0 + (Math.abs(hash >> 3) % 1500) / 100; // 73 to 88 E
  return [parseFloat(lat.toFixed(4)), parseFloat(lng.toFixed(4))];
}

/*
 * waypointSets maps a route string keyword to a
 * named array of [lat, lng] waypoints.
 * The GPS simulator uses these to interpolate
 * smooth movement between cities.
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
 * Default fallback waypoints — a multi-segment
 * route generated between origin and destination.
 */
function buildFallbackWaypoints(originLatLng, destLatLng) {
  const midLat = (originLatLng[0] + destLatLng[0]) / 2 + 0.15;
  const midLng = (originLatLng[1] + destLatLng[1]) / 2 + 0.15;
  return [originLatLng, [midLat, midLng], destLatLng];
}

/*
 * resolveWaypoints — given any route string,
 * return the best matching waypoint set.
 * If not in predefined sets, dynamically parse cities and build real waypoints.
 */
function resolveWaypoints(routeString) {
  if (!routeString) {
    return null;
  }

  // Exact match
  if (waypointSets[routeString]) {
    return waypointSets[routeString];
  }

  // Partial match against existing sets
  const keys = Object.keys(waypointSets);
  for (const key of keys) {
    if (routeString.includes(key) || key.includes(routeString)) {
      return waypointSets[key];
    }
  }

  // Dynamically parse route string by arrows (→, ->, to, -)
  const delimiters = ["→", "->", " to ", " - "];
  let parts = [routeString];
  for (const delim of delimiters) {
    if (routeString.includes(delim)) {
      parts = routeString.split(delim).map(p => p.trim()).filter(Boolean);
      break;
    }
  }

  if (parts.length >= 2) {
    const coords = parts.map(p => {
      // Remove modifiers like "(Air Freight)"
      const cleanName = p.replace(/\(.*\)/g, "").trim();
      return getCoordinates(cleanName);
    });

    // If only 2 points, insert a realistic midpoint for smooth curved animation
    if (coords.length === 2) {
      const mid = [
        parseFloat(((coords[0][0] + coords[1][0]) / 2 + 0.2).toFixed(4)),
        parseFloat(((coords[0][1] + coords[1][1]) / 2 + 0.15).toFixed(4))
      ];
      return [coords[0], mid, coords[1]];
    }
    return coords;
  }

  return null;
}

/*
 * Initial tracking state per shipment.
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

// Dynamically register a new shipment into tracking store
function registerShipmentInTracking(shipment) {
  if (!shipment || !shipment.id) return;
  if (!trackingStore[shipment.id]) {
    const coords = getCoordinates(shipment.origin);
    trackingStore[shipment.id] = {
      shipment_id:  shipment.id,
      medicine:     shipment.medicine || "Life-Saving Pharma",
      priority:     shipment.priority || "Critical",
      route:        shipment.route,
      latitude:     shipment.lat || coords[0],
      longitude:    shipment.lng || coords[1],
      speed:        70,
      heading:      45,
      eta_hours:    shipment.eta_hours || 4,
      timestamp:    new Date().toISOString(),
      segmentIndex: 0,
      progress:     0.0
    };
  }
}

module.exports = {
  trackingStore,
  waypointSets,
  cityCoordinates,
  getCoordinates,
  resolveWaypoints,
  buildFallbackWaypoints,
  getTrackingState,
  getAllTrackingStates,
  updateTrackingState,
  registerShipmentInTracking
};
