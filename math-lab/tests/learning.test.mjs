import { test } from "node:test";
import assert from "node:assert/strict";
import {
  fraction,
  equivalent,
  ratio,
  equation,
  functionValue,
  probabilities,
  weightedIndex,
  randomInt,
  runTrials,
} from "../src/learning-math.js";
import { learningActivities, learningUI } from "../src/learning-data.js";
test("fraction simplification, zero and improper sums are exact", () => {
  assert.deepEqual(fraction(0, 8), { value: 0, n: 0, d: 1 });
  assert.deepEqual(fraction(6, 8), { value: 0.75, n: 3, d: 4 });
  assert.deepEqual(fraction(10, 4), { value: 2.5, n: 5, d: 2 });
  for (let d = 1; d <= 12; d++)
    for (let n = 0; n <= d; n++)
      assert.equal(fraction(n, d).value + fraction(d - n, d).value, 1);
});
test("subdivision preserves fractions and rejects unequal quantities", () => {
  for (let d = 2; d <= 8; d++)
    for (let n = 0; n <= d; n++)
      for (let k = 1; k <= 6; k++) assert.ok(equivalent(n, d, n * k, d * k));
  assert.equal(equivalent(1, 2, 2, 6), false);
});
test("ratio scaling preserves both recipe and share", () => {
  for (let a = 1; a <= 6; a++)
    for (let b = 1; b <= 6; b++)
      for (let k = 1; k <= 6; k++) {
        const r = ratio(a, b, k);
        assert.equal(r.a / r.b, a / b);
        assert.equal(r.first, r.a / r.total);
      }
  assert.deepEqual(ratio(4, 6).simple, [2, 3]);
});
test("equivalent balance operations preserve solutions throughout challenge range", () => {
  for (let a = 1; a <= 4; a++)
    for (let b = 0; b <= 12; b++)
      for (let x = 0; x <= 12; x++) {
        const c = a * x + b;
        assert.equal(equation(a, b, c, x).equal, true);
        assert.equal(equation(a, b + 2, c + 2, x).solution, x);
        assert.equal(equation(a, 0, c - b, x).solution, x);
        assert.equal(equation(1, 0, (c - b) / a, x).solution, x);
      }
});
test("linear and quadratic graph evaluations are consistent with displayed points", () => {
  assert.equal(functionValue(0, 2, 0, 2), 4);
  assert.equal(functionValue(1, 0, 0, 2), 4);
  for (let x = -6; x <= 6; x += 0.5) {
    assert.equal(functionValue(0, 3, 2, x), 3 * x + 2);
    assert.equal(functionValue(1, -2, 3, x), x * x - 2 * x + 3);
  }
});
test("weighted sampling covers exactly the intended tickets including zero sectors", () => {
  assert.deepEqual(probabilities([0, 2, 1]), [0, 2 / 3, 1 / 3]);
  assert.equal(weightedIndex([0, 2, 1], 0), 1);
  assert.equal(weightedIndex([0, 2, 1], 1), 1);
  assert.equal(weightedIndex([0, 2, 1], 2), 2);
  assert.equal(weightedIndex([0, 1, 0], 0), 1);
});
test("random integer rejection discards biased tail values", () => {
  let sequence = [0xffffffff, 0xfffffffe, 7];
  assert.equal(
    randomInt(6, () => sequence.shift()),
    1,
  );
  assert.equal(sequence.length, 0);
  assert.equal(
    randomInt(1, () => 0xffffffff),
    0,
  );
});
test("batch trials accumulate without mutating previous experiment data", () => {
  let ticket = -1;
  const old = [3, 2, 1];
  const result = runTrials([2, 1, 1], 100, old, (max) => ++ticket % max);
  assert.deepEqual(result.counts, [53, 27, 26]);
  assert.equal(result.total, 106);
  assert.deepEqual(old, [3, 2, 1]);
  const only = runTrials([0, 1, 0], 1000);
  assert.deepEqual(only.counts, [0, 1000, 0]);
});
test("dice faces get one equally likely ticket each", () => {
  let n = -1;
  assert.deepEqual(
    runTrials([1, 1, 1, 1, 1, 1], 600, undefined, (max) => ++n % max).counts,
    [100, 100, 100, 100, 100, 100],
  );
});
test("invalid fractions, ratios, distributions and randomness are rejected", () => {
  for (const fn of [
    () => fraction(1, 0),
    () => fraction(-1, 4),
    () => fraction(1.5, 4),
    () => ratio(0, 2),
    () => probabilities([0, 0]),
    () => probabilities([-1, 2]),
    () => weightedIndex([1, 2], 3),
    () => randomInt(0),
    () => randomInt(6, () => NaN),
    () => runTrials([1, 1], 1001),
  ])
    assert.throws(fn, RangeError);
});
test("all eight new activity definitions and controls have EN/PT-BR text", () => {
  assert.equal(learningActivities.length, 8);
  assert.deepEqual(
    Object.keys(learningUI.en).sort(),
    Object.keys(learningUI.pt).sort(),
  );
  for (const lang of Object.values(learningUI))
    for (const value of Object.values(lang))
      assert.ok(typeof value === "string" && value.length);
  for (const a of learningActivities)
    for (const key of [
      "title",
      "tag",
      "description",
      "explain",
      "deep",
      "challenge",
    ])
      assert.equal(a[key].length, 2);
});
