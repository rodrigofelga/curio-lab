import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { GRAPH_FAMILIES } from "../src/graph-math.js";
const base = process.env.MATHLAB_URL || "http://127.0.0.1:8004/";
const browser = await chromium.launch({
  channel: "msedge",
  headless: true,
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1050 } }),
  errors = [],
  results = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});
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
async function set(id, value) {
  await page.locator("#" + id).evaluate((e, v) => {
    e.value = v;
    e.dispatchEvent(new Event("input", { bubbles: true }));
  }, String(value));
}
async function open(id) {
  if (await page.locator("#back").count()) await page.locator("#back").click();
  await page
    .locator(`[data-subject="${id === "balance" ? "algebra" : "functions"}"]`)
    .click();
  await page.locator(`[data-activity="${id}"]`).click();
}
await mkdir("test-results", { recursive: true });
try {
  await page.goto(base);
  await check(
    "2x visibly contains two equal groups; added units remain separate",
    async () => {
      await open("balance");
      await set("amount", 4);
      await page.locator("#add").click();
      await set("x", 4);
      assert.equal(await page.locator("[data-x-group]").count(), 2);
      for (const g of await page.locator("[data-x-group]").all())
        assert.equal(await g.locator(".x-unit").count(), 4);
      assert.equal(await page.locator(".constant-unit").count(), 8);
      assert.equal(await page.locator(".rhs-unit").count(), 16);
      assert.match(
        await page.locator(".multiplication-story").innerText(),
        /4 \+ 4 = 8/,
      );
      assert.equal(
        await page.locator(".algebra-comparison strong").innerText(),
        "=",
      );
      await page.screenshot({
        path: "test-results/algebra-equal-groups.png",
        fullPage: true,
      });
    },
  );
  await check(
    "decimal trial values show partial unit tiles and matching totals",
    async () => {
      await set("x", 3.905);
      assert.equal(await page.locator("#x").inputValue(), "3.9");
      assert.equal(await page.locator(".x-unit").count(), 6);
      assert.equal(await page.locator(".partial-unit").count(), 2);
      assert.equal(
        await page.locator("#learn-metrics strong").first().innerText(),
        "15.8",
      );
      assert.match(
        await page.locator(".side-calculation").first().innerText(),
        /15.8/,
      );
      assert.equal(
        await page.locator(".algebra-comparison strong").innerText(),
        "<",
      );
    },
  );
  await check(
    "bilateral operations keep the solution and the group count updates",
    async () => {
      await page.locator("#exact").click();
      await set("amount", 4);
      await page.locator("#subtract").click();
      await page.locator("#subtract").click();
      assert.equal(await page.locator(".constant-unit").count(), 0);
      await page.locator("#divide").click();
      assert.equal(await page.locator("[data-x-group]").count(), 1);
      assert.equal(await page.locator(".x-unit").count(), 4);
      assert.equal(await page.locator(".rhs-unit").count(), 4);
    },
  );
  await check(
    "all fourteen function families draw without invalid coordinates",
    async () => {
      await open("graphs");
      assert.equal(await page.locator("#family option").count(), 14);
      for (const family of GRAPH_FAMILIES) {
        await page.locator("#family").selectOption(family);
        assert.ok((await page.locator(".function-curve").count()) > 0, family);
        const paths = await page
          .locator(".function-curve")
          .evaluateAll((nodes) =>
            nodes.map((n) => n.getAttribute("d")).join(""),
          );
        assert.ok(!/NaN|Infinity/.test(paths), family);
        assert.ok(
          !(await page.locator("#family option").allTextContents()).includes(
            "undefined",
          ),
          family,
        );
      }
    },
  );
  await check(
    "sine cosine and quarter-turn shift match the supplied Desmos lesson",
    async () => {
      await page.locator("#family").selectOption("sine");
      await page.locator("#probe-quarter").click();
      assert.equal(
        await page.locator("#learn-metrics strong").last().innerText(),
        "1",
      );
      assert.match(
        await page.locator("#learn-metrics strong").first().innerText(),
        /π\/2/,
      );
      assert.equal(await page.locator("#compare-waves").isChecked(), true);
      await page.locator("#shift-quarter").click();
      assert.ok(
        Math.abs(
          Number(await page.locator("#phase").inputValue()) + Math.PI / 2,
        ) < 1e-9,
      );
      assert.match(
        await page.locator(".graph-identity").innerText(),
        /sin\(x \+ π\/2\) = cos\(x\)/,
      );
      assert.ok(
        Number(
          await page.locator("#learn-metrics strong").last().innerText(),
        ) === 0,
      );
      await page.screenshot({
        path: "test-results/sine-cosine-comparison.png",
        fullPage: true,
      });
    },
  );
  await check(
    "degrees preserve a radian transformation and probe position",
    async () => {
      await page.locator("#angleUnit").selectOption("degrees");
      assert.ok(
        Math.abs(Number(await page.locator("#phase").inputValue()) + 90) < 1e-8,
      );
      assert.ok(
        Math.abs(Number(await page.locator("#probe").inputValue()) - 90) < 1e-8,
      );
      assert.ok(
        Math.abs(Number(await page.locator("#span").inputValue()) - 360) < 1e-8,
      );
      assert.match(await page.locator(".graph-identity").innerText(), /90°/);
      await page.locator("#angleUnit").selectOption("radians");
      assert.ok(
        Math.abs(
          Number(await page.locator("#phase").inputValue()) + Math.PI / 2,
        ) < 1e-8,
      );
    },
  );
  await check(
    "amplitude frequency and vertical shift affect the sine values",
    async () => {
      await page.locator("#family").selectOption("sine");
      await set("amplitude", 2);
      await set("frequency", 2);
      await set("offset", 1);
      await set("probe", Math.PI / 4);
      assert.equal(
        await page.locator("#learn-metrics strong").last().innerText(),
        "3",
      );
      await page.locator("#reset-graph-view").click();
      assert.equal(await page.locator("#probe").inputValue(), "0");
    },
  );
  await check(
    "tangent is split at asymptotes and undefined at π/2 in both unit modes",
    async () => {
      await page.locator("#family").selectOption("tangent");
      await page.locator("#compare-waves").uncheck();
      assert.ok(
        (await page
          .locator('.function-curve[data-function="tangent"]')
          .count()) > 1,
      );
      assert.ok((await page.locator(".graph-asymptote").count()) > 0);
      await page.locator("#probe-quarter").click();
      assert.equal(
        await page.locator("#learn-metrics strong").last().innerText(),
        "Undefined",
      );
      assert.equal(await page.locator(".graph-probe").count(), 0);
      assert.match(await page.locator("#learn-formula").innerText(), /π\/2/);
      await page.locator("#angleUnit").selectOption("degrees");
      assert.equal(
        await page.locator("#learn-metrics strong").last().innerText(),
        "Undefined",
      );
      await page.screenshot({
        path: "test-results/tangent-asymptotes.png",
        fullPage: true,
      });
    },
  );
  await check(
    "logarithm root and reciprocal respect their real domains",
    async () => {
      for (const family of ["logarithm", "sqrt"]) {
        await page.locator("#family").selectOption(family);
        await set("probe", -1);
        assert.equal(
          await page.locator("#learn-metrics strong").last().innerText(),
          "Undefined",
        );
      }
      await page.locator("#family").selectOption("reciprocal");
      await set("probe", 0);
      assert.equal(
        await page.locator("#learn-metrics strong").last().innerText(),
        "Undefined",
      );
      assert.equal(await page.locator(".graph-asymptote").count(), 1);
      await set("amplitude",0);
      assert.equal(await page.locator(".graph-asymptote").count(),0);
      assert.equal(await page.locator("#learn-metrics strong").last().innerText(),"Undefined");
      await set("probe",1);
      assert.equal(await page.locator("#learn-metrics strong").last().innerText(),"0");
    },
  );
  await check(
    "English Portuguese desktop and phone layouts preserve models",
    async () => {
      for (const width of [1440, 820, 390, 320]) {
        await page.setViewportSize({ width, height: 950 });
        for (const lang of ["en", "pt"]) {
          await page.locator("#language").selectOption(lang);
          await open("balance");
          await set("x", 4);
          assert.equal(await page.locator(".x-unit").count(), 8);
          assert.ok(
            await page.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth,
            ),
            `balance ${lang} ${width}`,
          );
          await open("graphs");
          for (const family of ["sine", "tangent", "logarithm"]) {
            await page.locator("#family").selectOption(family);
            assert.ok(
              await page.evaluate(
                () => document.documentElement.scrollWidth <= innerWidth,
              ),
              `graph ${lang} ${width}`,
            );
            assert.ok(!/NaN/.test(await page.locator("main").innerText()));
            assert.ok(
              !(
                await page.locator("#family option").allTextContents()
              ).includes("undefined"),
            );
          }
        }
      }
      await page.screenshot({
        path: "test-results/trig-mobile.png",
        fullPage: true,
      });
    },
  );
  await check("no unexpected JavaScript errors", async () =>
    assert.deepEqual(errors, []),
  );
} finally {
  await writeFile(
    "test-results/visual-browser-report.json",
    JSON.stringify({ results, errors }, null, 2),
  );
  await browser.close();
}
if (results.some((r) => !r.passed)) process.exitCode = 1;
