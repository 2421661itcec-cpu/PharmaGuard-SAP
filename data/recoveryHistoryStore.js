// --------------------------------------------------
// RECOVERY HISTORY STORE
// In-memory persistent audit log of all human decisions,
// AI scenario selections, and recovery executions.
// --------------------------------------------------

const recoveryHistory = [
  {
    id: "REC-2026-0902-01",
    timestamp: "2026-09-02T22:30:15.000Z",
    shipment_id: "SH001",
    medicine: "Insulin",
    priority: "Critical",
    cold_chain: true,
    disruption_event: "Panipat Highway Fog & Stoppage",
    disrupted_location: "Panipat",
    decision: "MODIFIED",
    decision_by: "Supply Chain Manager",
    original_route: "Delhi → Panipat → Chandigarh",
    recovery_route: "Delhi → Western Peripheral Express → Chandigarh",
    origin: "Delhi",
    destination: "Chandigarh",
    eta_hours: 3.5,
    eta_saved_hours: 2.0,
    status: "EXECUTED & REROUTED",
    inventory_action: "500 units safety reserve dispatched from Delhi State Mega-Warehouse",
    urgency_label: "🚨 PRIORITY: STOCK DEFICIENCY",
    audit_notes: "Human controller adjusted route to bypass heavy fog backlog at Panipat toll corridor."
  },
  {
    id: "REC-2026-0902-02",
    timestamp: "2026-09-02T20:15:40.000Z",
    shipment_id: "SH003",
    medicine: "Vaccines",
    priority: "Critical",
    cold_chain: true,
    disruption_event: "Mumbai Western Expressway Inundation",
    disrupted_location: "Navi Mumbai",
    decision: "APPROVED",
    decision_by: "Supply Chain Manager",
    original_route: "Mumbai → Delhi",
    recovery_route: "Mumbai → Navi Mumbai → Pune (Vaccine Shortage Lifeline)",
    origin: "Mumbai",
    destination: "Pune",
    eta_hours: 2.5,
    eta_saved_hours: 4.5,
    status: "EXECUTED & REROUTED",
    inventory_action: "Vaccine stock rerouted to address acute Pune stock deficit (2.5 days left)",
    urgency_label: "🚨 PRIORITY: STOCK DEFICIENCY",
    audit_notes: "AI Recommended Option 1 approved. High-risk transit converted to urgent clinical fulfillment."
  },
  {
    id: "REC-2026-0902-03",
    timestamp: "2026-09-02T18:45:10.000Z",
    shipment_id: "SH004",
    medicine: "Antibiotics",
    priority: "High",
    cold_chain: false,
    disruption_event: "Ambala NH-44 Toll System Outage",
    disrupted_location: "Ambala",
    decision: "APPROVED",
    decision_by: "Supply Chain Manager",
    original_route: "Ambala → Amritsar",
    recovery_route: "Ambala → Ludhiana → Amritsar",
    origin: "Ambala",
    destination: "Amritsar",
    eta_hours: 4.0,
    eta_saved_hours: 1.5,
    status: "EXECUTED & REROUTED",
    inventory_action: "Sufficient buffer at Amritsar Regional Depot; no emergency transfer required",
    urgency_label: "ℹ️ LESS PRIOR: ROUTINE BUFFER",
    audit_notes: "Automated alternate state highway selected to bypass toll congestion."
  },
  {
    id: "REC-2026-0902-04",
    timestamp: "2026-09-02T15:20:05.000Z",
    shipment_id: "SH002",
    medicine: "Paracetamol",
    priority: "Medium",
    cold_chain: false,
    disruption_event: "Murthal Highway Maintenance Block",
    disrupted_location: "Sonipat",
    decision: "APPROVED",
    decision_by: "Supply Chain Manager",
    original_route: "Delhi → Ludhiana",
    recovery_route: "Delhi → Rohtak Corridor → Ludhiana",
    origin: "Delhi",
    destination: "Ludhiana",
    eta_hours: 5.0,
    eta_saved_hours: 1.0,
    status: "EXECUTED & REROUTED",
    inventory_action: "Routine replenishment delivered to Ludhiana Central Buffer",
    urgency_label: "ℹ️ LESS PRIOR: ROUTINE BUFFER",
    audit_notes: "Standard non-cold-chain diversion successfully deployed."
  },
  {
    id: "REC-2026-0902-05",
    timestamp: "2026-09-02T11:10:50.000Z",
    shipment_id: "SH-EMG109",
    medicine: "Emergency Trauma & Clinical Critical Care",
    priority: "Critical",
    cold_chain: false,
    disruption_event: "Dehradun Landslide & Flash Flooding",
    disrupted_location: "Dehradun",
    decision: "MODIFIED",
    decision_by: "Supply Chain Manager",
    original_route: "Delhi → Roorkee → Dehradun",
    recovery_route: "Delhi → Saharanpur Air Corridor → Dehradun (Emergency Air Freight)",
    origin: "Delhi",
    destination: "Dehradun",
    eta_hours: 1.8,
    eta_saved_hours: 6.2,
    status: "EXECUTED & REROUTED",
    inventory_action: "1,200 emergency trauma kits rushed from Delhi Mega-Warehouse to Dehradun Civil Hospital",
    urgency_label: "🚨 PRIORITY: EMERGENCY RELIEF",
    audit_notes: "Human manager escalated from ground transit to air charter due to blocked mountain roads."
  }
];

function getAllHistory() {
  return [...recoveryHistory].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

function addHistoryEntry(entry) {
  if (!entry) return;
  const newEntry = {
    id: `REC-${Date.now().toString().slice(-6)}`,
    timestamp: new Date().toISOString(),
    shipment_id: entry.shipment_id || "SH-SYS",
    medicine: entry.medicine || "Pharma Supply",
    priority: entry.priority || "Critical",
    cold_chain: Boolean(entry.cold_chain),
    disruption_event: entry.disruption_event || "Disruption Recovery Protocol",
    disrupted_location: entry.disrupted_location || "Transit Hub",
    decision: entry.decision || "APPROVED",
    decision_by: entry.decision_by || "Supply Chain Manager",
    original_route: entry.original_route || "Origin → Destination",
    recovery_route: entry.recovery_route || "Rerouted Path",
    origin: entry.origin || "Origin Hub",
    destination: entry.destination || "Destination Depot",
    eta_hours: entry.eta_hours || 4.0,
    eta_saved_hours: entry.eta_saved_hours || 2.0,
    status: entry.status || "EXECUTED & REROUTED",
    inventory_action: entry.inventory_action || "Inventory Rebalancing Completed",
    urgency_label: entry.urgency_label || "🚨 PRIORITY: DEFICIT / EMERGENCY",
    audit_notes: entry.audit_notes || "Multi-Agent recovery pipeline completed."
  };
  recoveryHistory.unshift(newEntry);
  return newEntry;
}

module.exports = {
  getAllHistory,
  addHistoryEntry
};
