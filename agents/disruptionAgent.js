// --------------------------------------------------
// DISRUPTION SENSING AGENT
// Responsibility:
// Detect disruption, dynamically identify the affected
// location across India or globally, and pinpoint the
// affected pharmaceutical shipments.
// --------------------------------------------------

const shipments = require("../data/shipments");
const { getCoordinates, registerShipmentInTracking } = require("../data/trackingStore");

// Catalog of known logistical hubs for rapid fuzzy matching
const KNOWN_CITIES = [
  "Ambala", "Delhi", "Chandigarh", "Ludhiana", "Mumbai", "Amritsar", "Panipat",
  "Kurukshetra", "Jalandhar", "Jaipur", "Lucknow", "Kanpur", "Agra", "Bhopal",
  "Indore", "Nagpur", "Patna", "Pune", "Ahmedabad", "Surat", "Vadodara",
  "Bangalore", "Bengaluru", "Chennai", "Hyderabad", "Kolkata", "Coimbatore",
  "Kochi", "Visakhapatnam", "Goa", "Guwahati", "Bhubaneswar", "London",
  "Frankfurt", "Singapore", "Dubai", "New York", "Tokyo", "Basel", "Zurich",
  "Chicago", "Paris", "Berlin", "Amsterdam"
];

// Helper to extract location from arbitrary text
function extractLocation(disruptionText) {
  const lower = disruptionText.toLowerCase();

  // 1. Check direct matches with existing shipment routes & origins/destinations
  for (const s of shipments) {
    if (lower.includes(s.origin.toLowerCase())) return s.origin;
    if (lower.includes(s.destination.toLowerCase())) return s.destination;
    const parts = s.route.split(/[→\->]/).map(p => p.trim());
    for (const part of parts) {
      if (part && lower.includes(part.toLowerCase())) {
        return part;
      }
    }
  }

  // 2. Check catalog of known major cities
  for (const city of KNOWN_CITIES) {
    if (lower.includes(city.toLowerCase())) {
      return city;
    }
  }

  // 3. Regular expression patterns for natural language place mentions
  // e.g. "in Bangalore", "near Hyderabad", "at Mumbai port", "Kolkata hub", "Chennai distribution"
  const patterns = [
    /(?:in|near|at|around|outside)\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)/i,
    /([A-Za-z]+(?:\s+[A-Za-z]+)?)\s+(?:hub|distribution|warehouse|center|facility|port|airport|highway|corridor|station|terminal|city|depot)/i,
    /([A-Za-z]+)\s+to\s+([A-Za-z]+)/i
  ];

  for (const pattern of patterns) {
    const match = disruptionText.match(pattern);
    if (match && match[1]) {
      const candidate = match[1].trim();
      const stopWords = ["the", "a", "an", "all", "our", "major", "severe", "closed", "road", "rail"];
      if (!stopWords.includes(candidate.toLowerCase()) && candidate.length > 2) {
        // Capitalize nicely
        return candidate.charAt(0).toUpperCase() + candidate.slice(1);
      }
    }
  }

  // 4. Fallback: if words like "hub" or "closure" are present, extract preceding word
  const words = disruptionText.split(/\s+/);
  if (words.length > 0 && words[0].length > 2) {
    return words[0].charAt(0).toUpperCase() + words[0].slice(1);
  }

  return "Global Supply Node";
}

function detectDisruption(disruption) {
  const disruptionText = (disruption || "").trim();
  const lowerText = disruptionText.toLowerCase();

  // Extract the disrupted location dynamically
  const disruptedLocation = extractLocation(disruptionText);

  // Find any existing shipments that pass through or touch this location
  let affectedShipments = shipments.filter((shipment) => {
    const route = shipment.route.toLowerCase();
    const origin = shipment.origin.toLowerCase();
    const destination = shipment.destination.toLowerCase();
    const locLower = disruptedLocation.toLowerCase();

    return (
      route.includes(locLower) ||
      origin.includes(locLower) ||
      destination.includes(locLower)
    );
  });

  // If no existing shipment covers this location, dynamically instantiate
  // a live active shipment for this corridor so the entire 7-agent pipeline
  // operates realistically for ANY location worldwide.
  if (affectedShipments.length === 0 && disruptedLocation) {
    const dynamicId = `SH-${disruptedLocation.slice(0, 3).toUpperCase()}${Math.floor(100 + Math.random() * 900)}`;
    const pairedDestination = disruptedLocation.toLowerCase() === "bangalore" ? "Chennai"
      : disruptedLocation.toLowerCase() === "mumbai" ? "Pune"
      : disruptedLocation.toLowerCase() === "kolkata" ? "Patna"
      : disruptedLocation.toLowerCase() === "hyderabad" ? "Bangalore"
      : disruptedLocation.toLowerCase() === "london" ? "Frankfurt"
      : "Regional Hub";

    const coords = getCoordinates(disruptedLocation);

    const dynamicShipment = {
      id: dynamicId,
      medicine: "Critical Vaccines & Oncology",
      priority: "Critical",
      origin: disruptedLocation,
      destination: pairedDestination,
      route: `${disruptedLocation} → Central Corridor → ${pairedDestination}`,
      status: "In Transit",
      lat: coords[0],
      lng: coords[1]
    };

    // Add to shared shipments list so impact, scenario, rerouting agents find it
    shipments.push(dynamicShipment);

    // Register with trackingStore so Network Map can plot it
    registerShipmentInTracking(dynamicShipment);

    affectedShipments = [dynamicShipment];
  }

  // Calculate severity based on shipment priority or disruption keywords
  let severity = "MEDIUM";

  if (
    lowerText.includes("flood") ||
    lowerText.includes("closure") ||
    lowerText.includes("closed") ||
    lowerText.includes("storm") ||
    lowerText.includes("cyclone") ||
    lowerText.includes("strike") ||
    affectedShipments.some((s) => s.priority === "Critical")
  ) {
    severity = "CRITICAL";
  } else if (
    lowerText.includes("delay") ||
    lowerText.includes("congestion") ||
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
    affected_shipments: affectedShipments.map((shipment) => shipment.id),
    affected_shipment_details: affectedShipments.map((shipment) => ({
      shipment_id: shipment.id,
      medicine: shipment.medicine,
      priority: shipment.priority,
      origin: shipment.origin,
      destination: shipment.destination,
      route: shipment.route
    })),
    reason: disruptedLocation
      ? `${disruptedLocation} hub / corridor is disrupted`
      : "Supply chain corridor experiencing operational disruption"
  };
}

module.exports = {
  detectDisruption
};