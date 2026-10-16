/**
 * InformationTheoryModel — Shannon information theory (bits = log₂).
 */
export class InformationTheoryModel {
  /**
   * @param {{ probs?: number[], B?: number, SNR?: number }} opts
   *   probs: probability distribution (must sum to 1)
   *   B:     bandwidth in Hz
   *   SNR:   signal-to-noise ratio (linear scale)
   */
  constructor({ probs = [0.5, 0.5], B = 1, SNR = 3 } = {}) {
    this.probs = probs;
    this.B = B;
    this.SNR = SNR;
  }

  /**
   * Shannon entropy in bits: H = -Σ p·log₂(p).
   * By convention 0·log₂(0) = 0.
   * @param {number[]} [probs]
   * @returns {number}
   */
  entropy(probs = this.probs) {
    let h = 0;
    for (const p of probs) {
      if (p <= 0) continue;
      h -= p * Math.log2(p);
    }
    return h;
  }

  /**
   * Maximum entropy for n equiprobable outcomes: log₂(n).
   * @param {number} n
   * @returns {number}
   */
  hMax(n) {
    return Math.log2(n);
  }

  /**
   * Shannon-Hartley channel capacity: C = B·log₂(1+SNR) bits/s.
   * @param {number} [B]
   * @param {number} [SNR]
   * @returns {number}
   */
  shannonHartley(B = this.B, SNR = this.SNR) {
    return B * Math.log2(1 + SNR);
  }

  /**
   * KL divergence D(P‖Q) in bits.
   * If Q[i]=0 and P[i]>0, returns Infinity.
   * By convention 0·log₂(0/anything) = 0.
   * @param {number[]} P
   * @param {number[]} Q
   * @returns {number}
   */
  klDivergence(P, Q) {
    let kl = 0;
    for (let i = 0; i < P.length; i++) {
      if (P[i] <= 0) continue;
      if (Q[i] <= 0) return Infinity;
      kl += P[i] * Math.log2(P[i] / Q[i]);
    }
    return kl;
  }

  /**
   * Binary entropy function H₂(p) = -p·log₂(p) - (1-p)·log₂(1-p).
   * @param {number} p
   * @returns {number}
   */
  binaryEntropy(p) {
    if (p <= 0 || p >= 1) return 0;
    return -p * Math.log2(p) - (1-p) * Math.log2(1-p);
  }
}
