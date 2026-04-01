import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, "");
  const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL || "";
  const supabaseAnon = env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || "";

  return {
    plugins: [react()],
    base: "/",
    /** Tarayıcı paketinde process.env.SUPABASE_* (src/lib/supabase.ts) — anahtarlar repo dışında, build env’den. */
    define: {
      "process.env.SUPABASE_URL": JSON.stringify(supabaseUrl),
      "process.env.SUPABASE_ANON_KEY": JSON.stringify(supabaseAnon),
    },
  };
});
