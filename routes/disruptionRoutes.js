const express = require("express");
const router = express.Router();

const {
  detectDisruption
} = require("../agents/disruptionAgent");

const {
  analyzeImpact
} = require("../agents/impactAnalysisAgent");

const {
  generateScenarios
} = require("../agents/scenarioPlanningAgent");

router.get("/", (req, res) => {
  const query = req.query.disruption || "Ambala distribution hub closure";
  const disruptionResult = detectDisruption(query);

  res.json(disruptionResult);
});

router.get("/impact", (req, res) => {
  const query = req.query.disruption || "Ambala distribution hub closure";
  const disruptionResult = detectDisruption(query);

  const impactResult = analyzeImpact(disruptionResult);

  res.json(impactResult);
});

router.get("/scenarios", (req, res) => {
  const query = req.query.disruption || "Ambala distribution hub closure";
  const disruptionResult = detectDisruption(query);

  const impactResult = analyzeImpact(disruptionResult);

  const scenarioResult = generateScenarios(
    impactResult
  );

  res.json(scenarioResult);
});

module.exports = router;