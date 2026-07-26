/**
 * Server-side Helia proxy helpers (CommonJS for server.js).
 * Secrets stay in process.env — never returned to clients.
 *
 * Required env: HELIA_API_KEY, HELIA_BASE_URL
 * Optional: HELIA_HANDLE (only if upstream needs Helvia-style handle), HELIA_MODEL
 */

function getHeliaEnv() {
  const apiKey = (process.env.HELIA_API_KEY || process.env.HELVIA_API_KEY || "").trim();
  const baseUrl = (process.env.HELIA_BASE_URL || process.env.HELVIA_BASE_URL || "").trim();
  const handle = (process.env.HELIA_HANDLE || process.env.HELVIA_HANDLE || process.env.HELIA_AGENT_HANDLE || "").trim();
  const model = (process.env.HELIA_MODEL || "").trim() || "default";
  return { apiKey, baseUrl, handle, model };
}

function isHeliaConfigured() {
  const { apiKey, baseUrl } = getHeliaEnv();
  return Boolean(apiKey && baseUrl);
}

/**
 * Helvia events URL when a handle is provided.
 * @param {string} baseUrl
 */
function resolveHelviaEventsUrl(baseUrl) {
  const raw = String(baseUrl || "").trim().replace(/\/+$/, "");
  if (!raw) return null;
  if (/\/api\/events$/i.test(raw) || /\/events$/i.test(raw)) return raw;
  return raw + "/api/events";
}

/**
 * OpenAI-compatible chat completions URL (no handle required).
 * @param {string} baseUrl
 */
function resolveChatCompletionsUrl(baseUrl) {
  const raw = String(baseUrl || "").trim().replace(/\/+$/, "");
  if (!raw) return null;
  if (/chat\/completions$/i.test(raw)) return raw;
  if (/\/v1$/i.test(raw)) return raw + "/chat/completions";
  if (/\/api$/i.test(raw)) return raw + "/v1/chat/completions";
  // Full domain root → assume OpenAI-compatible /v1/chat/completions
  return raw + "/v1/chat/completions";
}

/** @deprecated use resolveChatCompletionsUrl / resolveHelviaEventsUrl */
function resolveHeliaChatUrl(baseUrl) {
  return resolveChatCompletionsUrl(baseUrl);
}

/**
 * Pull assistant text from common response shapes.
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

  // OpenAI-compatible
  if (Array.isArray(obj.choices) && obj.choices[0]) {
    const choice = /** @type {Record<string, unknown>} */ (obj.choices[0]);
    const msg = choice.message && typeof choice.message === "object"
      ? /** @type {Record<string, unknown>} */ (choice.message)
      : null;
    if (msg && typeof msg.content === "string" && msg.content.trim()) return msg.content.trim();
    if (typeof choice.text === "string" && choice.text.trim()) return choice.text.trim();
  }

  // Helvia: result.responses[].altText | options[0]
  if (obj.result && typeof obj.result === "object") {
    const result = /** @type {Record<string, unknown>} */ (obj.result);
    if (Array.isArray(result.responses)) {
      const parts = result.responses
        .map(function (r) {
          if (!r || typeof r !== "object") return "";
          const rr = /** @type {Record<string, unknown>} */ (r);
          if (typeof rr.altText === "string") return rr.altText;
          if (Array.isArray(rr.options) && typeof rr.options[0] === "string") return rr.options[0];
          if (typeof rr.text === "string") return rr.text;
          return "";
        })
        .filter(Boolean);
      if (parts.length) return parts.join("\n\n").trim();
    }
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
        }
        return "";
      })
      .filter(Boolean);
    if (parts.length) return parts.join("\n\n").trim();
  }

  if (obj.message && typeof obj.message === "object") {
    const msg = /** @type {Record<string, unknown>} */ (obj.message);
    if (typeof msg.text === "string") return msg.text.trim();
    if (typeof msg.content === "string") return msg.content.trim();
  }

  if (obj.data != null && obj.data !== data) {
    const nested = extractHeliaReply(obj.data);
    if (nested) return nested;
  }

  return "";
}

/**
 * Call Helia platform with server-side credentials.
 * - With HELIA_HANDLE → Helvia /api/events body
 * - Without handle → OpenAI-compatible /v1/chat/completions (key + base URL only)
 *
 * @param {{ message: string, senderId?: string, language?: string }} input
 * @param {{ timeoutMs?: number }} [opts]
 */
async function callHeliaChat(input, opts) {
  const { apiKey, baseUrl, handle, model } = getHeliaEnv();
  if (!apiKey || !baseUrl) {
    const err = new Error("Helia is not configured on the server.");
    err.code = "HELIA_NOT_CONFIGURED";
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

  const useHelvia = Boolean(handle);
  const url = useHelvia ? resolveHelviaEventsUrl(baseUrl) : resolveChatCompletionsUrl(baseUrl);
  if (!url) {
    const err = new Error("Invalid HELIA_BASE_URL.");
    err.code = "HELIA_BAD_CONFIG";
    err.status = 503;
    throw err;
  }

  /** @type {Record<string, unknown>} */
  let body;
  if (useHelvia) {
    body = {
      handle: handle,
      message: { text: message },
      sender: { id: String(input.senderId || "snapsell-admin").slice(0, 128) },
      timestamp: Date.now(),
    };
    if (input.language) body.language = String(input.language);
  } else {
    body = {
      model: model,
      messages: [{ role: "user", content: message }],
    };
  }

  const timeoutMs = (opts && opts.timeoutMs) || 45000;
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
    const err = new Error(
      name === "TimeoutError" || name === "AbortError"
        ? "Helia request timed out. Please try again."
        : "Could not reach Helia. Please try again."
    );
    err.code = name === "TimeoutError" || name === "AbortError" ? "HELIA_TIMEOUT" : "HELIA_NETWORK";
    err.status = 504;
    throw err;
  }

  let data = null;
  const rawText = await res.text().catch(function () {
    return "";
  });
  try {
    data = rawText ? JSON.parse(rawText) : null;
  } catch {
    data = rawText ? { text: rawText } : null;
  }

  if (!res.ok) {
    const err = new Error(
      res.status === 401 || res.status === 403
        ? "Helia authentication failed. Check server configuration."
        : res.status >= 500
          ? "Helia is temporarily unavailable. Please try again."
          : "Helia rejected the request."
    );
    err.code = "HELIA_UPSTREAM";
    err.status = 502;
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
  resolveChatCompletionsUrl,
  resolveHelviaEventsUrl,
  extractHeliaReply,
  callHeliaChat,
};
