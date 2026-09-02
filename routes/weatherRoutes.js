// --------------------------------------------------
// WEATHER ROUTES
// REST endpoints for Open-Meteo live weather data,
// state mega-warehouse conditions, and automated
// weather-driven disruption sensing.
// --------------------------------------------------

const express = require("express");
const router = express.Router();

const {
  getAllHubsWeather,
  getCityWeather,
  scanCorridorDisruptions
} = require("../services/weatherService");

// --------------------------------------------------
// GET /api/weather/all
// Returns live real-time Open-Meteo weather for all
// 19 State Mega-Warehouses & Central Hubs.
// --------------------------------------------------
router.get("/all", async (req, res) => {
  try {
    const hubsWeather = await getAllHubsWeather();
    res.json({
      success: true,
      count: hubsWeather.length,
      provider: "Open-Meteo Free Weather API",
      data: hubsWeather
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// --------------------------------------------------
// GET /api/weather/scan-disruption
// Proactively scans national pharma corridors and
// returns an automated live weather disruption report.
// --------------------------------------------------
router.get("/scan-disruption", async (req, res) => {
  try {
    const scanResult = await scanCorridorDisruptions();
    res.json({
      success: true,
      provider: "Open-Meteo Real-Time Telemetry",
      result: scanResult
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// --------------------------------------------------
// GET /api/weather/:city
// Returns live weather for an individual city.
// --------------------------------------------------
router.get("/:city", async (req, res) => {
  try {
    const city = req.params.city;
    const weather = await getCityWeather(city);
    res.json({
      success: true,
      city,
      weather
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
