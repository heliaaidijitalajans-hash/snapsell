const { createClient } = require("@supabase/supabase-js");

function requireEnv(name) {
  const value = (process.env[name] || "").trim();
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

function createAnonClient() {
  const url = requireEnv("SUPABASE_URL");
  const key = requireEnv("SUPABASE_ANON_KEY");
  return createClient(url, key);
}

function createServiceClient() {
  const url = requireEnv("SUPABASE_URL");
  const key = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

module.exports = {
  createAnonClient,
  createServiceClient,
};
