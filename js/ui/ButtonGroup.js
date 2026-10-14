import { el } from './el.js';

/**
 * A row of buttons where exactly one is selected (like radio buttons).
 */
export class ButtonGroup {
  /**
   * @param {object} options
   * @param {string} options.label  accessible name for the group
   * @param {{value: string, label: string}[]} options.options
   * @param {string} options.value  initially selected value
   * @param {(value: string) => void} [options.onChange]
   */
  constructor({ label, options, value, onChange = () => {} }) {
    this.onChange = onChange;
    this.buttons = new Map();
    this.element = el('div', { class: 'row', role: 'group', 'aria-label': label });

    for (const option of options) {
      const button = el('button', {
        type: 'button',
        class: 'btn',
        text: option.label,
        onClick: () => this.select(option.value),
      });
      this.buttons.set(option.value, button);
      this.element.append(button);
    }
    this.setValue(value);
  }

  /** Changes the highlighted button without calling onChange. */
  setValue(value) {
    this.value = value;
    for (const [key, button] of this.buttons) button.setAttribute('aria-pressed', String(key === value));
  }

  /** Selects a value as if the user clicked it. */
  select(value) {
    if (value === this.value) return;
    this.setValue(value);
    this.onChange(value);
  }
}
