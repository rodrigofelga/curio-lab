import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
const base = process.env.MATHLAB_URL || "http://127.0.0.1:8004/";
const subjects = {
  fractions: "fractions",
  equivalent: "fractions",
  ratios: "fractions",
  balance: "algebra",
  variables: "algebra",
  graphs: "functions",
  dice: "probability",
  spinner: "probability",
};
const browser = await chromium.launch({
  channel: "msedge",
  headless: true,
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } }),
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
async function open(id) {
  if (await page.locator("#back").count()) await page.locator("#back").click();
  await page.locator(`[data-subject="${subjects[id]}"]`).click();
  await page.locator(`[data-activity="${id}"]`).click();
  await page.locator("#learning-stage").waitFor();
}
async function slider(id, v) {
  await page.locator("#" + id).evaluate((el, v) => {
    el.value = v;
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }, String(v));
}
const total = async () =>
  Number(
    (await page.locator("#learn-metrics strong").first().innerText()).replace(
      /[,\.\s]/g,
      "",
    ),
  );
await mkdir("test-results", { recursive: true });
try {
  await page.goto(base);
  await check(
    "all 18 activities are available across the six subjects",
    async () => {
      let count = 0;
      for (const s of [
        "area",
        "volume",
        "fractions",
        "algebra",
        "functions",
        "probability",
      ]) {
        await page.locator(`[data-subject="${s}"]`).click();
        count += await page.locator("[data-activity]").count();
        assert.equal(await page.locator(".upcoming").count(), 0);
      }
      assert.equal(count, 18);
    },
  );
  await check(
    "fraction pieces, circle keyboard interaction, improper addition and missions",
    async () => {
      await open("fractions");
      await slider("n", 3);
      assert.match(
        await page.locator("#learn-feedback").getAttribute("class"),
        /success/,
      );
      await page.locator("#shape").selectOption("circle");
      await page.locator('[data-piece="0"]').click();
      assert.equal(await page.locator("#n").inputValue(), "2");
      await page.locator('[data-piece="1"]').focus();
      await page.keyboard.press("Enter");
      assert.equal(await page.locator("#n").inputValue(), "1");
      await page.keyboard.press("Space");
      assert.equal(await page.locator("#n").inputValue(), "2");
      await slider("addend", 3);
      await page.locator("#combine").click();
      assert.match(await page.locator("#learn-formula").innerText(), /5\/4/);
      assert.equal(await page.locator(".fraction-bar").count(), 2);
      await page.locator("#new-mission").click();
      await slider("d", 3);
      await slider("n", 2);
      assert.match(
        await page.locator("#learn-feedback").getAttribute("class"),
        /success/,
      );
      await page.screenshot({
        path: "test-results/fraction-builder.png",
        fullPage: true,
      });
      await page.locator("#learn-reset").click();
      assert.equal(await page.locator("#n").inputValue(), "1");
    },
  );
  await check(
    "equivalent fractions subdivide and compare exact amounts",
    async () => {
      await open("equivalent");
      await slider("d", 2);
      await slider("k", 3);
      await slider("right", 2);
      assert.ok(
        !(await page.locator("#learn-feedback").getAttribute("class")).includes(
          "success",
        ),
      );
      await slider("right", 3);
      assert.match(
        await page.locator("#learn-feedback").getAttribute("class"),
        /success/,
      );
      assert.match(
        await page.locator("#learn-formula").innerText(),
        /1\/2 = 3\/6/,
      );
      await slider("k", 4);
      assert.equal(await page.locator("#right").inputValue(), "4");
      await slider("d", 8);
      await slider("k", 6);
      assert.equal(await page.locator("#right").getAttribute("max"), "48");
    },
  );
  await check("ratio counters and scaling match selected recipe", async () => {
    await open("ratios");
    await slider("a", 2);
    await slider("b", 3);
    await slider("batches", 3);
    assert.equal(await page.locator(".counter-a").count(), 6);
    assert.equal(await page.locator(".counter-b").count(), 9);
    assert.match(await page.locator("#learn-metrics").innerText(), /40%/);
    await page.locator("#double").click();
    assert.equal(await page.locator(".counter-a").count(), 12);
    assert.equal(await page.locator(".counter-b").count(), 18);
    assert.equal(await page.locator("#double").isDisabled(), true);
    await page.screenshot({
      path: "test-results/ratio-studio.png",
      fullPage: true,
    });
  });
  await check(
    "equation balance operations preserve and isolate the solution",
    async () => {
      await open("balance");
      await slider("x", 4);
      await slider("amount", 4);
      await page.locator("#subtract").click();
      assert.match(await page.locator("#learn-formula").innerText(), /2x = 8/);
      await page.locator("#divide").click();
      assert.match(await page.locator("#learn-formula").innerText(), /x = 4/);
      assert.match(await page.locator("#learn-feedback").innerText(), /Solved/);
      await page.locator("#new-mission").click();
      await page.locator("#exact").click();
      const x = await page.locator("#x").inputValue();
      await page.locator("#add").click();
      assert.equal(await page.locator("#x").inputValue(), x);
      assert.match(
        await page.locator("#learn-feedback").innerText(),
        /totals are equal/,
      );
      await page.locator('#new-mission').click();
      await page.locator('#right-plus').click();
      await page.locator('#exact').click();
      assert.ok(Math.abs(Number(await page.locator('#x').inputValue())-13/3)<1e-9,'Exact fractional solutions must not be rounded to the slider step');
      assert.equal(await page.locator('#learn-metrics strong').first().innerText(),await page.locator('#learn-metrics strong').last().innerText());
      await page.screenshot({
        path: "test-results/equation-balance.png",
        fullPage: true,
      });
    },
  );
  await check(
    "variable garden counts flowers and evaluates its input table",
    async () => {
      await open("variables");
      await slider("x", 5);
      assert.equal(await page.locator(".flower").count(), 17);
      assert.match(
        await page.locator("#learn-feedback").getAttribute("class"),
        /success/,
      );
      await slider("m", 4);
      await slider("extra", 1);
      await slider("x", 3);
      assert.equal(await page.locator(".flower").count(), 13);
      assert.equal(await page.locator("#extra-results tbody tr").count(), 6);
      assert.equal(
        await page
          .locator("#extra-results tbody tr")
          .last()
          .locator("td")
          .last()
          .innerText(),
        "21",
      );
    },
  );
  await check(
    "linear and quadratic graph missions, probe, dragging and keyboard",
    async () => {
      await open("graphs");
      await slider("slope", 2);
      await slider("probe", 2);
      assert.match(
        await page.locator("#learn-feedback").getAttribute("class"),
        /success/,
      );
      assert.equal(
        await page.locator("#learn-metrics strong").last().innerText(),
        "4",
      );
      await page.locator("#family").selectOption("quadratic");
      await slider("slope", 0);
      await slider("curve", 1);
      assert.equal(
        await page.locator("#learn-metrics strong").last().innerText(),
        "4",
      );
      const box = await page.locator("#learning-stage svg").boundingBox();
      await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5);
      await page.mouse.down();
      await page.mouse.move(
        box.x + box.width * 0.65,
        box.y + box.height * 0.5,
        { steps: 5 },
      );
      await page.mouse.up();
      assert.notEqual(await page.locator("#probe").inputValue(), "2");
      await page.locator("#probe").focus();
      const x = Number(await page.locator("#probe").inputValue());
      await page.keyboard.press("ArrowLeft");
      assert.equal(Number(await page.locator("#probe").inputValue()), x - 0.5);
      await page.screenshot({
        path: "test-results/graph-mission.png",
        fullPage: true,
      });
    },
  );
  await page.clock.install();
  await check(
    "dice batch totals, prediction and five-second single roll",
    async () => {
      await open("dice");
      for (const n of [10, 100, 1000]) await page.locator("#run-" + n).click();
      assert.equal(await total(), 1110);
      const counts = await page
        .locator("#trial-table tbody tr td:first-of-type")
        .allTextContents();
      assert.equal(
        counts.reduce((sum, n) => sum + Number(n.replace(/,/g, "")), 0),
        1110,
      );
      await page.locator("#predictFace").selectOption("2");
      await slider("prediction", 50);
      assert.match(await page.locator("#learn-formula").innerText(), /50%/);
      await page.locator("#learn-play").click();
      await page.clock.runFor(2500);
      assert.ok(
        Math.abs(
          Number(await page.locator("#learn-progress").inputValue()) - 0.5,
        ) < 0.025,
      );
      assert.equal(await total(), 1110);
      await page.clock.runFor(2600);
      assert.equal(await total(), 1111);
      await page.locator("#learn-reset").click();
      assert.equal(await total(), 0);
    },
  );
  await check(
    "spinner weighting, impossible outcomes, resets and paused five-second spin",
    async () => {
      await open("spinner");
      await slider("weight-0", 0);
      await slider("weight-2", 0);
      await slider("weight-1", 0);
      assert.equal(await page.locator("#weight-1").inputValue(), "1");
      assert.match(
        await page.locator("#learn-feedback").innerText(),
        /at least one/,
      );
      await page.locator("#run-1000").click();
      const cells = await page
        .locator("#trial-table tbody tr td:first-of-type")
        .allTextContents();
      assert.deepEqual(
        cells.map((n) => Number(n.replace(/,/g, ""))),
        [0, 1000, 0],
      );
      await slider("weight-0", 2);
      assert.equal(await total(), 0);
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.locator("#learn-play").click();
      await page.clock.runFor(1000);
      await page.locator("#learn-play").click();
      const p = await page.locator("#learn-progress").inputValue();
      await page.clock.runFor(1000);
      assert.equal(await page.locator("#learn-progress").inputValue(), p);
      await page.locator("#learn-play").click();
      await page.clock.runFor(4100);
      assert.equal(await total(), 1);
      assert.equal(await page.locator("#learn-progress").inputValue(), "1");
      await page.screenshot({
        path: "test-results/probability-spinner.png",
        fullPage: true,
      });
    },
  );
  await check(
    "new activities keep state on language changes and have Portuguese text",
    async () => {
      for (const id of Object.keys(subjects)) {
        await open(id);
        const key =
          id === "fractions"
            ? "n"
            : id === "ratios"
              ? "a"
              : id === "graphs"
                ? "slope"
                : id === "variables"
                  ? "x"
                  : null;
        if (key) await slider(key, 2);
        await page.locator("#language").selectOption("pt");
        assert.equal(await page.locator("html").getAttribute("lang"), "pt-BR");
        if (key) assert.equal(await page.locator("#" + key).inputValue(), "2");
        const body = await page.locator("main").innerText();
        assert.ok(
          !/undefined|NaN|Coming next|YOUR DISCOVERY MISSION|Reset experiment/.test(
            body,
          ),
        );
        assert.match(body, /SUA MISSÃO/);
        await page.locator("#language").selectOption("en");
      }
    },
  );
  await check(
    "all new activities fit desktop tablet and small phone widths in both languages",
    async () => {
      for (const width of [820, 390, 320]) {
        await page.setViewportSize({ width, height: 844 });
        for (const language of ["en", "pt"]) {
          await page.locator("#language").selectOption(language);
          for (const id of Object.keys(subjects)) {
            await open(id);
            assert.ok(
              await page.evaluate(
                () => document.documentElement.scrollWidth <= innerWidth,
              ),
              `${id} ${language} ${width} overflow`,
            );
          }
        }
      }
      await page.screenshot({
        path: "test-results/probability-mobile.png",
        fullPage: true,
      });
    },
  );
  await check(
    "new activities reset their controls and trial history",
    async () => {
      for (const [id, key, value, initial] of [
        ["fractions", "n", 3, 1],
        ["equivalent", "k", 6, 2],
        ["ratios", "batches", 6, 1],
        ["balance", "x", 12, 1],
        ["variables", "x", 8, 1],
        ["graphs", "slope", 4, 1],
      ]) {
        await open(id);
        await slider(key, value);
        await page.locator("#learn-reset").click();
        assert.equal(
          Number(await page.locator("#" + key).inputValue()),
          initial,
        );
      }
      for (const id of ["dice", "spinner"]) {
        await open(id);
        await page.locator("#run-10").click();
        assert.equal(await total(), 10);
        await page.locator("#learn-reset").click();
        assert.equal(await total(), 0);
      }
    },
  );
  await check("touchscreen fraction selection works on a phone", async () => {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    const mobile = await context.newPage();
    try {
      await mobile.goto(base);
      await mobile.locator('[data-subject="fractions"]').tap();
      await mobile.locator('[data-activity="fractions"]').tap();
      await mobile.locator('[data-piece="2"]').tap();
      assert.equal(await mobile.locator("#n").inputValue(), "2");
    } finally {
      await context.close();
    }
  });
  await check(
    "return to geometry still creates a working 3D viewer",
    async () => {
      await page.locator("#back").click();
      await page.locator('[data-subject="volume"]').click();
      await page.locator('[data-activity="cube"]').click();
      await page.locator("#stage canvas").waitFor();
    },
  );
  await check("no unexpected browser errors", async () =>
    assert.deepEqual(errors, []),
  );
} finally {
  await writeFile(
    "test-results/learning-browser-report.json",
    JSON.stringify({ results, errors }, null, 2),
  );
  await browser.close();
}
if (results.some((r) => !r.passed)) process.exitCode = 1;
