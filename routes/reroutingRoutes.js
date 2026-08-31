const express = require("express");
const router = express.Router();

const {
  executeReroute
} = require("../agents/reroutingAgent");

router.post("/execute", (req, res) => {
  const { approval } = req.body;

  if (!approval) {
    return res.status(400).json({
      success: false,
      status: "ERROR",
      message: "Approval result is required."
    });
  }

  const result = executeReroute(approval);

  if (!result.success) {
    return res.status(403).json(result);
  }

  res.json(result);
});

module.exports = router;