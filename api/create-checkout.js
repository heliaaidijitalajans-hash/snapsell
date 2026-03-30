/**
 * POST /api/create-checkout — Lemon Squeezy checkout.
 * checkout_data.email = yalnızca Supabase JWT içindeki session.user.email (sabit metin yok).
 * Oturum veya e-posta yoksa 4xx; istek gövdesindeki email alanı kullanılmaz.
 */
"use strict";

/**
 * @param {object} deps
 * @param {function(string): Promise<import("@supabase/supabase-js").User | null>} deps.getSupabaseAuthUserFromToken
 * @param {object} deps.lemon
 * @param {function(string): string} deps.resolveCheckoutVariantId
 */
module.exports = function createCheckoutHandlerFactory(deps) {
  const { getSupabaseAuthUserFromToken, lemon, resolveCheckoutVariantId } = deps;

  return async function handleCreateCheckout(req, res) {
    try {
      const body = req.body || {};
      const plan = String(body.plan || "").trim();
      if (!plan) {
        return res.status(400).json({ error: "plan gerekli" });
      }

      const authHeader = req.headers.authorization || "";
      if (!authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Oturum yok veya geçersiz. Önce giriş yapın." });
      }
      const accessToken = authHeader.slice(7).trim();
      if (!accessToken) {
        return res.status(401).json({ error: "Oturum yok veya geçersiz. Önce giriş yapın." });
      }

      const sessionUser = await getSupabaseAuthUserFromToken(accessToken);
      if (!sessionUser) {
        return res.status(401).json({ error: "Oturum doğrulanamadı. Yeniden giriş yapın." });
      }

      const sessionUserId = String(sessionUser.id || "").trim();
      if (!sessionUserId) {
        return res.status(400).json({ error: "Oturumda kullanıcı kimliği yok; ödeme başlatılamaz." });
      }

      const sessionEmail =
        sessionUser.email != null && sessionUser.email !== undefined
          ? String(sessionUser.email).trim()
          : "";
      if (!sessionEmail) {
        return res.status(400).json({
          error: "Oturumda e-posta yok; yanlış hesaba ödeme yapılmaması için checkout açılamıyor."
        });
      }

      const prefillName =
        (sessionUser.user_metadata &&
          (sessionUser.user_metadata.full_name || sessionUser.user_metadata.name)) ||
        "";

      const variantId = resolveCheckoutVariantId(plan);
      if (!variantId) {
        const p = String(plan || "").trim().toLowerCase();
        const known = ["monthly_plan", "monthly_plan_pro", "pro", "yearly_plan", "addon"];
        if (known.indexOf(p) === -1) {
          return res.status(400).json({
            error:
              "Geçersiz plan. İzin verilen: monthly_plan, monthly_plan_pro, pro, yearly_plan, addon."
          });
        }
        return res.status(400).json({
          error:
            "Lemon variant ID eksik veya geçersiz. monthly_plan için LEMON_SQUEEZY_VARIANT_MONTHLY_PLAN; pro / monthly_plan_pro / yearly_plan / addon için LEMON_SQUEEZY_VARIANT_PRO_PLAN kontrol edin."
        });
      }

      const apiKey = String(process.env.LEMON_SQUEEZY_API_KEY || "").trim();
      const storeId = lemon.normalizeLemonRelationshipId(process.env.LEMON_SQUEEZY_STORE_ID);
      if (!apiKey || !storeId) {
        return res.status(500).json({ error: "Lemon API yapılandırması eksik (LEMON_SQUEEZY_API_KEY / STORE_ID)" });
      }

      const base = String(process.env.PUBLIC_APP_URL || "").trim().replace(/\/$/, "");
      const redirectUrl = base ? base + "/hesap-ayarlari" : undefined;

      const { checkoutUrl } = await lemon.createCheckout({
        apiKey,
        storeId,
        variantId,
        sessionUserId,
        sessionEmail,
        prefillName: String(prefillName || "").trim() || undefined,
        redirectUrl,
        planId: plan
      });

      console.log(
        "[Lemon] create-checkout OK checkout_data.email=session.user.email userId=",
        sessionUserId,
        "email=",
        sessionEmail.toLowerCase()
      );
      res.json({ checkoutUrl });
    } catch (err) {
      const lemonStatus = err && typeof err.lemonStatus === "number" ? err.lemonStatus : null;
      console.error("[Lemon] create-checkout:", err.message, lemonStatus != null ? "(HTTP " + lemonStatus + ")" : "");
      const clientMsg = err.message || "Checkout oluşturulamadı";
      if (lemonStatus === 401 || lemonStatus === 403) {
        return res.status(502).json({
          error: "Lemon API reddetti (anahtar veya yetki). Sunucu LEMON_SQUEEZY_API_KEY / STORE_ID kontrol edin.",
          detail: clientMsg
        });
      }
      if (lemonStatus === 404 || lemonStatus === 422) {
        return res.status(400).json({ error: "Lemon geçersiz istek (variant veya mağaza ID’si yanlış olabilir).", detail: clientMsg });
      }
      if (lemonStatus != null && lemonStatus >= 400 && lemonStatus < 500) {
        return res.status(400).json({ error: clientMsg });
      }
      res.status(500).json({ error: clientMsg });
    }
  };
};
