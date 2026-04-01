/**
 * Lemon Squeezy API + webhook helpers (Node).
 * Docs: https://docs.lemonsqueezy.com/api/checkouts/create-checkout
 *
 * Üretim entegrasyonu: canlı API anahtarı ve canlı mağaza (variant.test_mode === false).
 * API tabanı: https://api.lemonsqueezy.com/v1/…
 */

const crypto = require("crypto");

/** Tek resmi API kökü — Bearer ile canlı (live) API anahtarı kullanın. */
const LEMON_API_BASE = "https://api.lemonsqueezy.com/v1";

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
 * Tam anahtarı loglamayın; yalnızca yapılandırılmış olduğunu ve canlı anahtar beklentisini belirtir.
 * @param {string} apiKey
 * @returns {string}
 */
function formatLemonApiKeyForLog(apiKey) {
  const k = String(apiKey || "").trim();
  if (!k) return "(empty)";
  const lower = k.toLowerCase();
  if (lower.startsWith("sk_live_") || lower.startsWith("lem_live_")) return "live API key (redacted)";
  return "API key set (redacted — use live key from Lemon Developers → API Keys)";
}

/**
 * GET /v1/variants/:id — checkout öncesi doğrulama. Test modundaki variant’lar reddedilir.
 * @returns {Promise<{ ok: true, storeId: string } | { ok: false, status: number, detail: string }>}
 */
