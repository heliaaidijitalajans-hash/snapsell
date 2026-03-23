/**
 * SnapSell – Supabase istemcileri (Firebase yok).
 *
 * Ortam:
 *   SUPABASE_URL + SUPABASE_ANON_KEY     → genel / anon istemci
 *   SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY → sunucu (RLS bypass, güvenli tutun)
 */

const { createClient } = require("@supabase/supabase-js");

function readEnv(name) {
  return String(process.env[name] || "").trim();
}

/**
 * @throws {Error} URL veya anahtar eksikse
 */
function assertUrlAndKey(url, key, label) {
  if (!url || !key) {
    throw new Error(`${label}: SUPABASE_URL ve ilgili anahtar tanımlı olmalı`);
  }
}

/**
 * Tarayıcı dışı (Node) için anon istemci — RLS geçerlidir.
 * @param {import('@supabase/supabase-js').SupabaseClientOptions} [options]
 */
function createAnonClient(options) {
  const url = readEnv("SUPABASE_URL");
  const key = readEnv("SUPABASE_ANON_KEY");
  assertUrlAndKey(url, key, "createAnonClient");
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
    ...options,
  });
}

/**
 * Sunucu / webhook — service role (kullanıcı tablosu yazma, token doğrulama vb.).
 * @param {import('@supabase/supabase-js').SupabaseClientOptions} [options]
 */
function createServiceClient(options) {
  const url = readEnv("SUPABASE_URL");
  const key = readEnv("SUPABASE_SERVICE_ROLE_KEY");
  assertUrlAndKey(url, key, "createServiceClient");
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
    ...options,
  });
}

/**
 * İstenen API: createClient = anon (SUPABASE_URL + SUPABASE_ANON_KEY).
 * @param {import('@supabase/supabase-js').SupabaseClientOptions} [options]
 */
function createClientFromEnv(options) {
  return createAnonClient(options);
}

module.exports = {
  /** SUPABASE_URL + SUPABASE_ANON_KEY ile istemci */
  createClient: createClientFromEnv,
  createAnonClient,
  /** Sunucu / webhook: SUPABASE_SERVICE_ROLE_KEY */
  createServiceClient,
};
