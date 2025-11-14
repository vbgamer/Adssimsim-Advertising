import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  // Load environment variables based on current mode (development or production)
  const env = loadEnv(mode, process.cwd(), "");

  return {
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

    // ✅ Define only Supabase variables (no Gemini or others)
    define: {
      "process.env.VITE_SUPABASE_URL": JSON.stringify(env.VITE_SUPABASE_URL),
      "process.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
    },

    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
