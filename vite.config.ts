import path from "path";

import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables for current mode
  const env = loadEnv(mode, process.cwd());

  // Configure output directory based on build mode
  const outDir =
    mode === "qc"
      ? "C:\\PMA\\web-qc"
      : mode === "production"
        ? "C:\\PMA\\web-prod"
        : "dist";

  return {
    // Base path for deployment - set to "/" for root, or "/pmaweb/" for subdirectory
    base: env.VITE_BASE_PATH || "/",

    plugins: [react(), tsconfigPaths(), tailwindcss()],

    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },

    define: {
      __APP_ENV__: JSON.stringify(env.VITE_ENV),
    },

    build: {
      outDir: outDir,
    },
  };
});
