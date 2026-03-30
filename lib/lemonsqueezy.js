/**
 * Lemon Squeezy API + webhook helpers (Node).
 * Docs: https://docs.lemonsqueezy.com/api/checkouts/create-checkout
 */

const crypto = require("crypto");

/**
 * Lemon Squeezy JSON:API — ilişki kimlikleri dokümanda string: `"id": "1"`.
 * @see https://docs.lemonsqueezy.com/api/checkouts/create-checkout
 * Sayı olarak göndermeyin; JSON gövdesinde `id` her zaman string olmalı.
 * @param {unknown} raw
 * @returns {string}
 */
function normalizeLemonRelationshipId(raw) {
  let s = String(raw ?? "").trim();
  s = s.replace(/\uFEFF/g, "");
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1).trim();
  }
  return s;
}

/**
 * @param {Buffer} rawBodyBuffer
 * @param {string|undefined} signatureHeader X-Signature from Lemon Squeezy
 * @param {string} secret LEMON_SQUEEZY_WEBHOOK_SECRET
 * @returns {boolean}
 */
function verifyWebhookSignature(rawBodyBuffer, signatureHeader, secret) {
  if (!secret || !signatureHeader || !rawBodyBuffer || !Buffer.isBuffer(rawBodyBuffer)) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBodyBuffer).digest("hex");
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
 * @param {object} opts
 * @param {string} opts.apiKey
 * @param {string} opts.storeId
 * @param {string} opts.variantId
 * @param {string} [opts.userId] — oturum kullanıcı id (Supabase); sessionUserId ile aynı
 * @param {string} [opts.sessionUserId] — session.user.id
 * @param {string} [opts.email] — geriye dönük; sessionEmail yoksa kullanılır
 * @param {string} [opts.sessionEmail] — session.user.email (ödeme formu ön doldurma)
 * @param {string} [opts.prefillName] — checkout_data.name (isteğe bağlı)
 * @param {string} [opts.redirectUrl]
 * @param {string} [opts.planId] — webhook'ta meta.custom_data.plan_id olarak döner
 * @returns {Promise<{ checkoutUrl: string }>}
 */
async function createCheckout(opts) {
  const apiKey = String(opts.apiKey || "").trim();
  const storeId = normalizeLemonRelationshipId(opts.storeId);
  const variantId = normalizeLemonRelationshipId(opts.variantId);
  if (!apiKey || !storeId || !variantId) {
    throw new Error("Lemon Squeezy: API anahtarı, mağaza ve variant ID gerekli");
  }

  const sessionUserId = String(opts.sessionUserId ?? opts.userId ?? "").trim();
  const sessionEmail = String(opts.sessionEmail ?? opts.email ?? "").trim();
  const prefillName = String(opts.prefillName || "").trim();

  const custom = {
    user_id: sessionUserId,
    userId: sessionUserId,
  };
  const planId = String(opts.planId || "").trim();
  if (planId) custom.plan_id = planId;

  const checkoutData = {
    email: sessionEmail || undefined,
    custom,
  };
  if (prefillName) checkoutData.name = prefillName;

  const attributes = {
    checkout_data: checkoutData,
  };

  if (opts.redirectUrl && String(opts.redirectUrl).trim()) {
    attributes.product_options = { redirect_url: String(opts.redirectUrl).trim() };
  }

  // JSON:API resource identifier: type + id (id daima string; Lemon örnekleri "1", "123" formatında)
  const body = {
    data: {
      type: "checkouts",
      attributes,
      relationships: {
        store: { data: { type: "stores", id: String(storeId) } },
        variant: { data: { type: "variants", id: String(variantId) } },
      },
    },
  };

  const res = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
    method: "POST",
    headers: {
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
      Authorization: "Bearer " + apiKey,
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch (_) {
    json = null;
  }

  if (!res.ok) {
    const msg =
      (json && json.errors && json.errors[0] && json.errors[0].detail) ||
      (json && json.errors && json.errors[0] && json.errors[0].title) ||
      text.slice(0, 300) ||
      res.statusText;
    const err = new Error("Lemon Squeezy checkout failed: " + msg);
    err.lemonStatus = res.status;
    err.lemonBody = text.slice(0, 800);
    throw err;
  }

  const url = json && json.data && json.data.attributes && json.data.attributes.url;
  if (!url || typeof url !== "string") {
    throw new Error("Lemon Squeezy: yanıtta checkout URL yok");
  }

  return { checkoutUrl: url };
}

/**
 * @param {object} body Parsed JSON webhook body
 */
function summarizeWebhook(body) {
  const meta = body && body.meta ? body.meta : {};
  const data = body && body.data ? body.data : {};
  const attrs = data.attributes && typeof data.attributes === "object" ? data.attributes : {};
  const eventName = meta.event_name || "";
  const rawCustom = meta.custom_data;
  const custom =
    rawCustom != null &&
    typeof rawCustom === "object" &&
    !Array.isArray(rawCustom)
      ? rawCustom
      : {};
  const customUserId =
    custom.user_id != null && String(custom.user_id).trim() !== ""
      ? String(custom.user_id).trim()
      : custom.userId != null && String(custom.userId).trim() !== ""
        ? String(custom.userId).trim()
        : null;
  const customPlanId = custom.plan_id != null ? String(custom.plan_id).trim() : null;

  const userEmailRaw =
    attrs.user_email ||
    attrs.email ||
    attrs.customer_email ||
    (attrs.customer && attrs.customer.email) ||
    null;

  const status = attrs.status != null ? String(attrs.status) : null;

  return {
    eventName,
    resourceType: data.type || "",
    resourceId: data.id != null ? String(data.id) : null,
    customUserId,
    customPlanId,
    userEmail: userEmailRaw ? String(userEmailRaw).trim().toLowerCase() : null,
    status: status ? status.toLowerCase() : null,
  };
}

module.exports = {
  verifyWebhookSignature,
  createCheckout,
  summarizeWebhook,
  normalizeLemonRelationshipId,
};
