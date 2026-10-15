/**
 * RescorlaWagnerModel — Rescorla–Wagner associative learning model.
 *
 * Trial update rule (all stimuli i present on trial):
 *   ΔV_i = α_i · β · (λ − ΣV)
 *   V_i ← V_i + ΔV_i
 *
 * where ΣV = Σ V_i over stimuli present on that trial.
 *
 * Single-cue closed form: V_n = λ·(1 − (1−αβ)^n)  [acquisition, V_0=0]
 * Extinction: V_n = V_0 · (1−αβ)^n                 [λ=0]
 *
 * Overshadowing asymptote (AB→λ, starting from 0):
 *   V_A/V_B = α_A/α_B always → V_A = λ·α_A/(α_A+α_B), V_B = λ·α_B/(α_A+α_B)
 *
 * Blocking (A+ to asymptote, then AB+):
 *   ΔV_B = α_B·β·(λ − V_A − V_B) ≈ 0 since V_A ≈ λ
 *
 * Overexpectation (A+ to λ, B+ to λ, then AB+):
 *   Both → λ/2 because ΔV_i = αβ(λ − V_A − V_B); both V_A,V_B start at λ
 *
 * Conditioned inhibition (A+/AX−):
 *   Asymptote: V_A = λ, V_X = −λ
 *
 * Stability domain:
 *   - For a single cue: αβ ∈ (0,1) → convergent; αβ>1 oscillates; αβ>2 diverges
 *   - For compound: β·Σα_present > 1 → oscillates; β·Σα > 2 → diverges
 *
 * Reference: Rescorla & Wagner (1972); Kamin (1969).
 * Status: formulas anchor-derived; no empirical constants.
 */
export class RescorlaWagnerModel {
  /**
   * @param {object} [opts]
   * @param {number} [opts.alphaA=0.5]  salience of stimulus A
   * @param {number} [opts.alphaB=0.3]  salience of stimulus B
   * @param {number} [opts.beta=0.5]    US processing rate
   * @param {number} [opts.lambda=1]    US asymptote
   */
  constructor({ alphaA = 0.5, alphaB = 0.3, beta = 0.5, lambda = 1 } = {}) {
    this.alphaA = alphaA;
    this.alphaB = alphaB;
    this.beta = beta;
    this.lambda = lambda;
  }

  /**
   * Run one trial with specified stimuli present.
   * @param {{ A?: boolean, B?: boolean }} stimuli  which stimuli are present
   * @param {number} lambda  US value for this trial
   * @param {{ VA: number, VB: number }} V  current associative strengths
   * @returns {{ VA: number, VB: number }}
   */
  trial(stimuli, lambda, { VA, VB }) {
    const sigmaV = (stimuli.A ? VA : 0) + (stimuli.B ? VB : 0);
    const error = lambda - sigmaV;
    return {
      VA: VA + (stimuli.A ? this.alphaA * this.beta * error : 0),
      VB: VB + (stimuli.B ? this.alphaB * this.beta * error : 0),
    };
  }

  /**
   * Simulate a scenario for nTrials.
   * @param {'acquisition'|'extinction'|'blocking'|'overshadowing'|'overexpectation'|'conditioned-inhibition'} scenario
   * @param {number} [nTrials=100]
   * @returns {{ n: number[], VA: number[], VB: number[] }}
   */
  simulate(scenario, nTrials = 100) {
    const ns = [], VAs = [], VBs = [];
    let state;

    switch (scenario) {
      case 'acquisition': {
        // A+ trials: VA grows toward λ
        let s = { VA: 0, VB: 0 };
        for (let n = 0; n <= nTrials; n++) {
          ns.push(n); VAs.push(s.VA); VBs.push(s.VB);
          if (n < nTrials) s = this.trial({ A: true }, this.lambda, s);
        }
        break;
      }
      case 'extinction': {
        // Start at V_A=λ, then A− trials
        let s = { VA: this.lambda, VB: 0 };
        for (let n = 0; n <= nTrials; n++) {
          ns.push(n); VAs.push(s.VA); VBs.push(s.VB);
          if (n < nTrials) s = this.trial({ A: true }, 0, s);
        }
        break;
      }
      case 'blocking': {
        // Phase 1: A+ for 50 trials; Phase 2: AB+ for nTrials-50
        const phase1 = Math.min(50, nTrials);
        let s = { VA: 0, VB: 0 };
        for (let n = 0; n <= nTrials; n++) {
          ns.push(n); VAs.push(s.VA); VBs.push(s.VB);
          if (n < nTrials) {
            s = n < phase1
              ? this.trial({ A: true }, this.lambda, s)
              : this.trial({ A: true, B: true }, this.lambda, s);
          }
        }
        break;
      }
      case 'overshadowing': {
        // AB+ trials from 0; V_A and V_B compete
        let s = { VA: 0, VB: 0 };
        for (let n = 0; n <= nTrials; n++) {
          ns.push(n); VAs.push(s.VA); VBs.push(s.VB);
          if (n < nTrials) s = this.trial({ A: true, B: true }, this.lambda, s);
        }
        break;
      }
      case 'overexpectation': {
        // Phase 1: 50 A+, 50 B+ (interleaved); Phase 2: nTrials-100 AB+
        const phase2Start = Math.min(100, nTrials);
        let s = { VA: 0, VB: 0 };
        for (let n = 0; n <= nTrials; n++) {
          ns.push(n); VAs.push(s.VA); VBs.push(s.VB);
          if (n < nTrials) {
            if (n < phase2Start) {
              // Alternate A+ and B+
              s = n % 2 === 0
                ? this.trial({ A: true }, this.lambda, s)
                : this.trial({ B: true }, this.lambda, s);
            } else {
              s = this.trial({ A: true, B: true }, this.lambda, s);
            }
          }
        }
        break;
      }
      case 'conditioned-inhibition': {
        // Alternate A+ and AX− trials
        let s = { VA: 0, VB: 0 }; // VB represents VX here
        for (let n = 0; n <= nTrials; n++) {
          ns.push(n); VAs.push(s.VA); VBs.push(s.VB);
          if (n < nTrials) {
            s = n % 2 === 0
              ? this.trial({ A: true }, this.lambda, s)          // A+
              : this.trial({ A: true, B: true }, 0, s);           // AX−
          }
        }
        break;
      }
      default:
        throw new Error(`Unknown scenario: ${scenario}`);
    }

    return { n: ns, VA: VAs, VB: VBs };
  }
}
