import {
  graphValue as evaluateGraph,
  isTrig,
  graphTarget,
} from "./graph-math.js";
import {
  graphControls,
  syncGraphControls,
  graphFormula,
  graphModel,
  graphInputLabel,
} from "./graph-view.js?v=zero-scale";
import { balanceModel, balanceNumber } from "./balance-view.js";
import {
  learningActivities,
  learningUI,
  references,
} from "./learning-data.js?v=20261028-visuals-trig";
import {
  fraction,
  equivalent,
  ratio,
  equation,
  probabilities,
  weightedIndex,
  randomInt,
  runTrials,
} from "./learning-math.js";
const ids = new Set(learningActivities.map((a) => a.id));
export function learningDefaults(id) {
  if (!ids.has(id)) return null;
  return {
    n: 1,
    d: 4,
    addend: 1,
    shape: "bar",
    combined: false,
    selected: [true, false, false, false],
    k: 2,
    right: 1,
    a: 2,
    b: 3,
    batches: 1,
    coefficient: 2,
    constant: 4,
    rhs: 12,
    x: 1,
    amount: 1,
    history: [],
    m: 3,
    extra: 2,
    family: "linear",
    curve: 1,
    slope: 1,
    intercept: 0,
    probe: 0,
    span: 8,
    ySpan: 8,
    amplitude: 1,
    frequency: 1,
    phase: 0,
    offset: 0,
    expBase: 2,
    angleUnit: "radians",
    compare: false,
    xExact: null,
    weights: id === "dice" ? [1, 1, 1, 1, 1, 1] : [2, 1, 1],
    counts: id === "dice" ? [0, 0, 0, 0, 0, 0] : [0, 0, 0],
    last: null,
    pending: null,
    progress: 0,
    angle: 0,
    fromAngle: 0,
    targetAngle: 0,
    prediction: 25,
    predictFace: 0,
    mission: 0,
    stars: 0,
    claimed: false,
    reveal: false,
    targetFraction: [3, 4],
    targetRatio: [2, 3],
    targetFlowers: 17,
    beacon: [2, 4],
  };
}
export function learningCard(id) {
  const icons = {
    fractions: "◕",
    equivalent: "½ = ²⁄₄",
    ratios: "2 : 3",
    balance: "⚖",
    variables: "x → ✿",
    graphs: "⌁",
    dice: "⚄",
    spinner: "◴",
  };
  return `<div class="learning-card-symbol" aria-hidden="true">${icons[id]}</div>`;
}
export function mountLearning(
  host,
  { activity: a, lang, state: s, onBack, onReset, ui: common, index, total },
) {
  const u = learningUI[lang],
    en = lang === "en",
    text = (pair) => pair[en ? 0 : 1],
    f = (n) =>
      new Intl.NumberFormat(en ? "en" : "pt-BR", {
        maximumFractionDigits: 2,
      }).format(Math.abs(n) < 0.005 ? 0 : n),
    percent = (n) => `${f(n * 100)}%`;
  let frame = 0,
    running = false,
    disposed = false,
    step = 0;
  const chance = ["dice", "spinner"].includes(a.id);
  const button = (id, label, extra = "") =>
    `<button id="${id}" class="button lab-action" ${extra}>${label}</button>`;
  const range = (key, label, min, max, value, inc = 1) =>
    `<label class="range-label" for="${key}"><span>${label}</span><output id="out-${key}">${f(value)}</output></label><input id="${key}" data-learn="${key}" type="range" min="${min}" max="${max}" step="${inc}" value="${value}">`;
  const select = (key, label, options, value) =>
    `<label class="range-label" for="${key}">${label}</label><select id="${key}" data-learn="${key}">${options.map(([v, label]) => `<option value="${v}" ${value === v ? "selected" : ""}>${label}</option>`).join("")}</select>`;
  let controls = "";
  if (a.id === "fractions")
    controls =
      select(
        "shape",
        u.shape,
        [
          ["bar", u.bar],
          ["circle", u.circle],
        ],
        s.shape,
      ) +
      range("d", u.denominator, 2, 12, s.d) +
      range("n", u.numerator, 0, s.d, s.n) +
      range("addend", u.addend, 0, s.d, s.addend) +
      button("combine", u.combine);
  if (a.id === "equivalent")
    controls =
      range("d", u.denominator, 2, 8, s.d) +
      range("n", u.numerator, 0, s.d, s.n) +
      range("k", u.subdivide, 1, 6, s.k) +
      range("right", u.right, 0, s.d * s.k, s.right);
  if (a.id === "ratios")
    controls =
      range("a", u.a, 1, 6, s.a) +
      range("b", u.b, 1, 6, s.b) +
      range("batches", u.batches, 1, 6, s.batches) +
      button("double", u.double);
  if (a.id === "balance")
    controls =
      range("x", u.trial, 0, 48, s.x, "any") +
      button("exact", u.exact) +
      range("amount", u.amount, 1, 6, s.amount) +
      button("subtract", u.subtract) +
      button("add", u.add) +
      button("divide", u.divide) +
      `<div class="balance-edit">${button("left-plus", u.leftPlus)}${button("left-minus", u.leftMinus)}${button("right-plus", u.rightPlus)}${button("right-minus", u.rightMinus)}</div>`;
  if (a.id === "variables")
    controls =
      range("x", u.rows, 0, 8, s.x) +
      range("m", u.perRow, 1, 6, s.m) +
      range("extra", u.extra, 0, 8, s.extra);
  if (a.id === "graphs") controls = graphControls(s, u, range, select, button);
  if (chance)
    controls =
      (a.id === "spinner"
        ? s.weights
            .map((v, i) =>
              range(`weight-${i}`, `${u.weight} ${"ABC"[i]}`, 0, 8, v),
            )
            .join("")
        : "") +
      select(
        "predictFace",
        u.predictFace,
        (a.id === "dice"
          ? ["1", "2", "3", "4", "5", "6"]
          : ["A", "B", "C"]
        ).map((v, i) => [String(i), v]),
        String(s.predictFace),
      ) +
      range("prediction", u.prediction, 0, 100, s.prediction) +
      `<div class="trial-buttons">${[10, 100, 1000].map((n) => button("run-" + n, `${u.run} ${f(n)}`)).join("")}</div>`;
  host.innerHTML = `<div class="experiment-page learning-page"><button class="back" id="back">← ${common.back}</button><div class="experiment-heading"><div><p class="eyebrow">${common.experiment} ${String(index + 1).padStart(2, "0")} / ${total} · ${text(a.tag)}</p><h1 id="activity-title" tabindex="-1">${text(a.title)}</h1><p>${text(a.description)}</p></div><span class="experiment-badge">${a.icon}</span></div><div class="discovery-steps" role="group" aria-label="${common.stepsLabel}">${common.step.map((label, i) => `<button data-discovery="${i}" aria-pressed="${i === 0}" class="${i === 0 ? "current" : ""}"><span>0${i + 1}</span>${label}</button>`).join("")}</div><p class="step-prompt" id="step-prompt">${common.stepText[0]}</p><div class="workbench"><section class="visual-panel"><div class="canvas-top"><span><span class="tiny-dot"></span>${common.lab}</span><span id="discovery-count"></span></div><div id="learning-stage" class="learning-stage" aria-label="${text(a.title)}"></div><p class="interaction-hint">${a.id === "fractions" ? u.partsHint : u.hint}</p>${chance ? `<div class="playback">${button("learn-play", u.play)}${button("learn-replay", "↺", `aria-label="${u.replay}"`)}<label class="sr-only" for="learn-progress">${u.progress}</label><input id="learn-progress" type="range" min="0" max="1" step=".001" value="${s.progress}"></div>` : ""}<div id="learn-metrics" class="measurements"></div></section><aside class="control-panel"><p class="eyebrow">${common.controls}</p>${controls}${button("learn-reset", "↺ " + u.reset)}<p class="unit-note">${a.id === "graphs" ? u.graphTip : a.id === "balance" ? u.balanceTip : u.baseUnits}</p></aside></div><div class="learning-grid"><section class="formula-panel"><p class="eyebrow">${common.formula}</p><div id="learn-formula"></div><details open><summary>${common.why}</summary><p>${text(a.explain)}</p></details><details><summary>${common.deeper}</summary><p>${text(a.deep)}</p></details><p class="reference-link">${u.reference}: <a href="${references[a.id][1]}" target="_blank" rel="noopener noreferrer">${references[a.id][0]} ↗</a></p></section><section class="challenge-panel"><span class="challenge-icon">✧</span><p class="eyebrow">${u.mission}</p><h2>${text(a.challenge)}</h2><p id="mission-target" class="mission-target"></p><p id="learn-feedback" role="status"></p>${!chance ? button("new-mission", u.newMission) : ""}<p class="unit-note">${u.challengeHint}</p><div class="step-actions">${button("learn-prev", "← " + common.previous)}${button("learn-next", common.next + " →")}</div></section></div>${chance ? `<section class="results-panel"><h2>${u.table}</h2><p>${u.sample}</p><div id="trial-table"></div></section>` : ""}${["balance", "variables"].includes(a.id) ? '<section class="results-panel" id="extra-results"></section>' : ""}</div>`;
  const q = (selector) => host.querySelector(selector),
    stage = q("#learning-stage");
  function metric(label, value) {
    return `<div><span>${label}</span><strong>${value}</strong></div>`;
  }
  function svg(body, label = text(a.title)) {
    return `<svg viewBox="0 0 640 440" role="img" aria-label="${label}">${body}</svg>`;
  }
  const label = (x, y, content, color = "#31594c", size = 20) =>
    `<text x="${x}" y="${y}" text-anchor="middle" fill="${color}" font-size="${size}" font-family="system-ui">${content}</text>`;
  const colors = ["#368a7b", "#dfa34d", "#9580bf"];
  function fractionBar(n, d, interactive = false) {
    return `<div class="fraction-bar" style="--parts:${d}">${Array.from({ length: d }, (_, i) => (interactive ? `<button class="fraction-piece ${s.selected[i] ? "shaded" : ""}" data-piece="${i}" aria-label="${u.selectPiece} ${i + 1} / ${d}" aria-pressed="${!!s.selected[i]}"><span>${i + 1}</span></button>` : `<span class="fraction-piece ${i < n ? "shaded" : ""}" aria-hidden="true"></span>`)).join("")}</div>`;
  }
  function fractionCircle() {
    let paths = "";
    const r = 128,
      cx = 320,
      cy = 190;
    for (let i = 0; i < s.d; i++) {
      const start = -Math.PI / 2 + (i * 2 * Math.PI) / s.d,
        end = start + (2 * Math.PI) / s.d;
      paths += `<path role="button" tabindex="0" data-piece="${i}" aria-label="${u.selectPiece} ${i + 1} / ${s.d}" aria-pressed="${!!s.selected[i]}" d="M${cx} ${cy} L${cx + r * Math.cos(start)} ${cy + r * Math.sin(start)} A${r} ${r} 0 ${end - start > Math.PI ? 1 : 0} 1 ${cx + r * Math.cos(end)} ${cy + r * Math.sin(end)}Z" fill="${s.selected[i] ? colors[0] : "#e3e9dd"}" stroke="#fffefa" stroke-width="3"/>`;
    }
    return svg(paths + label(320, 375, `${s.n}/${s.d}`), u.shape);
  }
  function eqText() {
    return `${s.coefficient === 1 ? "" : s.coefficient}x${s.constant ? " + " + s.constant : ""} = ${s.rhs}`;
  }
  function graphValue(x) {
    return evaluateGraph(s, x);
  }
  function drawGraph() {
    return graphModel(s, u, f);
  }
  function die(index) {
    const positions = [
      [[0, 0]],
      [
        [-1, -1],
        [1, 1],
      ],
      [
        [-1, -1],
        [0, 0],
        [1, 1],
      ],
      [
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ],
      [
        [-1, -1],
        [1, -1],
        [0, 0],
        [-1, 1],
        [1, 1],
      ],
      [
        [-1, -1],
        [1, -1],
        [-1, 0],
        [1, 0],
        [-1, 1],
        [1, 1],
      ],
    ];
    return svg(
      `<rect x="205" y="75" width="230" height="230" rx="34" fill="#fffefa" stroke="${colors[0]}" stroke-width="5"/>${positions[index].map(([x, y]) => `<circle cx="${320 + x * 65}" cy="${190 + y * 65}" r="19" fill="${colors[0]}"/>`).join("")}${label(320, 365, `${u.face} ${index + 1}`)}`,
    );
  }
  function wheel() {
    const sum = s.weights.reduce((a, b) => a + b, 0);
    let start = -Math.PI / 2,
      body = "";
    s.weights.forEach((weight, i) => {
      if (!weight) return;
      const sweep = (2 * Math.PI * weight) / sum,
        end = start + sweep,
        r = 139,
        cx = 320,
        cy = 210;
      const path =
        sweep >= 2 * Math.PI - 1e-9
          ? `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${colors[i]}"/>`
          : `<path d="M${cx} ${cy}L${cx + r * Math.cos(start)} ${cy + r * Math.sin(start)}A${r} ${r} 0 ${sweep > Math.PI ? 1 : 0} 1 ${cx + r * Math.cos(end)} ${cy + r * Math.sin(end)}Z" fill="${colors[i]}" stroke="#fffefa" stroke-width="3"/>`;
      body +=
        path +
        label(
          cx + 90 * Math.cos(start + sweep / 2),
          cy + 90 * Math.sin(start + sweep / 2) + 6,
          `${"ABC"[i]} · ${percent(weight / sum)}`,
          "white",
          17,
        );
      start = end;
    });
    body += `<g transform="rotate(${s.angle} 320 210)"><path d="M310 54L330 54L320 85Z" fill="#253d32"/><path d="M320 210V90" stroke="#253d32" stroke-width="4"/></g><circle cx="320" cy="210" r="9" fill="#253d32"/>${label(320, 407, u.legend, "#536d5c", 16)}`;
    return svg(body);
  }
  function sync() {
    host.querySelectorAll("[data-learn]").forEach((input) => {
      const key = input.dataset.learn;
      let value = key.startsWith("weight-")
        ? s.weights[Number(key.split("-")[1])]
        : s[key];
      if (key === "n" || key === "addend") input.max = s.d;
      if (key === "right") input.max = s.d * s.k;
      input.value = value;
      const out = q("#out-" + key);
      if (out) out.textContent = f(value);
    });
    if (a.id === "graphs") syncGraphControls(host, s, u, f);
    if (a.id === "balance") q("#out-x").textContent = balanceNumber(s.x, s, f);
    if (q("#double")) q("#double").disabled = s.batches * 2 > 6;
    if (a.id === "balance") {
      q("#subtract").disabled = s.amount > s.constant || s.amount > s.rhs;
      q("#add").disabled = s.constant + s.amount > 24 || s.rhs + s.amount > 48;
      q("#divide").disabled =
        s.coefficient <= 1 || s.constant !== 0 || s.rhs % s.coefficient !== 0;
      q("#left-minus").disabled = s.constant === 0;
      q("#left-plus").disabled = s.constant >= 24 || s.constant >= s.rhs;
      q("#right-minus").disabled = s.rhs <= s.constant;
      q("#right-plus").disabled = s.rhs >= 48;
    }
  }
  function draw() {
    if (disposed) return;
    sync();
    const focused = document.activeElement?.dataset?.piece;
    let metrics = "",
      formula = "",
      body = "",
      matched = false,
      target = "";
    const totalTrials = s.counts.reduce((a, b) => a + b, 0);
    if (a.id === "fractions") {
      const value = fraction(s.n, s.d);
      body =
        s.shape === "circle"
          ? fractionCircle()
          : `<div class="fraction-work"><p>${u.first}: <b>${s.n}/${s.d}</b></p>${fractionBar(s.n, s.d, true)}</div>`;
      if (s.combined) {
        const n = s.n + s.addend;
        body += `<div class="fraction-work"><p>${u.combined}: <b>${n}/${s.d}</b></p>${fractionBar(Math.min(n, s.d), s.d)}${n > s.d ? fractionBar(n - s.d, s.d) : ""}</div>`;
      }
      metrics =
        metric(u.first, `${s.n}/${s.d}`) +
        metric(common.total || u.total, percent(value.value));
      formula = `${s.n}/${s.d} = ${value.n}/${value.d} ≈ ${f(value.value)}${s.combined ? `<br>${s.n}/${s.d} + ${s.addend}/${s.d} = ${s.n + s.addend}/${s.d}` : ""}`;
      target = `${u.target}: ${s.targetFraction[0]}/${s.targetFraction[1]}`;
      matched = equivalent(s.n, s.d, ...s.targetFraction);
    }
    if (a.id === "equivalent") {
      body = `<div class="fraction-work"><p>${u.first}: <b>${s.n}/${s.d}</b></p>${fractionBar(s.n, s.d)}<p>${u.second}: <b>${s.right}/${s.d * s.k}</b></p>${fractionBar(s.right, s.d * s.k)}</div>`;
      matched = equivalent(s.n, s.d, s.right, s.d * s.k);
      metrics =
        metric(u.first, `${s.n}/${s.d}`) +
        metric(u.second, `${s.right}/${s.d * s.k}`);
      formula = `${s.n}/${s.d} ${matched ? "=" : "≠"} ${s.right}/${s.d * s.k}<br><span>${s.n} × ${s.d * s.k} ${matched ? "=" : "≠"} ${s.right} × ${s.d}</span>`;
      target = `${u.target}: ${s.n}/${s.d}`;
    }
    if (a.id === "ratios") {
      const r = ratio(s.a, s.b, s.batches);
      body = `<div class="recipe-work"><div class="recipe-jar"><p>A · ${r.a}</p><div class="counters">${Array.from({ length: r.a }, () => '<span class="counter counter-a">A</span>').join("")}</div></div><div class="recipe-jar"><p>B · ${r.b}</p><div class="counters">${Array.from({ length: r.b }, () => '<span class="counter counter-b">B</span>').join("")}</div></div></div>`;
      metrics =
        metric("A : B", `${r.a} : ${r.b}`) + metric(u.share, percent(r.first));
      formula = `${s.a} : ${s.b} = ${r.a} : ${r.b}<br><span>${u.total}: ${r.total} · A/(A+B) = ${f(r.a)}/${f(r.total)}</span>`;
      target = `${u.recipe}: ${s.targetRatio.join(" : ")}`;
      matched = s.a * s.targetRatio[1] === s.b * s.targetRatio[0];
    }
    if (a.id === "balance") {
      const eq = equation(s.coefficient, s.constant, s.rhs, s.x);
      body = balanceModel(s, u, f);
      metrics = metric(u.left, f(eq.left)) + metric(u.rightTotal, f(eq.right));
      matched = eq.equal && s.coefficient === 1 && s.constant === 0;
      formula = `${eqText()}<br><span>x = (c − b)/a${s.reveal || matched ? ` ≈ ${f(eq.solution)}` : ""}</span>`;
      target = `${u.target}: x = ?`;
      q("#extra-results").innerHTML =
        `<h2>${u.history}</h2><ol>${(s.history.length ? s.history : [eqText()]).map((line) => `<li>${line}</li>`).join("")}</ol>`;
    }
    if (a.id === "variables") {
      const output = s.m * s.x + s.extra;
      body = `<div class="garden-work"><p>${s.x} × ${s.m} + ${s.extra} = ${output}</p>${Array.from({ length: s.x }, () => `<div class="flower-row">${Array.from({ length: s.m }, () => '<span class="flower" aria-hidden="true">✿</span>').join("")}</div>`).join("")}${s.extra ? `<div class="flower-row extra-flowers">+ ${Array.from({ length: s.extra }, () => '<span class="flower" aria-hidden="true">✿</span>').join("")}</div>` : ""}</div>`;
      metrics = metric(u.input, f(s.x)) + metric(u.output, f(output));
      formula = `y = ${s.m}x + ${s.extra}<br><span>${s.m} × ${s.x} + ${s.extra} = ${output}</span>`;
      target = `${u.target}: ${s.targetFlowers} ✿`;
      matched = output === s.targetFlowers;
      q("#extra-results").innerHTML =
        `<h2>${u.rule}: ${s.m}x + ${s.extra}</h2><table><thead><tr><th>${u.input} x</th><th>${u.output} y</th></tr></thead><tbody>${Array.from({ length: 6 }, (_, x) => `<tr><td>${x}</td><td>${s.m * x + s.extra}</td></tr>`).join("")}</tbody></table>`;
    }
    if (a.id === "graphs") {
      body = drawGraph();
      const y = graphValue(s.probe);
      metrics =
        metric("x", graphInputLabel(s, f)) +
        metric("y", y === null ? u.undefinedValue : f(y));
      formula = `${graphFormula(s, f)}<br><span>y(${graphInputLabel(s, f)}) ${y === null ? u.undefinedValue : "≈ " + f(y)}</span>`;
      target = `${u.beacon}: (${graphInputLabel(s, f, s.beacon[0])}, ${f(s.beacon[1])})`;
      const targetValue = graphValue(s.beacon[0]);
      matched =
        targetValue !== null && Math.abs(targetValue - s.beacon[1]) < 1e-9;
    }
    if (chance) {
      const probs = probabilities(s.weights);
      body =
        a.id === "spinner"
          ? wheel()
          : die(
              running || s.pending !== null
                ? Math.floor(s.progress * 30) % 6
                : (s.last ?? 0),
            );
      const face = Number(s.predictFace),
        name = a.id === "dice" ? String(face + 1) : "ABC"[face];
      metrics =
        metric(u.trials, f(totalTrials)) +
        metric(
          u.last,
          s.last === null ? "—" : a.id === "dice" ? s.last + 1 : "ABC"[s.last],
        );
      formula = `P(${name}) = ${s.weights[face]}/${s.weights.reduce((a, b) => a + b, 0)} ≈ ${percent(probs[face])}<br><span>${u.prediction}: ${f(s.prediction)}% · ${u.observed}: ${totalTrials ? percent(s.counts[face] / totalTrials) : "—"}</span>`;
      target = `${u.target}: ${f(100)} ${u.trials}`;
      matched = totalTrials >= 100;
      q("#trial-table").innerHTML =
        `<table><caption>${totalTrials ? `${f(totalTrials)} ${u.trials}` : u.before}</caption><thead><tr><th>${a.id === "dice" ? u.face : u.sector}</th><th>${u.count}</th><th>${u.expected}</th><th>${u.observed}</th></tr></thead><tbody>${s.counts.map((n, i) => `<tr><th><span class="result-dot" style="background:${colors[i % 3]}"></span>${a.id === "dice" ? i + 1 : "ABC"[i]}</th><td>${f(n)}</td><td>${percent(probs[i])}<small> (${f(totalTrials * probs[i])})</small></td><td>${totalTrials ? percent(n / totalTrials) : "—"}<span class="frequency-track"><span style="width:${totalTrials ? (n / totalTrials) * 100 : 0}%"></span></span></td></tr>`).join("")}</tbody></table>`;
      q("#learn-progress").value = s.progress;
      q("#learn-play").textContent = running ? u.pause : u.play;
    }
    stage.innerHTML = body;
    if (q("#learn-metrics").innerHTML !== metrics)
      q("#learn-metrics").innerHTML = metrics;
    q("#learn-formula").innerHTML = `<p class="formula">${formula}</p>`;
    q("#mission-target").textContent = target;
    if (matched && !s.claimed) {
      s.stars++;
      s.claimed = true;
    }
    q("#discovery-count").textContent = `✧ ${u.stars}: ${s.stars}`;
    let feedback = matched ? u.matched : u.explore;
    if (a.id === "balance") {
      const eq = equation(s.coefficient, s.constant, s.rhs, s.x);
      feedback = matched ? u.isolated : eq.equal ? u.balance : u.unbalanced;
    }
    if (s.notice) feedback = u[s.notice];
    if (q("#learn-feedback").textContent !== feedback)
      q("#learn-feedback").textContent = feedback;
    q("#learn-feedback").classList.toggle("success", matched);
    stage.querySelectorAll("[data-piece]").forEach((el) => {
      const toggle = () => {
        const i = Number(el.dataset.piece);
        s.selected[i] = !s.selected[i];
        s.n = s.selected.filter(Boolean).length;
        s.combined = false;
        draw();
      };
      el.onclick = toggle;
      if (el.tagName.toLowerCase() === "path")
        el.onkeydown = (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggle();
          }
        };
    });
    if (focused !== undefined)
      stage.querySelector(`[data-piece="${focused}"]`)?.focus();
  }
  function stop() {
    running = false;
    cancelAnimationFrame(frame);
    if (q("#learn-play")) q("#learn-play").textContent = u.play;
  }
  function desiredAngle(index) {
    const sum = s.weights.reduce((a, b) => a + b, 0),
      before = s.weights.slice(0, index).reduce((a, b) => a + b, 0);
    return (360 * (before + s.weights[index] / 2)) / sum;
  }
  function begin() {
    if (running) {
      stop();
      return;
    }
    s.notice = null;
    if (s.pending === null) {
      s.pending = weightedIndex(
        s.weights,
        randomInt(s.weights.reduce((a, b) => a + b, 0)),
      );
      s.progress = 0;
      s.fromAngle = s.angle;
      s.targetAngle =
        s.angle +
        1080 +
        ((desiredAngle(s.pending) - (s.angle % 360) + 360) % 360);
    }
    running = true;
    const initial = s.progress,
      start = performance.now();
    let last = start;
    draw();
    function tick(now) {
      if (!running || disposed) return;
      if (now - last >= 40) {
        s.progress = Math.min(1, initial + (now - start) / 5000);
        last = now;
        s.angle =
          s.fromAngle +
          (s.targetAngle - s.fromAngle) * (1 - (1 - s.progress) ** 3);
        if (s.progress >= 1) {
          s.last = s.pending;
          s.counts[s.pending]++;
          s.pending = null;
          stop();
        }
        draw();
      }
      if (running) frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
  }
  function batch(n) {
    stop();
    s.pending = null;
    s.progress = 0;
    s.notice = null;
    const result = runTrials(s.weights, n, s.counts);
    s.counts = result.counts;
    s.last = result.last;
    if (a.id === "spinner") s.angle = desiredAngle(s.last);
    draw();
  }
  host.querySelectorAll("[data-learn]").forEach(
    (input) =>
      (input.oninput = () => {
        const key = input.dataset.learn;
        const previousUnit = s.angleUnit;
        s.notice = null;
        if (key.startsWith("weight-")) {
          stop();
          const i = Number(key.split("-")[1]),
            old = s.weights[i];
          s.weights[i] = Number(input.value);
          if (!s.weights.some(Boolean)) {
            s.weights[i] = old;
            s.notice = "empty";
          } else {
            s.counts = [0, 0, 0];
            s.last = null;
            s.pending = null;
            s.progress = 0;
            s.angle = 0;
            s.claimed = false;
            s.notice = "newDistribution";
          }
        } else {
          s[key] = ["shape", "family", "angleUnit"].includes(key)
            ? input.value
            : Number(input.value);
          if (a.id === "balance" && key === "x") {
            s.x = Math.round(s.x * 10) / 10;
            s.xExact = null;
            s.reveal = false;
          }
          if (a.id === "graphs") {
            if (key === "family") {
              s.amplitude = 1;
              s.frequency = 1;
              s.phase = 0;
              s.offset = 0;
              s.compare = isTrig(s);
              s.span = isTrig(s)
                ? s.angleUnit === "degrees"
                  ? 360
                  : 2 * Math.PI
                : 8;
              s.ySpan = isTrig(s) ? 3 : 8;
              s.probe = Math.max(
                -s.span,
                Math.min(
                  s.span,
                  isTrig(s) ? s.probe : Math.round(s.probe * 2) / 2,
                ),
              );
              s.beacon = graphTarget(s, s.mission);
              s.claimed = false;
            }
            if (key === "angleUnit" && previousUnit !== s.angleUnit) {
              const factor =
                s.angleUnit === "degrees" ? 180 / Math.PI : Math.PI / 180;
              s.phase *= factor;
              s.span *= factor;
              s.probe *= factor;
              s.beacon[0] *= factor;
            }
            if (key === "span")
              s.probe = Math.max(-s.span, Math.min(s.span, s.probe));
          }
          if (["n", "d", "addend"].includes(key)) {
            s.n = Math.min(s.n, s.d);
            s.addend = Math.min(s.addend, s.d);
            if (key !== "addend")
              s.selected = Array.from({ length: s.d }, (_, i) => i < s.n);
            s.combined = false;
          }
          if (a.id === "equivalent" && ["n", "d", "k"].includes(key))
            s.right = s.n * s.k;
        }
        draw();
      }),
  );
  q("#back").onclick = onBack;
  q("#learn-reset").onclick = () => {
    stop();
    onReset();
  };
  q("#combine")?.addEventListener("click", () => {
    s.combined = true;
    draw();
  });
  q("#double")?.addEventListener("click", () => {
    s.batches *= 2;
    draw();
  });
  function op(fn) {
    if (!s.history.length) s.history.push(eqText());
    fn();
    s.history.push(eqText());
    if (s.history.length > 15) s.history.shift();
    draw();
  }
  q("#subtract")?.addEventListener("click", () =>
    op(() => {
      s.constant -= s.amount;
      s.rhs -= s.amount;
    }),
  );
  q("#add")?.addEventListener("click", () =>
    op(() => {
      s.constant += s.amount;
      s.rhs += s.amount;
    }),
  );
  q("#divide")?.addEventListener("click", () =>
    op(() => {
      s.rhs /= s.coefficient;
      s.coefficient = 1;
    }),
  );
  q("#exact")?.addEventListener("click", () => {
    s.reveal = true;
    s.x = (s.rhs - s.constant) / s.coefficient;
    s.xExact = [s.rhs - s.constant, s.coefficient];
    draw();
  });
  for (const [id, key, delta] of [
    ["left-plus", "constant", 1],
    ["left-minus", "constant", -1],
    ["right-plus", "rhs", 1],
    ["right-minus", "rhs", -1],
  ])
    q("#" + id)?.addEventListener("click", () => op(() => (s[key] += delta)));
  q("#learn-play")?.addEventListener("click", begin);
  q("#learn-replay")?.addEventListener("click", () => {
    stop();
    s.pending = null;
    s.progress = 0;
    begin();
  });
  q("#learn-progress")?.addEventListener("input", (e) => {
    stop();
    if (s.pending === null) {
      s.pending = weightedIndex(
        s.weights,
        randomInt(s.weights.reduce((a, b) => a + b, 0)),
      );
      s.fromAngle = s.angle;
      s.targetAngle =
        s.angle +
        1080 +
        ((desiredAngle(s.pending) - (s.angle % 360) + 360) % 360);
    }
    s.progress = Math.min(0.999, Number(e.target.value));
    s.angle =
      s.fromAngle + (s.targetAngle - s.fromAngle) * (1 - (1 - s.progress) ** 3);
    draw();
  });
  for (const n of [10, 100, 1000])
    q("#run-" + n)?.addEventListener("click", () => batch(n));
  q("#new-mission")?.addEventListener("click", () => {
    s.mission++;
    s.claimed = false;
    s.notice = null;
    const n = s.mission;
    if (a.id === "fractions") {
      s.targetFraction = [
        [3, 4],
        [2, 3],
        [5, 6],
        [3, 8],
        [4, 5],
      ][n % 5];
      s.n = 0;
      s.selected = Array(s.d).fill(false);
      s.combined = false;
    }
    if (a.id === "equivalent") {
      s.n = (n % 3) + 1;
      s.d = s.n + 2;
      s.k = 2 + (n % 4);
      s.right = 0;
    }
    if (a.id === "ratios") {
      s.targetRatio = [
        [2, 3],
        [1, 2],
        [3, 1],
        [3, 4],
      ][n % 4];
      s.a = 1;
      s.b = 1;
      s.batches = 1;
    }
    if (a.id === "balance") {
      s.reveal = false;
      s.xExact = null;
      s.coefficient = 1 + (n % 3);
      s.constant = 2 + (n % 5);
      s.rhs = s.coefficient * (2 + (n % 6)) + s.constant;
      s.x = 0;
      s.history = [];
    }
    if (a.id === "variables") {
      s.m = 2 + (n % 4);
      s.extra = n % 5;
      s.targetFlowers = s.m * (2 + (n % 6)) + s.extra;
      s.x = 0;
    }
    if (a.id === "graphs") {
      s.beacon = graphTarget(s, n);
      s.slope = 0;
      s.intercept = 0;
      s.curve = 1;
    }
    draw();
  });
  function discovery(n) {
    step = Math.max(0, Math.min(4, n));
    host.querySelectorAll("[data-discovery]").forEach((b) => {
      const current = Number(b.dataset.discovery) === step;
      b.classList.toggle("current", current);
      b.setAttribute("aria-pressed", current);
    });
    q("#step-prompt").textContent = common.stepText[step];
    q("#learn-prev").disabled = step === 0;
    q("#learn-next").disabled = step === 4;
  }
  host
    .querySelectorAll("[data-discovery]")
    .forEach((b) => (b.onclick = () => discovery(Number(b.dataset.discovery))));
  q("#learn-prev").onclick = () => discovery(step - 1);
  q("#learn-next").onclick = () => discovery(step + 1);
  if (a.id === "graphs") {
    const move = (e) => {
      const node = stage.querySelector("svg");
      if (!node) return;
      const p = node.createSVGPoint();
      p.x = e.clientX;
      p.y = e.clientY;
      const point = p.matrixTransform(node.getScreenCTM().inverse());
      s.probe = Math.max(
        -s.span,
        Math.min(
          s.span,
          isTrig(s)
            ? ((point.x - 320) / 250) * s.span
            : Math.round(((point.x - 320) / 250) * s.span * 2) / 2,
        ),
      );
      draw();
    };
    stage.onpointerdown = (e) => {
      if (!e.target.closest("svg")) return;
      stage.setPointerCapture(e.pointerId);
      stage._dragging = true;
      move(e);
    };
    stage.onpointermove = (e) => {
      if (stage._dragging) move(e);
    };
    stage.onpointerup = stage.onpointercancel = () => (stage._dragging = false);
  }
  if (a.id === "graphs") {
    q("#compare-waves").oninput = (e) => {
      s.compare = e.target.checked;
      draw();
    };
    q("#shift-quarter").onclick = () => {
      s.amplitude = 1;
      s.frequency = 1;
      s.offset = 0;
      s.phase = -(s.angleUnit === "degrees" ? 90 : Math.PI / 2);
      s.compare = true;
      draw();
    };
    q("#probe-quarter").onclick = () => {
      s.probe = s.angleUnit === "degrees" ? 90 : Math.PI / 2;
      draw();
    };
    q("#reset-graph-view").onclick = () => {
      s.span = isTrig(s) ? (s.angleUnit === "degrees" ? 360 : 2 * Math.PI) : 8;
      s.ySpan = isTrig(s) ? 3 : 8;
      s.probe = 0;
      draw();
    };
  }
  discovery(0);
  draw();
  return () => {
    disposed = true;
    stop();
    stage.onpointerdown =
      stage.onpointermove =
      stage.onpointerup =
      stage.onpointercancel =
        null;
  };
}
