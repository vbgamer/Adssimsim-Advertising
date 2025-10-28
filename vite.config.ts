import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(() => {
  return {
    base: "./", // ✅ Important for Render / production hosting
    server: {
      port: 3000,
      host: "0.0.0.0",
    },
    preview: {
      port: 3000,
      allowedHosts: ["adssimsim-advertising-1.onrender.com"], // ✅ Allow your Render domain
    },
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
  };
});
