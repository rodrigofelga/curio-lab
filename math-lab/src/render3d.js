import { coneFillDepth } from "./math.js";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
export function create3D(host, t) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 200);
  camera.position.set(13, 10, 15);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.setClearColor(0, 0);
  host.replaceChildren(renderer.domElement);
  renderer.domElement.setAttribute("aria-label", t.stage);
  renderer.domElement.setAttribute("role", "img");
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = false;
  controls.minDistance = 7;
  controls.maxDistance = 150;
  controls.enablePan = false;
  controls.addEventListener("change", draw);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x7b8e8b, 2.8));
  const light = new THREE.DirectionalLight(0xffffff, 3);
  light.position.set(6, 12, 9);
  scene.add(light);
  let model = new THREE.Group();
  scene.add(model);
  let viewSize = 10;
  let frameWidth = 10;
  let frameHeight = 10;
  function frame(width, height) {
    frameWidth = width;
    frameHeight = height;
    viewSize = Math.max(width / Math.max(1, camera.aspect), height);
  }
  function draw() {
    renderer.render(scene, camera);
  }
  function clear() {
    scene.remove(model);
    model.traverse((o) => {
      o.geometry?.dispose();
      if (o.material) {
        for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
          m.map?.dispose();
          m.dispose();
        }
      }
    });
    model = new THREE.Group();
    scene.add(model);
  }
  function material(color, s, opacity) {
    return new THREE.MeshStandardMaterial({
      color,
      roughness: 0.38,
      metalness: 0.03,
      wireframe: s.wire,
      transparent: opacity !== undefined || s.transparent,
      opacity: opacity ?? (s.transparent ? 0.3 : 0.85),
      side: THREE.DoubleSide,
      depthWrite: !(opacity !== undefined || s.transparent),
    });
  }
  function mesh(geo, color, s, x = 0, y = 0, z = 0, opacity) {
    const m = new THREE.Mesh(geo, material(color, s, opacity));
    m.position.set(x, y, z);
    model.add(m);
    return m;
  }
  function outline(geo, x = 0, y = 0, z = 0) {
    const e = new THREE.LineSegments(
      new THREE.EdgesGeometry(geo, 24),
      new THREE.LineBasicMaterial({
        color: 0x577b77,
        transparent: true,
        opacity: 0.55,
      }),
    );
    e.position.set(x, y, z);
    model.add(e);
    geo.dispose();
    return e;
  }
  function label(text, x, y, z, color = "#254b44") {
    const c = document.createElement("canvas");
    const ctx = c.getContext("2d");
    ctx.font = "bold 28px system-ui";
    c.width = Math.ceil(ctx.measureText(text).width + 24);
    c.height = 64;
    ctx.fillStyle = "#f6f7f2";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = color;
    ctx.font = "bold 28px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(text, c.width / 2, 42);
    const tex = new THREE.CanvasTexture(c);
    const sp = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: tex, depthTest: false }),
    );
    const labelHeight = viewSize * 0.09;
    sp.scale.set((labelHeight * c.width) / c.height, labelHeight, 1);
    sp.position.set(x, y, z);
    model.add(sp);
  }
  function cubes(l, w, h, layers, s) {
    const geo = new THREE.BoxGeometry(1, 1, 1),
      mat = material(0x5ea99a, s);
    const obj = new THREE.InstancedMesh(geo, mat, l * w * layers);
    const mx = new THREE.Matrix4();
    let n = 0;
    for (let y = 0; y < layers; y++)
      for (let x = 0; x < l; x++)
        for (let z = 0; z < w; z++) {
          mx.makeTranslation(x - (l - 1) / 2, y - (h - 1) / 2, z - (w - 1) / 2);
          obj.setMatrixAt(n++, mx);
        }
    model.add(obj);
    const vertices = [];
    const segment = (...coords) => vertices.push(...coords);
    for (let y = 0; y <= layers; y++)
      for (let z = 0; z <= w; z++)
        segment(-l / 2, y - h / 2, z - w / 2, l / 2, y - h / 2, z - w / 2);
    for (let x = 0; x <= l; x++)
      for (let z = 0; z <= w; z++)
        segment(
          x - l / 2,
          -h / 2,
          z - w / 2,
          x - l / 2,
          layers - h / 2,
          z - w / 2,
        );
    for (let x = 0; x <= l; x++)
      for (let y = 0; y <= layers; y++)
        segment(x - l / 2, y - h / 2, -w / 2, x - l / 2, y - h / 2, w / 2);
    const lines = new THREE.BufferGeometry();
    lines.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(vertices, 3),
    );
    model.add(
      new THREE.LineSegments(
        lines,
        new THREE.LineBasicMaterial({
          color: 0x3a7163,
          transparent: true,
          opacity: 0.45,
        }),
      ),
    );
  }
  function update(id, s) {
    const previousSize = viewSize;
    clear();
    const green = 0x4b9c8b,
      purple = 0x9482c8,
      gold = 0xe5aa56;
    const p = s.progress;
    if (["cube", "prism", "scale"].includes(id)) {
      const l = s.w,
        w = id === "prism" ? s.d : s.w,
        h = id === "prism" ? s.h : s.w;
      frame(Math.max(l, w, h) + 4, Math.max(l, w, h) + 4);
      if (s.grid && id !== "scale")
        cubes(l, w, h, id === "prism" ? s.layers : h, s);
      else if (id === "prism") {
        if (s.layers > 0)
          mesh(
            new THREE.BoxGeometry(l, s.layers, w),
            green,
            s,
            0,
            -h / 2 + s.layers / 2,
            0,
          );
      } else
        mesh(
          new THREE.BoxGeometry(l, h, w),
          id === "scale" ? purple : green,
          s,
        );
      outline(new THREE.BoxGeometry(l, h, w));
      if (id === "scale") {
        mesh(
          new THREE.BoxGeometry(1, 1, 1),
          gold,
          s,
          -l / 2 - 2,
          -h / 2 + 0.5,
          0,
        );
        if (s.labels) label("1 u", -l / 2 - 2, -h / 2 - 0.6, 0);
        frame(frameWidth + 3, frameHeight + 3);
      }
      if (s.labels) {
        label(`${t.w}: ${l} u`, 0, -h / 2 - 0.6, w / 2 + 0.4, "#3778a4");
        label(`${t.h}: ${h} u`, l / 2 + 1.3, 0, 0, "#9b621d");
        label(`${t.d}: ${w} u`, -l / 2 - 1, 0, 0);
      }
    } else if (id === "cylinder" || id === "cone") {
      const r = s.r,
        h = s.h;
      frame(
        id === "cone" ? r * 5 + 3 : r * 2 + 3,
        h + 4 + (id === "cone" ? r * 1.5 : 0),
      );
      const x = id === "cone" ? r * 1.5 + 0.5 : 0;
      const cylinderGeo = () => new THREE.CylinderGeometry(r, r, h, 64);
      mesh(cylinderGeo(), green, s, x, 0, 0, s.transparent ? 0.12 : 0.9);
      outline(cylinderGeo(), x);
      if (id === "cone") {
        const cx = -x;
        const donor = mesh(
          new THREE.ConeGeometry(r, h, 64),
          gold,
          s,
          cx,
          0,
          0,
          s.transparent ? 0.12 : 0.9,
        );
        donor.rotation.z = Math.PI;
        const ol = outline(new THREE.ConeGeometry(r, h, 64), cx);
        ol.rotation.z = Math.PI;
        const portion = p === 1 ? 0 : 1 - ((p * 3) % 1),
          depth = coneFillDepth(h, portion),
          k = depth / h;
        if (depth > 0.001) {
          const fill = mesh(
            new THREE.ConeGeometry(r * k, depth, 64),
            gold,
            s,
            cx,
            -h / 2 + depth / 2,
            0,
            0.75,
          );
          fill.rotation.z = Math.PI;
        }
        if (p > 0.001)
          mesh(
            new THREE.CylinderGeometry(r, r, h * p, 64),
            purple,
            s,
            x,
            -h / 2 + (h * p) / 2,
            0,
            0.7,
          );
        for (let j = 1; j <= 2; j++) {
          const ring = new THREE.Mesh(
            new THREE.TorusGeometry(r, 0.025, 6, 64),
            new THREE.MeshBasicMaterial({ color: 0x73689a }),
          );
          ring.rotation.x = Math.PI / 2;
          ring.position.set(x, -h / 2 + (h * j) / 3, 0);
          model.add(ring);
        }
        if (s.labels) {
          label("⅓πr²h", cx, h / 2 + 1, 0);
          label("πr²h", x, h / 2 + 1, 0);
          label(`${Math.min(3, Math.floor(p * 3))} / 3`, x, -h / 2 - 1, 0);
        }
      } else {
        if (p > 0.001)
          mesh(
            new THREE.CylinderGeometry(r, r, h * p, 64),
            green,
            s,
            0,
            -h / 2 + (h * p) / 2,
            0,
            0.7,
          );
        for (let j = 1; j < 10; j++) {
          const ring = new THREE.Mesh(
            new THREE.TorusGeometry(r, 0.016, 4, 64),
            new THREE.MeshBasicMaterial({
              color: 0x347b70,
              transparent: true,
              opacity: 0.5,
            }),
          );
          ring.rotation.x = Math.PI / 2;
          ring.position.y = -h / 2 + (h * j) / 10;
          model.add(ring);
        }
      }
      if (s.base) {
        const base = mesh(
          new THREE.CircleGeometry(r, 64),
          gold,
          s,
          x,
          -h / 2 - 0.02,
          0,
          0.8,
        );
        base.rotation.x = -Math.PI / 2;
      }
      if (s.labels) {
        label(`r = ${s.r} u`, x, -h / 2 - 0.7, r);
        label(`h = ${s.h} u`, x + r + 1, 0, 0);
      }
    } else if (id === "sphere") {
      const r = s.r,
        y = s.slice * r,
        rad = Math.sqrt(Math.max(0, r * r - y * y));
      frame(r * 2 + 5, r * 2 + 5);
      mesh(
        new THREE.SphereGeometry(r, 48, 32),
        purple,
        s,
        0,
        0,
        0,
        s.transparent ? 0.2 : 0.8,
      );
      if (s.base) {
        mesh(
          new THREE.CylinderGeometry(r, r, 2 * r, 64),
          green,
          { ...s, wire: true },
          0,
          0,
          0,
          0.12,
        );
      }
      if (rad > 0.001) {
        const disk = mesh(
          new THREE.CircleGeometry(rad, 64),
          gold,
          s,
          0,
          y,
          0,
          0.96,
        );
        disk.rotation.x = -Math.PI / 2;
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(rad, 0.035, 6, 64),
          new THREE.MeshBasicMaterial({ color: gold, depthTest: false }),
        );
        ring.rotation.x = Math.PI / 2;
        ring.position.y = y;
        model.add(ring);
      }
      if (s.labels) {
        label(`r = ${r} u`, 0, -r - 1, 0);
        label(
          `y = ${new Intl.NumberFormat(document.documentElement.lang, { maximumFractionDigits: 2 }).format(y)} u`,
          r + 1,
          y,
          0,
        );
      }
    }
    if (viewSize !== previousSize) {
      camera.position.multiplyScalar(viewSize / previousSize);
      controls.update();
    }
    draw();
  }
  function resize() {
    const w = host.clientWidth,
      h = host.clientHeight || 430;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const previousSize = viewSize;
    frame(frameWidth, frameHeight);
    camera.position.multiplyScalar(viewSize / previousSize);
    camera.updateProjectionMatrix();
    draw();
  }
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  resize();
  return {
    update,
    view(angle, zoom) {
      const phi = (angle * Math.PI) / 180,
        dist = (viewSize * 1.5) / zoom;
      camera.position.set(
        Math.sin(phi) * dist,
        dist * 0.65,
        Math.cos(phi) * dist,
      );
      controls.target.set(0, 0, 0);
      controls.update();
      draw();
    },
    reset() {
      this.view(40, 1);
    },
    dispose() {
      observer.disconnect();
      controls.dispose();
      clear();
      renderer.dispose();
      renderer.forceContextLoss();
      host.replaceChildren();
    },
  };
}
