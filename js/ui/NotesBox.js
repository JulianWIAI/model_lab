import { el } from './el.js';
import { storage } from '../core/Storage.js';

/**
 * A text box for the "explain it in one line" step.
 * Saves as you type, in this browser only.
 */
export class NotesBox {
  /**
   * @param {object} options
   * @param {string} options.id          element id
   * @param {string} options.storageKey  where the note is saved
   * @param {string} [options.placeholder]
   */
  constructor({ id, storageKey, placeholder = '' }) {
    this.textarea = el('textarea', { id, placeholder, 'aria-label': 'Your one-line explanation' });
    this.textarea.value = storage.get(storageKey, '');
    this.textarea.addEventListener('input', () => storage.set(storageKey, this.textarea.value));

    this.element = el('div', {}, [this.textarea, el('p', { class: 'hint', text: 'Saved in this browser only.' })]);
  }
}
