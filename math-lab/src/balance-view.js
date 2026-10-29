import { fraction } from "./learning-math.js";
export function balanceNumber(value, s, f) {
  if (s.xExact && Math.abs(value - s.xExact[0] / s.xExact[1]) < 1e-9) {
    const v = fraction(...s.xExact);
    return v.d === 1 ? f(v.n) : `${v.n}/${v.d}`;
  }
  return f(value);
}
export function balanceModel(s, u, f) {
  const n = s.coefficient,
    xLabel = balanceNumber(s.x, s, f),
    full = Math.floor(s.x + 1e-10),
    partial = Math.max(0, s.x - full);
  const groupValue = s.xExact ? fraction(...s.xExact) : null;
  const fractionLabel = groupValue
    ? `${groupValue.n % groupValue.d}/${groupValue.d}`
    : f(partial);
  const tiles = (count, kind) =>
    Array.from(
      { length: count },
      () => `<span class="algebra-unit ${kind}" aria-hidden="true">1</span>`,
    ).join("");
  const group = () =>
    `<div class="x-group" data-x-group role="group" aria-label="x = ${xLabel}"><div class="x-group-heading">x = <strong>${xLabel}</strong></div><div class="algebra-unit-grid">${tiles(full, "x-unit")}${partial > 1e-9 ? `<span class="algebra-unit partial-unit" data-fraction="${partial}" style="--fill:${partial * 100}%" aria-label="${fractionLabel} ${u.ofUnit}"><span>${fractionLabel}</span></span>` : ""}${s.x < 1e-9 ? `<span class="zero-units">0</span>` : ""}</div></div>`;
  const left = n * s.x + s.constant,
    relation =
      Math.abs(left - s.rhs) < 1e-9 ? "=" : left < s.rhs ? "&lt;" : "&gt;";
  const repeated = Array.from({ length: n }, () => "x").join(" + "),
    values = Array.from({ length: n }, () => xLabel).join(" + ");
  const leftLabel = s.xExact
    ? (() => {
        const v = fraction(
          n * s.xExact[0] + s.constant * s.xExact[1],
          s.xExact[1],
        );
        return v.d === 1 ? f(v.n) : `${v.n}/${v.d}`;
      })()
    : f(left);
  return `<div class="algebra-model"><div class="multiplication-story"><p class="eyebrow">${u.seeMultiplication}</p><h2><span>${n}x</span> = ${repeated}</h2><p>${n} × ${xLabel} = ${values} = <strong>${balanceNumber(n * s.x, { ...s, xExact: s.xExact ? [n * s.xExact[0], s.xExact[1]] : null }, f)}</strong></p><p class="model-instruction">${u.equalGroups}</p></div><div class="algebra-sides"><section class="algebra-side"><h3>${u.left}</h3><div class="x-group-list" style="--groups:${n}">${Array.from({ length: n }, group).join("")}</div><p class="addition-symbol">+ <span>${s.constant} ${u.extraOnes}</span></p><div class="constant-group" role="group" aria-label="${s.constant} ${u.extraOnes}"><div class="algebra-unit-grid">${tiles(s.constant, "constant-unit")}${s.constant === 0 ? '<span class="zero-units">0</span>' : ""}</div></div><p class="side-calculation">${n} × ${xLabel} + ${s.constant} = <b>${leftLabel}</b></p></section><section class="algebra-side"><h3>${u.rightTotal}</h3><p class="rhs-label">${s.rhs} ${u.unitOnes}</p><div class="rhs-group" role="group" aria-label="${s.rhs} ${u.unitOnes}"><div class="algebra-unit-grid">${tiles(s.rhs, "rhs-unit")}${s.rhs === 0 ? '<span class="zero-units">0</span>' : ""}</div></div><p class="side-calculation">${u.rightTotal} = <b>${s.rhs}</b></p></section></div><div class="algebra-comparison"><span>${leftLabel}</span><strong>${relation}</strong><span>${s.rhs}</span></div><p class="algebra-unit-key"><span class="key-square"></span> 1 = ${u.oneUnit} · ${u.partialUnits}</p></div>`;
}
