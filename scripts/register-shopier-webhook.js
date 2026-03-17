#!/usr/bin/env node
/**
 * Shopier webhook'unu API üzerinden kaydeder.
 * Kullanım: SHOPIER_PAT=.env'de veya ortamda tanımlı olmalı.
 *   node scripts/register-shopier-webhook.js
 */

require("dotenv").config();

const WEBHOOK_URL = "https://snapsell.website/api/shopier-webhook";
const SHOPIER_WEBHOOKS_API = "https://api.shopier.com/v1/webhooks";

async function registerWebhook() {
  const pat = process.env.SHOPIER_PAT;
  if (!pat || typeof pat !== "string" || !pat.trim()) {
    console.error("Hata: SHOPIER_PAT ortam değişkeni tanımlı değil. .env dosyasına ekleyin.");
    process.exit(1);
  }

  const res = await fetch(SHOPIER_WEBHOOKS_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${pat.trim()}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      url: WEBHOOK_URL,
      events: ["order.created"]
    })
  });

  const data = await res.json().catch(() => ({}));
  console.log("Webhook sonucu:", data);

  if (!res.ok) {
    console.error("HTTP", res.status, res.statusText);
    process.exit(1);
  }
}

registerWebhook();
