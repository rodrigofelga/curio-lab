export function gcd(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a;
}
export function fraction(n, d) {
  if (!Number.isInteger(n) || !Number.isInteger(d) || n < 0 || d < 1)
    throw new RangeError("Invalid fraction");
  const g = gcd(n, d);
  return { value: n / d, n: n / g, d: d / g };
}
export function equivalent(a, b, c, d) {
  fraction(a, b);
  fraction(c, d);
  return a * d === c * b;
}
export function ratio(a, b, k = 1) {
  if (![a, b, k].every((v) => Number.isInteger(v) && v > 0))
    throw new RangeError("Invalid ratio");
  const g = gcd(a, b);
  return {
    a: a * k,
    b: b * k,
    total: (a + b) * k,
    first: a / (a + b),
    simple: [a / g, b / g],
  };
}
export function equation(a, b, c, x) {
  if (![a, b, c, x].every(Number.isFinite) || a <= 0)
    throw new RangeError("Invalid equation");
  return {
    left: a * x + b,
    right: c,
    solution: (c - b) / a,
    equal: Math.abs(a * x + b - c) < 1e-9,
  };
}
export function functionValue(a, m, b, x) {
  if (![a, m, b, x].every(Number.isFinite))
    throw new RangeError("Invalid function");
  return a * x * x + m * x + b;
}
export function probabilities(weights) {
  if (!weights.length || !weights.every((v) => Number.isInteger(v) && v >= 0))
    throw new RangeError("Invalid weights");
  const total = weights.reduce((a, b) => a + b, 0);
  if (total === 0) throw new RangeError("Empty distribution");
  return weights.map((w) => w / total);
}
export function weightedIndex(weights, ticket) {
  probabilities(weights);
  const sum = weights.reduce((a, b) => a + b, 0);
  if (!Number.isInteger(ticket) || ticket < 0 || ticket >= sum)
    throw new RangeError("Invalid ticket");
  let acc = 0;
  for (let i = 0; i < weights.length; i++) {
    acc += weights[i];
    if (ticket < acc) return i;
  }
}
// Rejection sampling avoids modulo bias. The injectable source supports deterministic tests.
export function randomInt(
  max,
  source = () => crypto.getRandomValues(new Uint32Array(1))[0],
) {
  if (!Number.isInteger(max) || max < 1 || max > 0x100000000)
    throw new RangeError("Invalid bound");
  const limit = Math.floor(0x100000000 / max) * max;
  let n;
  do {
    n = source();
    if (!Number.isInteger(n) || n < 0 || n >= 0x100000000)
      throw new RangeError("Invalid random word");
  } while (n >= limit);
  return n % max;
}
export function runTrials(
  weights,
  count,
  counts = weights.map(() => 0),
  random = randomInt,
) {
  probabilities(weights);
  if (
    !Number.isInteger(count) ||
    count < 1 ||
    count > 1000 ||
    counts.length !== weights.length ||
    !counts.every((v) => Number.isInteger(v) && v >= 0)
  )
    throw new RangeError("Invalid trials");
  const next = [...counts],
    total = weights.reduce((a, b) => a + b, 0);
  let last;
  for (let i = 0; i < count; i++) {
    last = weightedIndex(weights, random(total));
    next[last]++;
  }
  return { counts: next, last, total: next.reduce((a, b) => a + b, 0) };
}
