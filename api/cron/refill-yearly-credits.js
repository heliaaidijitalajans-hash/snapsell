/**
 * Vercel Cron: Yıllık plan (pro_yearly) kullanıcılarına her ay 100 kredi yükler.
 * Vercel, CRON_SECRET ile Authorization: Bearer <CRON_SECRET> gönderir.
 * Günlük çalıştırılır; next_refill_at tarihi gelmiş ve abonelik süresi dolmamış kullanıcılar güncellenir.
 *
 * Firestore: plan + next_refill_at sorgusu için bileşik indeks gerekebilir.
 * İlk çalıştırmada hata alırsanız, hata mesajındaki linkten indeksi oluşturun.
 */

const USERS_COLLECTION = "users";
const YEARLY_PLAN_MONTHLY_CREDITS = 100;
const MAX_MONTHS_REFILL = 12;

function getFirestore() {
  let admin;
  try {
    admin = require("firebase-admin");
  } catch (e) {
    throw new Error("firebase-admin not installed");
  }
  if (!admin.apps.length) {
    const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (!json || typeof json !== "string") {
      throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is not set");
    }
    const cred = JSON.parse(json);
    admin.initializeApp({ credential: admin.credential.cert(cred) });
  }
  return admin.firestore();
}

function requireCronAuth(req) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers?.authorization || req.headers?.Authorization;
  return auth === `Bearer ${secret}`;
}

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  if (!requireCronAuth(req)) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  const now = new Date();
  const nowIso = now.toISOString();

  let db;
  try {
    db = getFirestore();
  } catch (e) {
    console.error("[refill-yearly] Firebase init:", e.message);
    return res.status(500).json({ success: false, error: "Server configuration error" });
  }

  const { FieldValue } = require("firebase-admin/firestore");
  const usersRef = db.collection(USERS_COLLECTION);

  // plan = pro_yearly ve next_refill_at <= şimdi olan kullanıcılar
  const snapshot = await usersRef
    .where("plan", "==", "pro_yearly")
    .where("next_refill_at", "<=", nowIso)
    .get();

  const refilled = [];
  const errors = [];

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const nextRefillAt = data.next_refill_at ? new Date(data.next_refill_at) : null;
    const subscriptionEnd = data.subscription_end ? new Date(data.subscription_end) : null;
    const monthsRefilled = Number(data.months_refilled) || 0;

    if (monthsRefilled >= MAX_MONTHS_REFILL) continue;
    if (subscriptionEnd && subscriptionEnd <= now) continue;

    const nextRefillDate = new Date(nextRefillAt || now);
    nextRefillDate.setMonth(nextRefillDate.getMonth() + 1);

    try {
      await doc.ref.update({
        credits: FieldValue.increment(YEARLY_PLAN_MONTHLY_CREDITS),
        months_refilled: monthsRefilled + 1,
        next_refill_at: nextRefillDate.toISOString(),
        updatedAt: nowIso
      });
      refilled.push({ userId: doc.id, email: data.email || null, monthsRefilled: monthsRefilled + 1 });
    } catch (e) {
      errors.push({ userId: doc.id, error: e.message });
    }
  }

  console.log("[refill-yearly] refilled:", refilled.length, "errors:", errors.length, "ids:", refilled.map((r) => r.userId));

  return res.status(200).json({
    success: true,
    refilled: refilled.length,
    errors: errors.length,
    details: { refilled, errors }
  });
}
