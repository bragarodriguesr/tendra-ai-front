import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// /api vai para o servidor local da base (npm run servidor, na pasta backend), que só ouve em 127.0.0.1.
const BACKEND = process.env.TENDRA_BACKEND_URL || "http://127.0.0.1:3000";

export default defineConfig({
  plugins: [react()],
  server: { proxy: { "/api": BACKEND } }
});
