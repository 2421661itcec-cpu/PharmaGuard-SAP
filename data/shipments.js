// --------------------------------------------------
// SHIPMENTS DATA
// Core pharmaceutical fleet with rich origin/destination
// state mega-warehouses, coordinates, and live routes.
// --------------------------------------------------

const shipments = [
  {
    id: "SH001",
    medicine: "Insulin",
    priority: "Critical",
    origin: "Delhi",
    origin_hub: "Delhi Apex Central Pharma Hub",
    origin_warehouse: "Northern National Pharma Mega-Warehouse (Okhla Phase-III, New Delhi)",
    origin_coords: [28.6139, 77.2090],
    destination: "Chandigarh",
    destination_hub: "Chandigarh Capital Health Hub",
    destination_warehouse: "Chandigarh Apex Buffer Depot (Industrial Area Phase-I, Chandigarh)",
    destination_coords: [30.7333, 76.7794],
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
    origin_hub: "Delhi Apex Central Pharma Hub",
    origin_warehouse: "Northern National Pharma Mega-Warehouse (Okhla Phase-III, New Delhi)",
    origin_coords: [28.6139, 77.2090],
    destination: "Ludhiana",
    destination_hub: "Ludhiana Grand Central Hub",
    destination_warehouse: "Punjab State Central Pharma Mega-Warehouse (GT Road, Ludhiana)",
    destination_coords: [30.9010, 75.8573],
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
    origin_hub: "Mumbai Coastal Central Hub",
    origin_warehouse: "West India Gateway Pharma Mega-Warehouse (Bhiwandi Logistics Park, Mumbai)",
    origin_coords: [19.0760, 72.8777],
    destination: "Delhi",
    destination_hub: "Delhi Apex Central Pharma Hub",
    destination_warehouse: "Northern National Pharma Mega-Warehouse (Okhla Phase-III, New Delhi)",
    destination_coords: [28.6139, 77.2090],
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
    origin_hub: "Ambala Strategic Transit Hub",
    origin_warehouse: "Haryana Inter-State Central Mega-Warehouse (NH-44 Shivalik Junction, Ambala)",
    origin_coords: [30.3782, 76.7767],
    destination: "Amritsar",
    destination_hub: "Amritsar Border Gateway Depot",
    destination_warehouse: "Amritsar Regional Medical Supply Center (Amritsar, Punjab)",
    destination_coords: [31.6340, 74.8723],
    route: "Ambala → Amritsar",
    status: "In Transit",
    lat: 30.3782,
    lng: 76.7767
  }
];

module.exports = shipments;
