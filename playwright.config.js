import { defineConfig } from "@playwright/test";

// Portão da fase C (PLAN.md): a jornada inteira no navegador, com o backend na API simulada.
const BACKEND = 3100, FRONT = 5174;

export default defineConfig({
  testDir: "e2e",
  timeout: 180_000,
  expect: { timeout: 15_000 },
  retries: 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: { baseURL: `http://127.0.0.1:${FRONT}`, viewport: { width: 1440, height: 1000 }, trace: "retain-on-failure" },
  webServer: [
    { command: "node e2e/iniciarBackend.mjs", url: `http://127.0.0.1:${BACKEND}/api/pessoas`, env: { TENDRA_PORTA: String(BACKEND) }, timeout: 60_000 },
    { command: `npx vite --port ${FRONT} --strictPort --host 127.0.0.1`, url: `http://127.0.0.1:${FRONT}`, env: { TENDRA_BACKEND_URL: `http://127.0.0.1:${BACKEND}` }, timeout: 60_000 }
  ]
});
