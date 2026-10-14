import { Router } from './Router.js';
import { storage } from './Storage.js';
import { el } from '../ui/el.js';

/**
 * Runs the whole lab: builds the subject tabs and simulation chips,
 * creates each bench the first time it is opened, and drives the
 * animation loop for whichever bench is visible.
 */
export class App {
  /**
   * @param {object} options
   * @param {Array} options.catalog       subjects and their bench classes (see catalog.js)
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
    this.instances = new Map(); // bench id -> mounted bench object
    this.active = null;
    this.lastTime = null;
    this.subjectButtons = new Map();
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
   * Shows a bench. Unknown ids fall back to the first subject or bench.
   * @param {{subject?: string|null, bench?: string|null}} route
   */
  open(route) {
    const subject = this.catalog.find((s) => s.id === route.subject) ?? this.catalog[0];
    const BenchClass = subject.benches.find((b) => b.meta.id === route.bench) ?? subject.benches[0];
    const benchId = BenchClass.meta.id;

    this.router.replace(subject.id, benchId);
    storage.set('route', `${subject.id}/${benchId}`);

    for (const [id, button] of this.subjectButtons) {
      button.setAttribute('aria-selected', String(id === subject.id));
    }
    this.#buildBenchNav(subject, benchId);

    // Benches are created lazily, then kept alive so their state survives tab switches.
    let bench = this.instances.get(benchId);
    if (!bench) {
      bench = new BenchClass();
      bench.mount(this.root);
      this.instances.set(benchId, bench);
    }
    for (const other of this.instances.values()) other.setVisible(other === bench);

    this.active = bench;
    document.title = `${BenchClass.meta.navLabel} · Model Lab`;
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

  /** One chip per simulation in the current subject. */
  #buildBenchNav(subject, activeId) {
    const chips = subject.benches.map((B) =>
      el('button', {
        type: 'button',
        text: B.meta.navLabel,
        'aria-current': String(B.meta.id === activeId),
        onClick: () => this.open({ subject: subject.id, bench: B.meta.id }),
      }),
    );
    this.benchNav.replaceChildren(...chips);
  }

  /** Animation loop. dt is capped so a background tab does not cause a huge jump. */
  #loop(time) {
    const dt = this.lastTime === null ? 0 : Math.min(0.05, (time - this.lastTime) / 1000);
    this.lastTime = time;
    if (this.active) this.active.frame(dt);
    requestAnimationFrame((t) => this.#loop(t));
  }
}
