/**
 * Lemon Squeezy webhook — Vercel Serverless (Node).
 * Supabase users: plan, subscription_id, subscription_status (SnapSell şeması: ayrı `status` sütunu yok).
 *
 * Env:
 *   LEMON_SQUEEZY_WEBHOOK_SECRET
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   LEMON_VARIANT_PLAN_MAP — isteğe bağlı JSON: {"123456":"basic","789":"pro"}
 */

"use strict";

const crypto = require("crypto");
const { createServiceClient } = require("../../lib/supabase");

/** Örnek eşleme — kendi Lemon variant ID'lerinizle değiştirin veya env ile verin. */
const DEFAULT_PLAN_MAP = {
  "11111": "basic",
  "22222": "pro",
  "33333": "premium",
};

function buildPlanMap() {
  const raw = String(process.env.LEMON_VARIANT_PLAN_MAP || "").trim();
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return Object.fromEntries(
          Object.entries(parsed).map(([k, v]) => [String(k), String(v)])
        );
      }
    } catch (_) {
      console.warn("LEMON_VARIANT_PLAN_MAP geçersiz JSON, DEFAULT_PLAN_MAP kullanılıyor");
    }
  }
  return { ...DEFAULT_PLAN_MAP };
}

/**
 * @param {import('http').IncomingMessage} req
 * @returns {Promise<Buffer>}
 */
function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

/**
 * @param {Buffer} rawBody
 * @param {string|undefined} signatureHeader
 * @param {string} secret
 * @returns {boolean}
 */
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

/**
 * @param {object} payload
 * @returns {string|null}
 */
function extractVariantId(payload) {
  const data = payload && payload.data;
  if (!data) return null;
  const rel = data.relationships || {};
  const direct = rel.variant && rel.variant.data && rel.variant.data.id;
  if (direct != null) return String(direct);

  const firstRef = rel.first_order_item && rel.first_order_item.data;
  if (firstRef && firstRef.id && Array.isArray(payload.included)) {
    const item = payload.included.find(
      (x) => x && x.type === "order-items" && String(x.id) === String(firstRef.id)
    );
    const vid = item && item.relationships && item.relationships.variant && item.relationships.variant.data && item.relationships.variant.data.id;
    if (vid != null) return String(vid);
  }

  if (Array.isArray(payload.included)) {
    const variant = payload.included.find((x) => x && x.type === "variants");
    if (variant && variant.id != null) return String(variant.id);
  }

  const attr = data.attributes || {};
  if (attr.variant_id != null) return String(attr.variant_id);
  return null;
}

/**
 * @param {object} payload
 * @returns {string|null}
 */
function extractUserEmail(payload) {
  const a = payload && payload.data && payload.data.attributes;
  if (!a || typeof a !== "object") return null;
  const v =
    a.user_email ||
    a.customer_email ||
    a.email ||
    (a.user_name && String(a.user_name).includes("@") ? a.user_name : null);
  return v ? String(v).trim().toLowerCase() : null;
}

/**
 * @param {object} payload
 * @returns {string|null} subscription kaynak id (Lemon subscription id)
 */
function extractSubscriptionResourceId(payload) {
  const data = payload && payload.data;
  if (!data || data.type !== "subscriptions") return null;
  if (data.id == null) return null;
  return String(data.id);
}

/**
 * @param {object} payload
 * @returns {string|null}
 */
function extractSubscriptionStatusAttr(payload) {
  const a = payload && payload.data && payload.data.attributes;
  if (!a || a.status == null) return null;
  return String(a.status).trim().toLowerCase();
}

