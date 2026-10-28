export function positive(n) {
  if (!Number.isFinite(n) || n <= 0)
    throw new RangeError("Positive finite dimension required");
  return n;
}
export function rectangle(w, h) {
  positive(w);
  positive(h);
  return { area: w * h, perimeter: 2 * (w + h) };
}
export function triangle(b, h) {
  return { area: (positive(b) * positive(h)) / 2 };
}
export function circle(r) {
  positive(r);
  return { area: Math.PI * r * r, circumference: 2 * Math.PI * r };
}
export function prism(l, w, h) {
  positive(l);
  positive(w);
  positive(h);
  return { volume: l * w * h, surface: 2 * (l * w + l * h + w * h) };
}
export function cube(s) {
  return prism(s, s, s);
}
export function cylinder(r, h) {
  return { volume: circle(r).area * positive(h) };
}
export function cone(r, h) {
  return { volume: cylinder(r, h).volume / 3 };
}
export function sphere(r) {
  return { volume: (4 / 3) * Math.PI * positive(r) ** 3 };
}
export function sphereSlice(r, y) {
  positive(r);
  if (!Number.isFinite(y) || Math.abs(y) > r)
    throw new RangeError("Slice outside sphere");
  return Math.PI * Math.max(0, r * r - y * y);
}
// A cone filled from its tip: similar solids make volume proportional to depth cubed.
export function coneFillDepth(h, fraction) {
  positive(h);
  if (!Number.isFinite(fraction) || fraction < 0 || fraction > 1)
    throw new RangeError("Invalid fill");
  return h * Math.cbrt(fraction);
}
export function measure(id, s) {
  switch (id) {
    case "rectangle":
    case "challenge":
      return rectangle(s.w, s.h);
    case "triangle":
      return triangle(s.w, s.h);
    case "circle":
      return circle(s.r);
    case "cube":
    case "scale":
      return cube(s.w);
    case "prism":
      return prism(s.w, s.d, s.h);
    case "cylinder":
      return cylinder(s.r, s.h);
    case "cone":
      return {
        volume: cone(s.r, s.h).volume,
        cylinder: cylinder(s.r, s.h).volume,
      };
    case "sphere":
      return {
        ...sphere(s.r),
        slice: sphereSlice(s.r, s.slice * s.r),
        cylinder: cylinder(s.r, 2 * s.r).volume,
      };
    default:
      throw new Error("Unknown activity");
  }
}
export function challengeFeedback(w, h, mode) {
  if (mode === "area") return w * h === 24 && 2 * (w + h) !== 20;
  if (mode === "perimeter") return 2 * (w + h) === 20 && w * h !== 24;
  return w * h === 36;
}
