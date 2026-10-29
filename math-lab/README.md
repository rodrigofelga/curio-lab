# Math Lab — CurioLab mathematics collection

Live subpage: https://rodrigofelga.github.io/curio-lab/math-lab/

18 interactive mathematics experiences in English and Brazilian Portuguese. The ten geometry activities are joined by fraction building, equivalent fractions, ratio recipes, equation balance, a variable garden, 14-family function graph missions, dice experiments and a weighted probability spinner. All six subjects are available; none is an upcoming placeholder.

## Development

The checked-in index.html, style.css, src/ and vendor/ are directly deployable static files. Three.js 0.180.0, its core module and OrbitControls are vendored with their MIT license. No remote runtime CDN is required.

From this directory with Node.js 22.16+:

    npm.cmd ci
    npm.cmd start

Open http://127.0.0.1:8001/. Existing static files also work with any ordinary HTTP server. Do not open index.html as a file.

    npm.cmd test
    npm.cmd run test:browser
    npm.cmd run test:playback
    npm.cmd run test:learning
    npm.cmd run test:visual
    npm.cmd run build

Browser tests use locally installed Microsoft Edge. The static smoke test expects a packaged build served on port 8002 (node scripts/serve.mjs dist 8002). Build output is local dist/ only. Root-level GitHub Pages serves this checked-in math-lab/ directory directly.

## Educational and accessibility notes

All formulas are pure functions in src/math.js. Cube/prism controls use integer lengths and exactly corresponding unit cubes. Circle sectors preserve area but only approach a rectangle in the limit. The cone transfer conserves volume with cube-root donor-depth scaling; it is an illustrative transfer, not fluid physics. Sphere slices use pi(r²-y²); the deeper explanation uses Cavalieri's principle. Surface/volume bars compare dimensionless growth factors rather than unlike units.

Controls include pointer/touch orbit, drag resizing, keyboard-accessible sliders, reset, playback, visible focus, reduced motion, text explanations, language switching and dark/light themes. If WebGL is unavailable, numeric controls and explanations remain usable. Physical device, full screen-reader and non-Edge browser audits remain future validation work.

The original local prototype passed 11 unit tests, 19 browser checks and six packaged-build checks. Publication integration adds checks for the hub card, mathematics filter/search, real nested asset paths, bilingual return link and mobile layout. No changes are made to Animal Cell Explorer or Solar System & Milky Way Explorer.

Mathematical reference: https://openstax.org/books/calculus-volume-1/pages/6-2-determining-volumes-by-slicing

## Playback timing

Every user-started triangle, circle, cylinder and cone demonstration takes five seconds from start to finish, including when reduced motion is enabled. Incidental CSS motion remains suppressed by that preference. Pause retains progress; resume takes the remaining fraction of five seconds, and Replay starts a new five-second run. Playback timing regression checks cover both motion preferences, seeking, pause/resume, replay, and an actual wall-clock run.

## New subject design and verification

See [RESEARCH.md](RESEARCH.md) for official platform references, original activity designs, mathematical safeguards and scope limits. New code is separated into learning-data.js (bilingual activity content), learning-math.js (pure calculations and unbiased sampling), and learning.js (accessible controls, SVG/DOM models, missions and five-second probability playback). The geometry architecture is preserved. Tests add rational, algebraic, function and probability unit cases plus browser checks across all new activities, translations, resets and responsive sizes.

## Clearer algebra and extended graphs

Algebra now uses repeated equal groups of visible unit tiles: 2x is shown as x+x, and the added constant stays separate. Decimal and fractional trials have proportional partial tiles. Graphs support 14 function families, including all six basic trig functions, plus radians/degrees, transformations, sin/cos overlays, a quarter-turn shift lesson, domain checks and separated asymptote branches. See RESEARCH.md for the supplied Desmos example and OpenStax validation references. New pure tests cover function values, domains, poles, branch separation, periods and tile counts; browser tests check models, transformations and bilingual mobile layouts.
