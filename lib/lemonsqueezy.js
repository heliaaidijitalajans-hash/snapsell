/**
 * Lemon Squeezy API + webhook helpers (Node).
 * Docs: https://docs.lemonsqueezy.com/api/checkouts/create-checkout
 */

const crypto = require("crypto");

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
 * @param {string} opts.userId
 * @param {string} opts.email
 * @param {string} [opts.redirectUrl]
 * @param {string} [opts.planId] — webhook'ta meta.custom_data.plan_id olarak döner
 * @returns {Promise<{ checkoutUrl: string }>}
 */
async function createCheckout(opts) {
  const apiKey = String(opts.apiKey || "").trim();
  const storeId = String(opts.storeId || "").trim();
  const variantId = String(opts.variantId || "").trim();
  if (!apiKey || !storeId || !variantId) {
    throw new Error("Lemon Squeezy: API anahtarı, mağaza ve variant ID gerekli");
  }

  const custom = {
    user_id: String(opts.userId || "").trim(),
  };
  const planId = String(opts.planId || "").trim();
  if (planId) custom.plan_id = planId;

  const attributes = {
    checkout_data: {
      email: String(opts.email || "").trim() || undefined,
      custom,
    },
  };

  if (opts.redirectUrl && String(opts.redirectUrl).trim()) {
    attributes.product_options = { redirect_url: String(opts.redirectUrl).trim() };
  }

  const body = {
    data: {
      type: "checkouts",
      attributes,
      relationships: {
        store: { data: { type: "stores", id: storeId } },
        variant: { data: { type: "variants", id: variantId } },
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
    throw new Error("Lemon Squeezy checkout failed: " + msg);
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
  const custom = meta.custom_data && typeof meta.custom_data === "object" ? meta.custom_data : {};
  const customUserId = custom.user_id != null ? String(custom.user_id) : null;
  const customPlanId = custom.plan_id != null ? String(custom.plan_id).trim() : null;

  const userEmail =
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
    userEmail: userEmail ? String(userEmail).trim() : null,
    status: status ? status.toLowerCase() : null,
  };
}

module.exports = {
  verifyWebhookSignature,
  createCheckout,
  summarizeWebhook,
};
