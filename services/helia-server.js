/**
 * Server-side Helia/Helvia proxy helpers (CommonJS for server.js).
 * Secrets stay in process.env — never returned to clients.
 */

function getHeliaEnv() {
  const apiKey = (process.env.HELIA_API_KEY || process.env.HELVIA_API_KEY || "").trim();
  const baseUrl = (process.env.HELIA_BASE_URL || process.env.HELVIA_BASE_URL || "").trim();
  const handle = (process.env.HELIA_HANDLE || process.env.HELVIA_HANDLE || process.env.HELIA_AGENT_HANDLE || "").trim();
  return { apiKey, baseUrl, handle };
}

function isHeliaConfigured() {
  const { apiKey, baseUrl } = getHeliaEnv();
  return Boolean(apiKey && baseUrl);
}

/**
 * Build upstream URL from HELIA_BASE_URL.
 * Accepts full events URL or API root (e.g. https://bot-v5.helvia.ai).
 */
function resolveHeliaChatUrl(baseUrl) {
  const raw = String(baseUrl || "").trim().replace(/\/+$/, "");
  if (!raw) return null;
  if (/\/api\/events$/i.test(raw) || /\/events$/i.test(raw)) return raw;
  return raw + "/api/events";
}

/**
 * Pull assistant text from common Helia/Helvia response shapes.
 * @param {unknown} data
 * @returns {string}
 */
function extractHeliaReply(data) {
  if (data == null) return "";
  if (typeof data === "string") return data.trim();
  if (typeof data !== "object") return String(data);

  const obj = /** @type {Record<string, unknown>} */ (data);

  for (const key of ["reply", "text", "content", "response", "answer", "output"]) {
    if (typeof obj[key] === "string" && obj[key].trim()) return obj[key].trim();
  }

  if (Array.isArray(obj.messages)) {
    const parts = obj.messages
      .map(function (m) {
        if (!m) return "";
        if (typeof m === "string") return m;
        if (typeof m === "object") {
          const mm = /** @type {Record<string, unknown>} */ (m);
          if (typeof mm.text === "string") return mm.text;
          if (typeof mm.content === "string") return mm.content;
          if (typeof mm.message === "string") return mm.message;
          if (mm.message && typeof mm.message === "object" && typeof /** @type {any} */ (mm.message).text === "string") {
            return /** @type {any} */ (mm.message).text;
          }
        }
        return "";
      })
      .filter(Boolean);
    if (parts.length) return parts.join("\n\n").trim();
  }

  if (obj.message && typeof obj.message === "object") {
    const msg = /** @type {Record<string, unknown>} */ (obj.message);
    if (typeof msg.text === "string") return msg.text.trim();
  }

  if (obj.data != null && obj.data !== data) {
    const nested = extractHeliaReply(obj.data);
    if (nested) return nested;
  }

  return "";
}

/**
 * Call Helia platform with server-side credentials.
 * @param {{ message: string, senderId?: string, language?: string }} input
 * @param {{ timeoutMs?: number }} [opts]
 */
async function callHeliaChat(input, opts) {
  const { apiKey, baseUrl, handle } = getHeliaEnv();
  if (!apiKey || !baseUrl) {
    const err = new Error("Helia is not configured on the server.");
    err.code = "HELIA_NOT_CONFIGURED";
    err.status = 503;
    throw err;
  }

  const url = resolveHeliaChatUrl(baseUrl);
  if (!url) {
    const err = new Error("Invalid HELIA_BASE_URL.");
    err.code = "HELIA_BAD_CONFIG";
    err.status = 503;
    throw err;
  }

  const message = String(input.message || "").trim();
  if (!message) {
    const err = new Error("Message is required.");
    err.code = "HELIA_BAD_REQUEST";
    err.status = 400;
    throw err;
  }

  if (!handle) {
    const err = new Error("HELIA_HANDLE is not configured on the server.");
    err.code = "HELIA_NOT_CONFIGURED";
    err.status = 503;
    throw err;
  }

  const timeoutMs = (opts && opts.timeoutMs) || 45000;
  const body = {
    handle: handle,
    message: { text: message },
    sender: { id: String(input.senderId || "snapsell-admin").slice(0, 128) },
    timestamp: Date.now(),
  };
  if (input.language) body.language = String(input.language);

  let res;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + apiKey,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (e) {
    const name = e && e.name;
    const err = new Error(name === "TimeoutError" || name === "AbortError"
      ? "Helia request timed out. Please try again."
      : "Could not reach Helia. Please try again.");
    err.code = name === "TimeoutError" || name === "AbortError" ? "HELIA_TIMEOUT" : "HELIA_NETWORK";
    err.status = 504;
    throw err;
  }

  let data = null;
  const rawText = await res.text().catch(function () { return ""; });
  try {
    data = rawText ? JSON.parse(rawText) : null;
  } catch {
    data = rawText ? { text: rawText } : null;
  }

  if (!res.ok) {
    // Never forward upstream bodies (may contain tokens / internals).
    const err = new Error(
      res.status === 401 || res.status === 403
        ? "Helia authentication failed. Check server configuration."
        : res.status >= 500
          ? "Helia is temporarily unavailable. Please try again."
          : "Helia rejected the request."
    );
    err.code = "HELIA_UPSTREAM";
    err.status = res.status >= 500 ? 502 : 502;
    err.upstreamStatus = res.status;
    throw err;
  }

  const reply = extractHeliaReply(data);
  if (!reply) {
    const err = new Error("Helia returned an empty response.");
    err.code = "HELIA_EMPTY";
    err.status = 502;
    throw err;
  }

  return { reply: reply };
}

module.exports = {
  getHeliaEnv,
  isHeliaConfigured,
  resolveHeliaChatUrl,
  extractHeliaReply,
  callHeliaChat,
};
