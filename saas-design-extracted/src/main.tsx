import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router";
import { router } from "./app/routes";
import { AuthProvider } from "./app/contexts/AuthContext";
import { LanguageProvider } from "./app/contexts/LanguageContext";
import { setApiBaseFromConfig, getApiBase } from "./app/config";
import "./index.css";

async function init() {
  try {
    const r = await fetch("/config.json", { cache: "no-store" });
    if (r.ok) {
      const d = await r.json().catch(() => ({}));
      if (d?.apiUrl && typeof d.apiUrl === "string") setApiBaseFromConfig(d.apiUrl);
    }
  } catch (_) {}

  console.log("[SnapSell] API base URL:", getApiBase());
  if (typeof window !== "undefined") {
    console.log("[SnapSell] Frontend origin:", window.location.origin);
  }

  const rootEl = document.getElementById("root");
  if (rootEl) {
    createRoot(rootEl).render(
      <StrictMode>
        <LanguageProvider>
          <AuthProvider>
            <RouterProvider router={router} />
          </AuthProvider>
        </LanguageProvider>
      </StrictMode>
    );
  }
}

init();
