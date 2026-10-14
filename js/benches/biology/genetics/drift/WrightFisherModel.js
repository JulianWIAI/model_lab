import { Random } from '../../../../core/Random.js';

/**
 * Many independent populations evolving under the Wright–Fisher model.
 *
 * Each population has N diploid individuals, so 2N copies of a gene.
 * Allele A has frequency p; the other allele a has 1 − p.
 * Every generation:
 *   1. selection nudges p:   p′ = p·(1+s) / (1 + s·p)
 *   2. drift samples 2N copies at random:  count ~ Binomial(2N, p′)
 */
export class WrightFisherModel {
  /**
   * @param {object} [options]
   * @param {number} [options.size=100]          N, individuals per population
   * @param {number} [options.selection=0]       s, advantage of allele A
   * @param {number} [options.startFrequency=0.5] p₀
   * @param {number} [options.replicates=20]     number of populations
   * @param {number} [options.maxGenerations=300]
   */
  constructor({ size = 100, selection = 0, startFrequency = 0.5, replicates = 20, maxGenerations = 300 } = {}) {
    this.size = size;
    this.selection = selection;
    this.startFrequency = startFrequency;
    this.replicates = replicates;
    this.maxGenerations = maxGenerations;
    this.reset();
  }

  /** Starts all populations again from p₀. */
  reset() {
    this.generation = 0;
    /** @type {number[][]} frequency of A in each population, one entry per generation */
    this.history = Array.from({ length: this.replicates }, () => [this.startFrequency]);
    this.deterministic = this.#selectionOnlyPath();
  }

  get done() {
    return this.generation >= this.maxGenerations;
  }

  /** Runs one generation in every population. */
  step() {
    if (this.done) return;
    const copies = 2 * this.size;
    const s = this.selection;

    for (const path of this.history) {
      const p = path[path.length - 1];
      if (p === 0 || p === 1) {
        path.push(p); // lost or fixed: nothing can change without mutation
        continue;
      }
      const afterSelection = (p * (1 + s)) / (1 + s * p);
      path.push(Random.binomial(copies, afterSelection) / copies);
    }
    this.generation++;
  }

  /** Current frequency of A in every population. */
  get current() {
    return this.history.map((path) => path[path.length - 1]);
  }

  /** How many populations have fixed A, lost A, or still carry both alleles. */
  get outcomes() {
    let fixed = 0;
    let lost = 0;
    for (const p of this.current) {
      if (p === 1) fixed++;
      else if (p === 0) lost++;
    }
    return { fixed, lost, mixed: this.replicates - fixed - lost };
  }

  get meanFrequency() {
    const values = this.current;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  /**
   * Kimura's probability that A eventually takes over:
   *   P = (1 − e^(−4Nsp₀)) / (1 − e^(−4Ns)),   and P = p₀ when s = 0.
   */
  get fixationProbability() {
    const a = 4 * this.size * this.selection;
    const p0 = this.startFrequency;
    if (Math.abs(a) < 1e-9) return p0;
    if (a < -600) return Math.exp(-a * (p0 - 1)); // avoids overflow for strongly harmful alleles
    return (1 - Math.exp(-a * p0)) / (1 - Math.exp(-a));
  }

  /** What selection alone would do in an infinite population (no drift). */
  #selectionOnlyPath() {
    const path = [this.startFrequency];
    let p = this.startFrequency;
    for (let g = 0; g < this.maxGenerations; g++) {
      p = (p * (1 + this.selection)) / (1 + this.selection * p);
      path.push(p);
    }
    return path;
  }
}
