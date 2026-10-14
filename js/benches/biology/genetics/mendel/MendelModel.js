/**
 * MendelModel — Mendelian crosses, Punnett squares, and chi-square goodness-of-fit.
 *
 * Supports monohybrid and dihybrid crosses with complete, incomplete, and
 * co-dominance. Linkage is modelled via recombination frequency.
 *
 * References:
 *   Mendel, G. (1866). Versuche über Pflanzenhybriden. Verh. Naturforsch. Ver. Brünn, 4, 3–47.
 *   Falconer & Mackay (1996). Introduction to Quantitative Genetics, 4th ed. ch. 1.
 */
import { Random } from '../../../../core/Random.js';

export class MendelModel {
  constructor() {
    this.crossType = 'mono';
    this.dominance = 'complete';
    this.recombFreq = 0.5;
    this.parentA = 'Aa';
    this.parentB = 'Aa';
    this.litterSize = 100;
  }

  // Returns array of gametes (strings) for a monohybrid parent genotype
  _monoGametes(geno) {
    return [geno[0], geno[1]];
  }

  // Returns array of {gamete, freq} for di-hybrid parent genotype with linkage
  _diGametes(geno) {
    // geno is like 'AaBb'
    const A1 = geno[0], A2 = geno[1], B1 = geno[2], B2 = geno[3];
    const r = this.recombFreq;
    // Parental gametes: A1B1 and A2B2
    // Recombinant: A1B2 and A2B1
    if (r === 0.5) {
      return [
        { gamete: A1 + B1, freq: 0.25 },
        { gamete: A1 + B2, freq: 0.25 },
        { gamete: A2 + B1, freq: 0.25 },
        { gamete: A2 + B2, freq: 0.25 },
      ];
    }
    return [
      { gamete: A1 + B1, freq: (1 - r) / 2 },
      { gamete: A1 + B2, freq: r / 2 },
      { gamete: A2 + B1, freq: r / 2 },
      { gamete: A2 + B2, freq: (1 - r) / 2 },
    ];
  }

  phenotype(genotype) {
    if (this.crossType === 'mono') {
      const [a1, a2] = [genotype[0], genotype[1]];
      const upper = a1 === a1.toUpperCase();
      const upper2 = a2 === a2.toUpperCase();
      if (this.dominance === 'complete') {
        return (upper || upper2) ? `${a1.toUpperCase()}_` : `${a1.toLowerCase()}${a2.toLowerCase()}`;
      }
      return genotype; // incomplete/codominance: show all three
    }
    // Dihybrid
    if (this.dominance === 'complete') {
      const domA = genotype[0] === genotype[0].toUpperCase() || genotype[1] === genotype[1].toUpperCase();
      const domB = genotype[2] === genotype[2].toUpperCase() || genotype[3] === genotype[3].toUpperCase();
      return `${domA ? 'A_' : 'aa'} ${domB ? 'B_' : 'bb'}`;
    }
    return genotype;
  }

  punnettSquare() {
    if (this.crossType === 'mono') {
      const gamA = this._monoGametes(this.parentA);
      const gamB = this._monoGametes(this.parentB);
      const cells = gamB.map(gb => gamA.map(ga => {
        const alleles = [ga, gb].sort((a, b) => a.toLowerCase() === b.toLowerCase() ? (a < b ? 1 : -1) : 0);
        return alleles.join('');
      }));
      // Count phenotypes
      const counts = {};
      cells.flat().forEach(g => {
        const ph = this.phenotype(g);
        counts[ph] = (counts[ph] || 0) + 1;
      });
      const total = 4;
      const phenotypeRatios = Object.entries(counts).map(([label, count]) => ({ label, count, p: count / total }));
      return { cells, gameteA: gamA, gameteB: gamB, phenotypeRatios };
    }
    // Dihybrid
    const gamA = this._diGametes(this.parentA);
    const gamB = this._diGametes(this.parentB);
    const cells = gamB.map(gb => gamA.map(ga => {
      // Sort alleles within each locus
      const a1 = ga.gamete[0], a2 = gb.gamete[0];
      const b1 = ga.gamete[1], b2 = gb.gamete[1];
      const locA = [a1, a2].sort((x, y) => x.toLowerCase() === y.toLowerCase() ? (x < y ? 1 : -1) : 0).join('');
      const locB = [b1, b2].sort((x, y) => x.toLowerCase() === y.toLowerCase() ? (x < y ? 1 : -1) : 0).join('');
      return locA + locB;
    }));
    // Count phenotypes by gamete freq product
    const phenoCounts = {};
    for (let i = 0; i < gamB.length; i++) {
      for (let j = 0; j < gamA.length; j++) {
        const g = cells[i][j];
        const ph = this.phenotype(g);
        const freq = gamA[j].freq * gamB[i].freq;
        phenoCounts[ph] = (phenoCounts[ph] || 0) + freq;
      }
    }
    const phenotypeRatios = Object.entries(phenoCounts).map(([label, p]) => ({ label, p }));
    return { cells: cells.map(row => row), gameteA: gamA.map(g => g.gamete), gameteB: gamB.map(g => g.gamete), phenotypeRatios };
  }

