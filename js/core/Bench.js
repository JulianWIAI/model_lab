import { BenchLayout } from '../ui/BenchLayout.js';
import { CanvasView } from './CanvasView.js';
import { ToggleButton } from '../ui/ToggleButton.js';

/**
 * Base class for every simulation.
 *
 * A subclass provides:
 *   static meta  – id, title, navLabel, canvasLabel
 *   static info  – formula, predict, breaks, derive, research (shown as cards)
 *   build()      – create the model, view, controls and readouts
 *   update(dt)   – advance the model by dt real seconds (skipped while paused)
 *   draw()       – draw the current state (runs every frame)
 *
 * The App calls mount() once, then frame(dt) every animation frame while visible.
 */
export class Bench {
  static meta = { id: 'bench', title: 'Untitled', navLabel: 'Untitled', canvasLabel: '' };
  static info = {};

  constructor() {
    this.meta = this.constructor.meta;
    this.info = this.constructor.info;
    this.paused = false;
    this.reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    /** @type {BenchLayout|null} */
    this.layout = null;
    /** @type {CanvasView|null} */
    this.view = null;
  }

  /** Builds the page section for this bench inside container. */
  mount(container) {
    this.layout = new BenchLayout(container, this.meta, this.info);
    this.view = new CanvasView(this.layout.canvas);
    this.build();
  }

  setVisible(visible) {
    this.layout.root.hidden = !visible;
  }

  /** Called by the App every frame. */
  frame(dt) {
    if (!this.paused) this.update(dt);
    this.draw();
  }

  /** Override in subclasses. */
  build() {}
  /** Override in subclasses. @param {number} dt seconds since the last frame */
  update(dt) {} // eslint-disable-line no-unused-vars
  /** Override in subclasses. */
  draw() {}

  /** A ready-made Pause/Play button bound to this.paused. */
  createPauseButton() {
    return new ToggleButton({
      label: 'Pause',
      pressedLabel: 'Play',
      pressed: this.paused,
      onToggle: (pressed) => { this.paused = pressed; },
    });
  }

  /** Builds a unique element id for a control, e.g. "pendulum-angle". */
  controlId(name) {
    return `${this.meta.id}-${name}`;
  }
}
