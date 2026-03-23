/**
 * signInWithPassword / getSession içindeki TypeError: Failed to fetch —
 * genelde Supabase host’una istek gitmiyor (yanlış VITE_*, build, DNS, engelleyici).
 */
export function isNetworkFetchError(e: unknown): boolean {
  return e instanceof TypeError && String(e.message).includes("fetch");
}

export function supabaseUnreachableMessage(): Error {
  return new Error(
    "Supabase sunucusuna bağlanılamıyor (Failed to fetch). " +
      "Kontrol listesi: " +
      "1) Vercel’de VITE_SUPABASE_URL ve VITE_SUPABASE_ANON_KEY (Supabase → Settings → API ile aynı) tanımlı mı? " +
      "2) Değişiklikten sonra yeniden Deploy edildi mi? (Vite env’i build’de gömer.) " +
      "3) Supabase projesi duraklatılmadı mı? " +
      "4) Reklam / gizlilik eklentisi kapatılıp denensin."
  );
}
