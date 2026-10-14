/**
 * Gives canvas drawings access to the CSS colour tokens in css/tokens.css,
 * so plots follow light and dark mode exactly like the rest of the page.
 */
export class Theme {
  constructor(root = document.documentElement) {
    this.root = root;
    this.cache = new Map();

    // Colours change when the OS theme flips or the theme button sets data-theme.
    const invalidate = () => this.cache.clear();
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', invalidate);
    new MutationObserver(invalidate).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  }

  /**
   * @param {string} token CSS variable name, e.g. '--accent'
   * @returns {string} its current colour value
   */
  color(token) {
    if (!this.cache.has(token)) {
      this.cache.set(token, getComputedStyle(this.root).getPropertyValue(token).trim());
    }
    return this.cache.get(token);
  }

  /**
   * Canvas font string in the lab's fonts.
   * @param {number} size  pixel size
   * @param {'mono'|'sans'} family
   * @param {number} weight
   */
  font(size = 11, family = 'mono', weight = 400) {
    const stack = family === 'mono'
      ? '"IBM Plex Mono", ui-monospace, Menlo, monospace'
      : '"IBM Plex Sans", system-ui, sans-serif';
    return `${weight} ${size}px ${stack}`;
  }
}

/** Shared instance used by every view. */
export const theme = new Theme();
