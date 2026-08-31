const express = require("express");

const router = express.Router();

const {
  createRecoveryPlan,
  executeApprovedRecovery
} = require("../agents/pharmaGuardOrchestrator");


// --------------------------------------------------
// STEP 1: CREATE RECOVERY PLAN
// --------------------------------------------------

router.post("/recovery", (req, res) => {
  const {
    disruption
  } = req.body;

  if (!disruption) {
    return res.status(400).json({
      success: false,
      status: "INVALID_REQUEST",
      message:
        "Disruption description is required."
    });
  }

  const result =
    createRecoveryPlan(disruption);

  res.json(result);
});


// --------------------------------------------------
// STEP 2: EXECUTE APPROVED RECOVERY
// --------------------------------------------------

router.post(
  "/recovery/execute",
  (req, res) => {
    const {
      approval
    } = req.body;

    if (!approval) {
      return res.status(400).json({
        success: false,
        status: "INVALID_REQUEST",
        message:
          "Approval result is required."
      });
    }

    const result =
      executeApprovedRecovery(
        approval
      );

    if (!result.success) {
      return res.status(403).json(result);
    }

    res.json(result);
  }
);


module.exports = router;