  simulateLitter(n = this.litterSize) {
    const pq = this.punnettSquare();
    const result = [];
    for (let i = 0; i < n; i++) {
      // Pick random gametes weighted by frequency
      let ga, gb;
      if (this.crossType === 'mono') {
        ga = pq.gameteA[Math.floor(Random.uniform(0, pq.gameteA.length))];
        gb = pq.gameteB[Math.floor(Random.uniform(0, pq.gameteB.length))];
        const alleles = [ga, gb].sort((a, b) => a.toLowerCase() === b.toLowerCase() ? (a < b ? 1 : -1) : 0);
        const genotype = alleles.join('');
        result.push({ genotype, phenotype: this.phenotype(genotype) });
      } else {
        // Di: use weighted sampling
        const gamA = this._diGametes(this.parentA);
        const gamB = this._diGametes(this.parentB);
        ga = this._weightedPick(gamA).gamete;
        gb = this._weightedPick(gamB).gamete;
        const a1 = ga[0], a2 = gb[0], b1 = ga[1], b2 = gb[1];
        const locA = [a1, a2].sort((x, y) => x.toLowerCase() === y.toLowerCase() ? (x < y ? 1 : -1) : 0).join('');
        const locB = [b1, b2].sort((x, y) => x.toLowerCase() === y.toLowerCase() ? (x < y ? 1 : -1) : 0).join('');
        const genotype = locA + locB;
        result.push({ genotype, phenotype: this.phenotype(genotype) });
      }
    }
    return result;
  }

  _weightedPick(items) {
    const r = Random.uniform(0, 1);
    let cumulative = 0;
    for (const item of items) {
      cumulative += item.freq;
      if (r <= cumulative) return item;
    }
    return items[items.length - 1];
  }

  chiSquare(observed, expected) {
    // observed and expected: arrays of numbers (counts or proportions scaled to same total)
    const total = observed.reduce((a, b) => a + b, 0);
    const expectedCounts = expected.map(e => e * total);
    let stat = 0;
    const df = observed.length - 1;
    for (let i = 0; i < observed.length; i++) {
      if (expectedCounts[i] > 0) {
        stat += (observed[i] - expectedCounts[i]) ** 2 / expectedCounts[i];
      }
    }
    const pValue = MendelModel.chiSquarePValue(stat, df);
    return { stat, pValue, df };
  }

  // Regularized upper incomplete gamma Q(a, x) = 1 - P(a, x)
  // Returns p-value for chi-square test: P(X > chi2) where X ~ chi2(df)
  static chiSquarePValue(chi2, df) {
    const a = df / 2;
    const x = chi2 / 2;
    if (x < 0) return 1;
    if (x === 0) return 1;
    return 1 - MendelModel.regularizedGamma(a, x);
  }

  // Regularized lower incomplete gamma P(a, x) = gamma(a, x) / Gamma(a)
  static regularizedGamma(a, x) {
    if (x < 0) return 0;
    if (x === 0) return 0;
    if (x < a + 1) {
      // Series expansion
      return MendelModel._gammaSeries(a, x);
    } else {
      // Continued fraction
      return 1 - MendelModel._gammaCF(a, x);
    }
  }

  static _gammaSeries(a, x) {
    const ITMAX = 200;
    const EPS = 3e-15;
    let ap = a;
    let sum = 1 / a;
    let del = sum;
    for (let n = 1; n <= ITMAX; n++) {
      ap++;
      del *= x / ap;
      sum += del;
      if (Math.abs(del) < Math.abs(sum) * EPS) break;
    }
    return sum * Math.exp(-x + a * Math.log(x) - MendelModel.logGamma(a));
  }

  static _gammaCF(a, x) {
    // Lentz's method for continued fraction
    const ITMAX = 200;
    const EPS = 3e-15;
    const FPMIN = 1e-300;
    let b = x + 1 - a;
    let c = 1 / FPMIN;
    let d = 1 / b;
    let h = d;
    for (let i = 1; i <= ITMAX; i++) {
      const an = -i * (i - a);
      b += 2;
      d = an * d + b;
      if (Math.abs(d) < FPMIN) d = FPMIN;
      c = b + an / c;
      if (Math.abs(c) < FPMIN) c = FPMIN;
      d = 1 / d;
      const del = d * c;
      h *= del;
      if (Math.abs(del - 1) < EPS) break;
    }
    return Math.exp(-x + a * Math.log(x) - MendelModel.logGamma(a)) * h;
  }

  // Log-gamma using Lanczos approximation (Numerical Recipes, 6-term)
  static logGamma(z) {
    const p = [
      76.18009172947146, -86.50532032941677, 24.01409824083091,
      -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5,
    ];
    let y = z;
    let x = z;
    let tmp = x + 5.5;
    tmp -= (x + 0.5) * Math.log(tmp);
    let ser = 1.000000000190015;
    for (let j = 0; j < 6; j++) {
      y++;
      ser += p[j] / y;
    }
    return -tmp + Math.log(2.5066282746310005 * ser / x);
  }
}
