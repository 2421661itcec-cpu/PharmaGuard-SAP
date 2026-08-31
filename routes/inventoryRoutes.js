const express = require("express");
const router = express.Router();

const {
  analyzeInventory,
  executeInventoryTransfer
} = require("../agents/inventoryRebalancingAgent");

router.get("/analyze", (req, res) => {
  const medicine =
    req.query.medicine || "Insulin";

  const destination =
    req.query.destination || "Chandigarh";

  const result = analyzeInventory(
    medicine,
    destination
  );

  res.json(result);
});

router.post("/transfer", (req, res) => {
  const {
    medicine,
    source,
    destination,
    quantity
  } = req.body;

  if (
    !medicine ||
    !source ||
    !destination ||
    quantity === undefined
  ) {
    return res.status(400).json({
      success: false,
      status: "INVALID_REQUEST",
      message:
        "Medicine, source, destination and quantity are required."
    });
  }

  const result =
    executeInventoryTransfer(
      medicine,
      source,
      destination,
      Number(quantity)
    );

  if (!result.success) {
    return res.status(400).json(result);
  }

  res.json(result);
});

module.exports = router;