import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
const base = process.env.MATHLAB_URL || "http://127.0.0.1:8001/";
const browser = await chromium.launch({
  channel: "msedge",
  headless: true,
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
const results = [],
  errors = [];
try {
  for (const motion of ["no-preference", "reduce"]) {
    const page = await browser.newPage({ reducedMotion: motion });
    page.on("pageerror", (error) => errors.push(error.message));
    await page.clock.install();
    await page.goto(base);
    for (const id of ["triangle", "circle", "cylinder", "cone"]) {
      if (await page.locator("#back").count())
        await page.locator("#back").click();
      await page
        .locator(
          `[data-subject="${["triangle", "circle"].includes(id) ? "area" : "volume"}"]`,
        )
        .click();
      await page.locator(`[data-activity="${id}"]`).click();
      if (["cylinder", "cone"].includes(id))
        await page.locator("#stage canvas").waitFor();
      await page.locator("#play").click();
      const value = async () =>
        Number(await page.locator("#progress").inputValue());
      assert.ok((await value()) < 0.05, `${id}: starts at the beginning`);
      await page.clock.runFor(2500);
      assert.ok(
        Math.abs((await value()) - 0.5) < 0.025,
        `${id}: halfway after 2.5 seconds (${await value()})`,
      );
      await page.clock.runFor(2400);
      assert.ok(
        (await value()) > 0.96 && (await value()) < 1,
        `${id}: still animating before five seconds`,
      );
      await page.clock.runFor(200);
      assert.equal(await value(), 1, `${id}: completes after five seconds`);
      if (id === "circle") {
        await page.locator("#play").click();
        await page.clock.runFor(1000);
        await page.locator("#play").click();
        const paused = await value();
        await page.clock.runFor(1000);
        assert.equal(await value(), paused);
        await page.locator("#play").click();
        await page.clock.runFor(1000);
        assert.ok(
          Math.abs((await value()) - (paused + 0.2)) < 0.025,
          "Resume uses the remaining five-second timeline",
        );
        await page.locator("#replay").click();
        await page.clock.runFor(1000);
        assert.ok(
          Math.abs((await value()) - 0.2) < 0.025,
          "Replay starts a fresh five-second animation",
        );
        await page.locator("#progress").evaluate((el) => {
          el.value = 0.7;
          el.dispatchEvent(new Event("input", { bubbles: true }));
        });
        await page.clock.runFor(1000);
        assert.equal(await value(), 0.7, "Seeking pauses playback");
        await page.locator("#play").click();
        await page.clock.runFor(1600);
        assert.equal(await value(), 1);
      }
      results.push({ activity: id, reducedMotion: motion, passed: true });
      console.log("PASS five-second playback:", id, motion);
    }
    await page.close();
  }
  const real = await browser.newPage({ reducedMotion: "reduce" });
  real.on("pageerror", (error) => errors.push(error.message));
  await real.goto(base);
  await real.locator('[data-activity="circle"]').click();
  const started = Date.now();
  await real.locator("#play").click();
  await real.waitForTimeout(2500);
  const halfway = Number(await real.locator("#progress").inputValue());
  assert.ok(halfway > 0.4 && halfway < 0.65);
  await real.waitForFunction(
    () => Number(document.querySelector("#progress").value) === 1,
    {},
    { timeout: 7000 },
  );
  const elapsed = Date.now() - started;
  assert.ok(
    elapsed >= 4900 && elapsed < 6500,
    `Real playback elapsed ${elapsed}ms`,
  );
  results.push({
    activity: "circle",
    realTimeMs: elapsed,
    reducedMotion: "reduce",
    passed: true,
  });
  console.log("PASS real-time reduced-motion circle:", elapsed, "ms");
  assert.deepEqual(errors, []);
  await mkdir("test-results", { recursive: true });
  await writeFile(
    "test-results/playback-report.json",
    JSON.stringify({ base, results, errors }, null, 2),
  );
} finally {
  await browser.close();
}
