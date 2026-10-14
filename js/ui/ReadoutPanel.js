import { el } from './el.js';

/**
 * A grid of labelled live numbers shown under the canvas.
 */
export class ReadoutPanel {
  /** @param {{key: string, label: string}[]} items */
  constructor(items) {
    this.values = new Map();
    this.element = el('div', { class: 'readouts' });
    for (const { key, label } of items) {
      const value = el('span', { text: '–' });
      this.values.set(key, value);
      this.element.append(el('div', { class: 'ro' }, [el('small', { text: label }), value]));
    }
  }

  /**
   * Updates one readout. Skips the DOM write when nothing changed,
   * so calling this every frame is cheap.
   */
  set(key, text) {
    const node = this.values.get(key);
    if (node && node.textContent !== text) node.textContent = text;
  }
}
