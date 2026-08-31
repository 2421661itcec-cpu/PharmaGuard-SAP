const express = require("express");
const cors = require("cors");
const path = require("path");

const disruptionRoutes =
  require("./routes/disruptionRoutes");

const approvalRoutes =
  require("./routes/approvalRoutes");

const reroutingRoutes =
  require("./routes/reroutingRoutes");

const inventoryRoutes =
  require("./routes/inventoryRoutes");

const pharmaGuardRoutes =
  require("./routes/pharmaGuardRoutes");

const shipments =
  require("./data/shipments");

const inventory =
  require("./data/inventory");

const app = express();


// --------------------------------------------------
// MIDDLEWARE
// --------------------------------------------------

app.use(cors());

app.use(express.json());


// --------------------------------------------------
// API ROUTES
// --------------------------------------------------

app.use(
  "/api/disruption",
  disruptionRoutes
);

app.use(
  "/api/approval",
  approvalRoutes
);

app.use(
  "/api/rerouting",
  reroutingRoutes
);

app.use(
  "/api/inventory",
  inventoryRoutes
);

app.use(
  "/api/pharmaguard",
  pharmaGuardRoutes
);


// --------------------------------------------------
// READ-ONLY DATA APIs
// --------------------------------------------------

app.get(
  "/api/shipments",
  (req, res) => {

    res.json({
      success: true,
      count: shipments.length,
      shipments
    });

  }
);


app.get(
  "/api/inventory/all",
  (req, res) => {

    res.json({
      success: true,
      count: inventory.length,
      inventory
    });

  }
);


// --------------------------------------------------
// FRONTEND
// --------------------------------------------------

app.use(
  express.static(
    path.join(
      __dirname,
      "public"
    )
  )
);


// --------------------------------------------------
// HEALTH CHECK
// --------------------------------------------------

app.get(
  "/api/health",
  (req, res) => {

    res.json({
      application: "PharmaGuard",
      status: "RUNNING",
      message:
        "PharmaGuard Backend Running"
    });

  }
);


// --------------------------------------------------
// FRONTEND FALLBACK
// --------------------------------------------------

app.get(
  "/",
  (req, res) => {

    res.sendFile(
      path.join(
        __dirname,
        "public",
        "index.html"
      )
    );

  }
);


// --------------------------------------------------
// SERVER
// --------------------------------------------------

const PORT =
  process.env.PORT || 5050;

const HOST =
  "0.0.0.0";

app.listen(
  PORT,
  HOST,
  () => {

    console.log(
      `PharmaGuard server running on ${HOST}:${PORT}`
    );

  }
);