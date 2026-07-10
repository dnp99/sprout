// Capture real screenshots of the app dashboard for the landing hero, in both
// themes. Repeatable: re-run whenever the dashboard UI changes.
//
//   npm run capture:landing            # against http://localhost:3000
//   CAPTURE_URL=https://sprout-money.ca npm run capture:landing
//
// Uses the system Chrome via puppeteer-core (no Chromium download). Logs in as
// the seeded demo user, so run `npm run db:seed` first for clean data.

import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import puppeteer from "puppeteer-core";

const CHROME =
  process.env.CHROME_PATH ||
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const BASE = process.env.CAPTURE_URL || "http://localhost:3000";
const EMAIL = process.env.CAPTURE_EMAIL || "sam@sprout.money";
const PASSWORD = process.env.CAPTURE_PASSWORD || "password123";
const OUT_DIR = resolve(process.cwd(), "public/landing");
const VIEWPORT = { width: 1440, height: 900, deviceScaleFactor: 2 };

mkdirSync(OUT_DIR, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  defaultViewport: VIEWPORT,
  args: ["--no-sandbox", "--force-color-profile=srgb", "--hide-scrollbars"],
});

try {
  const page = await browser.newPage();

  // 1) Log in via the API so the session cookie is set on the browser context
  //    (far more robust than driving the two-copy login form).
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  const loggedIn = await page.evaluate(
    async (email, password) => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      return res.ok;
    },
    EMAIL,
    PASSWORD,
  );
  if (!loggedIn) throw new Error(`API login failed for ${EMAIL}`);

  // Polished demo state: set a monthly budget so the dashboard shows a real
  // "Safe to spend" figure and the first-run "Get started" checklist is complete
  // (and hides) — the hero should read as an established, in-use budget.
  await page.evaluate(async () => {
    await fetch("/api/auth/me", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ budgetPoolCents: 500000 }),
    });
  });

  // 2) Capture each theme. Set the persisted preference and hard-reload so the
  //    no-FOUC script applies the right theme class before paint.
  for (const theme of ["dark", "light"]) {
    // Set the persisted theme, then load /home fresh so the no-FOUC script
    // applies the right theme class before paint.
    await page.evaluate((t) => localStorage.setItem("sprout-theme", t), theme);
    await page.goto(`${BASE}/home`, { waitUntil: "networkidle2" });
    // Wait for the real dashboard: the Overview title is present and the boot /
    // data skeletons are gone.
    await page.waitForFunction(
      () =>
        document.body.innerText.includes("Overview") &&
        document.querySelectorAll(".animate-pulse").length === 0,
      { timeout: 20000 },
    );
    await new Promise((r) => setTimeout(r, 800)); // let bars/charts settle

    const out = resolve(OUT_DIR, `hero-${theme}.webp`);
    await page.screenshot({ path: out, type: "webp", quality: 92 });
    console.log(`✓ ${out}`);
  }
} finally {
  await browser.close();
}
