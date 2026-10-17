/**
 * OptionsPricingModel — Black-Scholes European option pricing.
 *
 * C = S·Φ(d₁) − K·e^{−rT}·Φ(d₂)    [call price]
 * P = K·e^{−rT}·Φ(−d₂) − S·Φ(−d₁)  [put price]
 * d₁ = [ln(S/K) + (r+σ²/2)·T] / (σ√T)
 * d₂ = d₁ − σ√T
 *
 * Φ implemented via Taylor series for erf (NOT Abramowitz & Stegun polynomial).
 * Put-call parity: C − P = S − K·e^{−rT}  (exact algebraic identity).
 *
 * Educational use only — not financial advice.
 * Reference: Black & Scholes (1973), JPE 81:637.
 */

function erf(x) {
  if (Math.abs(x) > 4) return x > 0 ? 1 : -1;  // |1-erf(4)| < 3e-8; safe early exit
  let sum = 0, term = x, n = 0;
  while (Math.abs(term) > 1e-17 && n < 200) {
    sum += term;
    n++;
    term *= -x * x * (2 * n - 1) / (n * (2 * n + 1));
  }
  return 2 / Math.sqrt(Math.PI) * sum;
}

function Phi(x) {
  return (1 + erf(x / Math.SQRT2)) / 2;
}

export class OptionsPricingModel {
  /**
   * @param {{S: number, K: number, r: number, sigma: number, T: number}} opts
   * @throws {RangeError} for invalid parameters
   */
  constructor({ S, K, r, sigma, T }) {
    if (S <= 0) throw new RangeError('OptionsPricingModel: S must be > 0');
    if (K <= 0) throw new RangeError('OptionsPricingModel: K must be > 0');
    if (sigma <= 0) throw new RangeError('OptionsPricingModel: sigma must be > 0');
    if (T <= 0) throw new RangeError('OptionsPricingModel: T must be > 0');
    this.S     = S;
    this.K     = K;
    this.r     = r;
    this.sigma = sigma;
    this.T     = T;
  }

  /** d₁ = [ln(S/K) + (r+σ²/2)·T] / (σ√T) */
  d1() {
    const { S, K, r, sigma, T } = this;
    return (Math.log(S / K) + (r + sigma * sigma / 2) * T) / (sigma * Math.sqrt(T));
  }

  /** d₂ = d₁ − σ√T */
  d2() {
    return this.d1() - this.sigma * Math.sqrt(this.T);
  }

  /** Call price: S·Φ(d₁) − K·e^{−rT}·Φ(d₂) */
  callPrice() {
    const { S, K, r, T } = this;
    return S * Phi(this.d1()) - K * Math.exp(-r * T) * Phi(this.d2());
  }

  /** Put price: K·e^{−rT}·Φ(−d₂) − S·Φ(−d₁) */
  putPrice() {
    const { S, K, r, T } = this;
    return K * Math.exp(-r * T) * (1 - Phi(this.d2())) - S * (1 - Phi(this.d1()));
  }

  /**
   * Delta: ∂price/∂S
   * @param {'call'|'put'} type
   */
  delta(type = 'call') {
    return type === 'call' ? Phi(this.d1()) : Phi(this.d1()) - 1;
  }

  /**
   * Intrinsic value
   * @param {'call'|'put'} type
   */
  intrinsicValue(type = 'call') {
    return type === 'call' ? Math.max(this.S - this.K, 0) : Math.max(this.K - this.S, 0);
  }

  /**
   * Time value = price − intrinsic value
   * @param {'call'|'put'} type
   */
  timeValue(type = 'call') {
    return (type === 'call' ? this.callPrice() : this.putPrice()) - this.intrinsicValue(type);
  }

  /**
   * Implied volatility via bisection.
   * @param {number} marketPrice
   * @param {'call'|'put'} type
   * @param {number} tol
   * @returns {number} implied sigma
   */
  impliedVol(marketPrice, type = 'call', tol = 1e-6) {
    const { S, K, r, T } = this;
    const price = (sig) => {
      const m = new OptionsPricingModel({ S, K, r, sigma: sig, T });
      return type === 'call' ? m.callPrice() : m.putPrice();
    };
    let lo = 1e-6, hi = 10;
    for (let i = 0; i < 200; i++) {
      const mid = (lo + hi) / 2;
      const pMid = price(mid);
      if (Math.abs(pMid - marketPrice) < tol) return mid;
      if (pMid < marketPrice) lo = mid;
      else hi = mid;
    }
    return (lo + hi) / 2;
  }
}
