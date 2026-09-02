// --------------------------------------------------
// SHIPMENTS DATA
// Existing fields are PRESERVED exactly.
// New fields added: lat, lng (starting coordinates)
// These are used by the GPS simulator as the
// initial map position for each shipment marker.
// --------------------------------------------------

const shipments = [
  {
    id: "SH001",
    medicine: "Insulin",
    priority: "Critical",
    origin: "Delhi",
    destination: "Chandigarh",
    route: "Delhi → Ambala → Chandigarh",
    status: "In Transit",
    lat: 28.6139,
    lng: 77.2090
  },
  {
    id: "SH002",
    medicine: "Paracetamol",
    priority: "Medium",
    origin: "Delhi",
    destination: "Ludhiana",
    route: "Delhi → Ludhiana",
    status: "In Transit",
    lat: 28.6139,
    lng: 77.2090
  },
  {
    id: "SH003",
    medicine: "Vaccines",
    priority: "Critical",
    origin: "Mumbai",
    destination: "Delhi",
    route: "Mumbai → Delhi",
    status: "In Transit",
    lat: 19.0760,
    lng: 72.8777
  },
  {
    id: "SH004",
    medicine: "Antibiotics",
    priority: "High",
    origin: "Ambala",
    destination: "Amritsar",
    route: "Ambala → Amritsar",
    status: "In Transit",
    lat: 30.3782,
    lng: 76.7767
  }
];

module.exports = shipments;