module.exports = async function lemonWebhookHandler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const secret = String(process.env.LEMON_SQUEEZY_WEBHOOK_SECRET || "").trim();
  if (!secret) {
    console.error("LEMON_SQUEEZY_WEBHOOK_SECRET tanımlı değil");
    res.status(500).json({ error: "Server misconfiguration" });
    return;
  }

  let supabase;
  try {
    supabase = createServiceClient();
  } catch (e) {
    console.error("Supabase:", e.message);
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
    console.error("Body okuma:", e.message);
    res.status(400).json({ error: "Invalid body" });
    return;
  }
  if (!rawBuf || rawBuf.length === 0) {
    res.status(400).json({ error: "Empty body" });
    return;
  }

  if (!verifySignature(rawBuf, sig, secret)) {
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

  const eventName = (payload.meta && payload.meta.event_name) || "";
  console.log("🔥 Webhook received");
  console.log("📦 Event:", eventName);

  const PLAN_MAP = buildPlanMap();
  const userEmail = extractUserEmail(payload);
  const variantId = extractVariantId(payload);
  const subscriptionId = extractSubscriptionResourceId(payload);

  if (!userEmail) {
    console.warn("Webhook: user_email bulunamadı");
    res.status(400).json({ error: "Missing user email in payload" });
    return;
  }

  const { data: userRow, error: userErr } = await supabase
    .from("users")
    .select("*")
    .eq("email", userEmail)
    .single();

  if (userErr) {
    if (userErr.code === "PGRST116") {
      console.warn("👤 User not found:", userEmail);
      res.status(404).json({ error: "User not found" });
      return;
    }
    console.error("Supabase select:", userErr.message);
    res.status(500).json({ error: "Database error" });
    return;
  }

  console.log("👤 User found:", userRow.id);

  /** SnapSell: `status` yerine `subscription_status` */
  let patch = null;

  switch (eventName) {
    case "subscription_created": {
      if (!variantId) {
        res.status(400).json({ error: "Missing variant_id" });
        return;
      }
      const plan = PLAN_MAP[variantId];
      if (!plan) {
        res.status(400).json({ error: "Unknown variant_id", variant_id: variantId });
        return;
      }
      patch = {
        plan,
        subscription_status: "active",
        subscription_id: subscriptionId || userRow.subscription_id,
      };
      break;
    }
    case "subscription_updated": {
      const st = extractSubscriptionStatusAttr(payload);
      const terminal = st === "cancelled" || st === "expired" || st === "unpaid";
      if (terminal) {
        patch = {
          plan: "free",
          subscription_status: "cancelled",
          subscription_id: subscriptionId || userRow.subscription_id,
        };
      } else if (st === "active" || st === "on_trial" || st === "paused") {
        if (!variantId) {
          patch = {
            subscription_status: "active",
            subscription_id: subscriptionId || userRow.subscription_id,
          };
        } else {
          const plan = PLAN_MAP[variantId];
          if (!plan) {
            console.warn("subscription_updated: bilinmeyen variant", variantId);
            patch = {
              subscription_status: "active",
              subscription_id: subscriptionId || userRow.subscription_id,
            };
          } else {
            patch = {
              plan,
              subscription_status: "active",
              subscription_id: subscriptionId || userRow.subscription_id,
            };
          }
        }
      }
      break;
    }
    case "subscription_cancelled":
    case "subscription_expired": {
      patch = {
        plan: "free",
        subscription_status: "cancelled",
        subscription_id: subscriptionId || userRow.subscription_id,
      };
      break;
    }
    case "order_created":
      console.log("📦 order_created (abonelik güncellemesi subscription_* ile yapılır)");
      break;
    default:
      break;
  }

  if (!patch) {
    res.status(200).json({ success: true, message: "No user update for this event" });
    return;
  }

  const updatePayload = {
    plan: patch.plan,
    subscription_status: patch.subscription_status,
    subscription_id: patch.subscription_id,
  };
  Object.keys(updatePayload).forEach((k) => {
    if (updatePayload[k] === undefined) delete updatePayload[k];
  });

  const { error: updErr } = await supabase.from("users").update(updatePayload).eq("email", userEmail);

  if (updErr) {
    console.error("Supabase update:", updErr.message);
    res.status(500).json({ error: "Update failed" });
    return;
  }

  console.log("✅ Updated user");
  res.status(200).json({ success: true });
};
