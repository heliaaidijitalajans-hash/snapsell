/**
 * Server-side Helia Suite proxy (CommonJS for server.js).
 * Secrets stay in process.env — never returned to clients.
 *
 * Required: HELIA_API_KEY, HELIA_BASE_URL
 * Optional: HELIA_CHAT_PATH (default for heliasuit.com: /api/brain/ask)
 * Optional: HELIA_MODEL (OpenAI-compatible providers only)
 * Optional: HELIA_HANDLE (legacy Helvia Events API only)
 */

function getHeliaEnv() {
  const apiKey = (process.env.HELIA_API_KEY || "").trim();
  const baseUrl = (process.env.HELIA_BASE_URL || "").trim();
  const handle = (process.env.HELIA_HANDLE || process.env.HELIA_AGENT_HANDLE || "").trim();
  const model = (process.env.HELIA_MODEL || "").trim() || "default";
  const chatPath = (process.env.HELIA_CHAT_PATH || "").trim();
  return { apiKey, baseUrl, handle, model, chatPath };
}

function isHeliaConfigured() {
  const { apiKey, baseUrl } = getHeliaEnv();
  return Boolean(apiKey && baseUrl);
}

function stripTrailingSlash(url) {
  return String(url || "").trim().replace(/\/+$/, "");
}

function isHeliaSuitHost(url) {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host === "heliasuit.com" || host === "www.heliasuit.com" || host.endsWith(".heliasuit.com");
  } catch {
    return /heliasuit\.com/i.test(String(url || ""));
  }
}

/**
 * Helvia events URL when HELIA_HANDLE is set.
 * @param {string} baseUrl
 */
function resolveHelviaEventsUrl(baseUrl) {
  const raw = stripTrailingSlash(baseUrl);
  if (!raw) return null;
  if (/\/api\/events$/i.test(raw) || /\/events$/i.test(raw)) return raw;
  return raw + "/api/events";
}

/**
 * Resolve the chat POST URL.
 * Helia Suite (heliasuit.com): same-origin /api/brain/ask
 * Otherwise: OpenAI-compatible /v1/chat/completions
 * @param {string} baseUrl
 * @param {{ chatPath?: string, handle?: string }} [opts]
 */
