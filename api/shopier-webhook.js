/**
 * Shopier webhook – Vercel serverless.
 * POST from Shopier with order_id, product_name, buyer_email, total_price.
 * Finds user in Firestore by buyer_email and activates plan or adds credits.
 * Requires FIREBASE_SERVICE_ACCOUNT_JSON in Vercel env (Firebase Admin with Firestore).
 */

const USERS_COLLECTION = "users";
const CREDIT_PACK_CREDITS = 250;
/** Yıllık planda her ay yüklenecek dönüşüm (kredi) sayısı. */
const YEARLY_PLAN_MONTHLY_CREDITS = 100;
/** Ek paket (25 dönüşüm) sadece bu planlara açık; free plan ek paket alamaz. */
const ADDON_ALLOWED_PLANS = ["starter", "pro_monthly", "pro_yearly"];

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

/** Map product_name to plan key or "add_credits". */
function resolveProduct(productName) {
  const name = String(productName || "").toLowerCase();
  if (name.includes("credit pack")) return "add_credits";
  if (name.includes("starter plan") || name.includes("starter")) return "starter";
  if (name.includes("pro plan monthly") || name.includes("pro monthly")) return "pro_monthly";
  if (name.includes("pro plan yearly") || name.includes("pro yearly")) return "pro_yearly";
  return null;
}

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  console.log("Shopier webhook received");

  let body;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
  } catch {
    return res.status(400).json({ success: false, error: "Invalid JSON body" });
  }

  const order_id = body.order_id ?? body.orderId ?? body.platform_order_id ?? body.id;
  const product_name = body.product_name ?? body.productName ?? body.title ?? "";
  const buyer_email = (body.buyer_email ?? body.buyerEmail ?? body.email ?? "").trim();
  const total_price = body.total_price ?? body.totalPrice ?? body.total_order_value ?? body.amount ?? 0;

  if (!buyer_email) {
    console.warn("[Shopier webhook] missing buyer_email");
    return res.status(200).json({ success: true });
  }

  let db;
  try {
    db = getFirestore();
  } catch (e) {
    console.error("[Shopier webhook] Firebase init:", e.message);
    return res.status(500).json({ success: false, error: "Server configuration error" });
  }

  const emailNorm = buyer_email.toLowerCase();
  const usersRef = db.collection(USERS_COLLECTION);
  const snapshot = await usersRef.where("email", "==", emailNorm).limit(1).get();

  if (snapshot.empty) {
    console.warn("[Shopier webhook] user not found for email:", buyer_email);
    return res.status(200).json({ success: true });
  }

  const doc = snapshot.docs[0];
  const userId = doc.id;
  const userData = doc.data();
  const now = new Date();
  const nowIso = now.toISOString();

  const action = resolveProduct(product_name);

  if (action === "add_credits") {
    const currentPlan = (userData.plan || "free").toLowerCase();
    if (!ADDON_ALLOWED_PLANS.includes(currentPlan)) {
      console.warn("[Shopier webhook] ek paket sadece aylık/yıllık plana açık; kullanıcı planı:", currentPlan, "userId:", userId);
      return res.status(200).json({ success: true });
    }
    const currentCredits = Number(userData.credits) || 0;
    const newCredits = currentCredits + CREDIT_PACK_CREDITS;
    await doc.ref.update({
      credits: newCredits,
      updatedAt: nowIso
    });
    console.log("[Shopier webhook] credits added", CREDIT_PACK_CREDITS, "userId:", userId, "plan:", currentPlan);
    return res.status(200).json({ success: true });
  }

  if (!action) {
    console.warn("[Shopier webhook] unknown product_name:", product_name);
    return res.status(200).json({ success: true });
  }

  let subscription_end = null;
  if (action === "starter" || action === "pro_monthly") {
    const end = new Date(now);
    end.setMonth(end.getMonth() + 1);
    subscription_end = end.toISOString();
  } else if (action === "pro_yearly") {
    const end = new Date(now);
    end.setFullYear(end.getFullYear() + 1);
    subscription_end = end.toISOString();
  }

  const updateData = {
    plan: action,
    subscription_start: nowIso,
    updatedAt: nowIso
  };
  if (subscription_end) {
    updateData.subscription_end = subscription_end;
  }

  // Yıllık planda: tek seferde 1200 değil, ilk ay 100 kredi + aylık refill için alanlar
  if (action === "pro_yearly") {
    const nextRefill = new Date(now);
    nextRefill.setMonth(nextRefill.getMonth() + 1);
    updateData.credits = YEARLY_PLAN_MONTHLY_CREDITS;
    updateData.next_refill_at = nextRefill.toISOString();
    updateData.months_refilled = 1;
  }

  await doc.ref.update(updateData);
  console.log("[Shopier webhook] user updated:", {
    userId,
    plan: action,
    subscription_start: nowIso,
    subscription_end,
    ...(action === "pro_yearly" && {
      credits: YEARLY_PLAN_MONTHLY_CREDITS,
      next_refill_at: updateData.next_refill_at,
      months_refilled: 1
    })
  });

  return res.status(200).json({ success: true });
}
