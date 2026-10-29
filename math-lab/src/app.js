import { activities, subjects, ui, future } from "./data.js?v=20261028-subjects";
import { measure, challengeFeedback } from "./math.js";
import { render2D } from "./render2d.js";
import { learningDefaults, learningCard, mountLearning } from "./learning.js";
let learningCleanup = null;
const app = document.querySelector("#app");
const PLAYBACK_DURATION_MS = 5000;
let lang = "en",
  subject = "area",
  active = null,
  s,
  viewer = null,
  cleanup2D = null,
  playing = false,
  raf = 0,
  epoch = 0,
  step = 0,
  theme = "light";
try {
  lang = localStorage.getItem("mathlab-language") === "pt" ? "pt" : "en";
  theme = localStorage.getItem("mathlab-theme") || "light";
} catch {}
const t = () => ui[lang],
  ix = () => (lang === "en" ? 0 : 1),
  loc = (a) => a[ix()],
  f = (n) =>
    new Intl.NumberFormat(lang === "pt" ? "pt-BR" : "en", {
      maximumFractionDigits: 2,
    }).format(n);
const defaults = (id) =>
  learningDefaults(id) ?? {
    w: id === "scale" ? 2 : 4,
    h: 3,
    d: 3,
    r: 3,
    slice: 0,
    sectors: 16,
    grid: true,
    labels: true,
    wire: false,
    transparent: true,
    base: true,
    layers: 3,
    progress: ["triangle", "circle", "cone"].includes(id) ? 0 : 1,
    angle: 40,
    zoom: 1,
    mode: "area",
  };
