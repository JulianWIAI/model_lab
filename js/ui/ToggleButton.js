import { el } from './el.js';

/**
 * A button that stays pressed or unpressed (e.g. "Catalyst on", "Pause").
 * Its label can change with the state.
 */
export class ToggleButton {
  /**
   * @param {object} options
   * @param {string} options.label           text when not pressed
   * @param {string} [options.pressedLabel]  text when pressed (defaults to label)
   * @param {boolean} [options.pressed=false]
   * @param {(pressed: boolean) => void} [options.onToggle]
   */
  constructor({ label, pressedLabel = label, pressed = false, onToggle = () => {} }) {
    this.label = label;
    this.pressedLabel = pressedLabel;
    this.onToggle = onToggle;
    this.element = el('button', { type: 'button', class: 'btn' });
    this.element.addEventListener('click', () => {
      this.pressed = !this.pressed;
      this.onToggle(this.pressed);
    });
    this.pressed = pressed;
  }

  get pressed() {
    return this._pressed;
  }

  /** Setting from code updates the look but does not call onToggle. */
  set pressed(value) {
    this._pressed = Boolean(value);
    this.element.setAttribute('aria-pressed', String(this._pressed));
    this.element.textContent = this._pressed ? this.pressedLabel : this.label;
  }
}
