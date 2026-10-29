# Research and activity design — 28 October 2026

The request was to find well-liked examples of children's mathematics games and complete Math Lab's four remaining subjects. There is no common, independently verifiable likes score across these platforms. Instead, this research used their official activity catalogs and an educator resource list to select relevant interaction patterns. This is a design shortlist, not a popularity ranking.

| Reference | Pattern used in the original CurioLab implementation |
|---|---|
| [Math Playground game catalog](https://www.mathplayground.com/game_directory) and [math games overview](https://www.mathplayground.com/math-games) | Short fraction, ratio and pre-algebra missions, immediate explanatory feedback and approachable visual targets |
| [PhET Fractions Intro](https://phet.colorado.edu/en/simulations/fractions-intro) | Equal pieces, visual/numerical fraction representations, exploration before explanation |
| [PhET Equality Explorer](https://phet.colorado.edu/en/simulations/equality-explorer) | A symbolic balance and equivalent operations on both sides |
| [Polypad](https://polypad.amplify.com/p) | Fraction bars, counters, function-machine inputs and outcome experiments |
| [Desmos Graphing Calculator](https://www.desmos.com/calculator) | Coefficient sliders linked to a live coordinate graph; input/output probes |
| [Toy Theater Spinner](https://toytheater.com/spinner/) | A visible chance wheel and experimental/theoretical probability comparison |
| [Rose Tree Media School District digital math resources](https://www.rtmsd.org/departments/curriculum-instruction/digital-math-resources) | Educator-curated cross-check of relevant games and manipulative platforms |

No proprietary code, question bank, illustration, game characters or page layouts were copied. There are no embedded third-party games, ads, accounts, subscriptions, analytics or external runtime dependencies. All models, missions, SVGs and controls are original local code. Each new activity links its design reference.

## What was implemented

- **Fraction builder:** selectable equal bar/circle pieces, keyboard/touch selection, denominator/numerator controls, compatible addition including improper fractions, equivalent-answer missions.
- **Equivalent fractions:** reference and subdivided bars, adjustable subdivision factor and second numerator, exact cross-product comparison, new matching missions.
- **Ratio recipe studio:** labeled A/B counters, recipe adjustments, proportional batch scaling, doubling and exact target-ratio comparison.
- **Equation balance:** symbolic x/1 blocks, trial x values, bilateral addition/subtraction/division, independent unit edits to observe imbalance, operation history and generated solvable missions. Numerical solutions are optional reveals.
- **Variable garden:** flowers arranged by input rows, a multiplier and extra flowers; an input/output table and target-growing missions.
- **Graph mission control:** linear and quadratic families, coefficient sliders, draggable/tappable curve probe, keyboard input, zoom, visible target beacons and exact hit detection.
- **Dice discovery lab:** fair six-sided outcomes, prediction, batches of 10/100/1,000 trials, frequency table/bars, independent single-trial playback and expected counts.
- **Probability spinner:** adjustable sector weights including zero, correctly weighted independent outcomes, reset on distribution changes, prediction and experimental comparison.

All eight include EN/PT-BR, reset, learning steps, beginner/advanced explanations and numeric alternatives. Missions are optional; discovery counts stay in the current activity only. Dice/spinner single-trial animations take five seconds, support pause/resume/replay, and do not record preview frames as trials. Explicit user playback still animates when reduced motion is enabled; incidental CSS transitions respect that setting. Batch buttons intentionally compute results directly rather than animating every trial.

## Mathematical safeguards

Exact rational comparisons use integer cross-products. Rounded decimal formulas use approximation signs. Ratios distinguish A:B from A/(A+B). Equation operations on both sides preserve solutions; unilateral edits are separately visible in a neutral equation history. Graphs compute analytic values and clip the view without changing the values. Each outcome is independently sampled with crypto.getRandomValues and rejection sampling, avoiding modulo bias. Zero-weight sectors cannot win; an all-zero distribution is rejected. Spinner weight changes reset counts so old and new probability models are not pooled.

The wheel pointer animates to a previously sampled sector; it is not a physical simulation. A symbolic balance is not a physical weight simulator. Experimental proportions need not equal theoretical probabilities, and more trials never guarantee exact equality. There is no promise that a less-frequent outcome is due next.

## Validation and limits

Pure unit tests cover rational equivalence, proportional scaling, equation-solution preservation, function evaluation, weighted ticket boundaries, random rejection, independent batch totals, zero-weight sectors and bilingual definitions. Browser checks exercise all eight experiences, controls, missions, reset, geometry navigation, Portuguese state preservation, phone/tablet widths, touch and probability playback. See the generated test reports for executed results.

Physical phones/tablets, non-Edge engines and full screen-reader/native-speaker audits remain untested. Graph missions use finite viewport and input/coefficient bounds. Equation blocks support nonnegative values; arbitrary signed expressions and unrestricted symbolic manipulation are outside this introductory activity. The virtual garden and ratio counters are simplified count models. These eight activities complete the requested subject experiences, not comprehensive curricula for every age or grade.

## Algebra representation and extended functions

The algebra model now expands each x into an equal framed group of unit tiles. For 2x + 8 = 16 at x = 4, two separate purple groups contain 4 + 4 tiles, eight gold tiles are added outside those groups, and sixteen right-hand tiles show the comparison. Trial inputs snap to tenths so displayed x and displayed totals agree. Exact-solution reveals preserve rational values and fractional tiles. Shared equation operations preserve solutions and the history includes the initial equation.

The supplied [Desmos Sine and Cosine example](https://www.desmos.com/calculator/nqfu5lxaij) was inspected: it contains y=sin(x), y=cos(x), and y=sin(x+a), with a slider. The original graph explorer now supports 14 families: linear, quadratic, cubic, absolute value, square root, reciprocal, exponential, natural logarithm, sine, cosine, tangent, cotangent, secant and cosecant. It adds explicit radians/degrees, A·f(B(x−h))+k transformations, sine/cosine reference overlays and a quarter-turn sine-shift demonstration. Inputs convert with the angle unit; screen labels use pi fractions where appropriate.

Mathematical references: [OpenStax Precalculus 2e §6.1](https://openstax.org/books/precalculus-2e/pages/6-1-graphs-of-the-sine-and-cosine-functions) and [§6.2](https://openstax.org/books/precalculus-2e/pages/6-2-graphs-of-the-other-trigonometric-functions). Sine/cosine periods use 2π/B and tangent/cotangent use π/B (or their degree equivalents). Undefined inputs produce missing probes and separated paths; dashed vertical asymptotes are computed analytically. No branch is joined across a pole. Square roots and logarithms enforce real domains. A tiny numerical tolerance detects trig poles. The graph remains a finite-resolution educational explorer with bounded transformations, not an unrestricted expression parser or a complete Desmos replacement.
