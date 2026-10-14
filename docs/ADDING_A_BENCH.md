# Adding a new simulation (bench)

A bench is three files in its own folder plus one line in `js/catalog.js`.
The pendulum in `js/benches/physics/pendulum/` is the smallest complete example; copy it and rename.

## 1. Create the folder

```
js/benches/<subject>/<topic>/
  <Name>Model.js
  <Name>View.js
  <Name>Bench.js
```

Example: `js/benches/chemistry/titration/TitrationModel.js`, `TitrationView.js`, `TitrationBench.js`.

## 2. The model: the science only

- One class, no DOM, no canvas, no `document`.
- Holds the state (positions, concentrations, frequencies…) and a `step(dt)` method that advances it.
- Every equation gets a comment saying what it is and where it comes from.
- Use real units and say which ones at the top of the file.

```js
/**
 * Radioactive decay: N(t) = N₀·e^(−λt). Time in seconds.
 */
export class DecayModel {
  constructor({ halfLife = 10, start = 1000 } = {}) {
    this.halfLife = halfLife;
    this.start = start;
    this.reset();
  }

  reset() {
    this.nuclei = this.start;
    this.time = 0;
  }

  /** Decay constant λ = ln 2 / half-life */
  get lambda() {
    return Math.LN2 / this.halfLife;
  }

  step(dt) {
    this.nuclei *= Math.exp(-this.lambda * dt); // exact solution over one step
    this.time += dt;
  }
}
```

## 3. The view: the drawing only

- One class that receives the `CanvasView` and draws a model.
- Start every draw with `const c = this.canvasView.begin();`.
- Use `Axes` for anything with axes, and `theme.color('--token')` for every colour, so light and dark mode both work.

```js
import { Axes } from '../../../core/Axes.js';
import { theme } from '../../../core/Theme.js';

export class DecayView {
  constructor(canvasView) {
    this.canvasView = canvasView;
  }

  draw(model, trace) {
    const c = this.canvasView.begin();
    const { width: w, height: h } = this.canvasView;
    const axes = new Axes(c, { left: 44, top: 20, right: w - 8, bottom: h - 26 }, [0, 60], [0, model.start]);
    axes.grid({ yTicks: [0, model.start / 2, model.start], xTicks: [0, 20, 40, 60], xLabel: 'seconds' });
    axes.polyline(trace.channel(0), { color: theme.color('--accent') });
  }
}
```

## 4. The bench: controls and texts

Extend `Bench`. Fill in `static meta`, `static info`, and the methods `build()`, `update(dt)`, `draw()`.

```js
import { Bench } from '../../../core/Bench.js';
import { TimeSeries } from '../../../core/TimeSeries.js';
import { Slider } from '../../../ui/Slider.js';
import { DecayModel } from './DecayModel.js';
import { DecayView } from './DecayView.js';

export class DecayBench extends Bench {
  static meta = {
    id: 'decay',                      // unique across the whole lab
    title: 'Half-life and decay',     // heading above the canvas
    navLabel: 'Radioactive decay',    // chip label
    canvasLabel: 'Number of nuclei over time',
  };

  static info = {
    formula: 'N(t) = N₀·e^(−λt)     λ = ln2 / T½',
    predict: ['After three half-lives, what fraction is left?'],
    breaks: ['Real samples decay one nucleus at a time, at random. This model is smooth.'],
    derive: [{ text: 'Each nucleus has the same chance λ·dt to decay in a short time dt.', formula: 'dN = −λ·N·dt' }],
    research: {
      questions: ['Why is decay random for one atom but predictable for a billion?'],
      challenge: 'Replace the smooth formula with individual random nuclei and compare.',
      papers: [{ authors: 'E. Rutherford & F. Soddy', year: 1902, title: 'The cause and nature of radioactivity' }],
    },
  };

  build() {
    this.model = new DecayModel();
    this.trace = new TimeSeries(60);
    this.decayView = new DecayView(this.view);
    this.layout.addAction(this.createPauseButton());
    this.layout.addControl(new Slider({
      id: this.controlId('halflife'), label: 'Half-life', min: 1, max: 30, value: 10,
      format: (v) => `${v} s`,
      onInput: (v) => { this.model.halfLife = v; },
    }));
  }

  update(dt) {
    this.model.step(dt);
    this.trace.push(this.model.time, [this.model.nuclei]);
  }

  draw() {
    this.decayView.draw(this.model, this.trace);
  }
}
```

`info` fields are all optional; leave one out and its card disappears. Papers without a `url` link to a Google Scholar search for their title.

## 5. Register it

In `js/catalog.js`, import the bench and add it to a subject (or add a new subject):

```js
import { DecayBench } from './benches/physics/decay/DecayBench.js';

{ id: 'physics', name: 'Physics', benches: [PendulumBench, QuarkBench, DecayBench] },
```

Reload the page. The new chip appears under the subject.

## Checklist

- [ ] Model has no DOM or canvas code
- [ ] View has no physics, chemistry or biology
- [ ] Every class in its own file, every file starts with a short doc comment
- [ ] Every colour comes from `theme.color(...)`
- [ ] Bench `meta.id` is unique
- [ ] The "Where it breaks" card is honest about the model's limits
- [ ] Works at phone width and in dark mode

## Asking Claude Code to build one

A prompt that works well:

> Add a new bench to Model Lab for *&lt;topic&gt;* in `js/benches/<subject>/<topic>/`. Follow docs/ADDING_A_BENCH.md and copy the structure of the pendulum bench: a Model file with only the equations, a View file with only drawing, and a Bench file with controls and the predict / breaks / derive / research texts. Comment the code normally and register it in catalog.js.
