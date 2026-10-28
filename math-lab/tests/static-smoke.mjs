import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
const browser = await chromium.launch({
  channel: "msedge",
  headless: true,
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("response", (r) => {
  if (r.status() >= 400) errors.push(r.status() + " " + r.url());
});
try {
  await page.goto("http://127.0.0.1:8002/");
  await page.locator('[data-subject="volume"]').click();
  await page.locator('[data-activity="cone"]').click();
  await page.locator("#stage canvas").waitFor();
  await page.screenshot({
    path: "test-results/cone-default.png",
    fullPage: true,
  });
  await page.locator("#play").click();
  await page.waitForTimeout(300);
  await page.locator("#play").click();
  assert.ok(Number(await page.locator("#progress").inputValue()) > 0);
  await page.locator("#back").click();
  await page.locator('[data-activity="cube"]').click();
  await page.locator("#stage canvas").waitFor();
  await page.screenshot({
    path: "test-results/cube-default.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator("#back").click();
  await page.locator('[data-activity="sphere"]').click();
  await page.locator("#stage canvas").waitFor();
  await page.screenshot({
    path: "test-results/mobile-sphere.png",
    fullPage: true,
  });
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  assert.deepEqual(errors, []);
  const fallback = await browser.newPage();
  await fallback.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      return /webgl/.test(type) ? null : original.call(this, type, ...args);
    };
  });
  await fallback.goto("http://127.0.0.1:8002/");
  await fallback.locator('[data-subject="volume"]').click();
  await fallback.locator('[data-activity="cube"]').click();
  await fallback
    .getByText("The 3D viewer is unavailable.", { exact: false })
    .waitFor();
  await fallback.locator("#w").evaluate((el) => {
    el.value = 2;
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
  assert.match(await fallback.locator("#measurements").innerText(), /8/);
  assert.equal(await fallback.locator("#angle").isDisabled(), true);
  await fallback.close();
  await writeFile(
    "test-results/static-smoke.json",
    JSON.stringify(
      {
        passed: true,
        checks: [
          "standalone static build loads",
          "vendored Three.js and OrbitControls load",
          "cone playback changes progress",
          "cube and sphere render",
          "mobile 3D no horizontal overflow",
          "WebGL unavailable fallback keeps calculations working",
        ],
        errors,
      },
      null,
      2,
    ),
  );
  console.log("Static build smoke checks passed");
} finally {
  await browser.close();
}
