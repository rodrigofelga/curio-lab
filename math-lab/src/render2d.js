const NS = "http://www.w3.org/2000/svg";
export function render2D(host, id, s, t, f, onChange) {
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", "0 0 800 440");
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", t.stage);
  host.replaceChildren(svg);
  const add = (tag, attrs = {}, text) => {
    const el = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    if (text !== undefined) el.textContent = text;
    svg.append(el);
    return el;
  };
  const line = (x1, y1, x2, y2, c = "#5e8c83", extra = {}) =>
    add("line", { x1, y1, x2, y2, stroke: c, "stroke-width": 2, ...extra });
  const label = (x, y, text, c = "#314d47") =>
    add(
      "text",
      {
        x,
        y,
        fill: c,
        "font-size": 17,
        "text-anchor": "middle",
        "font-family": "system-ui",
      },
      text,
    );
  const teal = "#368a7b",
    gold = "#df9c42";
  if (["rectangle", "challenge", "triangle"].includes(id)) {
    const unit = 25,
      x = 140,
      y = 365,
      w = s.w * unit,
      h = s.h * unit;
    if (s.grid)
      for (let i = 0; i <= 20; i++) {
        line(100 + i * unit, 65, 100 + i * unit, 390, "#d5e1d9", {
          "stroke-width": 1,
        });
        if (i < 14)
          line(100, 65 + i * unit, 700, 65 + i * unit, "#d5e1d9", {
            "stroke-width": 1,
          });
      }
    if (id === "challenge") {
      add("rect", {
        x,
        y: y - 100,
        width: 150,
        height: 100,
        fill: "none",
        stroke: gold,
        "stroke-width": 3,
        "stroke-dasharray": "7 5",
      });
      label(555, 110, `${t.reference}: 6 × 4`, gold);
    }
    if (id === "triangle") {
      add("rect", {
        x,
        y: y - h,
        width: w,
        height: h,
        fill: "none",
        stroke: "#879c91",
        "stroke-dasharray": "7 6",
        "stroke-width": 2,
      });
      const pts = `${x},${y} ${x + w},${y} ${x},${y - h}`;
      add("polygon", {
        points: pts,
        fill: teal,
        "fill-opacity": 0.65,
        stroke: teal,
        "stroke-width": 2,
      });
      add("polygon", {
        points: pts,
        fill: gold,
        "fill-opacity": 0.65,
        stroke: gold,
        "stroke-width": 2,
        transform: `rotate(${180 * s.progress} ${x + w / 2} ${y - h / 2})`,
      });
      label(550, 170, `A△ = ${f((s.w * s.h) / 2)} u²`);
      label(550, 205, `A▭ = ${f(s.w * s.h)} u²`);
    } else {
      add("rect", {
        x,
        y: y - h,
        width: w,
        height: h,
        fill: teal,
        "fill-opacity": 0.18,
        stroke: teal,
        "stroke-width": 3,
      });
      if (s.grid) {
        for (let i = 1; i < s.w; i++)
          line(x + i * unit, y - h, x + i * unit, y, teal, {
            "stroke-width": 1,
            "stroke-opacity": 0.5,
          });
        for (let j = 1; j < s.h; j++)
          line(x, y - j * unit, x + w, y - j * unit, teal, {
            "stroke-width": 1,
            "stroke-opacity": 0.5,
          });
      }
      const handle = add("circle", {
        cx: x + w,
        cy: y - h,
        r: 13,
        fill: teal,
        stroke: "white",
        "stroke-width": 4,
        style: "cursor:nwse-resize;touch-action:none",
      });
      host._dragging ??= false;
      const move = (e) => {
        if (!host._dragging) return;
        const p = svg.createSVGPoint();
        p.x = e.clientX;
        p.y = e.clientY;
        const q = p.matrixTransform(svg.getScreenCTM().inverse());
        onChange({
          w: Math.max(1, Math.min(12, Math.round((q.x - x) / unit))),
          h: Math.max(1, Math.min(10, Math.round((y - q.y) / unit))),
        });
      };
      // Capture on the persistent host, since each update replaces the SVG.
      handle.onpointerdown = (e) => {
        host._dragging = true;
        host.setPointerCapture(e.pointerId);
        e.preventDefault();
      };
      host.onpointermove = move;
      host.onpointerup = host.onpointercancel = () => {
        host._dragging = false;
      };
    }
    if (s.labels) {
      label(
        x + w / 2,
        y + 30,
        `${id === "triangle" ? t.base : t.w} = ${f(s.w)} u`,
        "#3778a4",
      );
      label(x - 68, y - h / 2, `${t.h} ${f(s.h)} u`, "#a66d29");
    }
  } else if (id === "circle") {
    const r = s.r * 30,
      n = s.sectors,
      a = (2 * Math.PI) / n,
      half = a / 2,
      chord = 2 * r * Math.sin(half),
      p = s.progress,
      left = 400 - ((n / 2) * chord) / 2;
    for (let i = 0; i < n; i++) {
      const startAngle = i * a,
        targetAngle = i % 2 === 0 ? 0 : 180;
      let delta = targetAngle - (startAngle * 180) / Math.PI;
      delta = ((delta + 540) % 360) - 180;
      const cx =
        265 * (1 - p) +
        (left + Math.floor(i / 2) * chord + (i % 2 ? chord / 2 : 0)) * p;
      const cy = 225 * (1 - p) + (i % 2 ? 240 - r * Math.cos(half) : 240) * p;
      const x1 = -r * Math.sin(half),
        y1 = -r * Math.cos(half),
        x2 = -x1;
      add("path", {
        d: `M 0 0 L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y1} Z`,
        fill: i % 2 ? gold : teal,
        stroke: "#f6f7f2",
        "stroke-width": 1,
        transform: `translate(${cx} ${cy}) rotate(${(startAngle * 180) / Math.PI + delta * p})`,
      });
    }
    if (p === 0 && s.labels) {
      line(265, 225, 265 + r, 225, "#3778a4", { "stroke-width": 3 });
      label(265 + r / 2, 214, `r = ${f(s.r)} u`);
      label(590, 210, `${t.diameter}: ${f(2 * s.r)} u`);
      label(590, 244, `2πr ≈ ${f(2 * Math.PI * s.r)} u`);
    }
    if (p > 0.95) {
      if (s.labels) {
        label(400, 285, `≈ πr = ${f(Math.PI * s.r)} u`);
        label(left - 25, 240 - r / 2, "≈ r");
      }
      label(400, 325, t.approx);
    }
  }
  return () => {
    host.onpointermove = null;
    host.onpointerup = null;
    host.onpointercancel = null;
  };
}
