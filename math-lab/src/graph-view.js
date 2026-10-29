import {
  GRAPH_FAMILIES,
  isTrig,
  graphValue,
  graphPoles,
  graphSegments,
  graphPeriod,
  graphAngleLabel,
} from "./graph-math.js";
export function graphControls(s, u, range, select, button) {
  return (
    select(
      "family",
      u.family,
      GRAPH_FAMILIES.map((id) => [id, u[id]]),
      s.family,
    ) +
    range("curve", u.curve, -2, 2, s.curve, 0.5) +
    range("slope", u.slope, -4, 4, s.slope, 0.5) +
    range("intercept", u.intercept, -6, 6, s.intercept, 0.5) +
    select(
      "angleUnit",
      u.angleUnit,
      [
        ["radians", u.radians],
        ["degrees", u.degrees],
      ],
      s.angleUnit,
    ) +
    range("amplitude", u.amplitude, -4, 4, s.amplitude, 0.25) +
    range("frequency", u.frequency, 0.25, 3, s.frequency, 0.25) +
    range("phase", u.phase, -2 * Math.PI, 2 * Math.PI, s.phase, "any") +
    range("offset", u.offset, -5, 5, s.offset, 0.5) +
    range("expBase", u.expBase, 1.25, 4, s.expBase, 0.25) +
    `<label class="toggle graph-compare"><input type="checkbox" id="compare-waves" ${s.compare ? "checked" : ""}><span>${u.compareWaves}</span></label>` +
    button("shift-quarter", u.shiftQuarter) +
    range("probe", u.probe, -6, 6, s.probe, "any") +
    button("probe-quarter", u.probeQuarter) +
    range("span", u.xRange, 2, 20, s.span, 1) +
    range("ySpan", u.yRange, 1, 20, s.ySpan, 0.5) +
    button("reset-graph-view", u.resetView)
  );
}
export function syncGraphControls(host, s, u, f) {
  const q = (id) => host.querySelector("#" + id),
    trig = isTrig(s),
    poly = ["linear", "quadratic"].includes(s.family);
  const show = (key, visible) => {
    const node = q(key);
    if (node) {
      node.hidden = !visible;
      const label = host.querySelector(`label[for="${key}"]`);
      if (label) label.hidden = !visible;
    }
  };
  show("curve", s.family === "quadratic");
  show("slope", poly);
  show("intercept", poly);
  for (const key of ["amplitude", "frequency", "phase", "offset"])
    show(key, !poly);
  show("expBase", s.family === "exponential");
  show("angleUnit", trig);
  host.querySelector(".graph-compare").hidden = !trig;
  q("compare-waves").checked = s.compare;
  q("shift-quarter").hidden = s.family !== "sine";
  q("shift-quarter").disabled = s.family !== "sine";
  q("probe-quarter").hidden = !trig;
  q("phase").min = trig
    ? s.angleUnit === "degrees"
      ? -360
      : -2 * Math.PI
    : -6;
  q("phase").max = trig ? (s.angleUnit === "degrees" ? 360 : 2 * Math.PI) : 6;
  q("phase").step = trig
    ? s.angleUnit === "degrees"
      ? 15
      : Math.PI / 12
    : 0.25;
  q("span").min = trig ? (s.angleUnit === "degrees" ? 90 : Math.PI) : 2;
  q("span").max = trig ? (s.angleUnit === "degrees" ? 720 : 4 * Math.PI) : 20;
  q("span").step = trig ? (s.angleUnit === "degrees" ? 90 : Math.PI / 2) : 1;
  q("probe").min = -s.span;
  q("probe").max = s.span;
  q("probe").step = trig ? "any" : 0.5;
  for (const key of ["phase", "span", "probe"]) {
    q(key).value = s[key];
    host.querySelector("#out-" + key).textContent =
      trig && s.angleUnit === "radians"
        ? graphAngleLabel(s[key], f)
        : f(s[key]);
  }
  q("shift-quarter").textContent = u.shiftQuarter;
  q("probe-quarter").textContent =
    `${u.probeQuarter} (${s.angleUnit === "degrees" ? "90°" : "π/2"})`;
}
function signed(v, f) {
  return v < 0 ? " − " + f(-v) : " + " + f(v);
}
export function graphFormula(s, f) {
  if (s.family === "linear")
    return `y = ${f(s.slope)}x${signed(s.intercept, f)}`;
  if (s.family === "quadratic")
    return `y = ${f(s.curve)}x²${signed(s.slope, f)}x${signed(s.intercept, f)}`;
  const phase =
    isTrig(s) && s.angleUnit === "radians"
      ? graphAngleLabel(Math.abs(s.phase), f)
      : f(Math.abs(s.phase));
  const shifted =
      s.phase === 0 ? "x" : `(x ${s.phase < 0 ? "+" : "−"} ${phase})`,
    arg = s.frequency === 1 ? shifted : `${f(s.frequency)}${shifted}`;
  const name = {
    sine: "sin",
    cosine: "cos",
    tangent: "tan",
    cotangent: "cot",
    secant: "sec",
    cosecant: "csc",
    logarithm: "ln",
  }[s.family];
  const expression = name
    ? `${name}(${arg})`
    : s.family === "absolute"
      ? `|${arg}|`
      : s.family === "sqrt"
        ? `√(${arg})`
        : s.family === "reciprocal"
          ? `1/(${arg})`
          : s.family === "exponential"
            ? `${f(s.expBase)}^(${arg})`
            : `(${arg})³`;
  return `y = ${f(s.amplitude)} · ${expression}${signed(s.offset, f)}`;
}
export function graphDomain(s, u) {
  if (s.family === "sqrt") return u.domainSqrt;
  if (s.family === "logarithm") return u.domainLog;
  if (s.family === "reciprocal") return u.domainReciprocal;
  if (["tangent", "secant"].includes(s.family)) return u.domainCos;
  if (["cotangent", "cosecant"].includes(s.family)) return u.domainSin;
  return u.domainAll;
}
export function graphModel(s, u, f) {
  const x0 = 70,
    y0 = 40,
    w = 500,
    h = 320,
    cx = 320,
    cy = 200,
    X = (x) => cx + ((x / s.span) * w) / 2,
    Y = (y) => cy - ((y / s.ySpan) * h) / 2;
  const label = (x, y, value, color = "#526c5a", size = 12) =>
    `<text x="${x}" y="${y}" text-anchor="middle" fill="${color}" font-size="${size}" font-family="system-ui">${value}</text>`;
  const trig = isTrig(s),
    radians = trig && s.angleUnit === "radians",
    xTick = trig ? (radians ? s.span / 4 : s.span / 4) : s.span <= 8 ? 2 : 4,
    yTick = s.ySpan <= 4 ? 1 : s.ySpan <= 10 ? 2 : 4;
  let grid = "";
  for (let i = -4; i <= 4; i++) {
    const x = i * xTick;
    if (x < -s.span - 1e-8 || x > s.span + 1e-8) continue;
    grid += `<path d="M${X(x)} ${y0}V${y0 + h}" stroke="#d4dfd3"/>${label(X(x), y0 + h + 22, radians ? graphAngleLabel(x, f) : f(x))}`;
  }
  // Non-trigonometric zooms may span more than four tick intervals.
  if (!trig)
    for (
      let n = -Math.floor(s.span / xTick);
      n <= Math.floor(s.span / xTick);
      n++
    ) {
      if (Math.abs(n) <= 4) continue;
      const x = n * xTick;
      grid += `<path d="M${X(x)} ${y0}V${y0 + h}" stroke="#d4dfd3"/>${label(X(x), y0 + h + 22, f(x))}`;
    }
  for (
    let n = -Math.floor(s.ySpan / yTick);
    n <= Math.floor(s.ySpan / yTick);
    n++
  ) {
    const y = n * yTick;
    grid += `<path d="M${x0} ${Y(y)}H${x0 + w}" stroke="#d4dfd3"/>${label(x0 - 25, Y(y) + 4, f(y))}`;
  }
  const drawPaths = (settings, color, width = 3, dash = "") =>
    graphSegments(settings, -s.span, s.span)
      .map(
        (points) =>
          `<path class="function-curve" data-function="${settings.family}" d="${points.map(([x, y], i) => `${i ? "L" : "M"}${X(x)} ${Math.max(-10000, Math.min(10000, Y(y)))}`).join(" ")}" fill="none" stroke="${color}" stroke-width="${width}" ${dash ? `stroke-dasharray="${dash}"` : ""}/>`,
      )
      .join("");
  // Zero vertical scale preserves domain holes, but their limits are finite.
  const poles = s.amplitude === 0 ? [] : graphPoles(s, -s.span, s.span),
    asymptotes = poles
      .map(
        (x) =>
          `<path class="graph-asymptote" d="M${X(x)} ${y0}V${y0 + h}" stroke="#b2674f" stroke-width="1.5" stroke-dasharray="5 5"/>`,
      )
      .join("");
  let curves = "";
  if (trig && s.compare) {
    const base = { ...s, amplitude: 1, frequency: 1, phase: 0, offset: 0 };
    curves +=
      drawPaths({ ...base, family: "sine" }, "#426ca7", 2, "7 4") +
      drawPaths({ ...base, family: "cosine" }, "#b47129", 2, "2 4");
  }
  curves += drawPaths(s, "#267565", 3.5);
  const y = graphValue(s, s.probe),
    probe =
      y !== null
        ? `<circle class="graph-probe" cx="${X(s.probe)}" cy="${Math.max(-10000, Math.min(10000, Y(y)))}" r="8" fill="#8a6db5" stroke="white" stroke-width="3"/>`
        : "";
  const beacon = `<circle cx="${X(s.beacon[0])}" cy="${Y(s.beacon[1])}" r="10" fill="#dda652" stroke="#916324" stroke-width="2"/><path d="M${X(s.beacon[0]) - 15} ${Y(s.beacon[1])}h30M${X(s.beacon[0])} ${Y(s.beacon[1]) - 15}v30" stroke="#916324"/>`;
  const xLabel = radians ? graphAngleLabel(s.probe, f) : f(s.probe),
    probeLabel =
      y === null
        ? `${u.undefinedValue}: x = ${xLabel}`
        : Math.abs(y) > s.ySpan
          ? u.outside
          : `(${xLabel}, ${f(y)})`;
  const chart = `<svg viewBox="0 0 640 440" role="img" aria-label="${u.graphAccessible}"><defs><clipPath id="graph-clip"><rect x="${x0}" y="${y0}" width="${w}" height="${h}"/></clipPath></defs>${grid}<path d="M${x0} ${cy}H${x0 + w}M${cx} ${y0}V${y0 + h}" stroke="#6d8370" stroke-width="2"/><g clip-path="url(#graph-clip)">${asymptotes}${curves}${beacon}${probe}</g>${label(583, 205, "x", "#31594c", 18)}${label(337, 28, "y", "#31594c", 18)}${label(320, 420, probeLabel, "#31594c", y === null || Math.abs(y) > s.ySpan ? 13 : 18)}${trig ? label(320, 399, s.angleUnit === "degrees" ? u.degrees : u.radians) : ""}</svg>`;
  const period = graphPeriod(s),
    quarter = s.angleUnit === "degrees" ? 90 : Math.PI / 2,
    aligned =
      s.family === "sine" &&
      s.amplitude === 1 &&
      s.frequency === 1 &&
      s.offset === 0 &&
      Math.abs(s.phase + quarter) < 1e-9;
  return `${chart}<div class="graph-legend"><span><i class="selected-line"></i>${u.selectedCurve}</span>${trig && s.compare ? `<span><i class="sine-line"></i>sin(x)</span><span><i class="cosine-line"></i>cos(x)</span>` : ""}${poles.length ? `<span><i class="pole-line"></i>${u.asymptote}</span>` : ""}</div><p class="graph-domain">${graphDomain(s, u)}</p>${period ? `<p class="graph-period">${u.period}: ≈ ${f(period)} ${s.angleUnit === "degrees" ? "°" : u.radians}</p>` : ""}${aligned ? `<p class="graph-identity">sin(x + ${s.angleUnit === "degrees" ? "90°" : "π/2"}) = cos(x)<br>${u.quarterIdentity}</p>` : ""}`;
}

export function graphInputLabel(s, f, x = s.probe) {
  return isTrig(s) && s.angleUnit === "radians" ? graphAngleLabel(x, f) : f(x);
}
