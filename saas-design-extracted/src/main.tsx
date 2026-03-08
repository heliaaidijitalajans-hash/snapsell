import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router";
import { router } from "./app/routes";
import { AuthProvider } from "./app/contexts/AuthContext";
import { LanguageProvider } from "./app/contexts/LanguageContext";
import "./index.css";

async function init() {
  if (typeof window !== "undefined") {
    console.log("[SnapSell] API: same-origin /api/...");
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
