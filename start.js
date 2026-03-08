/**
 * Railway / production giris noktasi.
 * server.js yuklenirken hata olursa yine de dinleyip 503 + hata mesaji doner.
 */
require("dotenv").config();

const express = require("express");
const PORT = parseInt(process.env.PORT, 10) || 3006;

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Session-Id");
}

let app;
try {
  app = require("./server.js").app;
} catch (err) {
  console.error("Startup error:", err);
  app = express();
  app.use(function (req, res, next) {
    setCors(res);
    if (req.method === "OPTIONS") return res.status(204).end();
    next();
  });
  app.use(function (req, res) {
    setCors(res);
    res.status(503).json({
      error: "Startup failed",
      message: err.message || String(err)
    });
  });
}

const server = app.listen(PORT, "0.0.0.0", function () {
  console.log("SnapSell API listening on port", PORT, "(Ready)");
});

server.on("error", function (err) {
  console.error("Server listen error:", err);
  process.exit(1);
});
