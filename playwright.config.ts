import { defineConfig, devices } from "@playwright/test";

// Тесты идут по собранному сайту (npm run build), поднятому так же, как на GitHub Pages.
export default defineConfig({
  testDir: "e2e",
  workers: 2,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:4175/booking-sites/",
    trace: "retain-on-failure",
    launchOptions: process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {},
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "phone", use: { ...devices["Pixel 7"], viewport: { width: 390, height: 844 } } },
    { name: "без анимаций", use: { ...devices["Desktop Chrome"], reducedMotion: "reduce" }, testMatch: /booking\.spec\.ts/ },
  ],
  webServer: { command: "node scripts/preview.mjs", url: "http://localhost:4175/booking-sites/", env: { PORT: "4175" }, reuseExistingServer: false },
});
