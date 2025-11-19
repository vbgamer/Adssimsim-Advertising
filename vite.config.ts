import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  server: {
    port: 3000,
    host: "0.0.0.0",
  },
  preview: {
    port: 3000,
    host: "0.0.0.0",
    allowedHosts: [
      "adssimsim-advertising-1.onrender.com",
      "localhost",
      "127.0.0.1",
    ],
  },
  plugins: [react()],

  // ❌ REMOVE define completely — Vite handles env automatically
  define: {},

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
