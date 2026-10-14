/**
 * Keeps the current simulation in the address bar as #subject/bench,
 * so a link like  .../#chemistry/equilibrium  opens that simulation directly.
 */
export class Router {
  /** @returns {{subject: string|null, bench: string|null}} */
  current() {
    const raw = decodeURIComponent(window.location.hash.slice(1));
    const [subject, bench] = raw.split('/');
    return { subject: subject || null, bench: bench || null };
  }

  /** Updates the address bar without adding a history entry or firing hashchange. */
  replace(subject, bench) {
    const hash = `#${subject}/${bench}`;
    if (window.location.hash !== hash) window.history.replaceState(null, '', hash);
  }

  /** Calls fn when the user edits the hash by hand or follows a link. */
  onChange(fn) {
    window.addEventListener('hashchange', () => fn(this.current()));
  }
}
