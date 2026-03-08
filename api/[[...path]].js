/**
 * Vercel API catch-all: forwards all /api/* to the Express app from server.js.
 * Keeps existing backend logic; no Railway needed.
 */
let app;

function getApp() {
  if (!app) {
    app = require("../server").app;
  }
  return app;
}

module.exports = function handler(req, res) {
  return getApp()(req, res);
};
