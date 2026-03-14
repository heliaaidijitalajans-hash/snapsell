/**
 * Railway / production giris noktasi.
 * Express veya server.js hata verirse bile Node http ile dinleyip 503 doner.
 */
console.log("SnapSell start.js running, PORT=" + (process.env.PORT || "8080"));

require("dotenv").config();
const PORT = parseInt(process.env.PORT, 10) || 8080;

process.on("unhandledRejection", function (err) {
  console.error("Unhandled rejection:", err);
});
process.on("uncaughtException", function (err) {
  console.error("Uncaught exception:", err);
});

function listenMinimal(err) {
  const http = require("http");
  const msg = JSON.stringify({
    error: "Startup failed",
    message: (err && (err.message || err.stack)) || String(err)
  });
  const server = http.createServer(function (req, res) {
    res.writeHead(503, {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    });
    res.end(msg);
  });
  server.listen(PORT, "0.0.0.0", function () {
    console.log("Minimal server on port", PORT, "(startup error)");
  });
}

try {
  const express = require("express");
  let app;
  try {
    app = require("./server.js").app;
  } catch (e) {
    console.error("server.js load error:", e);
    listenMinimal(e);
    return;
  }
  app.listen(PORT, "0.0.0.0", function () {
    console.log("Server is running on port", PORT);
  });
  server.on("error", function (err) {
    console.error("Listen error:", err);
    process.exit(1);
  });
} catch (e) {
  console.error("Startup error (express/server):", e);
  listenMinimal(e);
}
