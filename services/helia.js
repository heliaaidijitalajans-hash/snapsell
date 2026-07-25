/**
 * Helia AI client (browser) — talks only to SnapSell Railway proxy.
 *
 * Architecture:
 *   admin.html → POST /api/admin/helia/chat → Railway (HELIA_API_KEY) → Helia
 *
 * The Helia API key must NEVER be set here or passed from the frontend.
 */

/**
 * @typedef {Object} HeliaClientConfig
 * @property {string} [proxyBase] - SnapSell API origin (default: same origin). No secrets.
 * @property {number} [timeoutMs] - Client request timeout (default 50000).
 * @property {number} [retries] - Retries on temporary failures (default 2).
 */

/**
 * @typedef {Object} HeliaChatOptions
 * @property {string} [senderId]
 * @property {string} [language]
 * @property {AbortSignal} [signal]
 */

const DEFAULT_TIMEOUT_MS = 50000;
const DEFAULT_RETRIES = 2;

class HeliaClient {
  /**
   * @param {HeliaClientConfig} [config]
   */
  constructor(config = {}) {
    /** @type {string} Public SnapSell API base only — never a Helia secret URL with embedded keys. */
    this.proxyBase = (config.proxyBase || "").replace(/\/+$/, "");
    this.timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.retries = config.retries ?? DEFAULT_RETRIES;
  }

  /**
   * @deprecated Secrets must live on Railway. No-op kept for API compatibility.
   * @param {string} _key
   * @returns {this}
   */
  setApiKey(_key) {
    void _key;
    return this;
  }

  /**
   * Set SnapSell proxy origin (e.g. empty for same-origin /api).
   * @param {string} url
   * @returns {this}
   */
  setBaseUrl(url) {
    this.proxyBase = String(url || "").replace(/\/+$/, "");
    return this;
  }

  /**
   * Low-level call to SnapSell admin Helia proxy (not Helia directly).
   *
   * @param {string} endpoint - Path under /api/admin/helia (e.g. "/chat")
   * @param {Record<string, unknown>} [body]
   * @param {{ method?: string, signal?: AbortSignal, retries?: number }} [opts]
   * @returns {Promise<unknown>}
   */
  async request(endpoint, body = {}, opts = {}) {
    const path = endpoint.startsWith("/") ? endpoint : "/" + endpoint;
    const url = this.proxyBase + "/api/admin/helia" + path;
    const method = (opts.method || "POST").toUpperCase();
    const retries = opts.retries != null ? opts.retries : this.retries;

    let lastError = null;
    for (let attempt = 0; attempt <= retries; attempt++) {
      const controller = new AbortController();
      const external = opts.signal;
      const onAbort = () => controller.abort();
      if (external) {
        if (external.aborted) controller.abort();
        else external.addEventListener("abort", onAbort, { once: true });
      }
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);

      try {
        const res = await fetch(url, {
          method,
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: method === "GET" || method === "HEAD" ? undefined : JSON.stringify(body || {}),
          signal: controller.signal,
        });

        clearTimeout(timer);
        if (external) external.removeEventListener("abort", onAbort);

        let data = null;
        try {
          data = await res.json();
        } catch {
          data = null;
        }

        if (res.status === 401 || res.status === 403) {
          const err = new Error((data && data.error) || "Oturum gerekli. Tekrar giriş yapın.");
          err.code = "UNAUTHORIZED";
          err.status = res.status;
          throw err;
        }

        if (!res.ok) {
          const temporary = res.status === 408 || res.status === 429 || res.status >= 500;
          const err = new Error((data && data.error) || "Helia isteği başarısız oldu.");
          err.code = (data && data.code) || "HELIA_ERROR";
          err.status = res.status;
          err.temporary = temporary;
          if (temporary && attempt < retries) {
            lastError = err;
            await sleep(400 * (attempt + 1));
            continue;
          }
          throw err;
        }

        return data;
      } catch (e) {
        clearTimeout(timer);
        if (external) external.removeEventListener("abort", onAbort);

        if (e && (e.code === "UNAUTHORIZED" || e.status === 401 || e.status === 403)) throw e;
        if (e && e.temporary === false) throw e;

        const aborted = e && (e.name === "AbortError" || e.code === "HELIA_TIMEOUT");
        const network = e && !e.status;
        const err = aborted
          ? Object.assign(new Error("İstek zaman aşımına uğradı. Lütfen tekrar deneyin."), {
              code: "HELIA_TIMEOUT",
              temporary: true,
            })
          : e && e.message
            ? e
            : Object.assign(new Error("Bağlantı hatası. Lütfen tekrar deneyin."), {
                code: "HELIA_NETWORK",
                temporary: true,
              });

        if ((aborted || network || err.temporary) && attempt < retries) {
          lastError = err;
          await sleep(400 * (attempt + 1));
          continue;
        }
        throw err;
      }
    }
    throw lastError || new Error("Helia isteği başarısız oldu.");
  }

  /**
   * @param {string} message
   * @param {HeliaChatOptions} [options]
   * @returns {Promise<{ reply: string }>}
   */
  async chat(message, options = {}) {
    const text = String(message || "").trim();
    if (!text) {
      const err = new Error("Mesaj boş olamaz.");
      err.code = "HELIA_BAD_REQUEST";
      throw err;
    }
    const data = await this.request("/chat", {
      message: text,
      senderId: options.senderId,
      language: options.language,
    }, { signal: options.signal });

    const reply =
      (data && typeof data.reply === "string" && data.reply) ||
      (data && typeof data.text === "string" && data.text) ||
      "";
    if (!reply) {
      const err = new Error("Helia boş yanıt döndürdü.");
      err.code = "HELIA_EMPTY";
      throw err;
    }
    return { reply };
  }

  /**
   * Server-reported config status (never includes secrets).
   * @returns {Promise<{ configured: boolean }>}
   */
  async health() {
    const data = await this.request("/status", {}, { method: "GET", retries: 1 });
    return {
      configured: Boolean(data && data.configured),
      hasApiKey: Boolean(data && data.hasApiKey),
      hasBaseUrl: Boolean(data && data.hasBaseUrl),
      hasHandle: Boolean(data && data.hasHandle),
    };
  }

  /**
   * Same as health() — key validation is server-side only.
   * @returns {Promise<{ configured: boolean }>}
   */
  async validateKey() {
    return this.health();
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default HeliaClient;
