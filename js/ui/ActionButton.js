import { el } from './el.js';

/** A plain button that does one thing when clicked (e.g. "Restart", "Add A"). */
export class ActionButton {
  /**
   * @param {object} options
   * @param {string} options.label
   * @param {() => void} options.onClick
   */
  constructor({ label, onClick }) {
    this.element = el('button', { type: 'button', class: 'btn', text: label, onClick });
  }

  set disabled(value) {
    this.element.disabled = Boolean(value);
  }
}
