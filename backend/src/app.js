const express = require("express");
const cors = require("cors");

const app = express();

const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.length === 0) {
        return callback(null, true);
      }
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"), false);
    },
  })
);

app.use(express.json());

const signalRoutes = require("./routes/signalRoutes");

app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Backend is alive" });
});

app.use("/api/signal", signalRoutes);

// Test-only route to exercise the error handler in automated tests
if (process.env.NODE_ENV === "test") {
  app.get("/test/error", () => {
    throw new Error("Forced test error");
  });
}

// Central error handler so all errors return a JSON shape
// instead of default HTML responses.
app.use((err, req, res, next) => {
  if (process.env.NODE_ENV !== "test") {
    // eslint-disable-next-line no-console
    console.error(err);
  }

  if (err && err.message === "Not allowed by CORS") {
    return res.status(403).json({
      error: "CORS",
      message: "Origin not allowed",
    });
  }

  return res.status(500).json({
    error: "InternalServerError",
    message: "An unexpected error occurred",
  });
});

module.exports = app;
