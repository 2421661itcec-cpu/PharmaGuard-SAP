// --------------------------------------------------
// DISRUPTION SENSING AGENT
// Responsibility:
// Detect disruption, identify the affected supply chain
// corridor or hub, and pinpoint affected shipments.
// Robust against any phrasing: specific cities, transit
// corridors, or generalized weather/infrastructure events.
// --------------------------------------------------

const shipments = require("../data/shipments");
const { getCoordinates, registerShipmentInTracking } = require("../data/trackingStore");

// Verified geographical locations across India and international hubs
const KNOWN_HUBS = [
  // Specific Corridor Junctions (without absorbing other cities)
  { name: "Ambala", matches: ["ambala", "gt road", "nh44", "nh-44", "grand trunk", "shivalik"] },
  { name: "Delhi", matches: ["delhi", "new delhi", "ncr"] },
  { name: "Chandigarh", matches: ["chandigarh"] },
  { name: "Ludhiana", matches: ["ludhiana"] },
  { name: "Amritsar", matches: ["amritsar", "wagah"] },
  { name: "Panipat", matches: ["panipat"] },
  { name: "Jalandhar", matches: ["jalandhar"] },

  // Western
  { name: "Mumbai", matches: ["mumbai", "bombay", "jnpt", "nh48"] },
  { name: "Pune", matches: ["pune"] },
  { name: "Ahmedabad", matches: ["ahmedabad"] },
  { name: "Surat", matches: ["surat"] },
  { name: "Vadodara", matches: ["vadodara", "baroda"] },
  { name: "Jaipur", matches: ["jaipur"] },
  { name: "Goa", matches: ["goa"] },

  // Southern
  { name: "Bangalore", matches: ["bangalore", "bengaluru", "electronic city", "whitefield"] },
  { name: "Chennai", matches: ["chennai", "madras"] },
  { name: "Hyderabad", matches: ["hyderabad", "secunderabad", "cyberabad"] },
  { name: "Coimbatore", matches: ["coimbatore"] },
  { name: "Kochi", matches: ["kochi", "cochin"] },
  { name: "Visakhapatnam", matches: ["visakhapatnam", "vizag"] },

  // Eastern & Central
  { name: "Kolkata", matches: ["kolkata", "calcutta", "howrah"] },
  { name: "Patna", matches: ["patna"] },
  { name: "Lucknow", matches: ["lucknow"] },
  { name: "Kanpur", matches: ["kanpur"] },
  { name: "Bhopal", matches: ["bhopal"] },
  { name: "Indore", matches: ["indore"] },
  { name: "Nagpur", matches: ["nagpur"] },
  { name: "Guwahati", matches: ["guwahati"] },
  { name: "Bhubaneswar", matches: ["bhubaneswar"] },


  // Global Hubs
  { name: "London", matches: ["london", "heathrow", "uk", "united kingdom"] },
  { name: "Frankfurt", matches: ["frankfurt", "germany"] },
  { name: "Singapore", matches: ["singapore", "changi"] },
  { name: "Dubai", matches: ["dubai", "uae"] },
  { name: "New York", matches: ["new york", "jfk", "newark", "usa"] },
  { name: "Basel", matches: ["basel", "zurich", "switzerland"] },
  { name: "Chicago", matches: ["chicago", "ohare"] },
  { name: "Paris", matches: ["paris", "charles de gaulle"] },
  { name: "Tokyo", matches: ["tokyo", "narita", "haneda", "japan"] }
];

// Words that must NEVER be treated as cities
const NON_LOCATION_STOPWORDS = new Set([
  "the", "a", "an", "all", "our", "in", "near", "at", "on", "to", "from", "between",
  "warehouse", "transit", "highway", "traffic", "hub", "hospital", "due", "road",
  "strike", "heavy", "delay", "severe", "closed", "closure", "snow", "rain",
  "storm", "flood", "flooding", "accident", "emergency", "power", "truck", "driver",
  "drivers", "bridge", "port", "customs", "audit", "hold", "temperature", "cold",
  "chain", "alert", "route", "shipment", "medicine", "facility", "fog", "jam",
  "block", "blocked", "breakdown", "protest", "outage", "landslide", "cyclone",
  "corridor", "terminal", "depot", "center", "centre", "expressway", "urgent",
  "breach", "failure", "shortage", "spill", "leak", "fire", "incident", "is",
  "are", "was", "were", "has", "have", "had", "with", "and", "by", "for", "of",
  "there", "this", "that", "some", "other", "city", "place", "state", "region",
  "severe", "moderate", "minor", "critical", "warning", "reported", "ongoing",
  "issue", "issues", "problem", "problems", "disturbance", "halt", "halted", "stopped"
]);


