import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Component files use the standard .jsx extension, so Vite's default
// esbuild/React plugin configuration handles JSX transformation natively —
// no custom loader override needed.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: false,
    proxy: {
      // Forwards API calls to the Spring Boot backend during local development.
      "/api": {
        target: "http://localhost:8083",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
  },
});
