const shipments = [
  {
    id: "SH001",
    medicine: "Insulin",
    priority: "Critical",
    origin: "Delhi",
    destination: "Chandigarh",
    route: "Delhi → Ambala → Chandigarh",
    status: "In Transit"
  },
  {
    id: "SH002",
    medicine: "Paracetamol",
    priority: "Medium",
    origin: "Delhi",
    destination: "Ludhiana",
    route: "Delhi → Ludhiana",
    status: "In Transit"
  },
  {
    id: "SH003",
    medicine: "Vaccines",
    priority: "Critical",
    origin: "Mumbai",
    destination: "Delhi",
    route: "Mumbai → Delhi",
    status: "In Transit"
  },
  {
    id: "SH004",
    medicine: "Antibiotics",
    priority: "High",
    origin: "Ambala",
    destination: "Amritsar",
    route: "Ambala → Amritsar",
    status: "In Transit"
  }
];

module.exports = shipments;
