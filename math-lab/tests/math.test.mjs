import { test } from "node:test";
import assert from "node:assert/strict";
import {
  rectangle,
  triangle,
  circle,
  cube,
  prism,
  cylinder,
  cone,
  sphere,
  sphereSlice,
  coneFillDepth,
  measure,
  challengeFeedback,
} from "../src/math.js";
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-8, `${a} ≠ ${b}`);
test("rectangle units and challenge cases", () => {
  assert.deepEqual(rectangle(6, 4), { area: 24, perimeter: 20 });
  assert.equal(challengeFeedback(3, 8, "area"), true);
  assert.equal(challengeFeedback(4, 6, "area"), false);
  assert.equal(challengeFeedback(5, 5, "perimeter"), true);
  assert.equal(challengeFeedback(6, 4, "perimeter"), false);
  assert.equal(challengeFeedback(6, 6, "target"), true);
});
test("triangle is half of corresponding rectangle across supported dimensions", () => {
  for (let b = 1; b <= 12; b++)
    for (let h = 1; h <= 10; h++)
      assert.equal(triangle(b, h).area * 2, rectangle(b, h).area);
});
test("circle area and circumference scale differently", () => {
  near(circle(3).area, 9 * Math.PI);
  near(circle(6).area / circle(3).area, 4);
  near(circle(6).circumference / circle(3).circumference, 2);
});
test("cube lattice matches layer counts across whole-number dimensions", () => {
  for (let l = 1; l <= 8; l++)
    for (let w = 1; w <= 8; w++)
      for (let h = 1; h <= 8; h++) {
        let count = 0;
        for (let y = 0; y < h; y++)
          for (let x = 0; x < l; x++) for (let z = 0; z < w; z++) count++;
        assert.equal(prism(l, w, h).volume, count);
      }
});
test("doubling cube length gives four times surface and eight times volume", () => {
  assert.equal(cube(4).surface / cube(2).surface, 4);
  assert.equal(cube(4).volume / cube(2).volume, 8);
});
test("cone cylinder comparison and conservative transfer", () => {
  for (let r = 1; r <= 6; r += 0.5)
    for (let h = 1; h <= 10; h += 0.5) {
      near(cone(r, h).volume * 3, cylinder(r, h).volume);
      for (const fraction of [0, 0.1, 0.25, 0.5, 1]) {
        const depth = coneFillDepth(h, fraction);
        if (fraction === 0) assert.equal(depth, 0);
        else
          near(
            cone((r * depth) / h, depth).volume,
            cone(r, h).volume * fraction,
          );
      }
    }
});
test("sphere equator and poles agree with slice geometry", () => {
  near(sphereSlice(3, 0), 9 * Math.PI);
  near(sphereSlice(3, -3), 0);
  near(sphereSlice(3, 3), 0);
  near(sphere(3).volume / cylinder(3, 6).volume, 2 / 3);
});
test("midpoint integration of cross sections converges to exact formulas", () => {
  const r = 3,
    h = 5,
    n = 10000;
  let vs = 0,
    vc = 0;
  for (let i = 0; i < n; i++) {
    const y = -r + ((i + 0.5) * 2 * r) / n;
    vs += (sphereSlice(r, y) * 2 * r) / n;
    const z = ((i + 0.5) * h) / n;
    vc += (Math.PI * ((r * z) / h) ** 2 * h) / n;
  }
  assert.ok(Math.abs(vs - sphere(r).volume) < 0.00001);
  assert.ok(Math.abs(vc - cone(r, h).volume) < 0.00001);
});
test("impossible numeric inputs are rejected", () => {
  for (const v of [0, -1, NaN, Infinity]) {
    assert.throws(() => circle(v), RangeError);
    assert.throws(() => rectangle(v, 2), RangeError);
    assert.throws(() => prism(2, 2, v), RangeError);
  }
  assert.throws(() => sphereSlice(2, 3));
  assert.throws(() => coneFillDepth(2, 1.1));
});
test("all ten activity calculations produce finite positive measurements", () => {
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
    const values = measure(id, { w: 4, h: 3, d: 3, r: 3, slice: 0 });
    for (const value of Object.values(values))
      assert.ok(Number.isFinite(value) && value > 0);
  }
});

import { activities, ui, subjects, future } from "../src/data.js";
test("every implemented activity and interface key has both translations", () => {
  assert.deepEqual(Object.keys(ui.en).sort(), Object.keys(ui.pt).sort());
  for (const a of activities)
    for (const key of [
      "title",
      "tag",
      "description",
      "explain",
      "deep",
      "challenge",
    ]) {
      assert.equal(a[key].length, 2);
      for (const text of a[key])
        assert.ok(typeof text === "string" && text.length > 0);
    }
  assert.equal(subjects.length, 6);
  assert.equal(activities.length, 18);
  assert.equal(Object.keys(future).length, 0);
});
