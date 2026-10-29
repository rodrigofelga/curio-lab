import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
const baseUrl = process.env.MATHLAB_URL || "http://127.0.0.1:8001/";
const browser = await chromium.launch({
  channel: "msedge",
  headless: true,
  args: [
    "--enable-webgl",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
  ],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(msg.text());
});
const results = [];
async function check(name, fn) {
  try {
    await fn();
    results.push({ name, passed: true });
    console.log("PASS", name);
  } catch (e) {
    results.push({ name, passed: false, error: e.message });
    console.error("FAIL", name, e.message);
  }
}
async function slider(id, value) {
  await page.locator("#" + id).evaluate((el, v) => {
    el.value = v;
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }, String(value));
}
async function open(id) {
  if (await page.locator("#back").count()) await page.locator("#back").click();
  const subject = ["rectangle", "triangle", "circle", "challenge"].includes(id)
    ? "area"
    : "volume";
  await page.locator(`[data-subject="${subject}"]`).click();
  await page.locator(`[data-activity="${id}"]`).click();
  if (subject === "volume") await page.locator("#stage canvas").waitFor();
}
await mkdir("test-results", { recursive: true });
try {
  await check("landing and six subject navigation entries", async () => {
    await page.goto(baseUrl);
    assert.equal(await page.locator("[data-subject]").count(), 6);
    assert.equal(await page.locator("[data-activity]").count(), 4);
    await page.screenshot({
      path: "test-results/desktop-home.png",
      fullPage: true,
    });
  });
  await check(
    "rectangle slider, pointer resize, unit grid and reset",
    async () => {
      await open("rectangle");
      await slider("w", 6);
      await slider("h", 4);
      assert.match(await page.locator("#measurements").innerText(), /24/);
      const handle = page.locator("#stage circle");
      const b = await handle.boundingBox();
      await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
      await page.mouse.down();
      await page.mouse.move(b.x + 65, b.y - 35, { steps: 8 });
      await page.mouse.up();
      assert.notEqual(await page.locator("#w").inputValue(), "6");
      await page.locator('[data-key="grid"]').uncheck();
      await page.locator("#reset").click();
      assert.equal(await page.locator("#w").inputValue(), "4");
    },
  );
  await check(
    "triangle demonstration play pause progress replay and reset",
    async () => {
      await open("triangle");
      await page.locator("#play").click();
      await page.waitForTimeout(250);
      await page.locator("#play").click();
      const paused = await page.locator("#progress").inputValue();
      await page.waitForTimeout(200);
      assert.equal(await page.locator("#progress").inputValue(), paused);
      await slider("progress", 1);
      assert.match(
        await page.locator("#stage polygon").last().getAttribute("transform"),
        /180/,
      );
      await page.locator("#replay").click();
      await page.waitForTimeout(120);
      assert.ok(Number(await page.locator("#progress").inputValue()) < 1);
      await page.locator("#reset").click();
      assert.equal(await page.locator("#progress").inputValue(), "0");
    },
  );
  await check(
    "circle has selected sector count and conserved area on rearrangement",
    async () => {
      await open("circle");
      await slider("sectors", 64);
      assert.equal(await page.locator("#stage path").count(), 64);
      const area = await page.locator("#measurements").innerText();
      await slider("progress", 1);
      assert.equal(await page.locator("#measurements").innerText(), area);
      await page.screenshot({
        path: "test-results/circle.png",
        fullPage: true,
      });
    },
  );
  await check(
    "challenge only accepts same area with genuinely different perimeter",
    async () => {
      await open("challenge");
      await slider("w", 6);
      await slider("h", 4);
      assert.ok(
        !(await page.locator("#feedback").getAttribute("class"))?.includes(
          "success",
        ),
      );
      await slider("w", 3);
      await slider("h", 8);
      assert.match(
        await page.locator("#feedback").getAttribute("class"),
        /success/,
      );
      await page.locator("#challenge-mode").selectOption("perimeter");
      await slider("w", 5);
      await slider("h", 5);
      assert.match(
        await page.locator("#feedback").getAttribute("class"),
        /success/,
      );
    },
  );
  for (const id of ["cube", "prism", "cylinder", "cone", "sphere", "scale"])
    await check(`${id} WebGL renders, controls and reset work`, async () => {
      await open(id);
      assert.ok(
        await page
          .locator("#stage canvas")
          .evaluate((c) => c.width > 0 && c.height > 0),
      );
      await slider("angle", 160);
      await slider("zoom", 1.3);
      const beforeView = await page.locator("#stage canvas").screenshot();
      const canvas = await page.locator("#stage canvas").boundingBox();
      await page.mouse.move(
        canvas.x + canvas.width / 2,
        canvas.y + canvas.height / 2,
      );
      await page.mouse.down();
      await page.mouse.move(
        canvas.x + canvas.width / 2 + 60,
        canvas.y + canvas.height / 2 + 20,
        { steps: 5 },
      );
      await page.mouse.up();
      await page.mouse.wheel(0, -100);
      await page.waitForTimeout(50);
      assert.notEqual(
        await page.locator("#stage canvas").evaluate((c) => c.toDataURL()),
        beforeView,
      );
      await page.locator('[data-key="wire"]').check();
      await page.locator('[data-key="transparent"]').uncheck();
      if (id === "prism") {
        await slider("layers", 0);
        assert.match(await page.locator("#measurements").innerText(), /0/);
        await slider("h", 1);
        assert.equal(await page.locator("#layers").getAttribute("max"), "1");
      }
      if (id === "sphere") {
        await slider("slice", 1);
        assert.match(await page.locator("#measurements").innerText(), /0/);
      }
      if (id === "cone") {
        await slider("progress", 1);
        await page.screenshot({
          path: "test-results/cone-desktop.png",
          fullPage: true,
        });
      }
      if (id === "scale") {
        await slider("w", 2);
        assert.match(await page.locator("#formula").innerText(), /×4/);
        assert.match(await page.locator("#formula").innerText(), /×8/);
      }
      await page.locator("#reset-view").click();
      assert.equal(await page.locator("#angle").inputValue(), "40");
      await page.locator("#reset").click();
      await page.locator("#stage canvas").waitFor();
      assert.equal(await page.locator('[data-key="wire"]').isChecked(), false);
    });
  await check(
    "Portuguese translation preserves activity and dimensions",
    async () => {
      await open("cone");
      await slider("r", 4);
      await page.locator("#language").selectOption("pt");
      await page.locator("#stage canvas").waitFor();
      assert.equal(await page.locator("html").getAttribute("lang"), "pt-BR");
      assert.equal(await page.locator("#r").inputValue(), "4");
      assert.match(
        await page.locator("#activity-title").innerText(),
        /Três cones/,
      );
      assert.match(
        await page.locator("#measurements").innerText(),
        /Volume do cilindro/,
      );
      await page.locator("#language").selectOption("en");
    },
  );
  await check(
    "all four new subjects contain playable activity cards",
    async () => {
      await page.locator("#back").click();
      for (const [id, count] of [
        ["fractions", 3],
        ["algebra", 2],
        ["functions", 1],
        ["probability", 2],
      ]) {
        await page.locator(`[data-subject="${id}"]`).click();
        assert.equal(await page.locator("[data-activity]").count(), count);
        assert.equal(await page.locator(".upcoming").count(), 0);
      }
    },
  );
  await check(
    "desktop tablet and mobile have no horizontal page overflow",
    async () => {
      for (const width of [1440, 820, 390, 320]) {
        await page.setViewportSize({ width, height: 900 });
        await page.locator('[data-subject="area"]').click();
        assert.ok(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        );
        await page.locator('[data-activity="circle"]').click();
        assert.ok(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        );
        if (width === 390)
          await page.screenshot({
            path: "test-results/mobile-circle.png",
            fullPage: true,
          });
        await page.locator("#back").click();
      }
    },
  );
  await check(
    "explicit Play animates with reduced motion enabled",
    async () => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await open("triangle");
      await page.locator("#play").click();
      await page.waitForTimeout(200);
      const progress = Number(await page.locator("#progress").inputValue());
      assert.ok(progress > 0 && progress < 1);
      await page.locator("#play").click();
    },
  );
  await check("keyboard controls and dark theme", async () => {
    await page.locator("#w").focus();
    await page.keyboard.press("ArrowRight");
    assert.equal(await page.locator("#w").inputValue(), "5");
    await page.locator("#theme").click();
    assert.equal(await page.locator("html").getAttribute("data-theme"), "dark");
  });
  await check(
    "all activities translate to Portuguese without missing text",
    async () => {
      await page.locator("#language").selectOption("pt");
      for (const id of [
        "rectangle",
        "triangle",
        "circle",
        "challenge",
        "cube",
        "prism",
        "cylinder",
        "cone",
        "sphere",
        "scale",
      ]) {
        await open(id);
        const text = await page.locator("main").innerText();
        assert.ok(
          !/undefined|NaN|Coming next|Reset experiment|Why does it work/.test(
            text,
          ),
        );
      }
      await page.locator("#language").selectOption("en");
    },
  );
  await check("touchscreen rectangle resizing on mobile", async () => {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    const mobile = await context.newPage();
    try {
      await mobile.goto(baseUrl);
      await mobile.locator('[data-activity="rectangle"]').tap();
      const b = await mobile.locator("#stage circle").boundingBox();
      const cdp = await context.newCDPSession(mobile);
      const x = b.x + b.width / 2,
        y = b.y + b.height / 2;
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: [{ x, y }],
      });
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x: x + 35, y: y - 15 }],
      });
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchEnd",
        touchPoints: [],
      });
      assert.notEqual(await mobile.locator("#w").inputValue(), "4");
    } finally {
      await context.close();
    }
  });
  await check("no unexpected JavaScript or console errors", async () =>
    assert.deepEqual(errors, []),
  );
} finally {
  await writeFile(
    "test-results/browser-report.json",
    JSON.stringify({ results, errors }, null, 2),
  );
  await browser.close();
}
if (results.some((r) => !r.passed)) process.exitCode = 1;
