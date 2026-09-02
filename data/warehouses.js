// --------------------------------------------------
// PHARMAGUARD STATE MEGA-WAREHOUSES & CENTRAL HUBS
// Comprehensive directory of State Central Hubs
// and Large Strategic Pharmaceutical Mega-Warehouses
// for each major state, union territory, and global hub.
// --------------------------------------------------

const stateWarehouses = [
  // 1. Delhi (National Capital Region)
  {
    id: "WH-DEL-01",
    state: "Delhi (NCR)",
    hub_name: "Delhi Apex Central Pharma Hub",
    warehouse_name: "Northern National Pharma Mega-Warehouse",
    city: "Delhi",
    location_address: "Okhla Phase-III Industrial Area, New Delhi - 110020",
    lat: 28.5355,
    lng: 77.2610,
    capacity: "1,250,000 Units",
    cold_storage_temp: "-20°C to 8°C (Deep Freeze & Chilled)",
    status: "Active Strategic Facility"
  },

  // 2. Punjab
  {
    id: "WH-PB-01",
    state: "Punjab",
    hub_name: "Ludhiana Grand Central Hub",
    warehouse_name: "Punjab State Central Pharma Mega-Warehouse",
    city: "Ludhiana",
    location_address: "GT Road Industrial Logistics Corridor, Ludhiana, Punjab - 141003",
    lat: 30.9010,
    lng: 75.8573,
    capacity: "850,000 Units",
    cold_storage_temp: "2°C to 8°C (Refrigerated Vaccine Buffer)",
    status: "Active Strategic Facility"
  },

  // 3. Haryana
  {
    id: "WH-HR-01",
    state: "Haryana",
    hub_name: "Ambala Strategic Transit Hub",
    warehouse_name: "Haryana Inter-State Central Mega-Warehouse",
    city: "Ambala",
    location_address: "NH-44 Shivalik Logistics Junction, Ambala Cantt, Haryana - 133001",
    lat: 30.3782,
    lng: 76.7767,
    capacity: "750,000 Units",
    cold_storage_temp: "-20°C to 8°C (Multi-Zone Pharma Storage)",
    status: "Active Strategic Facility"
  },

  // 4. Chandigarh (Union Territory)
  {
    id: "WH-CH-01",
    state: "Chandigarh (UT)",
    hub_name: "Chandigarh Capital Health Hub",
    warehouse_name: "Chandigarh Apex Buffer Depot",
    city: "Chandigarh",
    location_address: "Industrial Area Phase-I, Chandigarh - 160002",
    lat: 30.7046,
    lng: 76.8015,
    capacity: "500,000 Units",
    cold_storage_temp: "2°C to 8°C (Biologics & Insulin Facility)",
    status: "Active Strategic Facility"
  },

  // 5. Maharashtra
  {
    id: "WH-MH-01",
    state: "Maharashtra",
    hub_name: "Mumbai Coastal Central Hub",
    warehouse_name: "West India Gateway Pharma Mega-Warehouse",
    city: "Mumbai",
    location_address: "Bhiwandi Integrated Logistics Park, MMR, Maharashtra - 421302",
    lat: 19.2967,
    lng: 73.0620,
    capacity: "1,500,000 Units",
    cold_storage_temp: "-80°C to 15°C (Ultra-Low & Controlled Room Temp)",
    status: "Active Strategic Facility"
  },

  // 6. Karnataka
  {
    id: "WH-KA-01",
    state: "Karnataka",
    hub_name: "Bangalore Bio-Logistics Central Hub",
    warehouse_name: "Karnataka State Pharma Mega-Warehouse",
    city: "Bangalore",
    location_address: "Peenya Industrial Complex Phase-II, Bengaluru, Karnataka - 560058",
    lat: 13.0285,
    lng: 77.5190,
    capacity: "1,100,000 Units",
    cold_storage_temp: "2°C to 8°C (Bio-Therapeutics & Monoclonal Vault)",
    status: "Active Strategic Facility"
  },

  // 7. Tamil Nadu
  {
    id: "WH-TN-01",
    state: "Tamil Nadu",
    hub_name: "Chennai Coastal Central Hub",
    warehouse_name: "Southern Regional Pharma Mega-Warehouse",
    city: "Chennai",
    location_address: "Sriperumbudur Industrial Corridor, Chennai, Tamil Nadu - 602105",
    lat: 12.9698,
    lng: 79.9406,
    capacity: "950,000 Units",
    cold_storage_temp: "-20°C to 8°C (Bulk Marine & Air Freight Store)",
    status: "Active Strategic Facility"
  },

  // 8. Telangana
  {
    id: "WH-TS-01",
    state: "Telangana",
    hub_name: "Hyderabad Genome Central Hub",
    warehouse_name: "Telangana Vaccine & Drug Mega-Warehouse",
    city: "Hyderabad",
    location_address: "Genome Valley Life Sciences Park, Hyderabad, Telangana - 500078",
    lat: 17.5850,
    lng: 78.5867,
    capacity: "1,400,000 Units",
    cold_storage_temp: "-80°C to 8°C (Vaccine Production Gateway)",
    status: "Active Strategic Facility"
  },

  // 9. West Bengal
  {
    id: "WH-WB-01",
    state: "West Bengal",
    hub_name: "Kolkata Eastern Gateway Hub",
    warehouse_name: "Eastern National Pharma Mega-Warehouse",
    city: "Kolkata",
    location_address: "Dankuni Freight Logistics Complex, Hooghly, West Bengal - 712311",
    lat: 22.6840,
    lng: 88.2910,
    capacity: "900,000 Units",
    cold_storage_temp: "2°C to 8°C (Eastern India Distribution Anchor)",
    status: "Active Strategic Facility"
  },

  // 10. Gujarat
  {
    id: "WH-GJ-01",
    state: "Gujarat",
    hub_name: "Ahmedabad Central Pharma Hub",
    warehouse_name: "Gujarat State Bulk Drug Mega-Warehouse",
    city: "Ahmedabad",
    location_address: "Sanand GIDC Logistics Zone, Ahmedabad, Gujarat - 382170",
    lat: 22.9920,
    lng: 72.3810,
    capacity: "1,300,000 Units",
    cold_storage_temp: "-20°C to 15°C (Active Pharmaceutical Ingredient Vault)",
    status: "Active Strategic Facility"
  },

  // 11. Rajasthan
  {
    id: "WH-RJ-01",
    state: "Rajasthan",
    hub_name: "Jaipur Northern Gateway Hub",
    warehouse_name: "Rajasthan State Central Medical Warehouse",
    city: "Jaipur",
    location_address: "Sitapura Industrial Area, Jaipur, Rajasthan - 302022",
    lat: 26.7820,
    lng: 75.8280,
    capacity: "650,000 Units",
    cold_storage_temp: "2°C to 8°C (Essential Medicine Reserve)",
    status: "Active Strategic Facility"
  },

  // 12. Uttar Pradesh
  {
    id: "WH-UP-01",
    state: "Uttar Pradesh",
    hub_name: "Lucknow Central Supply Hub",
    warehouse_name: "UP State Core Pharma Mega-Warehouse",
    city: "Lucknow",
    location_address: "Transport Nagar Logistics Hub, Lucknow, Uttar Pradesh - 226012",
    lat: 26.7780,
    lng: 80.8920,
    capacity: "1,000,000 Units",
    cold_storage_temp: "2°C to 8°C (Northern Plains Medical Depot)",
    status: "Active Strategic Facility"
  },

  // 13. Madhya Pradesh
  {
    id: "WH-MP-01",
    state: "Madhya Pradesh",
    hub_name: "Indore Central Logistics Hub",
    warehouse_name: "MP Heart-of-India Pharma Mega-Warehouse",
    city: "Indore",
    location_address: "Pithampur Special Economic Zone, Indore, Madhya Pradesh - 454775",
    lat: 22.6140,
    lng: 75.6880,
    capacity: "700,000 Units",
    cold_storage_temp: "-20°C to 8°C (Central India Transit Vault)",
    status: "Active Strategic Facility"
  },

  // 14. Kerala
  {
    id: "WH-KL-01",
    state: "Kerala",
    hub_name: "Kochi Marine Central Hub",
    warehouse_name: "Kerala State Critical Medical Mega-Warehouse",
    city: "Kochi",
    location_address: "Willingdon Island Port Logistics Zone, Kochi, Kerala - 682003",
    lat: 9.9520,
    lng: 76.2690,
    capacity: "600,000 Units",
    cold_storage_temp: "2°C to 8°C (High-Humidity Protected Cold Chain)",
    status: "Active Strategic Facility"
  },

  // 15. Bihar
  {
    id: "WH-BR-01",
    state: "Bihar",
    hub_name: "Patna Eastern Transit Hub",
    warehouse_name: "Bihar State Essential Medicines Mega-Warehouse",
    city: "Patna",
    location_address: "Fatuha Industrial Logistics Park, Patna, Bihar - 803201",
    lat: 25.5120,
    lng: 85.3110,
    capacity: "620,000 Units",
    cold_storage_temp: "2°C to 8°C (Eastern Regional Distribution Vault)",
    status: "Active Strategic Facility"
  },

  // 16. Assam & North-East
  {
    id: "WH-AS-01",
    state: "Assam",
    hub_name: "Guwahati North-East Gateway Hub",
    warehouse_name: "North-East Strategic Medicine Mega-Warehouse",
    city: "Guwahati",
    location_address: "Amingaon Inland Container Depot, Guwahati, Assam - 781031",
    lat: 26.1820,
    lng: 91.6810,
    capacity: "550,000 Units",
    cold_storage_temp: "-20°C to 8°C (Mountain Corridor Safe Storage)",
    status: "Active Strategic Facility"
  },

  // 17. Odisha
  {
    id: "WH-OD-01",
    state: "Odisha",
    hub_name: "Bhubaneswar Coastal Health Hub",
    warehouse_name: "Odisha State Strategic Pharma Depot",
    city: "Bhubaneswar",
    location_address: "Mancheswar Industrial Estate, Bhubaneswar, Odisha - 751010",
    lat: 20.3240,
    lng: 85.8560,
    capacity: "520,000 Units",
    cold_storage_temp: "2°C to 8°C (Cyclone-Resilient Cold Storage)",
    status: "Active Strategic Facility"
  },

  // 18. Andhra Pradesh
  {
    id: "WH-AP-01",
    state: "Andhra Pradesh",
    hub_name: "Visakhapatnam Port Central Hub",
    warehouse_name: "Andhra Coastal Pharma Mega-Warehouse",
    city: "Visakhapatnam",
    location_address: "Autonagar Logistics Park, Gajuwaka, Visakhapatnam, AP - 530012",
    lat: 17.6980,
    lng: 83.1950,
    capacity: "780,000 Units",
    cold_storage_temp: "-20°C to 8°C (Coastal API Buffer Facility)",
    status: "Active Strategic Facility"
  },

  // 19. Goa
  {
    id: "WH-GA-01",
    state: "Goa",
    hub_name: "Goa Formulations Central Hub",
    warehouse_name: "Goa State Export & Medical Mega-Warehouse",
    city: "Goa",
    location_address: "Verna Industrial Estate Phase-III, Verna, Goa - 403722",
    lat: 15.3580,
    lng: 73.9320,
    capacity: "420,000 Units",
    cold_storage_temp: "2°C to 8°C (Direct Export Pharma Vault)",
    status: "Active Strategic Facility"
  }
];

function getAllWarehouses() {
  return stateWarehouses;
}

function getWarehouseByCity(cityName) {
  if (!cityName) return null;
  const clean = cityName.trim().toLowerCase();
  return stateWarehouses.find(w =>
    w.city.toLowerCase() === clean ||
    w.state.toLowerCase().includes(clean) ||
    w.hub_name.toLowerCase().includes(clean) ||
    clean.includes(w.city.toLowerCase())
  ) || null;
}

function getWarehouseByState(stateName) {
  if (!stateName) return null;
  const clean = stateName.trim().toLowerCase();
  return stateWarehouses.find(w =>
    w.state.toLowerCase().includes(clean) ||
    clean.includes(w.state.toLowerCase())
  ) || null;
}

module.exports = {
  stateWarehouses,
  getAllWarehouses,
  getWarehouseByCity,
  getWarehouseByState
};
