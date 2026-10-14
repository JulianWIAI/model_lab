import { el } from './el.js';

/**
 * A labelled range slider with a live value readout.
 * onInput fires whenever the user moves it.
 */
export class Slider {
  /**
   * @param {object} options
   * @param {string} options.id       unique element id (use bench.controlId('name'))
   * @param {string} options.label
   * @param {number} options.min
   * @param {number} options.max
   * @param {number} [options.step=1]
   * @param {number} options.value    starting value
   * @param {(v: number) => string} [options.format]  how the value is shown
   * @param {(v: number) => void} [options.onInput]
   */
  constructor({ id, label, min, max, step = 1, value, format = (v) => String(v), onInput = () => {} }) {
    this.format = format;
    this.onInput = onInput;
    this.output = el('output', { for: id });
    this.input = el('input', { type: 'range', id, min, max, step, value });
    this.element = el('div', { class: 'ctrl' }, [el('label', { for: id, text: label }), this.output, this.input]);

    this.input.addEventListener('input', () => this.#changed());
    this.#render();
  }

  get value() {
    return Number(this.input.value);
  }

  /** Setting the value from code also fires onInput, like a user change. */
  set value(v) {
    this.input.value = String(v);
    this.#changed();
  }

  #render() {
    this.output.textContent = this.format(this.value);
  }

  #changed() {
    this.#render();
    this.onInput(this.value);
  }
}
