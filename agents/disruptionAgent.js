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

// --------------------------------------------------
// DEMAND & SHORTAGE-DRIVEN DESTINATION ENGINE
// Resolves destination based on:
// 1. Emergency/Disaster Casualty Surges (floods, landslides, accidents)
// 2. Critical Stock Deficiencies (lowest days of inventory remaining)
// NEVER dumps surplus into Delhi.
// --------------------------------------------------
function determineSupplyChainFlow(disruptedLocation, disruptionText) {
  const lower = (disruptionText || "").toLowerCase();
  const locLower = (disruptedLocation || "").toLowerCase();
  const inventory = require("../data/inventory");

  // Check if this disruption is an emergency/disaster event requiring surge relief supplies
  const isDisasterSurge =
    lower.includes("flood") ||
    lower.includes("flooding") ||
    lower.includes("landslide") ||
    lower.includes("cyclone") ||
    lower.includes("storm") ||
    lower.includes("snowstorm") ||
    lower.includes("accident") ||
    lower.includes("emergency") ||
    lower.includes("outbreak") ||
    lower.includes("epidemic") ||
    lower.includes("collapse");

  if (isDisasterSurge) {
    // DISASTER RELIEF SURGE MODE:
    // Destination is the affected city facing acute medical emergency!
    const destCity = disruptedLocation;

    // Pick the closest strategic surplus Mega-Warehouse to rush emergency supplies
    const nearbySurplusOrigins = {
      // North
      "dehradun": "Ambala", "haridwar": "Ambala", "rishikesh": "Ambala", "roorkee": "Ambala", "nainital": "Lucknow",
      "shimla": "Chandigarh", "manali": "Chandigarh", "dharamshala": "Chandigarh", "kullu": "Chandigarh",
      "jammu": "Ludhiana", "srinagar": "Ludhiana", "leh": "Chandigarh",
      "amritsar": "Ludhiana", "jalandhar": "Ludhiana", "patiala": "Chandigarh", "bathinda": "Ludhiana",
      // UP & Central
      "varanasi": "Lucknow", "prayagraj": "Lucknow", "allahabad": "Lucknow", "gorakhpur": "Lucknow", "ayodhya": "Lucknow",
      "kanpur": "Lucknow", "agra": "Lucknow", "meerut": "Lucknow", "bareilly": "Lucknow", "aligarh": "Lucknow",
      "indore": "Bhopal", "gwalior": "Bhopal", "jabalpur": "Bhopal", "ujjain": "Bhopal", "sagar": "Bhopal",
      "raipur": "Bhopal", "bilaspur": "Bhopal", "bhilai": "Bhopal",
      // Bihar & Jharkhand & East
      "patna": "Kolkata", "gaya": "Kolkata", "muzaffarpur": "Kolkata", "bhagalpur": "Kolkata",
      "ranchi": "Kolkata", "jamshedpur": "Kolkata", "dhanbad": "Kolkata", "bokaro": "Kolkata",
      "bhubaneswar": "Kolkata", "cuttack": "Bhubaneswar", "rourkela": "Kolkata", "puri": "Bhubaneswar",
      "guwahati": "Kolkata", "silchar": "Guwahati", "dibrugarh": "Guwahati", "shillong": "Guwahati",
      // West
      "nashik": "Mumbai", "pune": "Mumbai", "nagpur": "Mumbai", "aurangabad": "Mumbai", "solapur": "Mumbai", "kolhapur": "Mumbai",
      "surat": "Ahmedabad", "vadodara": "Ahmedabad", "rajkot": "Ahmedabad", "bhavnagar": "Ahmedabad", "vapi": "Mumbai",
      "jaipur": "Ahmedabad", "jodhpur": "Ahmedabad", "kota": "Ahmedabad", "udaipur": "Ahmedabad",
      // South
      "mysore": "Bangalore", "mysuru": "Bangalore", "mangalore": "Bangalore", "hubli": "Bangalore", "belgaum": "Bangalore",
      "coimbatore": "Chennai", "madurai": "Chennai", "trichy": "Chennai", "salem": "Chennai",
      "kochi": "Bangalore", "thiruvananthapuram": "Bangalore", "kozhikode": "Bangalore", "thrissur": "Bangalore",
      "warangal": "Hyderabad", "visakhapatnam": "Hyderabad", "vijayawada": "Hyderabad", "tirupati": "Chennai",
      "goa": "Mumbai"
    };

    const originCity = nearbySurplusOrigins[locLower] || "Mumbai";

    return {
      mode: "EMERGENCY_DISASTER_SURGE",
      origin: originCity,
      destination: destCity,
      medicine: "Emergency Trauma & Clinical Critical Care",
      priority: "Critical",
      flowReason: `Urgent disaster relief surge: Rushing trauma antibiotics, IV fluids, and emergency meds to treat casualties in ${destCity}.`,
      route: `${originCity} → Emergency Disaster Relief Corridor → ${destCity}`
    };
  }

  // SHORTAGE & CRITICAL DEFICIT FULFILLMENT MODE:
  // Find which regional health center has the highest stock deficiency / lowest days of supply
  const candidates = inventory
    .filter(item => {
      const loc = item.location.toLowerCase();
      if (loc === locLower) return false;
      if (loc === "delhi") return false; // Exclude Delhi (massive surplus producer)
      return item.daily_demand && item.daily_demand > 0;
    })
    .map(item => {
      const required = item.safety_stock + item.daily_demand;
      const deficit = Math.max(0, required - item.current_stock);
      const daysOfCoverage = parseFloat((item.current_stock / item.daily_demand).toFixed(1));
      return {
        location: item.location,
        medicine: item.medicine,
        current_stock: item.current_stock,
        safety_stock: item.safety_stock,
        daily_demand: item.daily_demand,
        deficit,
        daysOfCoverage
      };
    });

  candidates.sort((a, b) => {
    if (a.deficit > 0 && b.deficit <= 0) return -1;
    if (b.deficit > 0 && a.deficit <= 0) return 1;
    return a.daysOfCoverage - b.daysOfCoverage;
  });

  const bestDeficit = candidates.length > 0 ? candidates[0] : {
    location: "Chandigarh",
    medicine: "Insulin",
    current_stock: 110,
    deficit: 30,
    daysOfCoverage: 2.7
  };

  const originCity = disruptedLocation;
  const destCity = bestDeficit.location;

  return {
    mode: "CRITICAL_DEFICIT_FULFILLMENT",
    origin: originCity,
    destination: destCity,
    medicine: bestDeficit.medicine || "Insulin",
    priority: bestDeficit.deficit > 0 ? "Critical" : "High",
    flowReason: `Stockout prevention routing: Destination ${destCity} has only ${bestDeficit.daysOfCoverage} days of supply remaining (stock: ${bestDeficit.current_stock}, deficit: ${bestDeficit.deficit} units).`,
    route: `${originCity} → Arterial Supply Lifeline → ${destCity}`
  };
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

  // If no shipment matches this location, dynamically determine flow based on
  // Emergency Disaster Surge OR Critical Stock Deficiency
  if (affectedShipments.length === 0) {
    const { getWarehouseByCity } = require("../data/warehouses");
    const dynamicId = `SH-${disruptedLocation.slice(0, 3).toUpperCase()}${Math.floor(100 + Math.random() * 900)}`;

    const flow = determineSupplyChainFlow(disruptedLocation, disruptionText);

    const originWh = getWarehouseByCity(flow.origin);
    const destWh = getWarehouseByCity(flow.destination);

    const coords = getCoordinates(flow.origin);
    const destCoords = getCoordinates(flow.destination);

    // Reuse or create dynamic shipment
    const existingDyn = shipments.find(s => s.origin === flow.origin && s.destination === flow.destination);
    if (existingDyn) {
      affectedShipments = [existingDyn];
    } else {
      const dynamicShipment = {
        id: dynamicId,
        medicine: flow.medicine,
        priority: flow.priority,
        origin: flow.origin,
        origin_hub: originWh ? originWh.hub_name : `${flow.origin} Strategic Supply Mega-Hub`,
        origin_warehouse: originWh ? `${originWh.warehouse_name} (${originWh.location_address})` : `${flow.origin} Regional Logistics Depot`,
        origin_coords: coords,
        destination: flow.destination,
        destination_hub: destWh ? destWh.hub_name : `${flow.destination} Regional Healthcare & Emergency Depot`,
        destination_warehouse: destWh ? `${destWh.warehouse_name} (${destWh.location_address})` : `${flow.destination} Clinical Buffer Facility`,
        destination_coords: destCoords,
        route: flow.route,
        status: "In Transit",
        lat: coords[0],
        lng: coords[1],
        destination_rationale: flow.flowReason
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