function resolveChatUrl(baseUrl, opts) {
  const raw = stripTrailingSlash(baseUrl);
  if (!raw) return null;

  const chatPath = (opts && opts.chatPath) || "";
  if (chatPath) {
    if (/^https?:\/\//i.test(chatPath)) return chatPath;
    const path = chatPath.startsWith("/") ? chatPath : "/" + chatPath;
    return raw.replace(/\/api$/i, "") + path;
  }

  // Already a full chat/ask endpoint
  if (/\/(brain\/ask|chat\/completions|api\/events|events)$/i.test(raw)) return raw;

  if (opts && opts.handle) return resolveHelviaEventsUrl(raw);

  // Helia Suite Cloud — public API lives on www.heliasuit.com (NOT api.heliasuit.com)
  if (isHeliaSuitHost(raw)) {
    const origin = raw.replace(/\/api$/i, "");
    return origin + "/api/brain/ask";
  }

  if (/\/v1$/i.test(raw)) return raw + "/chat/completions";
  if (/\/api$/i.test(raw)) return raw + "/v1/chat/completions";
  return raw + "/v1/chat/completions";
}

/** @deprecated */
function resolveChatCompletionsUrl(baseUrl) {
  return resolveChatUrl(baseUrl, {});
}

function resolveHeliaChatUrl(baseUrl) {
  return resolveChatCompletionsUrl(baseUrl);
}

/**
 * @param {unknown} data
 * @returns {string}
 */
function extractHeliaReply(data) {
  if (data == null) return "";
  if (typeof data === "string") return data.trim();
  if (typeof data !== "object") return String(data);

  const obj = /** @type {Record<string, unknown>} */ (data);

  for (const key of ["reply", "text", "content", "response", "answer", "output", "result"]) {
    if (typeof obj[key] === "string" && obj[key].trim()) return obj[key].trim();
  }

  // Helia Suite: { ok: true, data: { ... } }
  if (obj.data != null && obj.data !== data) {
    const nested = extractHeliaReply(obj.data);
    if (nested) return nested;
  }

  if (Array.isArray(obj.choices) && obj.choices[0]) {
    const choice = /** @type {Record<string, unknown>} */ (obj.choices[0]);
    const msg =
      choice.message && typeof choice.message === "object"
        ? /** @type {Record<string, unknown>} */ (choice.message)
        : null;
    if (msg && typeof msg.content === "string" && msg.content.trim()) return msg.content.trim();
    if (typeof choice.text === "string" && choice.text.trim()) return choice.text.trim();
  }

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
  if (typeof obj.message === "string" && obj.message.trim()) return obj.message.trim();

  return "";
}

function buildRequestBody(message, env) {
  if (env.handle) {
    return {
      handle: env.handle,
      message: { text: message },
      sender: { id: "snapsell-admin" },
      timestamp: Date.now(),
    };
  }

  // Helia Suite Brain ask
  if (isHeliaSuitHost(env.baseUrl) || /brain\/ask/i.test(String(env.chatPath || ""))) {
    return {
      message: message,
      prompt: message,
      query: message,
    };
  }

  // OpenAI-compatible
  return {
    model: env.model,
    messages: [{ role: "user", content: message }],
  };
}

/**
 * @param {{ message: string, senderId?: string, language?: string }} input
 * @param {{ timeoutMs?: number }} [opts]
 */
async function callHeliaChat(input, opts) {
  const env = getHeliaEnv();
  if (!env.apiKey || !env.baseUrl) {
    const err = new Error("Helia is not configured on the server.");
    err.code = "HELIA_NOT_CONFIGURED";
    err.status = 503;
    throw err;
  }

  // Common misconfig: api.heliasuit.com does not exist (DNS) → long 504s
  if (/^https?:\/\/api\.heliasuit\.com/i.test(env.baseUrl)) {
    const err = new Error(
      "Invalid HELIA_BASE_URL. Use https://www.heliasuit.com (not api.heliasuit.com)."
    );
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

  const url = resolveChatUrl(env.baseUrl, { chatPath: env.chatPath, handle: env.handle });
  if (!url) {
    const err = new Error("Invalid HELIA_BASE_URL.");
    err.code = "HELIA_BAD_CONFIG";
    err.status = 503;
    throw err;
  }

  const body = buildRequestBody(message, env);
  if (env.handle && input.language) body.language = String(input.language);
  if (input.senderId && body.sender) body.sender.id = String(input.senderId).slice(0, 128);

  const timeoutMs = (opts && opts.timeoutMs) || 45000;
  let res;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + env.apiKey,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (e) {
    const name = e && e.name;
    const code = e && e.cause && e.cause.code;
    const dns = code === "ENOTFOUND" || code === "EAI_AGAIN";
    const timedOut = name === "TimeoutError" || name === "AbortError";
    const err = new Error(
      dns
        ? "Could not resolve Helia host. Set HELIA_BASE_URL=https://www.heliasuit.com"
        : timedOut
          ? "Helia request timed out. Please try again."
          : "Could not reach Helia. Please try again."
    );
    err.code = dns ? "HELIA_BAD_CONFIG" : timedOut ? "HELIA_TIMEOUT" : "HELIA_NETWORK";
    err.status = dns ? 503 : 504;
    throw err;
  }

  let data = null;
  const rawText = await res.text().catch(function () {
    return "";
  });
  try {
    data = rawText ? JSON.parse(rawText) : null;
  } catch {
    data = null;
  }

  if (!res.ok) {
    const upstreamMsg =
      data && data.error && typeof data.error === "object" && typeof data.error.message === "string"
        ? data.error.message
        : data && typeof data.error === "string"
          ? data.error
          : null;
    const upstreamCode =
      data && data.error && typeof data.error === "object" && typeof data.error.code === "string"
        ? data.error.code
        : null;

    let friendly;
    if (res.status === 401 || res.status === 403 || upstreamCode === "UNAUTHORIZED") {
      friendly =
        upstreamMsg && /session|log in|login/i.test(upstreamMsg)
          ? "Helia /api/brain/ask requires a Helia Cloud login session (JWT), not a project hl_live_ API key. In Helia → API Explorer, find a Brain route whose Auth is API Key, set that path as HELIA_CHAT_PATH on Railway, or ask Helia for the external chat endpoint."
          : "Helia authentication failed. Check HELIA_API_KEY on Railway (must be accepted by the target path).";
    } else if (res.status === 404) {
      friendly = "Helia chat endpoint not found. Check HELIA_BASE_URL / HELIA_CHAT_PATH.";
    } else if (upstreamMsg && res.status < 500) {
      friendly = upstreamMsg;
    } else if (res.status >= 500) {
      friendly = "Helia is temporarily unavailable. Please try again.";
    } else {
      friendly = "Helia rejected the request.";
    }

    const err = new Error(friendly);
    err.code = upstreamCode === "UNAUTHORIZED" ? "HELIA_UNAUTHORIZED" : "HELIA_UPSTREAM";
    err.status = 502;
    err.upstreamStatus = res.status;
    console.warn("helia upstream", res.status, upstreamCode || "", url.replace(/\/\/[^/@]+@?/, "//"));
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
  resolveChatUrl,
  resolveHelviaEventsUrl,
  extractHeliaReply,
  callHeliaChat,
};
