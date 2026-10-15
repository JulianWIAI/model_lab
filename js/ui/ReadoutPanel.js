import { el } from './el.js';

/**
 * A grid of labelled live numbers shown under the canvas.
 */
export class ReadoutPanel {
  /** @param {{key?: string, id?: string, label: string}[]} items */
  constructor(items) {
    this.values = new Map();
    this.element = el('div', { class: 'readouts' });
    for (const { key, id, label } of items) {
      const k = key ?? id;
      const value = el('span', { text: '–' });
      this.values.set(k, value);
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
