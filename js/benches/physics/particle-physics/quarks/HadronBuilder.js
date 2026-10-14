import { QUARKS, QUARK_ORDER, HADRONS } from './QuarkData.js';

/**
 * Holds the quarks the user has picked and works out which particle they form.
 *   baryon mode: three quarks (no antiquarks)
 *   meson mode:  one quark plus one antiquark
 */
export class HadronBuilder {
  constructor() {
    this.mode = 'baryon';
    /** @type {string[]} quark symbols in the order they were added */
    this.slots = [];
  }

  /** Number of quarks a complete particle needs in the current mode. */
  get capacity() {
    return this.mode === 'baryon' ? 3 : 2;
  }

  get complete() {
    return this.slots.length === this.capacity;
  }

  /** Switches between baryons and mesons and empties the slots. */
  setMode(mode) {
    this.mode = mode;
    this.slots = [];
  }

  /** Whether adding this quark keeps the combination valid. */
  canAdd(symbol) {
    if (this.complete) return false;
    const isAnti = QUARKS[symbol].anti;
    if (this.mode === 'baryon') return !isAnti;
    // Meson: one of each kind
    return !this.slots.some((s) => QUARKS[s].anti === isAnti);
  }

  add(symbol) {
    if (this.canAdd(symbol)) this.slots.push(symbol);
  }

  clear() {
    this.slots = [];
  }

  /** Total electric charge in units of the proton charge. */
  get charge() {
    return this.slots.reduce((sum, s) => sum + QUARKS[s].charge, 0);
  }

  /** Sum of the bare quark masses in MeV. */
  get bareMass() {
    return this.slots.reduce((sum, s) => sum + QUARKS[s].mass, 0);
  }

  /** Lookup key into HADRONS for the current quarks. */
  key() {
    if (this.mode === 'baryon') {
      return [...this.slots].sort((a, b) => QUARK_ORDER.indexOf(a) - QUARK_ORDER.indexOf(b)).join('');
    }
    const quark = this.slots.find((s) => !QUARKS[s].anti) ?? '';
    const anti = this.slots.find((s) => QUARKS[s].anti) ?? '';
    return quark + anti;
  }

  /** @returns {{name: string, mass: number, note: string}|null} the particle, once complete */
  identify() {
    return this.complete ? HADRONS[this.key()] ?? null : null;
  }
}