function extractLocation(disruptionText) {
  const lower = disruptionText.toLowerCase();
  const { cityCoordinates } = require("../data/trackingStore");

  // 1. Check known multi-word or alias hubs
  for (const hub of KNOWN_HUBS) {
    for (const kw of hub.matches) {
      const regex = new RegExp(`\\b${kw}\\b`, "i");
      if (regex.test(lower)) {
        return hub.name;
      }
    }
  }

  // 2. Direct match against 130+ Indian cities in cityCoordinates (sorted longest first)
  const cityKeys = Object.keys(cityCoordinates).sort((a, b) => b.length - a.length);
  for (const city of cityKeys) {
    const regex = new RegExp(`\\b${city}\\b`, "i");
    if (regex.test(lower)) {
      return city.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
    }
  }

  // 3. Check origins and destinations of existing shipments
  for (const s of shipments) {
    if (new RegExp(`\\b${s.origin.toLowerCase()}\\b`, "i").test(lower)) return s.origin;
    if (new RegExp(`\\b${s.destination.toLowerCase()}\\b`, "i").test(lower)) return s.destination;
  }

  // 4. Preposition patterns e.g. "in <City>", "near <City>", "at <City>"
  const patterns = [
    /(?:in|near|at|around|towards|outside|of|for)\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)/i,
    /([A-Za-z]+(?:\s+[A-Za-z]+)?)\s+(?:hub|distribution|warehouse|facility|port|airport|terminal|station|corridor|expressway|junction|border)/i
  ];

  for (const pattern of patterns) {
    const match = disruptionText.match(pattern);
    if (match && match[1]) {
      const candidate = match[1].trim();
      const firstWord = candidate.split(/\s+/)[0].toLowerCase();
      if (candidate.length > 2 && !NON_LOCATION_STOPWORDS.has(firstWord)) {
        return candidate.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
      }
    }
  }

  // 5. Smart token scanner: pick the first non-stopword word as the city name
  const tokens = disruptionText.replace(/[^\w\s-]/g, " ").split(/\s+/).filter(Boolean);
  for (const token of tokens) {
    const tLow = token.toLowerCase();
    if (tLow.length > 2 && !NON_LOCATION_STOPWORDS.has(tLow)) {
      return token.charAt(0).toUpperCase() + token.slice(1).toLowerCase();
    }
  }

  // 6. Ultimate fallback if zero location words are present
  return "Ambala";
}

