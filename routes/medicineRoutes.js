// --------------------------------------------------
// MEDICINE ROUTES
// REST endpoints for the Medicine Master Database,
// cold-chain specs, thermal stability, and generic
// substitution clinical equivalence.
// --------------------------------------------------

const express = require("express");
const router = express.Router();

const {
  getAllMedicines,
  getMedicineById,
  getMedicineByName,
  getSubstitutes
} = require("../data/medicines");

// GET /api/medicines
router.get("/", (req, res) => {
  const list = getAllMedicines();
  res.json({
    success: true,
    count: list.length,
    medicines: list
  });
});

// GET /api/medicines/:query
router.get("/:query", (req, res) => {
  const query = req.params.query;
  const med = getMedicineById(query) || getMedicineByName(query);

  if (!med) {
    return res.status(404).json({
      success: false,
      message: `Medicine '${query}' not found in Medicine Master Database.`
    });
  }

  res.json({
    success: true,
    medicine: med
  });
});

// GET /api/medicines/:query/substitutes
router.get("/:query/substitutes", (req, res) => {
  const query = req.params.query;
  const substitutes = getSubstitutes(query);
  const med = getMedicineByName(query);

  res.json({
    success: true,
    medicine: med ? med.name : query,
    approved_substitutes: substitutes
  });
});

module.exports = router;
