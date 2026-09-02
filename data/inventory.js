// --------------------------------------------------
// INVENTORY MASTER STORE
// Real-time stock, safety stock, and daily demand
// across all State Mega-Warehouses & Regional Hubs.
// --------------------------------------------------

const inventory = [
  // Delhi NCR Apex Hub
  { location: "Delhi", medicine: "Insulin", current_stock: 1200, safety_stock: 400, daily_demand: 120 },
  { location: "Delhi", medicine: "Vaccines", current_stock: 950, safety_stock: 300, daily_demand: 90 },
  { location: "Delhi", medicine: "Antibiotics", current_stock: 1500, safety_stock: 500, daily_demand: 150 },
  { location: "Delhi", medicine: "Paracetamol", current_stock: 3000, safety_stock: 800, daily_demand: 250 },

  // Punjab (Ludhiana / Amritsar)
  { location: "Ludhiana", medicine: "Insulin", current_stock: 450, safety_stock: 150, daily_demand: 45 },
  { location: "Ludhiana", medicine: "Antibiotics", current_stock: 600, safety_stock: 150, daily_demand: 50 },
  { location: "Amritsar", medicine: "Antibiotics", current_stock: 90, safety_stock: 80, daily_demand: 25 },
  { location: "Amritsar", medicine: "Insulin", current_stock: 75, safety_stock: 80, daily_demand: 20 },

  // Chandigarh Capital Health Hub
  { location: "Chandigarh", medicine: "Insulin", current_stock: 110, safety_stock: 100, daily_demand: 40 },
  { location: "Chandigarh", medicine: "Vaccines", current_stock: 85, safety_stock: 90, daily_demand: 30 },
  { location: "Chandigarh", medicine: "Antibiotics", current_stock: 220, safety_stock: 100, daily_demand: 35 },

  // Haryana (Ambala Transit Hub)
  { location: "Ambala", medicine: "Insulin", current_stock: 320, safety_stock: 100, daily_demand: 30 },
  { location: "Ambala", medicine: "Antibiotics", current_stock: 400, safety_stock: 100, daily_demand: 35 },

  // Maharashtra (Mumbai / Pune)
  { location: "Mumbai", medicine: "Insulin", current_stock: 1400, safety_stock: 400, daily_demand: 130 },
  { location: "Mumbai", medicine: "Vaccines", current_stock: 1100, safety_stock: 350, daily_demand: 110 },
  { location: "Mumbai", medicine: "Antibiotics", current_stock: 1800, safety_stock: 500, daily_demand: 160 },
  { location: "Pune", medicine: "Insulin", current_stock: 130, safety_stock: 150, daily_demand: 45 },
  { location: "Pune", medicine: "Vaccines", current_stock: 90, safety_stock: 120, daily_demand: 35 },

  // Karnataka (Bangalore / Mysore)
  { location: "Bangalore", medicine: "Insulin", current_stock: 1100, safety_stock: 350, daily_demand: 100 },
  { location: "Bangalore", medicine: "Vaccines", current_stock: 850, safety_stock: 250, daily_demand: 80 },
  { location: "Bangalore", medicine: "Critical Oncology & Vaccines", current_stock: 500, safety_stock: 150, daily_demand: 40 },
  { location: "Mysore", medicine: "Insulin", current_stock: 80, safety_stock: 90, daily_demand: 25 },

  // Tamil Nadu (Chennai / Coimbatore)
  { location: "Chennai", medicine: "Insulin", current_stock: 900, safety_stock: 300, daily_demand: 90 },
  { location: "Chennai", medicine: "Vaccines", current_stock: 750, safety_stock: 250, daily_demand: 70 },
  { location: "Coimbatore", medicine: "Insulin", current_stock: 110, safety_stock: 120, daily_demand: 30 },

  // Telangana (Hyderabad Genome Hub)
  { location: "Hyderabad", medicine: "Insulin", current_stock: 1300, safety_stock: 400, daily_demand: 110 },
  { location: "Hyderabad", medicine: "Vaccines", current_stock: 1500, safety_stock: 450, daily_demand: 120 },

  // West Bengal (Kolkata Gateway)
  { location: "Kolkata", medicine: "Insulin", current_stock: 850, safety_stock: 300, daily_demand: 85 },
  { location: "Kolkata", medicine: "Vaccines", current_stock: 700, safety_stock: 250, daily_demand: 70 },
  { location: "Kolkata", medicine: "Critical Oncology & Vaccines", current_stock: 420, safety_stock: 120, daily_demand: 35 },

  // Bihar (Patna Transit Hub)
  { location: "Patna", medicine: "Insulin", current_stock: 95, safety_stock: 120, daily_demand: 35 },
  { location: "Patna", medicine: "Antibiotics", current_stock: 140, safety_stock: 100, daily_demand: 30 },

  // Gujarat (Ahmedabad Central Hub)
  { location: "Ahmedabad", medicine: "Insulin", current_stock: 980, safety_stock: 300, daily_demand: 90 },
  { location: "Ahmedabad", medicine: "Antibiotics", current_stock: 1200, safety_stock: 350, daily_demand: 110 },

  // Rajasthan (Jaipur Northern Gateway)
  { location: "Jaipur", medicine: "Insulin", current_stock: 210, safety_stock: 150, daily_demand: 40 },
  { location: "Jaipur", medicine: "Vaccines", current_stock: 160, safety_stock: 120, daily_demand: 30 },

  // Uttar Pradesh (Lucknow / Kanpur / Varanasi / Agra)
  { location: "Lucknow", medicine: "Insulin", current_stock: 800, safety_stock: 250, daily_demand: 75 },
  { location: "Kanpur", medicine: "Antibiotics", current_stock: 220, safety_stock: 150, daily_demand: 40 },
  { location: "Varanasi", medicine: "Insulin", current_stock: 90, safety_stock: 110, daily_demand: 30 },
  { location: "Agra", medicine: "Insulin", current_stock: 85, safety_stock: 100, daily_demand: 28 },

  // Madhya Pradesh (Bhopal / Indore / Gwalior)
  { location: "Bhopal", medicine: "Insulin", current_stock: 650, safety_stock: 200, daily_demand: 60 },
  { location: "Indore", medicine: "Insulin", current_stock: 180, safety_stock: 120, daily_demand: 35 },
  { location: "Jabalpur", medicine: "Antibiotics", current_stock: 95, safety_stock: 100, daily_demand: 25 },

  // Uttarakhand (Dehradun / Haridwar / Rishikesh)
  { location: "Dehradun", medicine: "Insulin", current_stock: 70, safety_stock: 90, daily_demand: 25 },
  { location: "Dehradun", medicine: "Critical Oncology & Vaccines", current_stock: 45, safety_stock: 60, daily_demand: 15 },

  // Himachal Pradesh (Shimla / Manali)
  { location: "Shimla", medicine: "Insulin", current_stock: 60, safety_stock: 80, daily_demand: 20 },

  // Jharkhand (Ranchi / Jamshedpur)
  { location: "Ranchi", medicine: "Insulin", current_stock: 85, safety_stock: 100, daily_demand: 28 },

  // Odisha (Bhubaneswar / Cuttack)
  { location: "Bhubaneswar", medicine: "Insulin", current_stock: 450, safety_stock: 150, daily_demand: 40 },

  // Assam / North East (Guwahati)
  { location: "Guwahati", medicine: "Insulin", current_stock: 400, safety_stock: 150, daily_demand: 35 },

  // Kerala (Kochi / Thiruvananthapuram)
  { location: "Kochi", medicine: "Insulin", current_stock: 520, safety_stock: 180, daily_demand: 45 },

  // Goa
  { location: "Goa", medicine: "Insulin", current_stock: 350, safety_stock: 120, daily_demand: 30 }
];

module.exports = inventory;