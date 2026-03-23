/**
 * Tek Vercel Serverless Function: tüm /api/* Express route'ları (Hobby plan 12 fonksiyon limiti).
 * vercel.json: /api ve /api/:path* → /api
 */
"use strict";

const serverless = require("serverless-http");
const { app } = require("../server.js");

module.exports = serverless(app);
