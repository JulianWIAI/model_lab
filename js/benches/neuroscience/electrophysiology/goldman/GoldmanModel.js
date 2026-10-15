/**
 * GoldmanModel — Goldman–Hodgkin–Katz (GHK) voltage equation for membrane potential.
 *
 * GHK voltage equation (monovalent ions only):
 *   V_m = (RT/F) · ln[(P_K·[K]_o + P_Na·[Na]_o + P_Cl·[Cl]_i) /
 *                      (P_K·[K]_i + P_Na·[Na]_i + P_Cl·[Cl]_o)]
 *
 *   Units: V_m in mV, concentrations in mM, T in K, R in J/(mol·K), F in C/mol
 *
 * Primary references:
 *   D. E. Goldman (1943). Potential, impedance, and rectification in membranes.
 *     J. Gen. Physiol. 27, 37–60. https://doi.org/10.1085/jgp.27.1.37
 *   A. L. Hodgkin & B. Katz (1949). The effect of sodium ions on the electrical
 *     activity of the giant axon of the squid.
 *     J. Physiol. 108, 37–77. https://doi.org/10.1113/jphysiol.1949.sp004310
 *
 * Default concentrations — squid giant axon at rest (Hodgkin & Katz 1949, Table 1;
 *   not checked against primary source):
 *   K⁺:  [K]_i  = 400 mM,  [K]_o  =  20 mM
 *   Na⁺: [Na]_i =  50 mM,  [Na]_o = 440 mM
 *   Cl⁻: [Cl]_i =  52 mM,  [Cl]_o = 560 mM
 *
 * Default permeability ratios at rest (Hodgkin & Katz 1949; not checked against
 *   primary source):
 *   P_K : P_Na : P_Cl = 1 : 0.04 : 0.45
 *   (P_K normalised to 1; only ratios enter the equation)
 *
 * Computed resting Vm (squid axon, T = 293.15 K):
 *   num = 1·20 + 0.04·440 + 0.45·52  = 61.0
 *   den = 1·400 + 0.04·50 + 0.45·560 = 654.0
 *   Vm  = (RT/F)·ln(61/654)·1000 ≈ −59.9 mV
 *
 * Second preset — mammalian skeletal muscle at rest, 37 °C:
 *   Concentrations from Hille (2001) Chapter 1 (not checked against primary source):
 *     K⁺:  [K]_i = 155 mM,  [K]_o =  4 mM
 *     Na⁺: [Na]_i = 12 mM,  [Na]_o = 145 mM
 *     Cl⁻: [Cl]_i =  4 mM,  [Cl]_o = 120 mM
 *   Permeability ratios: P_K : P_Na : P_Cl = 1 : 0.05 : 0.45
 *   T = 310.15 K (37 °C)  →  Vm ≈ −74 mV
 *
 * Secondary source for concentration overview:
 *   B. Hille (2001). Ion Channels of Excitable Membranes, 3rd ed.
 *     Sinauer Associates, Sunderland MA. Chapter 1.
 *
 * Constants: R and F from NIST CODATA 2018 (via js/data/constants.js).
 * Temperature: T = 293.15 K (20 °C) — typical squid-axon experimental condition.
 */

import { CONSTANTS } from '../../../../data/constants.js';

const R = CONSTANTS.R.value;    // 8.314 462 618 J/(mol·K)
const F = CONSTANTS.F.value;    // 96 485.332 12 C/mol

/** Default concentrations: squid giant axon (Hodgkin & Katz 1949, Table 1). */
export const SQUID_AXON = Object.freeze({
  Ki:  400,   // mM
  Ko:   20,   // mM
  Nai:  50,   // mM
  Nao: 440,   // mM
  Cli:  52,   // mM
  Clo: 560,   // mM
});

/** Default permeability ratios at rest (Hodgkin & Katz 1949). */
export const SQUID_AXON_REST = Object.freeze({ PK: 1, PNa: 0.04, PCl: 0.45 });

/** Permeability ratios at action-potential peak (Hodgkin & Katz 1949). */
export const SQUID_AXON_AP = Object.freeze({ PK: 1, PNa: 20, PCl: 0.45 });

