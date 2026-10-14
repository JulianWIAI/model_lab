import { el } from './el.js';

/**
 * Colour key explaining the lines on a plot.
 * Colours are given as CSS token names so they follow the theme.
 */
export class Legend {
  /** @param {{label: string, token: string}[]} items  e.g. { label: 'voltage', token: '--accent' } */
  constructor(items) {
    this.element = el(
      'div',
      { class: 'legend' },
      items.map(({ label, token }) => {
        const swatch = el('i');
        swatch.style.background = `var(${token})`;
        return el('span', {}, [swatch, label]);
      }),
    );
  }
}
