import { el } from './el.js';
import { NotesBox } from './NotesBox.js';

/**
 * Builds the standard page section every bench shares:
 *
 *   left  (stage): title, action buttons, canvas, legend, live readouts, note
 *   right (side):  controls, formula, "Predict first", "Where it breaks",
 *                  "Derive it", "Research it", notes box
 *
 * Benches only fill in the parts; the structure stays the same everywhere.
 */
export class BenchLayout {
  /**
   * @param {HTMLElement} container
   * @param {object} meta  the bench's static meta
   * @param {object} info  the bench's static info (texts for the cards)
   */
  constructor(container, meta, info) {
    // Left column
    this.actions = el('div', { class: 'row' });
    this.canvas = el('canvas', { 'aria-label': meta.canvasLabel || meta.title, role: 'img' });
    this.legendSlot = el('div');
    this.readoutSlot = el('div');
    this.stageNote = el('p', { class: 'stage-note', hidden: true });
    const stage = el('div', { class: 'stage' }, [
      el('div', { class: 'stagebar' }, [el('h2', { text: meta.title }), this.actions]),
      this.canvas,
      this.legendSlot,
      this.readoutSlot,
      this.stageNote,
    ]);

    // Right column
    this.controls = el('div', { class: 'controls' });
    this.formulaEl = el('pre', { class: 'formula' });
    const notes = new NotesBox({
      id: `${meta.id}-notes`,
      storageKey: `notes:${meta.id}`,
      placeholder: info.notePlaceholder || 'In one sentence: what happened, and why?',
    });

    const side = el('div', { class: 'side' }, [
      this.#card('Controls', this.controls),
      this.#card('Formula', this.formulaEl),
      info.predict && this.#card('Predict first', this.#list(info.predict, 'ul'), 'predict'),
      info.breaks && this.#card('Where it breaks', info.breaks.map((t) => el('p', { text: t }))),
      meta.related?.length && this.#card('Related simulations', this.#related(meta.related)),
      info.derive && this.#collapsible('Derive it', this.#derive(info.derive)),
      info.research && this.#collapsible('Research it', this.#research(info.research)),
      this.#card('Your one-line explanation', notes.element),
    ]);

    this.setFormula(info.formula || '');
    this.root = el('section', { class: 'bench', id: `bench-${meta.id}` }, [stage, side]);
    container.append(this.root);
  }

  /** Adds a button (or any component with .element) next to the title. */
  addAction(component) {
    this.actions.append(component.element ?? component);
  }

  /** Adds a slider, button row or other control to the Controls card. */
  addControl(component) {
    this.controls.append(component.element ?? component);
  }

  /** Adds a small grey explanation line to the Controls card. */
  addHint(text) {
    this.controls.append(el('p', { class: 'hint', text }));
  }

  setLegend(legend) {
    this.legendSlot.replaceChildren(legend.element);
  }

  setReadouts(panel) {
    this._readoutPanel = panel;
    this.readoutSlot.replaceChildren(panel.element);
  }

  /** Alias used by Phase 6 benches. */
  addReadout(panel) { this.setReadouts(panel); }

  /** Updates a single readout by key (forwards to the mounted ReadoutPanel). */
  setReadout(key, value) {
    this._readoutPanel?.set(key, value);
  }

  setFormula(text) {
    this.formulaEl.textContent = text;
  }

  /** A short line of text under the readouts; empty text hides it. */
  setStageNote(text) {
    this.stageNote.textContent = text;
    this.stageNote.hidden = !text;
  }

  // ---- private builders ----

  #card(title, content, variant = '') {
    return el('section', { class: `card ${variant}`.trim() }, [el('h3', { text: title }), ...[].concat(content)]);
  }

  #collapsible(title, content) {
    return el('section', { class: 'card' }, [el('details', {}, [el('summary', { text: title }), ...[].concat(content)])]);
  }

  #list(items, tag) {
    return el(tag, {}, items.map((t) => el('li', { text: t })));
  }

  /** Links to related bench routes ('subject/id'). Each becomes a hash link. */
  #related(routes) {
    return el(
      'div',
      { class: 'related-links' },
      routes.map((route) => {
        const label = route.split('/').pop(); // show the bench id portion
        return el('a', { href: `#${route}`, class: 'related-chip', text: label });
      }),
    );
  }

  /** Derivation steps: numbered, because the order matters. */
  #derive(steps) {
    return el(
      'ol',
      {},
      steps.map((step) =>
        el('li', {}, [
          el('p', { text: step.text }),
          step.formula ? el('pre', { class: 'formula small', text: step.formula }) : null,
        ]),
      ),
    );
  }

  /** Open questions, a build challenge and the original sources. */
  #research({ questions = [], challenge = '', papers = [] }) {
    const parts = [];
    if (questions.length) parts.push(this.#list(questions, 'ul'));
    if (challenge) {
      parts.push(el('p', { class: 'challenge' }, [el('strong', { text: 'Build it: ' }), challenge]));
    }
    if (papers.length) {
      parts.push(el('p', { class: 'hint', text: 'Original sources' }));
      parts.push(
        el(
          'ul',
          { class: 'sources' },
          papers.map((p) => {
            // Without a known URL, link to a Google Scholar search for the title.
            const url = p.url || `https://scholar.google.com/scholar?q=${encodeURIComponent(`${p.title} ${p.authors}`)}`;
            return el('li', {}, [
              `${p.authors} (${p.year}). `,
              el('a', { href: url, target: '_blank', rel: 'noopener', text: p.title }),
            ]);
          }),
        ),
      );
    }
    return parts;
  }
}
