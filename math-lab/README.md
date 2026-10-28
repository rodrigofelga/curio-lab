# Math Lab — CurioLab mathematics collection

Live subpage: https://rodrigofelga.github.io/curio-lab/math-lab/

Ten geometry experiments in English and Brazilian Portuguese. Rectangle area/perimeter, triangle area, circle sector rearrangement, area/perimeter challenges, cube unit counts, prism layers, cylinder stacking, cone/cylinder comparison, sphere cross-sections, and surface/volume scaling. The four additional subject collections are explicitly upcoming.

## Development

The checked-in index.html, style.css, src/ and vendor/ are directly deployable static files. Three.js 0.180.0, its core module and OrbitControls are vendored with their MIT license. No remote runtime CDN is required.

From this directory with Node.js 22.16+:

    npm.cmd ci
    npm.cmd start

Open http://127.0.0.1:8001/. Existing static files also work with any ordinary HTTP server. Do not open index.html as a file.

    npm.cmd test
    npm.cmd run test:browser
    npm.cmd run test:playback
    npm.cmd run build

Browser tests use locally installed Microsoft Edge. The static smoke test expects a packaged build served on port 8002 (node scripts/serve.mjs dist 8002). Build output is local dist/ only. Root-level GitHub Pages serves this checked-in math-lab/ directory directly.

## Educational and accessibility notes

All formulas are pure functions in src/math.js. Cube/prism controls use integer lengths and exactly corresponding unit cubes. Circle sectors preserve area but only approach a rectangle in the limit. The cone transfer conserves volume with cube-root donor-depth scaling; it is an illustrative transfer, not fluid physics. Sphere slices use pi(r²-y²); the deeper explanation uses Cavalieri's principle. Surface/volume bars compare dimensionless growth factors rather than unlike units.

Controls include pointer/touch orbit, drag resizing, keyboard-accessible sliders, reset, playback, visible focus, reduced motion, text explanations, language switching and dark/light themes. If WebGL is unavailable, numeric controls and explanations remain usable. Physical device, full screen-reader and non-Edge browser audits remain future validation work.

The original local prototype passed 11 unit tests, 19 browser checks and six packaged-build checks. Publication integration adds checks for the hub card, mathematics filter/search, real nested asset paths, bilingual return link and mobile layout. No changes are made to Animal Cell Explorer or Solar System & Milky Way Explorer.

Mathematical reference: https://openstax.org/books/calculus-volume-1/pages/6-2-determining-volumes-by-slicing

## Playback timing

Every user-started triangle, circle, cylinder and cone demonstration takes five seconds from start to finish, including when reduced motion is enabled. Incidental CSS motion remains suppressed by that preference. Pause retains progress; resume takes the remaining fraction of five seconds, and Replay starts a new five-second run. Playback timing regression checks cover both motion preferences, seeking, pause/resume, replay, and an actual wall-clock run.
