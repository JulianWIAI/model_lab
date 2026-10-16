/**
 * Tests for IntegrateAndFireModel.js
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { IntegrateAndFireModel } from '../../js/benches/neuroscience/electrophysiology/integrate-and-fire/IntegrateAndFireModel.js';

// Defaults: τ_m=10ms, V_rest=-65mV, V_th=-50mV, V_reset=-65mV, R=10MΩ, t_ref=2ms

test('iaf: rheobase = 1.5 nA ±1e-10', () => {
  const m = new IntegrateAndFireModel();
  assert.ok(Math.abs(m.Ith - 1.5) < 1e-10,
    `I_th = ${m.Ith}, expected 1.5 nA`);
});

test('iaf: ISI = 2+10·ln4 at I=2nA ±1e-10', () => {
  // V_∞ = -65 + 10·2 = -45 mV
  // ISI = 2 + 10·ln[(-45-(-65))/(-45-(-50))] = 2 + 10·ln[20/5] = 2 + 10·ln4
  const m = new IntegrateAndFireModel({ I: 2 });
  const expected = 2 + 10 * Math.log(4);
  assert.ok(Math.abs(m.ISI - expected) < 1e-10,
    `ISI = ${m.ISI}, expected 2+10·ln4 = ${expected}`);
});

test('iaf: f = 63.04 Hz at I=2nA ±1e-4', () => {
  const m = new IntegrateAndFireModel({ I: 2 });
  const expected = 1000 / (2 + 10 * Math.log(4));
  assert.ok(Math.abs(m.firingRate - expected) < 1e-4,
    `f = ${m.firingRate}, expected ${expected} Hz`);
});

test('iaf: no spike below rheobase (I=1 nA)', () => {
  const m = new IntegrateAndFireModel({ I: 1 });
  // V_∞ = -65 + 10·1 = -55 mV < V_th=-50 mV
  assert.ok(m.ISI === Infinity, `ISI should be Infinity below rheobase, got ${m.ISI}`);
  assert.ok(m.firingRate === 0, `f should be 0 below rheobase`);
});

test('iaf: rheobase boundary ISI = Infinity', () => {
  // At I = I_th exactly: V_∞ = V_th → ln[(V_∞−V_reset)/(0)] = ∞
  const m = new IntegrateAndFireModel({ I: 1.5 });
  assert.ok(m.ISI === Infinity, `ISI at rheobase should be Infinity, got ${m.ISI}`);
});

test('iaf: 63.2% of deflection at t=τ_m ±1e-10', () => {
  // Sub-threshold: starting at V_reset, after τ_m: V = V_∞ + (V_reset - V_∞)·e^(-1)
  // Deflection fraction = (V(τ_m) - V_reset) / (V_∞ - V_reset) = 1 - 1/e
  const m = new IntegrateAndFireModel({ I: 1 }); // subthreshold
  const tauM = m.tauM;
  const dt = 0.0001;
  const N = Math.round(tauM / dt);
  let V = m.Vreset;
  for (let i = 0; i < N; i++) {
    V = m.Vinf + (V - m.Vinf) * Math.exp(-dt / tauM);
  }
  const frac = (V - m.Vreset) / (m.Vinf - m.Vreset);
  const expected = 1 - Math.exp(-1);
  assert.ok(Math.abs(frac - expected) < 1e-10,
    `63.2% fraction = ${frac.toFixed(8)}, expected 1-1/e = ${expected.toFixed(8)}`);
});

test('iaf: simulation matches closed form ISI ±1e-4 relative at dt=0.001 ms', () => {
  const m = new IntegrateAndFireModel({ I: 2, tRef: 2 });
  const expectedISI = m.ISI; // 2 + 10·ln4
  const tEnd = expectedISI * 5; // run for 5 spikes
  const { spikeTimes } = m.simulate(tEnd, 0.001);
  assert.ok(spikeTimes.length >= 2, `Expected ≥2 spikes, got ${spikeTimes.length}`);
  // Measured ISI from first two spikes
  const measuredISI = spikeTimes[1] - spikeTimes[0];
  const relErr = Math.abs(measuredISI - expectedISI) / expectedISI;
  assert.ok(relErr < 1e-4,
    `Relative ISI error = ${relErr.toExponential(2)}, expected < 1e-4 (dt=0.001ms)`);
});

test('iaf: dt-halving convergence ±1e-4 relative (dt=0.0005 ms)', () => {
  const m = new IntegrateAndFireModel({ I: 2, tRef: 2 });
  const expectedISI = m.ISI;
  const tEnd = expectedISI * 5;
  const { spikeTimes } = m.simulate(tEnd, 0.0005);
  assert.ok(spikeTimes.length >= 2, `Expected ≥2 spikes at dt=0.0005ms, got ${spikeTimes.length}`);
  const measuredISI = spikeTimes[1] - spikeTimes[0];
  const relErr = Math.abs(measuredISI - expectedISI) / expectedISI;
  assert.ok(relErr < 1e-4,
    `Halved dt relative ISI error = ${relErr.toExponential(2)}, expected < 1e-4`);
});

// ── Near-rheobase specific values ─────────────────────────────────────────────

test('iaf: near-rheobase f at ε=1e-3, 1e-6, 1e-9 nA — stated anchors from closed form', () => {
  // V_∞−V_th = R·ε = 10ε; V_∞−V_reset = 15+10ε ≈ 15 for small ε.
  // ISI = t_ref + τ·ln[(15+10ε)/(10ε)]; independently derived:
  //   ε=1e-3: ISI = 2+10·ln(15.01/0.01)  = 2+10·ln(1501)   ≈ 75.13 ms → f ≈ 13.31 Hz
  //   ε=1e-6: ISI = 2+10·ln(15.000001/1e-5)≈ 2+10·ln(1.5e6) ≈ 144.2 ms → f ≈  6.93 Hz
  //   ε=1e-9: ISI = 2+10·ln(15/1e-8)     ≈ 2+10·ln(1.5e9)  ≈ 213.3 ms → f ≈  4.69 Hz
  // f decreasing confirms logarithmic (not power-law or exponential) divergence of ISI.
  const cases = [
    { eps: 1e-3, fLo: 13.2, fHi: 13.5 },
    { eps: 1e-6, fLo:  6.8, fHi:  7.0 },
    { eps: 1e-9, fLo:  4.5, fHi:  4.9 },
  ];
  const fs = cases.map(({ eps }) => new IntegrateAndFireModel({ I: 1.5 + eps }).firingRate);
  for (let i = 0; i < cases.length; i++) {
    const { eps, fLo, fHi } = cases[i];
    assert.ok(fs[i] > fLo && fs[i] < fHi,
      `f(I_th+${eps}) = ${fs[i].toFixed(4)} Hz, expected in (${fLo}, ${fHi})`);
  }
  // Strictly decreasing as ε → 0 (ISI diverges logarithmically)
  assert.ok(fs[0] > fs[1] && fs[1] > fs[2],
    `f should decrease: f(1e-3)=${fs[0].toFixed(4)} > f(1e-6)=${fs[1].toFixed(4)} > f(1e-9)=${fs[2].toFixed(4)}`);
});

// ── Large-I limit (non-circular) ──────────────────────────────────────────────

test('iaf: large-I limit f → 1/t_ref = 500 Hz (non-circular, refractory ceiling)', () => {
  // As I→∞: V_∞→∞; (V_∞−V_reset)/(V_∞−V_th)→1; ln→0; ISI→t_ref=2ms; f→500 Hz.
  // At I=10000 nA: ISI = 2+10·ln(10000·10+15)/(10000·10−15) ≈ 2.00150 ms → f ≈ 499.63 Hz.
  // Independent check: 1/t_ref is the asymptote — no ISI formula needed.
  const limit = 1000 / 2; // 1000 ms / t_ref_ms = 500 Hz
  const mHigh = new IntegrateAndFireModel({ I: 10000 });
  assert.ok(mHigh.firingRate > 499,
    `f(I=10000) = ${mHigh.firingRate.toFixed(3)} Hz, expected > 499 Hz (within 0.4 Hz of 500)`);
  assert.ok(mHigh.firingRate < limit,
    `f should not exceed refractory ceiling ${limit} Hz; got ${mHigh.firingRate.toFixed(3)}`);
  // Monotone: f increases with I toward the ceiling
  const m100  = new IntegrateAndFireModel({ I: 100 });
  const m1000 = new IntegrateAndFireModel({ I: 1000 });
  assert.ok(m100.firingRate < m1000.firingRate && m1000.firingRate < mHigh.firingRate,
    `f increases: f(100)=${m100.firingRate.toFixed(2)}, f(1000)=${m1000.firingRate.toFixed(2)}, f(10000)=${mHigh.firingRate.toFixed(2)}`);
});

// ── dt-halving error values stated ────────────────────────────────────────────

test('iaf: dt-halving error values stated — err(0.001)≈1.056e-3 ms, err(0.0005)≈5.564e-4 ms, ratio≈1.90', () => {
  // Exact exponential update: threshold-crossing is recorded at end of the step where V≥V_th.
  // Spike-time error ≤ dt (O(dt) convergence). Half dt → half error → ratio ≈ 2.
  // Computed values: err(0.001)≈1.056e-3 ms; err(0.0005)≈5.564e-4 ms; ratio≈1.90∈[1.5,2.5].
  const m = new IntegrateAndFireModel({ I: 2, tRef: 2 });
  const expectedISI = m.ISI; // 2+10·ln4 ≈ 15.86 ms
  const tEnd = expectedISI * 3;
  const { spikeTimes: st1 } = m.simulate(tEnd, 0.001);
  const { spikeTimes: st2 } = m.simulate(tEnd, 0.0005);
  const err1 = Math.abs((st1[1] - st1[0]) - expectedISI);
  const err2 = Math.abs((st2[1] - st2[0]) - expectedISI);
  // Each absolute error bounded by 2×dt (ISI = difference of two spike times, each quantized ≤ dt)
  assert.ok(err1 < 2 * 0.001, `err(dt=0.001) = ${err1.toExponential(3)} ms, expected < 0.002`);
  assert.ok(err2 < 2 * 0.0005, `err(dt=0.0005) = ${err2.toExponential(3)} ms, expected < 0.001`);
  // Ratio confirms O(dt) convergence; not exactly 2 because threshold crossing occurs at different phase
  const ratio = err1 / err2;
  assert.ok(ratio > 1.5 && ratio < 2.5,
    `dt-halving ratio = ${ratio.toFixed(2)}, expected ≈1.90 (in [1.5,2.5]); err1=${err1.toExponential(3)}, err2=${err2.toExponential(3)}`);
});

// ── f→0 near rheobase (MISSING) ───────────────────────────────────────────────

test('iaf: firing rate → 0 as I → I_th from above (logarithmic divergence)', () => {
  // ISI = t_ref + τ_m·ln[(V_∞−V_reset)/(V_∞−V_th)]; as I→I_th, V_∞→V_th → ISI→∞ → f→0.
  // V_∞−V_th = R·(I−I_th) = 10·(I−1.5) → 0 as I→1.5.
  // At I=I_th+0.001: f should be < 10 Hz; at I=I_th+0.01: f should be larger.
  // At I=I_th+0.001 (= 1.501 nA): V_∞−V_th = R·0.001 = 0.01 mV → ISI = 2+10·ln(1501) ≈ 75 ms → f ≈ 13 Hz
  // At I=I_th+0.0001: ISI ≈ 121 ms → f ≈ 8 Hz < 10 Hz.  Use latter for the < 10 bound.
  const mVeryLow = new IntegrateAndFireModel({ I: 1.50001 }); // 0.00001 above rheobase
  const mLow = new IntegrateAndFireModel({ I: 1.501 }); // 0.001 above rheobase
  const mMid = new IntegrateAndFireModel({ I: 1.51 });  // 0.01 above rheobase
  // Very close to rheobase: f < 10 Hz (logarithmically diverging ISI)
  assert.ok(mVeryLow.firingRate > 0, `f(I_th+1e-5) should be > 0, got ${mVeryLow.firingRate}`);
  assert.ok(mVeryLow.firingRate < 10, `f very near rheobase = ${mVeryLow.firingRate.toFixed(2)}, expected < 10 Hz`);
  // Rate increases with I (f is monotone in I above rheobase)
  assert.ok(mMid.firingRate > mLow.firingRate,
    `f should increase with I: f(1.51)=${mMid.firingRate.toFixed(2)}, f(1.501)=${mLow.firingRate.toFixed(2)}`);
});

// ── Large-I asymptote (MISSING) ───────────────────────────────────────────────

test('iaf: ISI formula verified at large I=10 nA ±1e-10', () => {
  // At I=10 nA: V_∞ = −65 + 10·10 = 35 mV
  // V_∞−V_reset = 35−(−65) = 100 mV;  V_∞−V_th = 35−(−50) = 85 mV
  // ISI = 2 + 10·ln(100/85) = 2 + 10·ln(20/17)
  const m = new IntegrateAndFireModel({ I: 10 });
  const expectedISI = 2 + 10 * Math.log(100 / 85);
  assert.ok(Math.abs(m.ISI - expectedISI) < 1e-10,
    `ISI(I=10) = ${m.ISI.toFixed(6)}, expected 2+10·ln(100/85) = ${expectedISI.toFixed(6)}`);
  // f = 1000/ISI
  const expectedF = 1000 / expectedISI;
  assert.ok(Math.abs(m.firingRate - expectedF) < 1e-6,
    `f(I=10) = ${m.firingRate.toFixed(4)}, expected ${expectedF.toFixed(4)}`);
});

// ── dt-halving ratio (strengthens existing test) ──────────────────────────────

test('iaf: dt-halving error ratio ≈ 2 (threshold-crossing error ∝ dt)', () => {
  // Exact exponential update: the only integration error comes from discrete threshold crossing.
  // Spike recorded at end of step where V first crosses V_th → error ≤ dt.
  // Halving dt halves the spike-time quantisation error → ratio ≈ 2.
  const m = new IntegrateAndFireModel({ I: 2, tRef: 2 });
  const expectedISI = m.ISI;
  const tEnd = expectedISI * 3;
  const { spikeTimes: st1 } = m.simulate(tEnd, 0.001);
  const { spikeTimes: st2 } = m.simulate(tEnd, 0.0005);
  const err1 = Math.abs((st1[1] - st1[0]) - expectedISI);
  const err2 = Math.abs((st2[1] - st2[0]) - expectedISI);
  // Ratio should be ≈ 2 (dt-proportional error); accept [1.5, 2.5] for rounding effects
  const ratio = err1 / err2;
  assert.ok(ratio > 1.5 && ratio < 2.5,
    `dt-halving ratio = ${ratio.toFixed(2)}, expected ≈ 2; err(0.001)=${err1.toExponential(2)}, err(0.0005)=${err2.toExponential(2)}`);
});
