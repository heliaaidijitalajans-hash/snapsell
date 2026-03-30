/**
 * Lemon Squeezy webhook — Vercel serverless (Node).
 * Mantık Railway'deki server.js ile aynı: lib/lemonWebhookProcess.js → runLemonWebhook
 */

"use strict";

const crypto = require("crypto");
const { createServiceClient } = require("../../lib/supabase");
const lemon = require("../../lib/lemonsqueezy");
const { runLemonWebhook } = require("../../lib/lemonWebhookProcess");

const FREE_CREDITS = 100;

/** server.js DEFAULT_SITE_PLANS ile aynı kredi sayıları (tek kaynak sapmasın diye) */
const CREDITS_BY_PLAN = {
  monthly_plan: 300,
  monthly_plan_pro: 800,
  yearly_plan: 12000,
  addon: 250,
  enterprise: 0,
  free: 30
};

function getCreditsForPlan(planId) {
  const id = planId === "pro" ? "monthly_plan_pro" : String(planId || "");
  if (Object.prototype.hasOwnProperty.call(CREDITS_BY_PLAN, id)) return CREDITS_BY_PLAN[id];
  return 0;
}

function isProPlan(plan) {
  if (!plan) return false;
  const p = String(plan).toLowerCase();
  if (p === "pro") return true;
  if (["monthly_plan", "monthly_plan_pro", "yearly_plan", "enterprise"].indexOf(p) !== -1) return true;
  if (String(plan).startsWith("enterprise_")) return true;
  return false;
}

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function verifySignature(rawBody, signatureHeader, secret) {
  if (!secret || !signatureHeader || !rawBody || !Buffer.isBuffer(rawBody)) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  try {
    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(String(signatureHeader).trim(), "utf8");
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch (_) {
    return false;
  }
}

module.exports = async function lemonWebhookHandler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const secret = String(process.env.LEMON_SQUEEZY_WEBHOOK_SECRET || "").trim();
  if (!secret) {
    console.error("[Lemon Vercel] LEMON_SQUEEZY_WEBHOOK_SECRET tanımlı değil");
    res.status(500).json({ error: "Server misconfiguration" });
    return;
  }

  let supabase;
  try {
    supabase = createServiceClient();
  } catch (e) {
    console.error("[Lemon Vercel] Supabase:", e.message);
    res.status(500).json({ error: "Database configuration error" });
    return;
  }

  const sig = req.headers["x-signature"] || req.headers["X-Signature"];
  let rawBuf;
  try {
    rawBuf = await readRawBody(req);
    if (!rawBuf || rawBuf.length === 0) {
      if (Buffer.isBuffer(req.body) && req.body.length) rawBuf = req.body;
      else if (typeof req.body === "string" && req.body.length) rawBuf = Buffer.from(req.body, "utf8");
    }
  } catch (e) {
    console.error("[Lemon Vercel] Body:", e.message);
    res.status(400).json({ error: "Invalid body" });
    return;
  }
  if (!rawBuf || rawBuf.length === 0) {
    res.status(400).json({ error: "Empty body" });
    return;
  }

  if (!verifySignature(rawBuf, sig, secret)) {
    console.warn("[Lemon Vercel] İmza geçersiz");
    res.status(401).json({ error: "Invalid signature" });
    return;
  }

  let payload;
  try {
    payload = JSON.parse(rawBuf.toString("utf8"));
  } catch (e) {
    res.status(400).json({ error: "Invalid JSON" });
    return;
  }

  const ev = payload.meta && payload.meta.event_name;
  console.log("[Lemon Vercel] 🔗 Webhook (imza OK), event=", ev || "?");

  async function getUserById(userId) {
    if (!userId || String(userId).trim() === "") return null;
    const id = String(userId).trim();
    const { data: row, error } = await supabase.from("users").select("*").eq("id", id).maybeSingle();
    if (error || !row) return null;
    return {
      id: row.id,
      credits: row.credits ?? FREE_CREDITS,
      plan: row.plan || "free",
      email: row.email,
      displayName: row.display_name
    };
  }

  async function getUserByEmail(email) {
    if (!email || String(email).trim() === "") return null;
    const emailNorm = String(email).trim().toLowerCase();
    const { data: rows, error } = await supabase.from("users").select("*").ilike("email", emailNorm).limit(1);
    if (error || !rows || !rows.length) return null;
    const row = rows[0];
    return {
      id: row.id,
      credits: row.credits ?? FREE_CREDITS,
      plan: row.plan || "free",
      email: row.email,
      displayName: row.display_name
    };
  }

  async function updateUserInDb(userId, data) {
    const payload = {};
    if (data.credits != null) payload.credits = data.credits;
    if (data.plan != null) payload.plan = data.plan;
    if (data.totalConversions != null) payload.total_conversions = data.totalConversions;
    if (data.email != null) payload.email = data.email;
    if (data.displayName != null) payload.display_name = data.displayName;
    if (data.subscription_start != null) payload.subscription_start = data.subscription_start;
    if (data.subscription_end != null) payload.subscription_end = data.subscription_end;
    if (Object.prototype.hasOwnProperty.call(data, "subscription_id")) {
      payload.subscription_id = data.subscription_id;
    }
    if (data.subscription_status != null) payload.subscription_status = data.subscription_status;
    if (Object.keys(payload).length === 0) return;
    const { data: rows, error } = await supabase.from("users").update(payload).eq("id", userId).select("id");
    if (error) throw new Error(error.message);
    if (!rows || rows.length === 0) {
      console.warn("[Lemon Vercel] Supabase update: kullanıcı yok id=", userId);
    }
  }

  try {
    await runLemonWebhook(payload, {
      lemon,
      FREE_CREDITS,
      getUserById,
      getUserByEmail,
      updateUserInDb,
      getCreditsForPlan,
      isProPlan
    });
    res.status(200).json({ success: true, received: true });
  } catch (err) {
    console.error("[Lemon Vercel] İşleme hatası:", err && err.message);
    res.status(500).json({ error: err.message || "Webhook error" });
  }
};
