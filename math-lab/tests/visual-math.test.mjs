import { test } from "node:test";
import assert from "node:assert/strict";
import {
  GRAPH_FAMILIES,
  graphValue,
  graphPoles,
  graphSegments,
  graphPeriod,
  graphAngleLabel,
} from "../src/graph-math.js";
import { balanceModel } from "../src/balance-view.js";
import { learningDefaults } from "../src/learning.js";
import { learningUI } from "../src/learning-data.js";
const base = {
  ...learningDefaults("graphs"),
  amplitude: 1,
  frequency: 1,
  phase: 0,
  offset: 0,
  expBase: 2,
  angleUnit: "radians",
};
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} ≠ ${b}`);
test("all fourteen families evaluate representative analytic values", () => {
  const cases = {
    linear: [2, 2],
    quadratic: [2, 6],
    cubic: [2, 8],
    absolute: [-2, 2],
    sqrt: [4, 2],
    reciprocal: [2, 0.5],
    exponential: [3, 8],
    logarithm: [Math.E, 1],
    sine: [Math.PI / 2, 1],
    cosine: [0, 1],
    tangent: [Math.PI / 4, 1],
    cotangent: [Math.PI / 4, 1],
    secant: [0, 1],
    cosecant: [Math.PI / 2, 1],
  };
  assert.equal(GRAPH_FAMILIES.length, 14);
  for (const [family, [x, y]] of Object.entries(cases))
    near(graphValue({ ...base, family }, x), y);
});
test("trig unit conversion and quarter-turn identity preserve values", () => {
  for (let x = -360; x <= 360; x += 15) {
    for (const family of [
      "sine",
      "cosine",
      "tangent",
      "cotangent",
      "secant",
      "cosecant",
    ]) {
      const deg = graphValue({ ...base, family, angleUnit: "degrees" }, x),
        rad = graphValue({ ...base, family }, (x * Math.PI) / 180);
      if (rad === null) assert.equal(deg, null);
      else near(deg, rad);
    }
    near(
      graphValue({ ...base, family: "sine", phase: -Math.PI / 2 }, x),
      Math.cos(x),
    );
  }
});
test("amplitude frequency phase and vertical shifts use A f(B(x-h))+k", () => {
  near(
    graphValue(
      {
        ...base,
        family: "sine",
        amplitude: 2,
        frequency: 2,
        phase: Math.PI / 4,
        offset: 3,
      },
      Math.PI / 2,
    ),
    5,
  );
  near(
    graphValue(
      {
        ...base,
        family: "sqrt",
        amplitude: 2,
        frequency: 2,
        phase: 1,
        offset: -3,
      },
      3,
    ),
    1,
  );
  near(
    graphValue({ ...base, family: "exponential", expBase: 3, phase: 1 }, 3),
    9,
  );
});
test("real domains and exact trig poles are undefined, not huge numbers", () => {
  for (const [family, x] of [
    ["sqrt", -1],
    ["logarithm", 0],
    ["logarithm", -1],
    ["reciprocal", 0],
    ["tangent", Math.PI / 2],
    ["secant", Math.PI / 2],
    ["cotangent", 0],
    ["cosecant", 0],
  ])
    assert.equal(graphValue({ ...base, family }, x), null);
  assert.ok(
    Number.isFinite(
      graphValue({ ...base, family: "tangent" }, Math.PI / 2 - 1e-6),
    ),
  );
});
test("no graph segment crosses a computed vertical asymptote", () => {
  for (const angleUnit of ["radians", "degrees"])
    for (const family of [
      "tangent",
      "cotangent",
      "secant",
      "cosecant",
      "reciprocal",
      "logarithm",
    ]) {
      const s = { ...base, family, angleUnit, frequency: 1.5, phase: 0.37 },
        span = angleUnit === "degrees" ? 360 : 8,
        poles = graphPoles(s, -span, span);
      for (const segment of graphSegments(s, -span, span, 501)) {
        const lo = segment[0][0],
          hi = segment.at(-1)[0];
        for (const p of poles)
          assert.ok(
            !(lo < p - 1e-10 && hi > p + 1e-10),
            `${family} crosses ${p}`,
          );
        for (const [x, y] of segment)
          assert.ok(Number.isFinite(x) && Number.isFinite(y));
      }
    }
});
test("periods distinguish sine/cosine from tangent/cotangent and constants", () => {
  near(graphPeriod({ ...base, family: "sine", frequency: 2 }), Math.PI);
  near(graphPeriod({ ...base, family: "tangent", frequency: 2 }), Math.PI / 2);
  near(
    graphPeriod({ ...base, family: "cotangent", angleUnit: "degrees" }),
    180,
  );
  assert.equal(graphPeriod({ ...base, family: "sine", amplitude: 0 }), null);
  assert.equal(graphAngleLabel(-Math.PI / 2, String), "−π/2");
  assert.equal(graphAngleLabel((3 * Math.PI) / 8, String), "3π/8");
});
test("2x contains two equal visible groups and addition stays separate", () => {
  const s = { ...learningDefaults("balance"), x: 4, constant: 8, rhs: 16 };
  const html = balanceModel(s, learningUI.en, String);
  assert.equal((html.match(/data-x-group/g) || []).length, 2);
  assert.equal((html.match(/algebra-unit x-unit/g) || []).length, 8);
  assert.equal((html.match(/algebra-unit constant-unit/g) || []).length, 8);
  assert.equal((html.match(/algebra-unit rhs-unit/g) || []).length, 16);
  assert.ok(html.includes("2x</span> = x + x"));
  assert.ok(html.includes("4 + 4"));
});
test("fractional x values show correct partial units in every group", () => {
  const s = { ...learningDefaults("balance"), x: 3.9 };
  const html = balanceModel(s, learningUI.en, (n) =>
    String(Math.round(n * 100) / 100),
  );
  assert.equal((html.match(/algebra-unit x-unit/g) || []).length, 6);
  assert.equal((html.match(/data-fraction=/g) || []).length, 2);
  const exact = balanceModel(
    { ...s, coefficient: 3, x: 13 / 3, xExact: [13, 3] },
    learningUI.en,
    String,
  );
  assert.ok(exact.includes("13/3"));
  assert.equal((exact.match(/algebra-unit x-unit/g) || []).length, 12);
});
import {graphModel} from '../src/graph-view.js';
test('zero vertical scale preserves holes without claiming vertical asymptotes',()=>{const s={...base,family:'reciprocal',amplitude:0};assert.equal(graphValue(s,0),null);assert.equal(graphValue(s,1),0);assert.ok(graphSegments(s,-8,8).length>1);assert.ok(!graphModel(s,learningUI.en,String).includes('graph-asymptote'));});
