// --------------------------------------------------
// TRACKING STORE
// In-memory GPS state for all active shipments.
// This is NOT a database — it is a lightweight
// in-process state object that the GPS simulator
// reads and writes on every tick.
// --------------------------------------------------

// City coordinates directory (Indian and major global pharma logistics hubs)
const cityCoordinates = {
  // India North & NCR
  "delhi":          [28.6139, 77.2090],
  "new delhi":      [28.6139, 77.2090],
  "noida":          [28.5355, 77.3910],
  "gurgaon":        [28.4595, 77.0266],
  "gurugram":       [28.4595, 77.0266],
  "faridabad":      [28.4089, 77.3178],
  "ghaziabad":      [28.6692, 77.4538],
  "chandigarh":     [30.7333, 76.7794],
  "mohali":         [30.7046, 76.7179],
  "panchkula":      [30.6942, 76.8606],
  "ambala":         [30.3782, 76.7767],
  "ludhiana":       [30.9010, 75.8573],
  "amritsar":       [31.6340, 74.8723],
  "jalandhar":      [31.3260, 75.5762],
  "patiala":        [30.3398, 76.3869],
  "bathinda":       [30.2110, 74.9455],
  "panipat":        [29.3909, 76.9635],
  "karnal":         [29.6857, 76.9905],
  "kurukshetra":    [30.1348, 76.9997],
  "sonipat":        [28.9931, 77.0151],
  "rohtak":         [28.8955, 76.6066],
  "hisar":          [29.1492, 75.7217],
  "shimla":         [31.1048, 77.1734],
  "dharamshala":    [32.2190, 76.3234],
  "manali":         [32.2432, 77.1892],
  "kullu":          [31.9579, 77.1095],
  "solan":          [30.9045, 77.0967],
  "dehradun":       [30.3165, 78.0322],
  "haridwar":       [29.9457, 78.1642],
  "rishikesh":      [30.0869, 78.2676],
  "roorkee":        [29.8543, 77.8880],
  "nainital":       [29.3919, 79.4542],
  "jammu":          [32.7266, 74.8570],
  "srinagar":       [34.0837, 74.7973],
  "leh":            [34.1526, 77.5771],

  // India UP & Central
  "lucknow":        [26.8467, 80.9462],
  "kanpur":         [26.4499, 80.3319],
  "agra":           [27.1767, 78.0081],
  "varanasi":       [25.3176, 82.9739],
  "prayagraj":      [25.4358, 81.8463],
  "allahabad":      [25.4358, 81.8463],
  "meerut":         [28.9845, 77.7064],
  "bareilly":       [28.3670, 79.4304],
  "aligarh":        [27.8974, 78.0880],
  "moradabad":      [28.8351, 78.7747],
  "gorakhpur":      [26.7606, 83.3732],
  "jhansi":         [25.4484, 78.5685],
  "mathura":        [27.4924, 77.6737],
  "ayodhya":        [26.7922, 82.1998],
  "bhopal":         [23.2599, 77.4126],
  "indore":         [22.7196, 75.8577],
  "gwalior":        [26.2183, 78.1828],
  "jabalpur":       [23.1815, 79.9864],
  "ujjain":         [23.1765, 75.7885],
  "sagar":          [23.8388, 78.7378],
  "satna":          [24.6005, 80.8322],
  "rewa":           [24.5362, 81.3037],
  "raipur":         [21.2514, 81.6296],
  "bilaspur":       [22.0797, 82.1409],
  "durg":           [21.1904, 81.2849],
  "bhilai":         [21.2144, 81.3805],

  // India West
  "mumbai":         [19.0760, 72.8777],
  "navi mumbai":    [19.0330, 73.0297],
  "thane":          [19.2183, 72.9781],
  "pune":           [18.5204, 73.8567],
  "nashik":         [19.9975, 73.7898],
  "nagpur":         [21.1458, 79.0882],
  "aurangabad":     [19.8762, 75.3433],
  "solapur":        [17.6599, 75.9064],
  "kolhapur":       [16.7050, 74.2433],
  "amravati":       [20.9374, 77.7796],
  "nanded":         [19.1383, 77.3210],
  "sangli":         [16.8524, 74.5815],
  "jalgaon":        [21.0077, 75.5626],
  "akola":          [20.7002, 77.0082],
  "ahmedabad":      [23.0225, 72.5714],
  "gandhinagar":    [23.2156, 72.6369],
  "surat":          [21.1702, 72.8311],
  "vadodara":       [22.3072, 73.1812],
  "rajkot":         [22.3039, 70.8022],
  "bhavnagar":      [21.7645, 72.1519],
  "jamnagar":       [22.4707, 70.0577],
  "junagadh":       [21.5222, 70.4579],
  "gandhidham":     [23.0753, 70.1337],
  "vapi":           [20.3893, 72.9106],
  "jaipur":         [26.9124, 75.7873],
  "jodhpur":        [26.2389, 73.0243],
  "kota":           [25.2138, 75.8648],
  "bikaner":        [28.0229, 73.3119],
  "ajmer":          [26.4499, 74.6399],
  "udaipur":        [24.5854, 73.7125],
  "bhilwara":       [25.3407, 74.6313],
  "alwar":          [27.5530, 76.6346],
  "sikar":          [27.6094, 75.1399],
  "goa":            [15.2993, 74.1240],
  "panaji":         [15.4909, 73.8278],

  // India South
  "bangalore":      [12.9716, 77.5946],
  "bengaluru":      [12.9716, 77.5946],
  "mysore":         [12.2958, 76.6394],
  "mysuru":         [12.2958, 76.6394],
  "hubli":          [15.3647, 75.1240],
  "hubballi":       [15.3647, 75.1240],
  "dharwad":        [15.4589, 75.0078],
  "mangalore":      [12.9141, 74.8560],
  "mangaluru":      [12.9141, 74.8560],
  "belgaum":        [15.8497, 74.4977],
  "belagavi":       [15.8497, 74.4977],
  "gulbarga":       [17.3297, 76.8343],
  "kalaburagi":     [17.3297, 76.8343],
  "davanagere":     [14.4644, 75.9218],
  "bellary":        [15.1394, 76.9214],
  "ballari":        [15.1394, 76.9214],
  "shimoga":        [13.9299, 75.5681],
  "shivamogga":     [13.9299, 75.5681],
  "tumkur":         [13.3379, 77.1006],
  "chennai":        [13.0827, 80.2707],
  "coimbatore":     [11.0168, 76.9558],
  "madurai":        [9.9252, 78.1198],
  "tiruchirappalli":[10.7905, 78.7047],
  "trichy":         [10.7905, 78.7047],
  "salem":          [11.6643, 78.1460],
  "tirunelveli":    [8.7139, 77.7567],
  "tiruppur":       [11.1085, 77.3411],
  "vellore":        [12.9165, 79.1325],
  "erode":          [11.3410, 77.7172],
  "thoothukudi":    [8.7642, 78.1348],
  "hyderabad":      [17.3850, 78.4867],
  "secunderabad":   [17.4399, 78.4983],
  "warangal":       [17.9689, 79.5941],
  "nizamabad":      [18.6725, 78.0941],
  "karimnagar":     [18.4386, 79.1288],
  "khammam":        [17.2473, 80.1514],
  "visakhapatnam":  [17.6868, 83.2185],
  "vizag":          [17.6868, 83.2185],
  "vijayawada":     [16.5062, 80.6480],
  "guntur":         [16.3067, 80.4365],
  "nellore":        [14.4426, 79.9865],
  "kurnool":        [15.8281, 78.0373],
  "rajahmundry":    [17.0005, 81.8040],
  "tirupati":       [13.6288, 79.4192],
  "kakinada":       [16.9891, 82.2475],
  "kadapa":         [14.4673, 78.8242],
  "anantapur":      [14.6819, 77.6006],
  "kochi":          [9.9312, 76.2673],
  "cochin":         [9.9312, 76.2673],
  "thiruvananthapuram": [8.5241, 76.9366],
  "trivandrum":     [8.5241, 76.9366],
  "kozhikode":      [11.2588, 75.7804],
  "calicut":        [11.2588, 75.7804],
  "thrissur":       [10.5276, 76.2144],
  "kollam":         [8.8932, 76.6141],
  "palakkad":       [10.7867, 76.6548],
  "alappuzha":      [9.4981, 76.3388],
  "kannur":         [11.8745, 75.3704],
  "kottayam":       [9.5916, 76.5222],

  // India East & Northeast
  "kolkata":        [22.5726, 88.3639],
  "howrah":         [22.5958, 88.2636],
  "durgapur":       [23.5204, 87.3119],
  "asansol":        [23.6739, 86.9524],
  "siliguri":       [26.7271, 88.3953],
  "kharagpur":      [22.3460, 87.2320],
  "patna":          [25.5941, 85.1376],
  "gaya":           [24.7955, 85.0002],
  "bhagalpur":      [25.2425, 86.9842],
  "muzaffarpur":    [26.1209, 85.3647],
  "darbhanga":      [26.1542, 85.8918],
  "ranchi":         [23.3441, 85.3096],
  "jamshedpur":     [22.8046, 86.2029],
  "dhanbad":        [23.7957, 86.4304],
  "bokaro":         [23.6693, 86.1511],
  "bhubaneswar":    [20.2961, 85.8245],
  "cuttack":        [20.4625, 85.8828],
  "rourkela":       [22.2604, 84.8536],
  "berhampur":      [19.3150, 84.7941],
  "sambalpur":      [21.4669, 83.9812],
  "puri":           [19.8135, 85.8312],
  "guwahati":       [26.1445, 91.7362],
  "silchar":        [24.8170, 92.7993],
  "dibrugarh":      [27.4728, 94.9120],
  "jorhat":         [26.7509, 94.2037],
  "tezpur":         [26.6528, 92.7926],
  "agartala":       [23.8315, 91.2868],
  "shillong":       [25.5788, 91.8933],
  "imphal":         [24.8170, 93.9368],
  "aizawl":         [23.7271, 92.7176],
  "kohima":         [25.6751, 94.1086],
  "gangtok":        [27.3389, 88.6065],
  "itanagar":       [27.0844, 93.6053],

  // International Global Hubs
  "london":         [51.5074, -0.1278],
  "frankfurt":      [50.1109, 8.6821],
  "singapore":      [1.3521, 103.8198],
  "dubai":          [25.2048, 55.2708],
  "new york":       [40.7128, -74.0060],
  "tokyo":          [35.6762, 139.6503],
  "basel":          [47.5596, 7.5886],
  "zurich":         [47.3769, 8.5417],
  "chicago":        [41.8781, -87.6298],
  "paris":          [48.8566, 2.3522],
  "berlin":         [52.5200, 13.4050],
  "amsterdam":      [52.3676, 4.9041]
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

  // SH003 — Mumbai → Navi Mumbai → Pune (vaccine deficit fulfillment)
  "Mumbai → Navi Mumbai → Pune": [
    [19.0760, 72.8777],   // Mumbai
    [18.9894, 73.1175],   // Navi Mumbai / Panvel
    [18.7546, 73.4062],   // Lonavala Western Ghats
    [18.5204, 73.8567]    // Pune
  ],

  // SH003 — Mumbai → Delhi (original alternative)
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
