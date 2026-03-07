import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/",
  server: { port: 5173 },
  optimizeDeps: {
    include: ["firebase/app", "firebase/auth"],
  },
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    commonjsOptions: {
      include: [/firebase/, /node_modules/],
    },
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes("node_modules/firebase") || id.includes("node_modules\\firebase")) return "firebase";
          if (id.includes("node_modules")) return "vendor";
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
});
