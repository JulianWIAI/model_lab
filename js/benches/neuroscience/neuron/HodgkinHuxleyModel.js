/**
 * The Hodgkin–Huxley model of the squid giant axon (1952).
 *
 *   C·dV/dt = I − gNa·m³h·(V − ENa) − gK·n⁴·(V − EK) − gL·(V − EL)
 *
 * m, h, n are gating variables between 0 and 1:
 *   m – sodium activation (fast, opens on depolarisation)
 *   h – sodium inactivation (slow, shuts the sodium channel)
 *   n – potassium activation (slow, lets K⁺ out to end the spike)
 *
 * Units: voltage mV, time ms, current µA/cm², conductance mS/cm².
 */
export class HodgkinHuxleyModel {
  /** Original parameters, shifted so the resting potential is about −65 mV. */
  static PARAMS = { C: 1, gNa: 120, gK: 36, gL: 0.3, ENa: 50, EK: -77, EL: -54.387 };

  constructor() {
    this.inputCurrent = 0; // steady current injected by the experimenter
    this.pulseAmplitude = 15; // extra current during a pulse
    this.blockSodium = false; // TTX
    this.blockPotassium = false; // TEA
    this.reset();
  }

  /** Returns the cell to rest with every gate at its resting value. */
  reset() {
    this.V = -65;
    this.m = HodgkinHuxleyModel.steadyState(HodgkinHuxleyModel.alphaM, HodgkinHuxleyModel.betaM, this.V);
    this.h = HodgkinHuxleyModel.steadyState(HodgkinHuxleyModel.alphaH, HodgkinHuxleyModel.betaH, this.V);
    this.n = HodgkinHuxleyModel.steadyState(HodgkinHuxleyModel.alphaN, HodgkinHuxleyModel.betaN, this.V);
    this.time = 0;
    this.pulseUntil = -1;
    this.spikeTimes = [];
    this.sodiumCurrent = 0;
    this.potassiumCurrent = 0;
  }

  // ---- Opening (alpha) and closing (beta) rates per ms, as fitted by Hodgkin and Huxley ----
  // The 0/0 points of the alpha functions are replaced by their limit values.

  static alphaN(V) {
    const x = V + 55;
    return Math.abs(x) < 1e-4 ? 0.1 : (0.01 * x) / (1 - Math.exp(-x / 10));
  }
  static betaN(V) {
    return 0.125 * Math.exp(-(V + 65) / 80);
  }
  static alphaM(V) {
    const x = V + 40;
    return Math.abs(x) < 1e-4 ? 1 : (0.1 * x) / (1 - Math.exp(-x / 10));
  }
  static betaM(V) {
    return 4 * Math.exp(-(V + 65) / 18);
  }
  static alphaH(V) {
    return 0.07 * Math.exp(-(V + 65) / 20);
  }
  static betaH(V) {
    return 1 / (1 + Math.exp(-(V + 35) / 10));
  }

  /** Fraction of gates open if the voltage were held at V forever. */
  static steadyState(alpha, beta, V) {
    return alpha(V) / (alpha(V) + beta(V));
  }

  /** Starts a current pulse lasting `ms` milliseconds. */
  pulse(ms = 1) {
    this.pulseUntil = this.time + ms;
  }

  get pulseActive() {
    return this.time < this.pulseUntil;
  }

  /** One forward-Euler step of dt ms (dt = 0.01 ms is small enough here). */
  step(dt) {
    const P = HodgkinHuxleyModel.PARAMS;
    const M = HodgkinHuxleyModel;
    const I = this.inputCurrent + (this.pulseActive ? this.pulseAmplitude : 0);
    const gNa = this.blockSodium ? 0 : P.gNa;
    const gK = this.blockPotassium ? 0 : P.gK;

    // Ionic currents; positive = outward
    this.sodiumCurrent = gNa * this.m ** 3 * this.h * (this.V - P.ENa);
    this.potassiumCurrent = gK * this.n ** 4 * (this.V - P.EK);
    const leak = P.gL * (this.V - P.EL);

    const previousV = this.V;
    this.V += (dt / P.C) * (I - this.sodiumCurrent - this.potassiumCurrent - leak);

    // Each gate relaxes towards open at rate alpha and towards shut at rate beta.
    this.m += dt * (M.alphaM(this.V) * (1 - this.m) - M.betaM(this.V) * this.m);
    this.h += dt * (M.alphaH(this.V) * (1 - this.h) - M.betaH(this.V) * this.h);
    this.n += dt * (M.alphaN(this.V) * (1 - this.n) - M.betaN(this.V) * this.n);

    // Count a spike each time the voltage crosses 0 mV going up.
    if (previousV < 0 && this.V >= 0) this.spikeTimes.push(this.time);
    this.time += dt;
  }

  /** Number of spikes in the last `windowMs` milliseconds. */
  spikesInLast(windowMs) {
    const since = this.time - windowMs;
    while (this.spikeTimes.length && this.spikeTimes[0] < since - 1000) this.spikeTimes.shift(); // forget old ones
    return this.spikeTimes.filter((t) => t >= since).length;
  }
}
