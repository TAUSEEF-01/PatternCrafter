import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "./",
  server: {
    port: 5173,
    strictPort: true,
    cors: true,
    headers: {
      // Allow the portal to embed via iframe during dev
      "X-Frame-Options": "ALLOWALL",
      "Content-Security-Policy": "frame-ancestors 'self' http://localhost:5172",
    },
  },
});