async function fetchVariantMeta(apiKey, variantId) {
  const key = String(apiKey || "").trim();
  const vid = normalizeLemonRelationshipId(variantId);
  if (!key || !vid) {
    return { ok: false, status: 0, detail: "API anahtarı veya variant ID eksik" };
  }
  const res = await fetch(LEMON_API_BASE + "/variants/" + encodeURIComponent(vid), {
    method: "GET",
    headers: {
      Accept: "application/vnd.api+json",
      Authorization: "Bearer " + key
    }
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch (_) {
    json = null;
  }
  if (!res.ok) {
    const detail =
      (json && json.errors && json.errors[0] && json.errors[0].detail) ||
      (json && json.errors && json.errors[0] && json.errors[0].title) ||
      text.slice(0, 400) ||
      res.statusText;
    return { ok: false, status: res.status, detail };
  }
  const storeRel = json && json.data && json.data.relationships && json.data.relationships.store;
  const storeData = storeRel && storeRel.data;
  const sid = storeData && storeData.id != null ? String(storeData.id) : null;
  if (!sid) {
    return { ok: false, status: 500, detail: "Lemon variant yanıtında store ilişkisi yok" };
  }
  const attrs = json && json.data && json.data.attributes;
  if (attrs && attrs.test_mode === true) {
    return {
      ok: false,
      status: 400,
      detail: "Variant Lemon test modunda; üretim yalnızca canlı (live) variant kabul eder."
    };
  }
  return { ok: true, storeId: sid };
}

/**
 * @param {object} opts
 * @param {string} opts.apiKey
 * @param {string} opts.storeId
 * @param {string} opts.variantId
 * @param {string} opts.sessionUserId — session.user.id (zorunlu)
 * @param {string} opts.sessionEmail — session.user.email (zorunlu; checkout_data.email yalnızca bu)
 * @param {string} [opts.prefillName] — checkout_data.name (isteğe bağlı)
 * @param {string} [opts.redirectUrl]
 * @param {string} [opts.planId] — webhook'ta meta.custom_data.plan_id olarak döner
 * @returns {Promise<{ checkoutUrl: string }>}
 */
async function createCheckoutOnce(opts) {
  const apiKey = String(opts.apiKey || "").trim();
  const storeId = normalizeLemonRelationshipId(opts.storeId);
  const variantId = normalizeLemonRelationshipId(opts.variantId);
  if (!apiKey || !storeId || !variantId) {
    throw new Error("Lemon Squeezy: API anahtarı, mağaza ve variant ID gerekli");
  }

  const sessionUserId = String(opts.sessionUserId || "").trim();
  const sessionEmail = String(opts.sessionEmail || "").trim();
  if (!sessionUserId) {
    throw new Error("Lemon Squeezy: sessionUserId (session.user.id) gerekli");
  }
  if (!sessionEmail) {
    throw new Error("Lemon Squeezy: sessionEmail (session.user.email) gerekli");
  }
  const prefillName = String(opts.prefillName || "").trim();

  const custom = {
    user_id: sessionUserId,
    userId: sessionUserId,
  };
  const planId = String(opts.planId || "").trim();
  if (planId) custom.plan_id = planId;

  const checkoutData = {
    email: sessionEmail,
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

  const res = await fetch(LEMON_API_BASE + "/checkouts", {
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
 * Checkout oluşturur; 429/502/503 için kısa yeniden deneme (rate limit / geçici Lemon hatası).
 */
async function createCheckout(opts) {
  const maxAttempts = 3;
  let lastErr;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await createCheckoutOnce(opts);
    } catch (err) {
      lastErr = err;
      const s = err && typeof err.lemonStatus === "number" ? err.lemonStatus : null;
      const retryable = s === 429 || s === 503 || s === 502;
      if (!retryable || attempt === maxAttempts) throw err;
      const delay = 400 * attempt;
      await new Promise(function (r) {
        setTimeout(r, delay);
      });
    }
  }
  throw lastErr;
}

/**
 * Lemon webhook gövdesinden olası tüm müşteri e-postaları (sıra korunur, tekrarsız, küçük harf).
 * @param {object} body
 * @returns {string[]}
 */
function collectWebhookEmailsFromBody(body) {
  const emails = [];
  function push(val) {
    if (val == null) return;
    const s = String(val).trim().toLowerCase();
    if (!s.includes("@")) return;
    if (emails.indexOf(s) === -1) emails.push(s);
  }

  const meta = body && body.meta ? body.meta : {};
  const data = body && body.data ? body.data : {};
  const attrs = data.attributes && typeof data.attributes === "object" ? data.attributes : {};

  push(attrs.user_email);
  push(attrs.email);
  push(attrs.customer_email);
  if (attrs.customer && typeof attrs.customer === "object") {
    push(attrs.customer.email);
  }

  const ch = attrs.checkout_data;
  if (ch && typeof ch === "object" && !Array.isArray(ch)) {
    push(ch.email);
  } else if (typeof ch === "string" && ch.trim()) {
    try {
      const parsed = JSON.parse(ch);
      if (parsed && typeof parsed === "object") push(parsed.email);
    } catch (_) {}
  }

  const rawCustom = meta.custom_data;
  if (rawCustom != null && typeof rawCustom === "object" && !Array.isArray(rawCustom)) {
    push(rawCustom.user_email);
    push(rawCustom.email);
  }

  if (Array.isArray(body.included)) {
    for (let i = 0; i < body.included.length; i++) {
      const inc = body.included[i];
      const a = inc && inc.attributes;
      if (a && typeof a === "object") {
        push(a.user_email);
        push(a.email);
        push(a.customer_email);
        if (a.customer && typeof a.customer === "object") push(a.customer.email);
      }
    }
  }

  return emails;
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

  const userEmails = collectWebhookEmailsFromBody(body);
  const userEmail = userEmails.length > 0 ? userEmails[0] : null;

  const status = attrs.status != null ? String(attrs.status) : null;

  return {
    eventName,
    resourceType: data.type || "",
    resourceId: data.id != null ? String(data.id) : null,
    customUserId,
    customPlanId,
    userEmail,
    userEmails,
    status: status ? status.toLowerCase() : null,
  };
}

module.exports = {
  verifyWebhookSignature,
  createCheckout,
  createCheckoutOnce,
  fetchVariantMeta,
  formatLemonApiKeyForLog,
  summarizeWebhook,
  collectWebhookEmailsFromBody,
  normalizeLemonRelationshipId,
};
