import { mkdir, cp, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
const root = resolve(import.meta.dirname, ".."),
  out = resolve(root, "dist");
await mkdir(out, { recursive: true });
for (const name of ["style.css", "src"])
  await cp(resolve(root, name), resolve(out, name), { recursive: true });
await mkdir(resolve(out, "vendor/three/addons/controls"), { recursive: true });
for (const name of ["three.module.js", "three.core.js"])
  await cp(
    resolve(root, "node_modules/three/build", name),
    resolve(out, "vendor/three", name),
  );
await cp(
  resolve(root, "node_modules/three/examples/jsm/controls/OrbitControls.js"),
  resolve(out, "vendor/three/addons/controls/OrbitControls.js"),
);
await cp(
  resolve(root, "node_modules/three/LICENSE"),
  resolve(out, "vendor/three/LICENSE"),
);
let html = await readFile(resolve(root, "index.html"), "utf8");
html = html
  .replace(
    "./node_modules/three/build/three.module.js",
    "./vendor/three/three.module.js",
  )
  .replace("./node_modules/three/examples/jsm/", "./vendor/three/addons/");
await writeFile(resolve(out, "index.html"), html);
console.log("Local static build created in dist/. Nothing published.");
