import { useEffect } from "react";

const PANEL_ORIGIN =
  typeof window !== "undefined" && window.location.port === "5173"
    ? "http://localhost:3006"
    : typeof window !== "undefined"
      ? window.location.origin
      : "";

/**
 * Panel (upload, gorseller, ayarlar) sayfasina yonlendirir.
 */
export function RedirectToDashboard({ hash }: { hash?: string }) {
  useEffect(() => {
    if (!PANEL_ORIGIN) return;
    const url = hash ? `${PANEL_ORIGIN}/panel#${hash}` : `${PANEL_ORIGIN}/panel`;
    window.location.replace(url);
  }, [hash]);

  return null;
}
