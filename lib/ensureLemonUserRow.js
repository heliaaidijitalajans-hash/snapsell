"use strict";

/**
 * Lemon ödeme webhook'unda `custom_data.user_id` (Supabase auth id) için `public.users` satırı yoksa oluşturur.
 * Kullanıcı ödeme öncesi hiç API çağırmamış veya /api/auth/supabase senkronu başarısız olmuş olabilir.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {{ getUserById: function, getUserByEmail: function, FREE_CREDITS: number }} ctx
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
    console.warn(
      "[Lemon] ensureLemonUserRow: e-posta",
      em,
      "zaten başka kullanıcı id'sine bağlı (",
      byEmail.id,
      ") — checkout user_id",
      id,
      "ile çakışıyor."
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
    console.error("[Lemon] ensureLemonUserRow insert:", error.message, error.code || "");
    return;
  }
  console.log("[Lemon] public.users satırı webhook ile oluşturuldu:", id);
}

module.exports = { ensureLemonUserRow };
