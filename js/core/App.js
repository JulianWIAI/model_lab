import { Router } from './Router.js';
import { storage } from './Storage.js';
import { el } from '../ui/el.js';

/** Human-readable badge text for each level value. */
const LEVEL_LABEL = { intro: 'Intro', university: 'University', graduate: 'Graduate' };

/**
 * Runs the whole lab: builds the subject tabs and simulation chips,
 * lazy-loads each bench the first time it is opened, and drives the
 * animation loop for whichever bench is visible.
 *
 * The catalog is a three-level structure: subjects → fields → bench entries.
 * Each entry carries only navigation metadata and a load() function that
 * returns the bench class on demand.
 */
export class App {
  /**
   * @param {object} options
   * @param {import('../catalog.js').Subject[]} options.catalog  subjects → fields → bench entries
   * @param {HTMLElement} options.subjectNav  container for subject tabs
   * @param {HTMLElement} options.benchNav    container for simulation chips
   * @param {HTMLElement} options.root        where benches are mounted
   */
  constructor({ catalog, subjectNav, benchNav, root }) {
    this.catalog = catalog;
    this.subjectNav = subjectNav;
    this.benchNav = benchNav;
    this.root = root;
    this.router = new Router();
    /** Mounted bench instances: benchId → bench object */
    this.instances = new Map();
    /** Loaded bench classes: benchId → BenchClass (cached after first load) */
    this.loadedClasses = new Map();
    this.active = null;
    this.lastTime = null;
    this.subjectButtons = new Map();
    /** Loading sentinel element shown while a bench module is fetching */
    this.loadingEl = el('p', { class: 'loading', text: 'Loading…', hidden: true });
    this.root.prepend(this.loadingEl);
  }

  /** Builds navigation, opens the first bench and starts animating. */
  start() {
    this.#buildSubjectNav();
    this.router.onChange((route) => this.open(route));

    // Priority: link in the address bar, then the last bench visited, then the first one.
    const fromUrl = this.router.current();
    const saved = (storage.get('route', '') || '').split('/');
    this.open(fromUrl.subject ? fromUrl : { subject: saved[0], bench: saved[1] });

    requestAnimationFrame((t) => this.#loop(t));
  }

  /**
   * Shows a bench. Unknown ids fall back to the first subject / bench.
   * Returns a Promise so callers can await it, but the animation loop
   * does not need to wait.
   * @param {{subject?: string|null, bench?: string|null}} route
   */
  async open(route) {
    const subject = this.catalog.find((s) => s.id === route.subject) ?? this.catalog[0];

    // Flatten fields → entries to find the requested bench.
    const allEntries = subject.fields.flatMap((f) => f.benches);
    const entry = allEntries.find((e) => e.id === route.bench) ?? allEntries[0];

    this.router.replace(subject.id, entry.id);
    storage.set('route', `${subject.id}/${entry.id}`);

    for (const [id, button] of this.subjectButtons) {
      button.setAttribute('aria-selected', String(id === subject.id));
    }
    this.#buildBenchNav(subject, entry.id);

    // Show loading sentinel while the module is being fetched.
    if (!this.loadedClasses.has(entry.id)) {
      this.loadingEl.hidden = false;
      // Hide all existing bench instances while loading.
      for (const bench of this.instances.values()) bench.setVisible(false);
      this.active = null;
    }

    // Load the class (cached after the first call).
    let BenchClass = this.loadedClasses.get(entry.id);
    if (!BenchClass) {
      BenchClass = await entry.load();
      this.loadedClasses.set(entry.id, BenchClass);
    }
    this.loadingEl.hidden = true;

    document.title = `${entry.navLabel} · Model Lab`;

    // Mount once, keep alive so state survives tab switches.
    let bench = this.instances.get(entry.id);
    if (!bench) {
      bench = new BenchClass();
      bench.mount(this.root);
      this.instances.set(entry.id, bench);
    }
    for (const other of this.instances.values()) other.setVisible(other === bench);
    this.active = bench;
  }

  /** One tab per subject. */
  #buildSubjectNav() {
    for (const subject of this.catalog) {
      const button = el('button', {
        type: 'button',
        role: 'tab',
        text: subject.name,
        onClick: () => this.open({ subject: subject.id }),
      });
      this.subjectButtons.set(subject.id, button);
      this.subjectNav.append(button);
    }
  }

  /**
   * Chips grouped under field headings for the current subject.
   * Each chip carries a small level badge.
   */
  #buildBenchNav(subject, activeId) {
    const children = [];
    for (const field of subject.fields) {
      children.push(el('p', { class: 'field-heading', text: field.name }));
      for (const entry of field.benches) {
        const badge = el('span', { class: `level-badge level-${entry.level}`, text: LEVEL_LABEL[entry.level] ?? entry.level });
        const chip = el('button', {
          type: 'button',
          'aria-current': String(entry.id === activeId),
          onClick: () => this.open({ subject: subject.id, bench: entry.id }),
        });
        chip.append(document.createTextNode(entry.navLabel + ' '), badge);
        children.push(chip);
      }
    }
    this.benchNav.replaceChildren(...children);
  }

  /** Animation loop. dt is capped so a background tab does not cause a huge jump. */
  #loop(time) {
    const dt = this.lastTime === null ? 0 : Math.min(0.05, (time - this.lastTime) / 1000);
    this.lastTime = time;
    if (this.active) this.active.frame(dt);
    requestAnimationFrame((t) => this.#loop(t));
  }
}
