/**
 * Shopier callback – Vercel serverless.
 * GET only. Logs query params, then redirects:
 *  - Missing required params => /pricing
 *  - Otherwise => /dashboard
 *
 * Requirement log (exact):
 *  - "↩️ Shopier callback hit"
 */

const DEFAULT_FRONTEND_BASE = "https://snapsell.website";

function getFrontendBaseUrl() {
  const v = process.env.PUBLIC_APP_URL || process.env.APP_DOMAIN || "";
  if (typeof v === "string" && v.trim()) return v.trim().replace(/\/$/, "");
  return DEFAULT_FRONTEND_BASE;
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  console.log("↩️ Shopier callback hit");
  console.log("Shopier callback query:", req.query);

  const q = (req && req.query) || {};
  const orderId = q.platform_order_id ?? q.order_id ?? q.id ?? q.orderId ?? null;
  const status = q.status ?? q.payment_status ?? q.paymentStatus ?? q.result ?? null;

  const hasOrder = orderId != null && String(orderId).trim().length > 0;
  const hasStatus = status != null && String(status).trim().length > 0;

  const frontendBase = getFrontendBaseUrl();
  const targetPath = hasOrder && hasStatus ? "/dashboard" : "/pricing";
  const targetUrl = frontendBase + targetPath;

  res.status(302).setHeader("Location", targetUrl).end();
}

