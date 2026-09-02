const express = require("express");
const cors = require("cors");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

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

const trackingRoutes =
  require("./routes/trackingRoutes");

const shipments =
  require("./data/shipments");

const inventory =
  require("./data/inventory");

const { startSimulation } =
  require("./data/gpsSimulator");

const app = express();


// --------------------------------------------------
// MIDDLEWARE
// --------------------------------------------------

app.use(cors());

app.use(express.json());


// --------------------------------------------------
// API ROUTES  (existing — unchanged)
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
// TRACKING ROUTES  (new — does not overlap existing)
// --------------------------------------------------

app.use(
  "/api/tracking",
  trackingRoutes
);


// --------------------------------------------------
// READ-ONLY DATA APIs  (existing — unchanged)
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
// HEALTH CHECK  (existing — unchanged)
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
// FRONTEND FALLBACK  (existing — unchanged)
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
// SERVER + SOCKET.IO
// Socket.IO is attached to the SAME http server —
// no second process, no second port.
// All existing REST APIs continue to work exactly
// as before through the same server instance.
// --------------------------------------------------

const PORT =
  process.env.PORT || 5050;

const HOST =
  "0.0.0.0";

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  console.log(
    `[Socket.IO] Client connected: ${socket.id}`
  );

  socket.on("disconnect", () => {
    console.log(
      `[Socket.IO] Client disconnected: ${socket.id}`
    );
  });
});


httpServer.listen(
  PORT,
  HOST,
  () => {

    console.log(
      `PharmaGuard server running on ${HOST}:${PORT}`
    );

    // Start GPS simulation after server is ready.
    // The io instance is passed so the simulator
    // can broadcast to connected browser clients.
    startSimulation(io);

  }
);