const express = require("express");
const router = express.Router();

const {
  approvePlan,
  rejectPlan,
  modifyPlan,
  getApprovalState
} = require("../agents/approvalAgent");

// Get current approval state
router.get("/status", (req, res) => {
  res.json(getApprovalState());
});

// Approve a recovery plan
router.post("/approve", (req, res) => {
  const { plan, decision_by } = req.body;

  if (!plan) {
    return res.status(400).json({
      error: "Plan is required"
    });
  }

  const result = approvePlan(
    plan,
    decision_by || "Supply Chain Manager"
  );

  res.json(result);
});

// Reject a recovery plan
router.post("/reject", (req, res) => {
  const { plan, reason, decision_by } = req.body;

  if (!plan) {
    return res.status(400).json({
      error: "Plan is required"
    });
  }

  if (!reason) {
    return res.status(400).json({
      error: "Rejection reason is required"
    });
  }

  const result = rejectPlan(
    plan,
    reason,
    decision_by || "Supply Chain Manager"
  );

  res.json(result);
});

// Modify a recovery plan
router.post("/modify", (req, res) => {
  const {
    plan,
    modifications,
    decision_by
  } = req.body;

  if (!plan) {
    return res.status(400).json({
      error: "Plan is required"
    });
  }

  if (!modifications) {
    return res.status(400).json({
      error: "Modifications are required"
    });
  }

  const result = modifyPlan(
    plan,
    modifications,
    decision_by || "Supply Chain Manager"
  );

  res.json(result);
});

module.exports = router;