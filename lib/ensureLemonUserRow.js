"use strict";

/**
 * Lemon ödeme webhook'unda `custom_data.user_id` (Supabase auth id) için `public.users` satırı yoksa oluşturur.
 * Kullanıcı ödeme öncesi hiç API çağırmamış veya /api/auth/supabase senkronu başarısız olmuş olabilir.
 *
 * Identity: auth.users.id is canonical. Email is only used to run one-time claim_user_identity
 * when a legacy active/anonymous row already owns that email — never as a runtime attach.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {{ getUserById: function, getUserByEmail: function, FREE_CREDITS: number, claimUserIdentity?: function }} ctx
 * @param {string} authUserId
 * @param {string} email
 */
async function ensureLemonUserRow(supabase, ctx, authUserId, email) {
  if (!supabase) return;
  const { getUserById, getUserByEmail, FREE_CREDITS } = ctx;
  const id = String(authUserId || "").trim();
  const em = email != null ? String(email).trim().toLowerCase() : "";
  if (!id) return;
  const existing = await getUserById(id);
  if (existing) return;
  if (!em) {
    console.warn("[Lemon] ensureLemonUserRow: e-posta yok, public.users oluşturulamıyor (user_id=" + id + ")");
    return;
  }
  const byEmail = await getUserByEmail(em);
  if (byEmail && byEmail.id !== id) {
    if (typeof ctx.claimUserIdentity === "function") {
      await ctx.claimUserIdentity(supabase, id, em, {
        mergeReason: "email_claim_v1_lemon",
      });
      const afterClaim = await getUserById(id);
      if (afterClaim) {
        console.log("[Lemon] ensureLemonUserRow: identity claim →", id);
        return;
      }
    }
    console.warn(
      "[Lemon] ensureLemonUserRow: e-posta",
      em,
      "zaten başka kullanıcı id'sine bağlı (",
      byEmail.id,
      ") — checkout user_id",
      id,
      "ile çakışıyor; user_identity_conflicts kontrol edin."
    );
    return;
  }
  const insertRow = {
    id: id,
    email: em,
    plan: "free",
    credits: FREE_CREDITS,
    total_conversions: 0,
    identity_status: "active",
  };
  const { error } = await supabase.from("users").insert(insertRow);
  if (error) {
    if (error.code === "23505" && typeof ctx.claimUserIdentity === "function") {
      await ctx.claimUserIdentity(supabase, id, em, {
        mergeReason: "email_claim_v1_lemon",
      });
      const after = await getUserById(id);
      if (after) return;
    }
    console.error("[Lemon] ensureLemonUserRow insert:", error.message, error.code || "");
    return;
  }
  console.log("[Lemon] public.users satırı webhook ile oluşturuldu:", id);
}

module.exports = { ensureLemonUserRow };