function save(k, v) {
  try {
    localStorage.setItem(k, v);
  } catch {}
}
function stop() {
  playing = false;
  cancelAnimationFrame(raf);
  const b = document.querySelector("#play");
  if (b) b.textContent = t().play;
}
function dispose() {
  learningCleanup?.();
  learningCleanup = null;
  stop();
  epoch++;
  viewer?.dispose();
  viewer = null;
  cleanup2D?.();
  cleanup2D = null;
}
function shell() {
  const u = t();
  document.documentElement.lang = lang === "pt" ? "pt-BR" : "en";
  document.documentElement.dataset.theme = theme;
  document.querySelector(".skip").textContent = u.skip;
  app.innerHTML = `<header><button class="brand" id="home" aria-label="${u.home}"><span class="brand-symbol">✳</span><span>curio<span class="brand-lab">lab</span><small>${u.lab}</small></span></button><p class="brand-note">${u.brand}</p><div class="header-actions"><a class="hub-link" href="https://rodrigofelga.github.io/curio-lab/" aria-label="${u.hub}"><span aria-hidden="true">←</span><span class="hub-link-text">CurioLab</span></a><button id="theme" class="icon-button" aria-label="${theme === "light" ? u.dark : u.light}">${theme === "light" ? "☾" : "☀"}</button><label class="language"><span aria-hidden="true">◎</span><select id="language" aria-label="${lang === "pt" ? "Idioma" : "Language"}"><option value="en" ${lang === "en" ? "selected" : ""}>EN</option><option value="pt" ${lang === "pt" ? "selected" : ""}>PT-BR</option></select></label></div></header><main id="main" tabindex="-1"></main><footer><span class="footer-logo">✳ curiolab</span><span>${u.footer}</span><span>Explore → ${u.step[1]} → ${u.step[3]}</span></footer>`;
  document.querySelector("#home").onclick = () => {
    active = null;
    render();
  };
  document.querySelector("#language").onchange = (e) => {
    lang = e.target.value;
    save("mathlab-language", lang);
    render();
  };
  document.querySelector("#theme").onclick = () => {
    theme = theme === "light" ? "dark" : "light";
    save("mathlab-theme", theme);
    render();
  };
}
function heroArt() {
  return `<svg viewBox="0 0 470 300" aria-hidden="true"><defs><pattern id="hero-grid" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M 24 0 L 0 0 0 24" fill="none" stroke="#c8d9cc" stroke-width=".7"/></pattern></defs><rect x="10" y="15" width="440" height="270" rx="28" fill="url(#hero-grid)"/><circle cx="335" cy="102" r="69" fill="#ead7ad"/><path d="M335 102 L335 33 A69 69 0 0 1 404 102 Z" fill="#d7a254"/><path d="M335 102 L404 102" stroke="#a67538" stroke-width="2" stroke-dasharray="5 4"/><g stroke="#367d70" stroke-width="2"><path d="M88 129L177 77L265 128L176 180Z" fill="#a9cbbc"/><path d="M88 129L176 180L176 270L88 219Z" fill="#5c9d88"/><path d="M176 180L265 128L265 218L176 270Z" fill="#83b7a0"/><path d="M118 147V236M147 164V253M206 163V253M235 146V236M88 159L176 210L265 158M88 189L176 240L265 188M118 112L206 163M147 95L235 146M118 146L206 95M147 163L235 112" fill="none" opacity=".6"/></g><text x="294" y="230" fill="#7e699d" font-size="36" font-family="Georgia" transform="rotate(-8 294 230)">a² + b²</text><circle cx="58" cy="65" r="5" fill="#dfad6a"/><path d="M394 248h18m-9-9v18" stroke="#5b8e7a" stroke-width="2"/><text x="63" y="103" font-size="19" fill="#55846f" font-family="Georgia">1 × 1 × 1</text></svg>`;
}
function subjectNav() {
  const u = t();
  return `<nav class="subjects" aria-label="${u.subjects}">${subjects.map(([id, icon, en, pt]) => `<button class="subject ${subject === id ? "selected" : ""}" data-subject="${id}" aria-pressed="${subject === id}"><span class="subject-icon">${icon}</span><span>${lang === "en" ? en : pt}${future[id] ? `<small>${u.upcoming}</small>` : ""}</span></button>`).join("")}</nav>`;
}
function bindSubjects() {
  document.querySelectorAll("[data-subject]").forEach(
    (b) =>
      (b.onclick = () => {
        subject = b.dataset.subject;
        active = null;
        render();
        document
          .querySelector(".collection")
          ?.scrollIntoView({ block: "start", behavior: "instant" });
      }),
  );
}
function landing() {
  const u = t(),
    sub = subjects.find((a) => a[0] === subject);
  const main = document.querySelector("main");
  main.innerHTML = `<section class="hero"><div><p class="eyebrow"><span class="tiny-dot"></span>${u.eyebrow}</p><h1>${u.hero}</h1><p class="hero-intro">${u.intro}</p><a class="button primary" href="#collection">${u.start}<span>↗</span></a><p class="hero-meta"><span class="tiny-dot"></span>${u.count}</p></div><div class="hero-art">${heroArt()}<span class="art-note">${lang === "en" ? "Less memorizing. More wondering." : "Menos decorar. Mais descobrir."}</span></div></section><section class="collection" id="collection"><div class="section-heading"><div><p class="eyebrow">${u.subjects}</p><h2>${u.explore}</h2></div><span class="collection-note">${u.step[0]} · ${u.step[1]} · ${u.step[3]}</span></div>${subjectNav()}<div class="collection-title"><h3>${lang === "en" ? sub[2] : sub[3]}</h3><span>${lang === "en" ? sub[4] : sub[5]}</span></div><div class="activity-grid">${
    future[subject]
      ? future[subject]
          .map(
            (a, i) =>
              `<article class="activity-card upcoming"><div class="card-art future-art">${sub[1]}</div><div class="card-copy"><p class="eyebrow">${u.upcoming}</p><h3>${loc(a)}</h3><p>${u.soon}</p></div></article>`,
          )
          .join("")
      : activities
          .filter((a) => a.subject === subject)
          .map(
            (a, i) =>
              `<button class="activity-card" data-activity="${a.id}"><div class="card-art art-${a.id}">${cardArt(a.id)}<span class="card-number">${String(activities.indexOf(a) + 1).padStart(2, "0")}</span><span class="card-arrow">↗</span></div><div class="card-copy"><p class="eyebrow">${loc(a.tag)}</p><h3>${loc(a.title)}</h3><p>${loc(a.description)}</p><span class="card-ready"><span class="tiny-dot"></span>${u.available}</span></div></button>`,
          )
          .join("")
  }</div></section>`;
  bindSubjects();
  document
    .querySelectorAll("[data-activity]")
    .forEach((b) => (b.onclick = () => open(b.dataset.activity)));
}
function cardArt(id) {
  if (learningDefaults(id)) return learningCard(id);
  const colors = {
    rectangle: "#7eaf96",
    triangle: "#d0a462",
    circle: "#b1a0c9",
    challenge: "#86a4b7",
    cube: "#7eaf96",
    prism: "#86a4b7",
    cylinder: "#b1a0c9",
    cone: "#d0a462",
    sphere: "#b1a0c9",
    scale: "#86a4b7",
  };
  const c = colors[id];
  let shape = "";
  if (id === "rectangle" || id === "challenge") {
    shape = `<rect x="66" y="32" width="${id === "challenge" ? 150 : 130}" height="84" fill="${c}" fill-opacity=".45" stroke="${c}" stroke-width="2"/><path d="M92 32V116M118 32V116M144 32V116M170 32V116M66 60H196M66 88H196" stroke="${c}"/><circle cx="196" cy="32" r="6" fill="${c}"/>`;
  } else if (id === "triangle")
    shape = `<path d="M65 117V32H213V117Z" fill="none" stroke="${c}" stroke-dasharray="6 4"/><path d="M65 32V117H213Z" fill="${c}" fill-opacity=".6"/><path d="M65 32H213V117Z" fill="${c}" fill-opacity=".18"/>`;
  else if (id === "circle")
    shape = `<circle cx="140" cy="77" r="51" fill="${c}" fill-opacity=".4"/><path d="M140 77V26M140 77L184 52M140 77L184 102M140 77V128M140 77L96 102M140 77L96 52M140 77H191M140 77H89" stroke="${c}" stroke-width="2"/>`;
  else if (id === "sphere")
    shape = `<circle cx="140" cy="77" r="52" fill="${c}" fill-opacity=".3" stroke="${c}"/><ellipse cx="140" cy="77" rx="52" ry="15" fill="#e5b364" fill-opacity=".5" stroke="#c59c57"/><ellipse cx="140" cy="77" rx="20" ry="52" fill="none" stroke="${c}"/>`;
  else if (id === "cylinder")
    shape = `<path d="M90 45V109C90 136 190 136 190 109V45Z" fill="${c}" fill-opacity=".35" stroke="${c}"/><ellipse cx="140" cy="45" rx="50" ry="18" fill="${c}" fill-opacity=".5" stroke="${c}"/><path d="M90 70C90 97 190 97 190 70M90 94C90 121 190 121 190 94" fill="none" stroke="${c}"/>`;
  else if (id === "cone")
    shape = `<path d="M105 25L58 119Q105 146 152 119Z" fill="${c}" fill-opacity=".5" stroke="${c}"/><path d="M174 45V119Q210 140 246 119V45Z" fill="#90b6a5" fill-opacity=".4" stroke="#78a58e"/><ellipse cx="210" cy="45" rx="36" ry="12" fill="#90b6a5" fill-opacity=".4" stroke="#78a58e"/><text x="155" y="83" fill="#6f756d" font-size="18">⅓</text>`;
  else
    shape = `<path d="M78 52L140 20L202 52L140 86Z" fill="${c}" fill-opacity=".35" stroke="${c}"/><path d="M78 52V114L140 146V86Z" fill="${c}" fill-opacity=".7" stroke="${c}"/><path d="M140 86L202 52V114L140 146Z" fill="${c}" fill-opacity=".5" stroke="${c}"/><path d="M109 36L171 68M109 68L171 36M78 83L140 115L202 83M109 68V130M171 68V130" fill="none" stroke="${c}"/>`;
  return `<svg viewBox="0 0 280 160" aria-hidden="true">${shape}</svg>`;
}
function open(id) {
  active = id;
  subject = activities.find((a) => a.id === id).subject;
  s = defaults(id);
  step = 0;
  render();
  document.querySelector("#activity-title").focus();
}
function range(key, label, min, max, value, stepSize = 1) {
  return `<label class="range-label" for="${key}"><span>${label}</span><output id="out-${key}" for="${key}">${f(value)}</output></label><input id="${key}" data-key="${key}" type="range" min="${min}" max="${max}" step="${stepSize}" value="${value}">`;
}
function toggle(key, label) {
  return `<label class="toggle"><input type="checkbox" data-key="${key}" ${s[key] ? "checked" : ""}><span>${label}</span></label>`;
}
function activity() {
  if (learningDefaults(active)) {
    const definition = activities.find((a) => a.id === active);
    learningCleanup = mountLearning(document.querySelector("main"), {
      activity: definition,
      lang,
      state: s,
      ui: t(),
      index: activities.indexOf(definition),
      total: activities.length,
      onBack: () => {
        active = null;
        render();
      },
      onReset: () => {
        s = defaults(active);
        render();
      },
    });
    return;
  }
  const a = activities.find((a) => a.id === active),
    u = t(),
    is2D = a.subject === "area",
    animated = ["triangle", "circle", "cylinder", "cone"].includes(active);
  let dims = "";
  if (["rectangle", "triangle", "challenge", "prism"].includes(active))
    dims +=
      range(
        "w",
        active === "triangle" ? u.base : u.w,
        1,
        active === "prism" ? 8 : 12,
        s.w,
      ) + range("h", u.h, 1, active === "prism" ? 8 : 10, s.h);
  if (["cube", "scale"].includes(active)) dims += range("w", u.edge, 1, 8, s.w);
  if (active === "prism")
    dims +=
      range("d", u.d, 1, 8, s.d) + range("layers", u.layers, 0, s.h, s.layers);
  if (["circle", "cylinder", "cone", "sphere"].includes(active))
    dims += range("r", u.r, 1, 6, s.r, 0.5);
  if (["cylinder", "cone"].includes(active))
    dims += range("h", u.h, 1, 10, s.h, 0.5);
  if (active === "circle")
    dims += range("sectors", u.sectors, 8, 64, s.sectors, 2);
  if (active === "sphere")
    dims += range("slice", u.slice, -1, 1, s.slice, 0.05);
  document.querySelector("main").innerHTML =
    `<div class="experiment-page"><button class="back" id="back">← ${u.back}</button><div class="experiment-heading"><div><p class="eyebrow">${u.experiment} ${String(activities.indexOf(a) + 1).padStart(2, "0")} / ${activities.length} · ${loc(a.tag)}</p><h1 id="activity-title" tabindex="-1">${loc(a.title)}</h1><p>${loc(a.description)}</p></div><span class="experiment-badge">${a.icon}</span></div><div class="discovery-steps" role="group" aria-label="${u.stepsLabel}">${u.step.map((name, i) => `<button data-step="${i}" class="${i === step ? "current" : ""}" aria-pressed="${i === step}"><span>0${i + 1}</span>${name}</button>`).join("")}</div><p class="step-prompt" id="step-prompt">${u.stepText[step]}</p><div class="workbench"><section class="visual-panel"><div class="canvas-top"><span><span class="tiny-dot"></span>${u.lab}</span><button class="text-button" id="reset-view">${is2D ? u.reset : u.resetCamera} ↺</button></div><div id="stage" class="stage ${is2D ? "two-d" : "three-d"}"><p>${u.loading}</p></div><p class="interaction-hint">${is2D ? (active === "circle" ? u.hintCircle : active === "triangle" ? u.hintTriangle : u.hint) : u.hint3}</p>${animated ? `<div class="playback"><button class="button primary" id="play">▶ ${u.play}</button><button class="icon-button" id="replay" aria-label="${u.replay}">↺</button><label class="sr-only" for="progress">${u.progress}</label><input id="progress" data-key="progress" type="range" min="0" max="1" step=".001" value="${s.progress}"></div>` : ""}<div id="measurements" class="measurements" aria-live="off"></div></section><aside class="control-panel"><p class="eyebrow">${u.controls}</p>${dims}<div class="toggles">${is2D && active !== "circle" ? toggle("grid", u.grid) : ""}${toggle("labels", u.dimensions)}${!is2D ? toggle("wire", u.wire) + toggle("transparent", u.transparent) : ""}${["cylinder", "cone", "sphere"].includes(active) ? toggle("base", active === "sphere" ? u.cylinderToggle : u.baseToggle) : ""}${["cube", "prism"].includes(active) ? toggle("grid", u.grid) : ""}</div>${!is2D ? `<div class="view-controls">${range("angle", u.rotate, 0, 360, s.angle)}${range("zoom", u.zoom, 0.5, 2, s.zoom, 0.05)}</div>` : ""}<button class="button reset-button" id="reset">↺ ${u.reset}</button><p class="unit-note">${u.units}</p></aside></div><div class="learning-grid"><section class="formula-panel"><p class="eyebrow">${u.formula}</p><div id="formula"></div><details open><summary>${u.why}</summary><p>${loc(a.explain)}</p></details><details><summary>${u.deeper}</summary><p>${loc(a.deep)}</p></details><p class="reference-link"><a href="https://openstax.org/books/calculus-volume-1/pages/6-2-determining-volumes-by-slicing" target="_blank" rel="noopener noreferrer">${u.sources} ↗</a></p></section><section class="challenge-panel"><span class="challenge-icon">✧</span><p class="eyebrow">${u.try}</p><h2>${loc(a.challenge)}</h2>${active === "challenge" ? `<label for="challenge-mode" class="sr-only">${u.try}</label><select id="challenge-mode"><option value="area">${u.sameArea}</option><option value="perimeter">${u.samePerimeter}</option><option value="target">${u.target}</option></select>` : ""}<p id="feedback" role="status"></p><div class="step-actions"><button class="text-button" id="prev">← ${u.previous}</button><button class="text-button" id="next">${u.next} →</button></div></section></div></div>`;
  document.querySelector("#back").onclick = () => {
    active = null;
    render();
  };
  document.querySelectorAll("[data-key]").forEach((input) =>
    input.addEventListener("input", () => {
      const key = input.dataset.key;
      if (key === "progress") stop();
      s[key] = input.type === "checkbox" ? input.checked : Number(input.value);
      if (key === "h" && active === "prism") {
        s.layers = Math.min(s.layers, s.h);
        document.querySelector("#layers").max = s.h;
        document.querySelector("#layers").value = s.layers;
      }
      if (["angle", "zoom"].includes(key)) {
        viewer?.view(s.angle, s.zoom);
        syncOutputs();
      } else update();
    }),
  );
  document.querySelector("#reset").onclick = reset;
  document.querySelector("#reset-view").onclick = () => {
    if (is2D) reset();
    else {
      s.angle = 40;
      s.zoom = 1;
      viewer?.reset();
      syncOutputs();
    }
  };
  document
    .querySelector("#play")
    ?.addEventListener("click", () => (playing ? stop() : play()));
  document.querySelector("#replay")?.addEventListener("click", () => {
    s.progress = 0;
    update();
    play();
  });
  document.querySelector("#challenge-mode")?.addEventListener("change", (e) => {
    s.mode = e.target.value;
    update();
  });
  if (active === "challenge")
    document.querySelector("#challenge-mode").value = s.mode;
  document
    .querySelectorAll("[data-step]")
    .forEach((b) => (b.onclick = () => setStep(Number(b.dataset.step))));
  document.querySelector("#prev").onclick = () =>
    setStep(Math.max(0, step - 1));
  document.querySelector("#next").onclick = () =>
    setStep(Math.min(4, step + 1));
  setStep(step);
  update();
  if (!is2D) {
    const token = epoch;
    import("./render3d.js")
      .then(({ create3D }) => {
        if (token !== epoch) return;
        try {
          viewer = create3D(document.querySelector("#stage"), u);
          viewer.update(active, s);
          viewer.view(s.angle, s.zoom);
        } catch (err) {
          showFallback(u);
          console.warn("3D unavailable:", err.message);
        }
      })
      .catch(() => {
        if (token === epoch) showFallback(u);
      });
  }
}
function showFallback(u) {
  viewer?.dispose();
  viewer = null;
  document.querySelector("#stage").textContent = u.fallback;
  document
    .querySelectorAll(".toggles input,.view-controls input,#reset-view")
    .forEach((control) => {
      control.disabled = true;
    });
}
function setStep(n) {
  step = n;
  document.querySelectorAll("[data-step]").forEach((b) => {
    b.classList.toggle("current", Number(b.dataset.step) === step);
    b.setAttribute("aria-pressed", Number(b.dataset.step) === step);
  });
  document.querySelector("#step-prompt").textContent = t().stepText[step];
  document.querySelector("#prev").disabled = step === 0;
  document.querySelector("#next").disabled = step === 4;
}
function syncOutputs() {
  document.querySelectorAll("[data-key]").forEach((input) => {
    const key = input.dataset.key;
    if (input.type === "checkbox") input.checked = s[key];
    else input.value = s[key];
    const out = document.querySelector(`#out-${key}`);
    if (out) out.textContent = f(s[key]);
  });
}
function update() {
  if (!active) return;
  const u = t(),
    m = measure(active, s);
  syncOutputs();
  let items = [],
    formula = "";
  const item = (label, val, unit) => [
    label,
    `${f(val)} <small>${unit}</small>`,
  ];
  switch (active) {
    case "rectangle":
    case "challenge":
      items = [item(u.area, m.area, "u²"), item(u.perimeter, m.perimeter, "u")];
      formula = `A = w × h = ${s.w} × ${s.h} = <strong>${f(m.area)} u²</strong><br><span>P = 2(w + h) = ${f(m.perimeter)} u</span>`;
      break;
    case "triangle":
      items = [
        item(u.area, m.area, "u²"),
        item(u.area + " ▭", s.w * s.h, "u²"),
      ];
      formula = `A = ½bh = ½ × ${s.w} × ${s.h} = <strong>${f(m.area)} u²</strong>`;
      break;
    case "circle":
      items = [
        item(u.area, m.area, "u²"),
        item(u.circumference, m.circumference, "u"),
      ];
      formula = `A = πr² = ${f(s.r * s.r)}π <strong>≈ ${f(m.area)} u²</strong>`;
      break;
    case "cube":
    case "scale":
      items = [
        item(u.volume, m.volume, "u³"),
        item(u.surface, m.surface, "u²"),
      ];
      formula = `V = s³ = ${s.w}³ = <strong>${m.volume} u³</strong><br><span>S = 6s² = ${m.surface} u²</span>`;
      break;
    case "prism":
      items = [
        item(u.full, m.volume, "u³"),
        item(u.filled, s.w * s.d * s.layers, "u³"),
      ];
      formula = `V = lwh = ${s.w} × ${s.d} × ${s.h} = <strong>${m.volume} u³</strong><br><span>${u.base}: ${s.w * s.d} u² · ${u.layers}: ${s.layers}</span>`;
      break;
    case "cylinder":
      items = [
        item(u.volume, m.volume, "u³"),
        item(u.filled, m.volume * s.progress, "u³"),
      ];
      formula = `V = πr²h = ${f(s.r * s.r * s.h)}π <strong>≈ ${f(m.volume)} u³</strong><br><span>${u.base}: ${f(s.r * s.r)}π ≈ ${f(Math.PI * s.r * s.r)} u²</span>`;
      break;
    case "cone":
      items = [
        item(u.cone, m.volume, "u³"),
        item(u.cylinder, m.cylinder, "u³"),
        item(u.filled, m.cylinder * s.progress, "u³"),
      ];
      formula = `V = ⅓πr²h <strong>≈ ${f(m.volume)} u³</strong><br><span>V${lang === "en" ? "cone" : "cone"} : V${lang === "en" ? "cylinder" : "cilindro"} = 1 : 3</span>`;
      break;
    case "sphere":
      items = [
        item(u.volume, m.volume, "u³"),
        item(u.cross, m.slice, "u²"),
        item(u.cylinder, m.cylinder, "u³"),
      ];
      formula = `V = ⁴⁄₃πr³ <strong>≈ ${f(m.volume)} u³</strong><br><span>A(y) = π(r² − y²) ≈ ${f(m.slice)} u²</span>`;
      break;
  }
  document.querySelector("#measurements").innerHTML = items
    .map(
      ([label, v]) => `<div><span>${label}</span><strong>${v}</strong></div>`,
    )
    .join("");
  document.querySelector("#formula").innerHTML =
    `<p class="formula">${formula}</p>${active === "scale" ? `<p class="growth-label">${u.growth}</p><div class="growth-row"><span>${u.surface}</span><div style="--bar:${(s.w ** 2 / 512) * 100}%"></div><b>×${s.w ** 2}</b></div><div class="growth-row"><span>${u.volume}</span><div style="--bar:${(s.w ** 3 / 512) * 100}%"></div><b>×${s.w ** 3}</b></div>` : ""}`;
  const feedback = document.querySelector("#feedback");
  if (active === "challenge") {
    const good = challengeFeedback(s.w, s.h, s.mode);
    feedback.textContent = good ? u.success : u.keep;
    feedback.classList.toggle("success", good);
  } else if (active === "rectangle") {
    feedback.textContent = s.w * s.h === 24 ? u.success : "";
  } else if (active === "scale") {
    feedback.textContent = `${u.surface}: ×${s.w ** 2} · ${u.volume}: ×${s.w ** 3}`;
  }
  if (activities.find((a) => a.id === active).subject === "area") {
    // Keep pointer capture and drag state on the stable host.
    const host = document.querySelector("#stage");
    render2D(host, active, s, u, f, (patch) => {
      Object.assign(s, patch);
      update();
    });
  } else viewer?.update(active, s);
}
function reset() {
  stop();
  s = defaults(active);
  step = 0;
  render();
}
function play() {
  stop();
  if (s.progress >= 1) s.progress = 0;
  // Explicit Play always shows the demonstration, including with reduced motion.
  // CSS still suppresses incidental transitions; Pause and seeking remain available.
  playing = true;
  document.querySelector("#play").textContent = "Ⅱ " + t().pause;
  const initialProgress = s.progress;
  const startedAt = performance.now();
  let last = startedAt;
  update();
  function tick(now) {
    if (!playing) return;
    if (now - last >= 40) {
      s.progress = Math.min(
        1,
        initialProgress + (now - startedAt) / PLAYBACK_DURATION_MS,
      );
      last = now;
      update();
    }
    if (s.progress >= 1) {
      stop();
      return;
    }
    raf = requestAnimationFrame(tick);
  }
  raf = requestAnimationFrame(tick);
}
function render() {
  dispose();
  shell();
  if (active) activity();
  else landing();
}
render();
