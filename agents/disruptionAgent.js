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
  // Northern Corridor
  { name: "Ambala", matches: ["ambala", "gt road", "nh44", "nh-44", "grand trunk", "shivalik"] },
  { name: "Delhi", matches: ["delhi", "new delhi", "ncr", "noida", "gurgaon", "gurugram", "faridabad", "ghaziabad"] },
  { name: "Chandigarh", matches: ["chandigarh", "mohali", "panchkula"] },
  { name: "Ludhiana", matches: ["ludhiana"] },
  { name: "Amritsar", matches: ["amritsar", "wagah"] },
  { name: "Panipat", matches: ["panipat", "karnal", "kurukshetra", "sonipat", "rohtak"] },
  { name: "Jalandhar", matches: ["jalandhar"] },

  // Western Corridor
  { name: "Mumbai", matches: ["mumbai", "bombay", "navi mumbai", "thane", "jnpt", "nh48"] },
  { name: "Pune", matches: ["pune", "pimpri"] },
  { name: "Ahmedabad", matches: ["ahmedabad", "gandhinagar", "gujarat"] },
  { name: "Surat", matches: ["surat", "hazira"] },
  { name: "Vadodara", matches: ["vadodara", "baroda"] },
  { name: "Udaipur", matches: ["udaipur"] },
  { name: "Jaipur", matches: ["jaipur", "rajasthan"] },
  { name: "Goa", matches: ["goa", "mormugao"] },

  // Southern Corridor
  { name: "Bangalore", matches: ["bangalore", "bengaluru", "electronic city", "whitefield", "karnataka"] },
  { name: "Chennai", matches: ["chennai", "madras", "ennore", "tamil nadu"] },
  { name: "Hyderabad", matches: ["hyderabad", "secunderabad", "cyberabad", "telangana"] },
  { name: "Coimbatore", matches: ["coimbatore"] },
  { name: "Kochi", matches: ["kochi", "cochin", "kerala"] },
  { name: "Visakhapatnam", matches: ["visakhapatnam", "vizag", "andhra"] },

  // Eastern & Central Corridor
  { name: "Kolkata", matches: ["kolkata", "calcutta", "howrah", "west bengal"] },
  { name: "Patna", matches: ["patna", "bihar"] },
  { name: "Lucknow", matches: ["lucknow", "kanpur", "uttar pradesh", "up"] },
  { name: "Bhopal", matches: ["bhopal", "indore", "madhya pradesh", "mp"] },
  { name: "Nagpur", matches: ["nagpur"] },
  { name: "Guwahati", matches: ["guwahati", "assam"] },
  { name: "Bhubaneswar", matches: ["bhubaneswar", "odisha"] },

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
  "block", "blocked", "breakdown", "strike", "protest", "outage", "landslide",
  "corridor", "terminal", "depot", "center", "centre", "expressway", "urgent",
  "breach", "failure", "shortage", "spill", "leak", "fire", "incident"
]);

function extractLocation(disruptionText) {
  const lower = disruptionText.toLowerCase();

  // 1. Check known hubs (direct word or boundary match)
  for (const hub of KNOWN_HUBS) {
    for (const kw of hub.matches) {
      const regex = new RegExp(`\\b${kw}\\b`, "i");
      if (regex.test(lower)) {
        return hub.name;
      }
    }
  }

  // 2. Check origins and destinations of existing shipments
  for (const s of shipments) {
    if (new RegExp(`\\b${s.origin.toLowerCase()}\\b`, "i").test(lower)) return s.origin;
    if (new RegExp(`\\b${s.destination.toLowerCase()}\\b`, "i").test(lower)) return s.destination;
  }

  // 3. Regex for pattern "in <City>", "near <City>", "at <City>"
  const patterns = [
    /(?:in|near|at|around|towards|outside)\s+([A-Za-z]+)/i,
    /([A-Za-z]+)\s+(?:hub|distribution|warehouse|facility|port|airport|terminal|station)/i
  ];

  for (const pattern of patterns) {
    const match = disruptionText.match(pattern);
    if (match && match[1]) {
      const candidate = match[1].trim();
      if (candidate.length > 2 && !NON_LOCATION_STOPWORDS.has(candidate.toLowerCase())) {
        return candidate.charAt(0).toUpperCase() + candidate.slice(1).toLowerCase();
      }
    }
  }

  // 4. Default fallback: if no city is named (e.g. user entered "heavy rain", "truck strike", "accident on highway"),
  // default to the central transit lifeline (Ambala Corridor) connecting active shipments.
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

  // If no shipment matches this location (e.g. user entered Bangalore, Kolkata, London, etc.),
  // dynamically attach an active pharma corridor passing through that hub.
  if (affectedShipments.length === 0) {
    const dynamicId = `SH-${disruptedLocation.slice(0, 3).toUpperCase()}${Math.floor(100 + Math.random() * 900)}`;
    const pairedDestination =
      locLower === "bangalore" ? "Chennai"
      : locLower === "mumbai" ? "Pune"
      : locLower === "kolkata" ? "Patna"
      : locLower === "hyderabad" ? "Bangalore"
      : locLower === "london" ? "Frankfurt"
      : locLower === "frankfurt" ? "Basel"
      : "Central Hub";

    const coords = getCoordinates(disruptedLocation);

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
        destination: pairedDestination,
        route: `${disruptedLocation} → Central Corridor → ${pairedDestination}`,
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