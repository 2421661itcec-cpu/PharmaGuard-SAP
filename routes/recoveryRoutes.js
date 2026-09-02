// --------------------------------------------------
// RECOVERY HISTORY ROUTES
// REST endpoints for the Recovery History & System Audit
// --------------------------------------------------

const express = require("express");
const router = express.Router();
const { getAllHistory } = require("../data/recoveryHistoryStore");

router.get("/history", (req, res) => {
  const history = getAllHistory();

  const total = history.length;
  const approved = history.filter(h => h.decision === "APPROVED").length;
  const modified = history.filter(h => h.decision === "MODIFIED").length;
  const critical = history.filter(h => h.priority === "Critical").length;
  const coldChain = history.filter(h => h.cold_chain).length;

  const totalHoursSaved = history.reduce((sum, h) => sum + (Number(h.eta_saved_hours) || 0), 0);
  const avgHoursSaved = total > 0 ? (totalHoursSaved / total).toFixed(1) : "0.0";

  res.json({
    success: true,
    count: total,
    summary: {
      total_recoveries: total,
      approved_count: approved,
      modified_count: modified,
      critical_rescued: critical,
      cold_chain_count: coldChain,
      avg_hours_saved: avgHoursSaved
    },
    history
  });
});

module.exports = router;
