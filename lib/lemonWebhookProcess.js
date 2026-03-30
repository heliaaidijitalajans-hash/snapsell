/**
 * Lemon Squeezy webhook → SnapSell users (plan, kredi, abonelik).
 * Hem server.js (Railway) hem api/webhook/lemonsqueezy.js (Vercel) bu modülü kullanır.
 */

"use strict";

const LEMON_CHECKOUT_PLAN_IDS = ["monthly_plan", "monthly_plan_pro", "yearly_plan", "addon", "enterprise"];

function snapPlanFromLemonCustom(planIdRaw) {
  const p = String(planIdRaw || "").trim();
  if (LEMON_CHECKOUT_PLAN_IDS.indexOf(p) !== -1) return p;
  if (p === "pro") return "pro";
  return "pro";
}

/**
 * @param {object} deps
 * @param {object} deps.lemon
 * @param {number} deps.FREE_CREDITS
 * @param {function} deps.getUserById
 * @param {function} deps.getUserByEmail
 * @param {function} deps.updateUserInDb
 * @param {function} deps.getCreditsForPlan
 * @param {function} deps.isProPlan
 */
async function runLemonWebhook(body, deps) {
  const lemon = deps.lemon;
  const FREE_CREDITS = deps.FREE_CREDITS;
  const getUserById = deps.getUserById;
  const getUserByEmail = deps.getUserByEmail;
  const updateUserInDb = deps.updateUserInDb;
  const getCreditsForPlan = deps.getCreditsForPlan;
  const isProPlan = deps.isProPlan;

  async function resolveLemonWebhookUserId(b) {
    const sum = lemon.summarizeWebhook(b);
    if (sum.customUserId) {
      const row = await getUserById(sum.customUserId);
      if (row) {
        console.log("[Lemon] Kullanıcı eşleşti: checkout custom user_id →", row.id);
        return row.id;
      }
      console.warn(
        "[Lemon] custom user_id DB'de yok, e-posta ile deneniyor:",
        sum.customUserId,
        "email:",
        sum.userEmail || "(yok)"
      );
    }
    if (sum.userEmail) {
      const u = await getUserByEmail(sum.userEmail);
      if (u) {
        console.log("[Lemon] Kullanıcı eşleşti: user_email →", u.id, sum.userEmail);
        return u.id;
      }
      console.warn("[Lemon] user_email ile kullanıcı bulunamadı:", sum.userEmail);
    }
    return null;
  }

  async function applyLemonPaidPlanToUser(uid, planSnap, opts) {
    opts = opts || {};
    const grant = getCreditsForPlan(planSnap);
    const u = await getUserById(uid);
    if (!u) {
      console.warn("[Lemon] applyLemonPaidPlanToUser: uid için satır yok", uid);
      return;
    }
    const patch = {
      plan: planSnap,
      subscription_status: "active"
    };
    if (opts.subscriptionId != null && String(opts.subscriptionId).trim() !== "") {
      patch.subscription_id = String(opts.subscriptionId).trim();
    }
    if (grant > 0) {
      if (opts.renewal) {
        patch.credits = (u.credits ?? FREE_CREDITS) + grant;
      } else {
        patch.credits = Math.max(u.credits ?? FREE_CREDITS, grant);
      }
    }
    await updateUserInDb(uid, patch);
    const after = await getUserById(uid);
    console.log(
      "[Lemon] ✅ Kullanıcı güncellendi:",
      uid,
      "plan=",
      after && after.plan,
      "credits=",
      after && after.credits,
      "grant=",
      grant,
      "renewal=",
      !!opts.renewal
    );
  }

  const sum = lemon.summarizeWebhook(body);
  console.log(
    "[Lemon] 📩 Webhook:",
    sum.eventName,
    "type=",
    sum.resourceType,
    "custom_user_id=",
    sum.customUserId || null,
    "custom_plan_id=",
    sum.customPlanId || null,
    "email=",
    sum.userEmail || null
  );

  const uid = await resolveLemonWebhookUserId(body);
  const planSnap = snapPlanFromLemonCustom(sum.customPlanId);
  const dataAttrs = body && body.data && body.data.attributes ? body.data.attributes : {};

  try {
    switch (sum.eventName) {
      case "subscription_created":
        if (uid) {
          await applyLemonPaidPlanToUser(uid, planSnap, { subscriptionId: sum.resourceId, renewal: false });
        } else {
          console.warn("[Lemon] subscription_created: kullanıcı bulunamadı", sum.userEmail);
        }
        break;

      case "subscription_payment_success":
      case "subscription_payment_recovered": {
        if (String(dataAttrs.status || "").toLowerCase() !== "paid") {
          console.log("[Lemon]", sum.eventName, "atlandı (fatura paid değil):", dataAttrs.status);
          break;
        }
        if (!uid) {
          console.warn("[Lemon]", sum.eventName, ": kullanıcı bulunamadı", sum.userEmail);
          break;
        }
        const subId =
          dataAttrs.subscription_id != null ? String(dataAttrs.subscription_id) : sum.resourceId;
        const renewal = String(dataAttrs.billing_reason || "").toLowerCase() === "renewal";
        await applyLemonPaidPlanToUser(uid, planSnap, { subscriptionId: subId, renewal: renewal });
        break;
      }

      case "subscription_resumed":
      case "subscription_unpaused":
        if (uid) {
          await applyLemonPaidPlanToUser(uid, planSnap, { subscriptionId: sum.resourceId, renewal: false });
          console.log("[Lemon]", sum.eventName, "→ plan senkron", uid);
        } else {
          console.warn("[Lemon]", sum.eventName, ": kullanıcı bulunamadı", sum.userEmail);
        }
        break;

      case "subscription_updated":
        if (!uid) {
          console.warn("[Lemon] subscription_updated: kullanıcı bulunamadı", sum.userEmail);
          break;
        }
        if (sum.status === "active" || sum.status === "on_trial" || sum.status === "paused") {
          await applyLemonPaidPlanToUser(uid, planSnap, { subscriptionId: sum.resourceId, renewal: false });
        } else if (sum.status === "cancelled" || sum.status === "expired" || sum.status === "unpaid") {
          await updateUserInDb(uid, { plan: "free", subscription_status: "cancelled" });
          console.log("[Lemon] subscription_updated → plan free (durum:", sum.status, ")");
        }
        break;

      case "subscription_cancelled":
      case "subscription_expired":
        if (uid) {
          await updateUserInDb(uid, { plan: "free", subscription_status: "cancelled" });
          console.log("[Lemon] Abonelik sonlandı → kullanıcı", uid, "free");
        } else {
          console.warn("[Lemon] subscription end: kullanıcı bulunamadı", sum.userEmail);
        }
        break;

      case "order_created":
        if (sum.resourceType !== "orders") break;
        if (String(dataAttrs.status || "").toLowerCase() !== "paid") {
          console.log("[Lemon] order_created atlandı (sipariş paid değil):", dataAttrs.status);
          break;
        }
        if (String(sum.customPlanId || "").trim() === "addon") {
          let targetId = uid;
          if (!targetId && sum.customUserId) {
            const uByCustom = await getUserById(sum.customUserId);
            if (uByCustom) targetId = uByCustom.id;
          }
          if (!targetId) {
            console.warn("[Lemon] order_created addon: kullanıcı yok (uid / custom user_id)");
            break;
          }
          const add = getCreditsForPlan("addon");
          const u = await getUserById(targetId);
          if (!u) {
            console.warn("[Lemon] order_created addon: kullanıcı yok", targetId);
            break;
          }
          const newCredits = (u.credits ?? FREE_CREDITS) + add;
          const patch = { credits: newCredits };
          if (!isProPlan(u.plan)) patch.plan = "addon";
          await updateUserInDb(targetId, patch);
          console.log("[Lemon] order_created addon kredi +", add, "→", targetId);
          break;
        }
        if (uid) {
          await applyLemonPaidPlanToUser(uid, planSnap, { renewal: false });
          console.log("[Lemon] order_created (paid) senkron:", uid);
        } else {
          console.warn("[Lemon] order_created paid: kullanıcı eşleşmedi (custom_data.user_id veya user_email)");
        }
        break;

      default:
        console.log("[Lemon] İşlenmeyen olay (bilgi):", sum.eventName);
    }
  } catch (err) {
    console.error("[Lemon] Webhook switch içi hata:", err && err.message, err && err.stack);
    throw err;
  }
}

module.exports = { runLemonWebhook, snapPlanFromLemonCustom, LEMON_CHECKOUT_PLAN_IDS };
