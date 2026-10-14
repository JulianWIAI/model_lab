import { storage } from '../core/Storage.js';

/** The three theme modes, in the order the button cycles through them. */
const MODES = ['system', 'light', 'dark'];

/**
 * Header button that cycles the theme: follow the system, force light, force dark.
 * Works by setting data-theme on <html>, which css/tokens.css reacts to.
 */
export class ThemeToggle {
  /** @param {HTMLButtonElement} button */
  constructor(button) {
    this.button = button;
    const saved = storage.get('theme', 'system');
    this.mode = MODES.includes(saved) ? saved : 'system';
    this.#apply();

    button.addEventListener('click', () => {
      this.mode = MODES[(MODES.indexOf(this.mode) + 1) % MODES.length];
      storage.set('theme', this.mode);
      this.#apply();
    });
  }

  #apply() {
    const root = document.documentElement;
    if (this.mode === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', this.mode);
    this.button.textContent = `Theme: ${this.mode}`;
  }
}