/**
 * Mammalian skeletal muscle at rest, 37 °C.
 * Concentrations: Hille (2001) Chapter 1 — not checked against primary source.
 * Permeability ratios: typical mammalian values; not checked against primary source.
 */
export const MAMMALIAN_MUSCLE = Object.freeze({
  Ki: 155, Ko:   4,   // mM
  Nai: 12, Nao: 145,  // mM
  Cli:  4, Clo: 120,  // mM
  PK: 1, PNa: 0.05, PCl: 0.45,
  T: 310.15,           // K (37 °C)
});

export class GoldmanModel {
  /**
   * @param {{
   *   Ki?: number, Ko?: number,
   *   Nai?: number, Nao?: number,
   *   Cli?: number, Clo?: number,
   *   PK?: number, PNa?: number, PCl?: number,
   *   T?: number
   * }} options
   */
  constructor({
    Ki  = SQUID_AXON.Ki,
    Ko  = SQUID_AXON.Ko,
    Nai = SQUID_AXON.Nai,
    Nao = SQUID_AXON.Nao,
    Cli = SQUID_AXON.Cli,
    Clo = SQUID_AXON.Clo,
    PK  = SQUID_AXON_REST.PK,
    PNa = SQUID_AXON_REST.PNa,
    PCl = SQUID_AXON_REST.PCl,
    T   = 293.15,
  } = {}) {
    this.Ki  = Ki;
    this.Ko  = Ko;
    this.Nai = Nai;
    this.Nao = Nao;
    this.Cli = Cli;
    this.Clo = Clo;
    this.PK  = PK;
    this.PNa = PNa;
    this.PCl = PCl;
    this.T   = T;   // K
  }

  /**
   * Membrane potential (mV) via the GHK voltage equation.
   * @returns {number}  V_m in mV
   */
  get Vm() {
    const num = this.PK * this.Ko  + this.PNa * this.Nao + this.PCl * this.Cli;
    const den = this.PK * this.Ki  + this.PNa * this.Nai + this.PCl * this.Clo;
    return (R * this.T / F) * Math.log(num / den) * 1000;  // J/C → mV
  }

  /**
   * Nernst potential (mV) for a single ion species.
   * z = +1 for cations (K⁺, Na⁺), z = −1 for anions (Cl⁻).
   * @param {number} outside  extracellular concentration (mM)
   * @param {number} inside   intracellular concentration (mM)
   * @param {number} [z=1]    valence
   * @returns {number}  E in mV
   */
  nernst(outside, inside, z = 1) {
    return (R * this.T / (z * F)) * Math.log(outside / inside) * 1000;
  }

  /**
   * Nernst potentials for K⁺, Na⁺, and Cl⁻ at current concentrations.
   * @returns {{ EK: number, ENa: number, ECl: number }}  all in mV
   */
  get nernstPotentials() {
    return {
      EK:  this.nernst(this.Ko,  this.Ki,  +1),
      ENa: this.nernst(this.Nao, this.Nai, +1),
      ECl: this.nernst(this.Clo, this.Cli, -1),
    };
  }

  /**
   * Sweep PNa from pNaMin to pNaMax to produce a Vm vs PNa curve.
   * @param {number} [pNaMin=0.01]
   * @param {number} [pNaMax=30]
   * @param {number} [nPoints=200]
   * @returns {Array<{PNa: number, Vm: number}>}
   */
  vCurve(pNaMin = 0.01, pNaMax = 30, nPoints = 200) {
    const pts = [];
    for (let i = 0; i < nPoints; i++) {
      const PNa = pNaMin + (pNaMax - pNaMin) * (i / (nPoints - 1));
      const num = this.PK * this.Ko  + PNa * this.Nao + this.PCl * this.Cli;
      const den = this.PK * this.Ki  + PNa * this.Nai + this.PCl * this.Clo;
      const Vm  = (R * this.T / F) * Math.log(num / den) * 1000;
      pts.push({ PNa, Vm });
    }
    return pts;
  }
}
