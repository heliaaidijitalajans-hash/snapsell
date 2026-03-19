/**
 * Shopier webhook – Vercel serverless.
 * POST from Shopier with order_id, product_name, buyer_email, total_price.
 *
 * Requirement logs (exact):
 *  - "🔥 Shopier webhook received"
 *  - "📦 Shopier body:"
 *  - "👤 User found:"
 *  - "✅ User updated"
 */

import { getFirestore } from "../lib/firebase-admin.js";

const USERS_COLLECTION = "users";

// Internal credits unit matches pricing endpoint (addon/ek paket = 250 credits).
const CREDIT_PACK_CREDITS = 250;

// Credits granted/used for plan activation.
const PLAN_CREDITS = {
  starter: 300,
  pro_monthly: 800,
  // For yearly: keep "first month" behavior (monthly 100 refill).
  pro_yearly: 100,
};

// Allow Credit Pack only for paid plans.
const ADDON_ALLOWED_PLANS = ["starter", "pro_monthly", "pro_yearly"];

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function resolveProductAction(productName) {
  const name = String(productName || "").toLowerCase();
  if (name.includes("credit pack")) return { type: "credits" };
  if (name.includes("starter plan") || name.includes("starter")) return { type: "plan", plan: "starter" };
  if (name.includes("pro plan monthly") || name.includes("pro monthly")) return { type: "plan", plan: "pro_monthly" };
  if (name.includes("pro plan yearly") || name.includes("pro yearly")) return { type: "plan", plan: "pro_yearly" };
  return null;
}

function computeSubscriptionEnd(plan, now) {
  const end = new Date(now);
  if (plan === "starter" || plan === "pro_monthly") {
    end.setMonth(end.getMonth() + 1);
    return end.toISOString();
  }
  if (plan === "pro_yearly") {
    end.setFullYear(end.getFullYear() + 1);
    return end.toISOString();
  }
  return null;
}

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  let debugParsed = null;
  try {
    console.log("🔥 Shopier webhook received");

    let body = req.body;
    if (typeof body === "string") {
      body = JSON.parse(body);
    }
    if (!body || typeof body !== "object") body = {};

    console.log("📦 Shopier body:", body);

    // Parse attempts (fields requested by the user).
    const order_id = body.order_id ?? body.orderId ?? body.platform_order_id ?? body.id ?? null;
    const product_name = body.product_name ?? body.productName ?? body.title ?? "";
    const buyer_email_raw = body.buyer_email ?? body.buyerEmail ?? body.email ?? "";
    const buyer_email = normalizeEmail(buyer_email_raw);
    const total_price_raw = body.total_price ?? body.totalPrice ?? body.total_order_value ?? body.amount ?? null;
    const total_price = total_price_raw == null ? null : Number(total_price_raw);
    debugParsed = { order_id, product_name, buyer_email, total_price };

    const action = resolveProductAction(product_name);
    if (!buyer_email) throw new Error("Missing buyer_email");
    if (!action) throw new Error("Unknown product_name: " + String(product_name));

    const db = getFirestore();
    const emailNorm = buyer_email;
    const snapshot = await db
      .collection(USERS_COLLECTION)
      .where("email", "==", emailNorm)
      .limit(1)
      .get();

    if (snapshot.empty) {
      throw new Error("User not found for buyer_email: " + buyer_email);
    }

    const doc = snapshot.docs[0];
    const userId = doc.id;
    const userData = doc.data() || {};

    console.log("👤 User found:", userId);

    const now = new Date();
    const nowIso = now.toISOString();

    let updateData = {
      // Always update these fields (per requirement).
      plan: userData.plan ?? "free",
      credits: userData.credits ?? 0,
      subscription_start: userData.subscription_start ?? null,
      subscription_end: userData.subscription_end ?? null,
      updatedAt: nowIso,
    };

    if (action.type === "credits") {
      const currentPlan = String(userData.plan ?? "free").toLowerCase();
      if (!ADDON_ALLOWED_PLANS.includes(currentPlan)) {
        // No-op (don't error), but still return success to avoid retries.
        return res.status(200).json({ success: true });
      }

      updateData = {
        ...updateData,
        credits: Number(userData.credits) + CREDIT_PACK_CREDITS,
      };
    } else if (action.type === "plan") {
      const plan = action.plan;
      const subscription_end = computeSubscriptionEnd(plan, now);
      if (!subscription_end) throw new Error("Invalid plan for subscription end: " + plan);

      updateData = {
        ...updateData,
        plan,
        credits: PLAN_CREDITS[plan] ?? updateData.credits,
        subscription_start: nowIso,
        subscription_end,
      };

      // Keep yearly monthly refill fields if you already use them elsewhere.
      if (plan === "pro_yearly") {
        const nextRefill = new Date(now);
        nextRefill.setMonth(nextRefill.getMonth() + 1);
        updateData.next_refill_at = nextRefill.toISOString();
        updateData.months_refilled = 1;
      }
    }

    // Avoid losing required user fields: ensure they exist.
    updateData.plan = updateData.plan ?? "free";
    updateData.credits = Number(updateData.credits) || 0;

    // Persist.
    await doc.ref.update(updateData);
    console.log("✅ User updated");

    return res.status(200).json({ success: true });
  } catch (err) {
    // Detailed console.error + 500 (per requirement).
    console.error("Shopier webhook error:", {
      message: err && err.message ? err.message : String(err),
      stack: err && err.stack ? err.stack : null,
      parsed: debugParsed,
    });
    return res.status(500).json({ success: false, error: "SHOPIER_WEBHOOK_ERROR" });
  }
}