function detectDisruption(disruption) {
  const disruptionText = (disruption || "").trim() || "Supply chain transit disruption";
  const lowerText = disruptionText.toLowerCase();

  // Extract the disrupted location cleanly
  const disruptedLocation = extractLocation(disruptionText);
  const locLower = disruptedLocation.toLowerCase();

  // Find existing shipments matching this location
  let affectedShipments = shipments.filter((shipment) => {
    const route = shipment.route.toLowerCase();
    const origin = shipment.origin.toLowerCase();
    const destination = shipment.destination.toLowerCase();

    return (
      route.includes(locLower) ||
      origin.includes(locLower) ||
      destination.includes(locLower)
    );
  });

  // If no shipment matches this location (e.g. user entered Dehradun, Shimla, Varanasi, Ranchi, Indore, etc.),
  // dynamically attach an active pharma corridor passing through that hub.
  if (affectedShipments.length === 0) {
    const { getWarehouseByCity, stateWarehouses } = require("../data/warehouses");
    const dynamicId = `SH-${disruptedLocation.slice(0, 3).toUpperCase()}${Math.floor(100 + Math.random() * 900)}`;

    // Regional pairing across Indian states
    const regionalPairings = {
      // Uttarakhand & Himachal & J&K
      "dehradun": "Delhi", "haridwar": "Delhi", "rishikesh": "Delhi", "roorkee": "Delhi", "nainital": "Delhi",
      "shimla": "Chandigarh", "manali": "Chandigarh", "dharamshala": "Chandigarh", "kullu": "Chandigarh", "solan": "Chandigarh",
      "jammu": "Ludhiana", "srinagar": "Delhi", "leh": "Chandigarh",

      // Uttar Pradesh & Central
      "lucknow": "Delhi", "kanpur": "Lucknow", "agra": "Delhi", "varanasi": "Lucknow", "prayagraj": "Lucknow",
      "allahabad": "Lucknow", "meerut": "Delhi", "bareilly": "Lucknow", "aligarh": "Delhi", "gorakhpur": "Lucknow", "jhansi": "Lucknow", "ayodhya": "Lucknow",
      "bhopal": "Delhi", "indore": "Bhopal", "gwalior": "Bhopal", "jabalpur": "Bhopal", "ujjain": "Indore", "sagar": "Bhopal",
      "raipur": "Bhopal", "bilaspur": "Raipur", "durg": "Raipur", "bhilai": "Raipur",

      // Bihar & Jharkhand
      "patna": "Kolkata", "ranchi": "Kolkata", "jamshedpur": "Kolkata", "dhanbad": "Kolkata", "bokaro": "Ranchi", "gaya": "Patna", "muzaffarpur": "Patna",

      // Maharashtra & Gujarat
      "mumbai": "Pune", "pune": "Mumbai", "nashik": "Mumbai", "nagpur": "Mumbai", "aurangabad": "Mumbai", "solapur": "Pune", "kolhapur": "Pune",
      "ahmedabad": "Mumbai", "surat": "Mumbai", "vadodara": "Ahmedabad", "rajkot": "Ahmedabad", "bhavnagar": "Ahmedabad", "vapi": "Mumbai",

      // Rajasthan
      "jaipur": "Delhi", "jodhpur": "Jaipur", "kota": "Jaipur", "bikaner": "Jaipur", "ajmer": "Jaipur", "udaipur": "Jaipur",

      // Karnataka & South
      "bangalore": "Chennai", "bengaluru": "Chennai", "mysore": "Bangalore", "mysuru": "Bangalore", "hubli": "Bangalore", "mangalore": "Bangalore", "belgaum": "Bangalore",
      "chennai": "Bangalore", "coimbatore": "Chennai", "madurai": "Chennai", "trichy": "Chennai", "salem": "Chennai", "tirunelveli": "Chennai",
      "kochi": "Bangalore", "thiruvananthapuram": "Kochi", "trivandrum": "Kochi", "kozhikode": "Kochi", "thrissur": "Kochi",
      "hyderabad": "Bangalore", "warangal": "Hyderabad", "visakhapatnam": "Hyderabad", "vizag": "Hyderabad", "vijayawada": "Hyderabad", "tirupati": "Chennai",

      // Odisha & North East & Goa
      "bhubaneswar": "Kolkata", "cuttack": "Bhubaneswar", "rourkela": "Bhubaneswar", "puri": "Bhubaneswar",
      "guwahati": "Kolkata", "silchar": "Guwahati", "dibrugarh": "Guwahati", "shillong": "Guwahati", "agartala": "Kolkata",
      "goa": "Mumbai", "panaji": "Mumbai"
    };

    const pairedDestination = regionalPairings[locLower] || "Delhi";

    const originWh = getWarehouseByCity(disruptedLocation);
    const destWh = getWarehouseByCity(pairedDestination);

    const coords = getCoordinates(disruptedLocation);
    const destCoords = getCoordinates(pairedDestination);

    const dynamicRoute = `${disruptedLocation} → Regional Logistics Corridor → ${pairedDestination}`;


    // Reuse or create dynamic shipment
    const existingDyn = shipments.find(s => s.origin === disruptedLocation);
    if (existingDyn) {
      affectedShipments = [existingDyn];
    } else {
      const dynamicShipment = {
        id: dynamicId,
        medicine: "Critical Oncology & Vaccines",
        priority: "Critical",
        origin: disruptedLocation,
        origin_hub: originWh ? originWh.hub_name : `${disruptedLocation} State Central Hub`,
        origin_warehouse: originWh ? `${originWh.warehouse_name} (${originWh.location_address})` : `${disruptedLocation} Strategic Medical Depot`,
        origin_coords: coords,
        destination: pairedDestination,
        destination_hub: destWh ? destWh.hub_name : `${pairedDestination} Regional Apex Depot`,
        destination_warehouse: destWh ? `${destWh.warehouse_name} (${destWh.location_address})` : `${pairedDestination} Strategic Medical Depot`,
        destination_coords: destCoords,
        route: dynamicRoute,
        status: "In Transit",
        lat: coords[0],
        lng: coords[1]
      };

      shipments.push(dynamicShipment);
      registerShipmentInTracking(dynamicShipment);
      affectedShipments = [dynamicShipment];
    }
  }


  // Determine severity based on disruption text and affected priority
  let severity = "MEDIUM";
  const isCriticalKeyword =
    lowerText.includes("flood") ||
    lowerText.includes("storm") ||
    lowerText.includes("closed") ||
    lowerText.includes("closure") ||
    lowerText.includes("cyclone") ||
    lowerText.includes("strike") ||
    lowerText.includes("accident") ||
    lowerText.includes("emergency") ||
    lowerText.includes("landslide");

  if (isCriticalKeyword || affectedShipments.some((s) => s.priority === "Critical")) {
    severity = "CRITICAL";
  } else if (
    lowerText.includes("delay") ||
    lowerText.includes("congestion") ||
    lowerText.includes("fog") ||
    affectedShipments.some((s) => s.priority === "High")
  ) {
    severity = "HIGH";
  } else if (affectedShipments.length > 0) {
    severity = "MEDIUM";
  }

  return {
    disruption: disruptionText,
    disrupted_location: disruptedLocation,
    severity,
    affected_shipments: affectedShipments.map((s) => s.id),
    affected_shipment_details: affectedShipments.map((s) => ({
      shipment_id: s.id,
      medicine: s.medicine,
      priority: s.priority,
      origin: s.origin,
      destination: s.destination,
      route: s.route
    })),
    reason: `${disruptedLocation} logistics hub / transit corridor is disrupted`
  };
}

module.exports = {
  detectDisruption
};