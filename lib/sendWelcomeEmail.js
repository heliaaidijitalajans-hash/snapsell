/**
 * Resend ile abonelik / ödeme sonrası hoş geldin e-postası (Lemon receipt’a ek).
 * RESEND_API_KEY yoksa sessizce atlanır.
 */

"use strict";

const { Resend } = require("resend");

/** Aynı kullanıcıya kısa sürede çift mail (ör. subscription_created + order_created) önleme */
const welcomeDedup = new Map();
const DEDUP_MS = 120000;

/**
 * @param {string} to
 * @param {string} plan Görünen plan adı
 * @param {number|{ planCredits?: number, balanceCredits?: number }} credits Tek sayı (eski davranış) veya paket + bakiye
 * @returns {Promise<{ success: boolean }>}
 */
async function sendSubscriptionWelcomeEmail(to, plan, credits) {
  const apiKey = String(process.env.RESEND_API_KEY || "").trim();
  if (!apiKey) {
    return { success: false };
  }
  const email = String(to || "").trim();
  if (!email) {
    return { success: false };
  }
  const planStr = String(plan || "");
  const planSafe = escapeHtml(planStr);
  const dedupKey = email.toLowerCase() + ":" + planStr;

  let creditsBlock = "";
  if (credits != null && typeof credits === "object" && !Array.isArray(credits)) {
    const pc = credits.planCredits;
    const bc = credits.balanceCredits;
    if (pc != null && Number(pc) > 0) {
      creditsBlock += "<p><b>Plan kredisi:</b> " + escapeHtml(String(pc)) + "</p>";
    }
    if (bc != null && bc !== undefined && String(bc).trim() !== "") {
      creditsBlock += "<p><b>Güncel bakiyen:</b> " + escapeHtml(String(bc)) + "</p>";
    }
    if (!creditsBlock) {
      creditsBlock = "<p><b>Kredi:</b> —</p>";
    }
  } else {
    creditsBlock = "<p><b>Kredi:</b> " + escapeHtml(String(credits)) + "</p>";
  }
  const now = Date.now();
  const prev = welcomeDedup.get(dedupKey);
  if (prev != null && now - prev < DEDUP_MS) {
    return { success: true };
  }
  welcomeDedup.set(dedupKey, now);
  if (welcomeDedup.size > 500) {
    const cutoff = now - DEDUP_MS;
    welcomeDedup.forEach(function (ts, k) {
      if (ts < cutoff) welcomeDedup.delete(k);
    });
  }

  const from = String(process.env.RESEND_FROM || "SnapSell <onboarding@mail.snapsell.website>").trim();
  const replyTo = String(process.env.RESEND_REPLY_TO || "snapsell.destek@gmail.com").trim();
  const appBase = String(process.env.PUBLIC_APP_URL || "https://snapsell.website").trim().replace(/\/$/, "");
  const dashboardUrl = escapeAttr(
    String(process.env.RESEND_DASHBOARD_URL || appBase + "/dashboard").trim()
  );
  const supportEmail = escapeHtml(replyTo);

  const resend = new Resend(apiKey);
  const html =
    '<div style="font-family: Arial, sans-serif; background:#f5f7fb; padding:40px;">' +
    '<div style="max-width:600px; margin:auto; background:white; border-radius:12px; overflow:hidden;">' +
    '<div style="background:#4f46e5; padding:20px; text-align:center;">' +
    '<h1 style="color:white; margin:0;">SnapSell</h1>' +
    "</div>" +
    '<div style="padding:30px; color:#333;">' +
    "<h2>🎉 Hoşgeldin!</h2>" +
    "<p>Aboneliğin başarıyla aktif edildi.</p>" +
    '<div style="background:#f1f3f9; padding:15px; border-radius:8px; margin:20px 0;">' +
    "<p><b>Plan:</b> " +
    planSafe +
    "</p>" +
    creditsBlock +
    "</div>" +
    "<p>Artık SnapSell'i kullanmaya başlayabilirsin 🚀</p>" +
    '<div style="text-align:center; margin:30px 0;">' +
    '<a href="' +
    dashboardUrl +
    '" style="background:#4f46e5;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;">Dashboard\'a Git</a>' +
    "</div>" +
    '<p style="font-size:14px; color:#777;">Herhangi bir sorunda bize ulaş:<br/><b>' +
    supportEmail +
    "</b></p>" +
    "</div>" +
    '<div style="background:#f5f7fb; padding:15px; text-align:center; font-size:12px; color:#999;">© 2026 SnapSell. Tüm hakları saklıdır.</div>' +
    "</div></div>";

  try {
    const response = await resend.emails.send({
      from,
      replyTo,
      to: email,
      subject: "🎉 SnapSell hesabın aktif!",
      html
    });
    console.log("[Resend] Hoş geldin e-postası gönderildi:", email, response && response.data ? response.data.id : "");
    return { success: true };
  } catch (err) {
    console.error("[Resend] E-posta hatası:", err && err.message);
    return { success: false };
  }
}

/** @param {number|{ planCredits?: number, balanceCredits?: number }} credits */
function sendEmail(to, plan, credits) {
  return sendSubscriptionWelcomeEmail(to, plan, credits);
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(s) {
  return escapeHtml(s).replace(/'/g, "&#39;");
}

module.exports = { sendSubscriptionWelcomeEmail, sendEmail };
