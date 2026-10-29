export const GRAPH_FAMILIES = [
  "linear",
  "quadratic",
  "cubic",
  "absolute",
  "sqrt",
  "reciprocal",
  "exponential",
  "logarithm",
  "sine",
  "cosine",
  "tangent",
  "cotangent",
  "secant",
  "cosecant",
];
export const TRIG_FAMILIES = [
  "sine",
  "cosine",
  "tangent",
  "cotangent",
  "secant",
  "cosecant",
];
export const isTrig = (s) => TRIG_FAMILIES.includes(s.family);
export function graphValue(s, x) {
  if (!Number.isFinite(x)) return null;
  if (s.family === "linear") return s.slope * x + s.intercept;
  if (s.family === "quadratic")
    return s.curve * x * x + s.slope * x + s.intercept;
  const { amplitude: A = 1, frequency: B = 1, phase: h = 0, offset: k = 0 } = s;
  if (![A, B, h, k].every(Number.isFinite) || B <= 0)
    throw new RangeError("Invalid graph transformation");
  const u = B * (x - h),
    angle = u * (s.angleUnit === "degrees" ? Math.PI / 180 : 1);
  let value;
  switch (s.family) {
    case "cubic":
      value = u ** 3;
      break;
    case "absolute":
      value = Math.abs(u);
      break;
    case "sqrt":
      if (u < 0) return null;
      value = Math.sqrt(u);
      break;
    case "reciprocal":
      if (Math.abs(u) < 1e-12) return null;
      value = 1 / u;
      break;
    case "exponential":
      if (!Number.isFinite(s.expBase) || s.expBase <= 0)
        throw new RangeError("Invalid exponential base");
      value = s.expBase ** u;
      break;
    case "logarithm":
      if (u <= 0) return null;
      value = Math.log(u);
      break;
    case "sine":
      value = Math.sin(angle);
      break;
    case "cosine":
      value = Math.cos(angle);
      break;
    case "tangent":
      if (Math.abs(Math.cos(angle)) < 1e-10) return null;
      value = Math.tan(angle);
      break;
    case "cotangent":
      if (Math.abs(Math.sin(angle)) < 1e-10) return null;
      value = Math.cos(angle) / Math.sin(angle);
      break;
    case "secant":
      if (Math.abs(Math.cos(angle)) < 1e-10) return null;
      value = 1 / Math.cos(angle);
      break;
    case "cosecant":
      if (Math.abs(Math.sin(angle)) < 1e-10) return null;
      value = 1 / Math.sin(angle);
      break;
    default:
      throw new RangeError("Unknown function family");
  }
  const y = A * value + k;
  return Number.isFinite(y) ? y : null;
}
export function graphPoles(s, min, max) {
  const B = s.frequency ?? 1,
    h = s.phase ?? 0;
  if (["reciprocal", "logarithm"].includes(s.family))
    return h >= min && h <= max ? [h] : [];
  if (!["tangent", "cotangent", "secant", "cosecant"].includes(s.family))
    return [];
  const unit = s.angleUnit === "degrees" ? 180 : Math.PI,
    offset = ["tangent", "secant"].includes(s.family) ? unit / 2 : 0;
  const first = Math.ceil((B * (min - h) - offset) / unit),
    last = Math.floor((B * (max - h) - offset) / unit),
    poles = [];
  for (let n = first; n <= last; n++) poles.push(h + (offset + n * unit) / B);
  return poles;
}
export function graphSegments(s, min, max, samples = 640) {
  const poles = graphPoles(s, min, max),
    segments = [];
  let current = [],
    previous = null;
  for (let i = 0; i <= samples; i++) {
    const x = min + ((max - min) * i) / samples,
      y = graphValue(s, x);
    if (
      y === null ||
      (previous !== null &&
        poles.some((p) => p > previous + 1e-12 && p <= x + 1e-12))
    ) {
      if (current.length) segments.push(current);
      current = [];
    }
    if (y !== null) current.push([x, y]);
    previous = x;
  }
  if (current.length) segments.push(current);
  return segments;
}
export function graphPeriod(s) {
  if (!isTrig(s) || s.amplitude === 0) return null;
  const full = s.angleUnit === "degrees" ? 360 : 2 * Math.PI;
  return (
    (["tangent", "cotangent"].includes(s.family) ? full / 2 : full) /
    s.frequency
  );
}
export function graphTarget(s, n = 0) {
  const q = s.angleUnit === "degrees" ? 90 : Math.PI / 2;
  if (["linear", "quadratic"].includes(s.family))
    return [
      [2, 4],
      [-2, 2],
      [3, 3],
      [1, -2],
    ][n % 4];
  if (["sine", "cosecant"].includes(s.family)) return [q, 2 + (n % 2)];
  if (["cosine", "secant"].includes(s.family)) return [0, 2 + (n % 2)];
  if (["tangent", "cotangent"].includes(s.family)) return [q / 2, 2 + (n % 2)];
  if (s.family === "sqrt") return [4, 3 + (n % 2)];
  if (s.family === "reciprocal") return [1, 2 + (n % 2)];
  if (s.family === "logarithm") return [1, 1 + (n % 2)];
  return [1, 3 + (n % 2)];
}
export function graphAngleLabel(value, f) {
  const n = Math.round((value / Math.PI) * 48);
  if (Math.abs(value - (n * Math.PI) / 48) > 1e-8) return f(value);
  if (n === 0) return "0";
  let a = Math.abs(n),
    b = 48;
  const sign = n < 0 ? "−" : "";
  let g = a,
    v = b;
  while (v) [g, v] = [v, g % v];
  a /= g;
  b /= g;
  return `${sign}${a === 1 ? "" : a}π${b === 1 ? "" : "/" + b}`;
}
