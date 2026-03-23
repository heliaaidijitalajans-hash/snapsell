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

import { createServiceClient } from "../lib/supabase.js";

const CREDIT_PACK_CREDITS = 250;
const PLAN_CREDITS = { starter: 300, pro_monthly: 800, pro_yearly: 100 };
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

    console.log("📦 Data:", body);

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

    let supabase;
    try {
      supabase = createServiceClient();
    } catch (e) {
      console.error("Shopier webhook: Supabase not configured", e && e.message ? e.message : e);
      return res.status(503).json({ success: false, error: "SUPABASE_NOT_CONFIGURED" });
    }

    const emailNorm = buyer_email;
    const { data: userData, error: findErr } = await supabase
      .from("users")
      .select("*")
      .eq("email", emailNorm)
      .maybeSingle();
    if (findErr || !userData) {
      throw new Error("User not found for buyer_email: " + buyer_email);
    }
    const userId = userData.id;

    console.log("👤 User found:", userId);

    const now = new Date();
    const nowIso = now.toISOString();

    let updateData = {
      // Always update these fields (per requirement).
      plan: userData.plan ?? "free",
      credits: userData.credits ?? 0,
      subscription_start: userData.subscription_start ?? null,
      subscription_end: userData.subscription_end ?? null,
      updated_at: nowIso,
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

    const { error: updateErr } = await supabase.from("users").update(updateData).eq("id", userId);
    if (updateErr) throw new Error(updateErr.message || "Failed to update user");
    console.log("✅ Plan updated");

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

