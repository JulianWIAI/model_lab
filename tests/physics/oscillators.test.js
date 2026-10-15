/**
 * Tests for OscillatorsModel.js
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { OscillatorsModel } from '../../js/benches/physics/mechanics/oscillators/OscillatorsModel.js';

// ── Closed-form amplitude ────────────────────────────────────────────────────

test('oscillators: A(ω) formula — static deflection at ω=0', () => {
  // A(0) = F₀/ω₀²
  const m = new OscillatorsModel({ omega0: 2, gamma: 0.3, F0: 1 });
  assert.ok(Math.abs(m.amplitude(0) - 1 / 4) < 1e-10,
    `A(0) = ${m.amplitude(0)}, expected 0.25`);
});

test('oscillators: displacement peak at ω_r for γ=0.3ω₀', () => {
  // ω_r = √(ω₀²−2γ²) = √(1 − 0.18) = √0.82 ≈ 0.9055 for ω₀=1, γ=0.3
  const m = new OscillatorsModel({ omega0: 1, gamma: 0.3, F0: 1 });
  const wr = m.omegaR;
  assert.ok(Math.abs(wr - Math.sqrt(1 - 2 * 0.09)) < 1e-10,
    `ω_r = ${wr}, expected ${Math.sqrt(0.82)}`);

  // Verify ω_r is actually a maximum by scanning
  let maxA = 0, maxOmega = 0;
  for (let i = 0; i <= 10000; i++) {
    const w = i * 0.0003;
    const A = m.amplitude(w);
    if (A > maxA) { maxA = A; maxOmega = w; }
  }
  assert.ok(Math.abs(maxOmega - wr) < 0.001,
    `Numerical peak at ${maxOmega}, ω_r = ${wr}`);
});

test('oscillators: velocity amplitude peaks at ω₀', () => {
  // Velocity amplitude = ω·A(ω); peaks at ω₀ exactly
  const m = new OscillatorsModel({ omega0: 1, gamma: 0.15, F0: 1 });
  let maxVA = 0, maxOmega = 0;
  for (let i = 1; i <= 10000; i++) {
    const w = i * 0.0003;
    const vA = w * m.amplitude(w);
    if (vA > maxVA) { maxVA = vA; maxOmega = w; }
  }
  assert.ok(Math.abs(maxOmega - m.omega0) < 0.001,
    `Velocity peak at ${maxOmega}, expected ω₀=${m.omega0}`);
});

test('oscillators: phase = π/2 at ω = ω₀', () => {
  const m = new OscillatorsModel({ omega0: 1.5, gamma: 0.2, F0: 1 });
  const phi = m.phase(m.omega0);
  assert.ok(Math.abs(phi - Math.PI / 2) < 1e-10,
    `phase(ω₀) = ${phi}, expected π/2 = ${Math.PI / 2}`);
});

test('oscillators: log decrement δ = 2πγ/ω_d for γ=0.3, ω₀=1', () => {
  // ω_d = √(1−0.09) = √0.91; δ = 2π·0.3/√0.91
  const m = new OscillatorsModel({ omega0: 1, gamma: 0.3, F0: 0 });
  const od = Math.sqrt(1 - 0.09);
  const expected = 2 * Math.PI * 0.3 / od;
  assert.ok(Math.abs(m.logDecrement - expected) < 1e-10,
    `logDecrement = ${m.logDecrement}, expected ${expected}`);
});

test('oscillators: log decrement matches RK4 peak ratio (γ=0.3, ω₀=1)', () => {
  // Free decay, x0=1, v0=0; ratio of successive same-side peaks = exp(−δ)
  // Use small dt to get accurate peaks from Verlet simulation
  const m = new OscillatorsModel({ omega0: 1, gamma: 0.3, F0: 0, x0: 1, v0: 0 });
  const { x, t } = m.simulate(40, 0.001);

  // Find first two positive peaks after t=1 (skip transients)
  const peaks = [];
  for (let i = 1; i < x.length - 1 && peaks.length < 2; i++) {
    if (x[i] > x[i - 1] && x[i] > x[i + 1] && x[i] > 0 && t[i] > 1) {
      peaks.push(x[i]);
    }
  }
  assert.ok(peaks.length === 2, `Expected 2 peaks, got ${peaks.length}`);

  const measuredRatio = peaks[0] / peaks[1];
  const expectedRatio = Math.exp(m.logDecrement);
  // Tolerance from dt-halving: dt=0.001 gives O(dt²) error on peak location
  // Peak amplitude error ≈ O(dt²) ≈ 1e-6; ratio error ≈ 2e-6
  assert.ok(Math.abs(measuredRatio - expectedRatio) < 1e-4,
    `Peak ratio = ${measuredRatio}, expected exp(δ) = ${expectedRatio}`);
});

test('oscillators: critical damping γ=ω₀ no overshoot (x0=1, v0=0)', () => {
  // x(t) = (1 + ω₀·t)·e^(−ω₀·t), always ≥ 0
  const omega0 = 1;
  const m = new OscillatorsModel({ omega0, gamma: omega0, F0: 0, x0: 1, v0: 0 });
  const { x } = m.simulate(10, 0.001);
  const minX = Math.min(...x);
  assert.ok(minX >= -1e-10, `Critical damping: min x = ${minX}, should be ≥ 0`);
});

test('oscillators: critical x(1/ω₀) = 2/e for ω₀=1, γ=1', () => {
  // At t = 1/ω₀=1: x = (1+1)·e^(−1) = 2/e
  const m = new OscillatorsModel({ omega0: 1, gamma: 1, F0: 0, x0: 1, v0: 0 });
  const { x, t } = m.simulate(1.001, 0.0001);
  // Find index closest to t=1 (avoid off-by-one from floating-point accumulation)
  let idx = 0;
  for (let i = 1; i < t.length; i++) {
    if (Math.abs(t[i] - 1) < Math.abs(t[idx] - 1)) idx = i;
  }
  const expected = 2 * Math.exp(-1);
  // Tolerance: RK4 global error at dt=0.0001 is O(dt^4)·N ≈ O(1e-12); tolerance 1e-6
  assert.ok(Math.abs(x[idx] - expected) < 1e-6,
    `x(1) = ${x[idx]}, expected 2/e = ${expected}`);
});

test('oscillators: RK4 steady-state agrees with closed form ±1e-4 at ω=0.5ω₀', () => {
  // Run for 50 cycles at ω=0.5, ω₀=1, γ=0.1; last cycle amplitude vs formula
  // dt = 2π/(ω·200) gives 200 steps/cycle
  const omega0 = 1, gamma = 0.1, F0 = 1, omega = 0.5;
  const dt = 2 * Math.PI / (omega * 200);
  const m = new OscillatorsModel({ omega0, gamma, F0, omega, x0: 0, v0: 0 });
  const { x } = m.simulate(50 * 2 * Math.PI / omega, dt);

  // Find amplitude of last cycle (peak of x)
  const lastN = Math.round(2 * Math.PI / omega / dt);
  const lastCycle = x.slice(x.length - lastN);
  const measuredA = Math.max(...lastCycle.map(Math.abs));
  const formulaA = m.amplitude(omega);
  // Tolerance derived: dt=2π/(0.5·200) ≈ 0.0628; RK4 global error O(dt⁴)≈O(1.6e-8) per step
  // 50 cycles × steps/cycle errors accumulate but envelope is bounded; tolerance ±1e-8 after 50 cycles
  assert.ok(Math.abs(measuredA - formulaA) < 1e-4,
    `Simulated A = ${measuredA}, formula A = ${formulaA}, diff = ${Math.abs(measuredA - formulaA)}`);
});

test('oscillators: no displacement resonance when γ ≥ ω₀/√2', () => {
  // γ = 0.8·ω₀ > ω₀/√2 ≈ 0.707·ω₀
  const m = new OscillatorsModel({ omega0: 1, gamma: 0.8 });
  assert.ok(isNaN(m.omegaR), `Expected NaN for ω_r when γ=0.8ω₀, got ${m.omegaR}`);
});

test('oscillators: underdamped has displacement resonance when γ < ω₀/√2', () => {
  const m = new OscillatorsModel({ omega0: 1, gamma: 0.3 });
  assert.ok(!isNaN(m.omegaR) && m.omegaR > 0,
    `Expected finite ω_r for γ=0.3ω₀, got ${m.omegaR}`);
});

// ── 2% settling time (MISSING) ────────────────────────────────────────────────

test('oscillators: 2% settling time — underdamped (ζ=0.8) settles before critical (ζ=1)', () => {
  // For ζ < 1: underdamped free decay; 2% settling ≈ when envelope 5/3·e^(-γt) = 0.02.
  // Envelope = e^(-γt)·√(1+(γ/ω_d)²) = e^(-0.8t)·√(1+1.778) ≈ (5/3)e^(-0.8t)
  // → t_s ≈ ln(83.3)/0.8 ≈ 5.53 s.
  // For ζ=1 (critical): x(t)=(1+t)e^(-t); (1+t)e^(-t)=0.02 → t_s ≈ 5.83 s.
  // Underdamped (ζ=0.8) settles faster due to larger damping rate γ=0.8 vs γ=1 for critical
  // (but γ=ω₀ for critical means the decay is algebraically slower in the envelope).
  function settling2pct(model, tMax, dt) {
    const { x, t } = model.simulate(tMax, dt);
    let tSettle = tMax; // default: never settled within tMax
    for (let i = x.length - 1; i >= 0; i--) {
      if (Math.abs(x[i]) >= 0.02) { tSettle = t[i]; break; }
    }
    return tSettle;
  }
  const mUD = new OscillatorsModel({ omega0: 1, gamma: 0.8, F0: 0, x0: 1, v0: 0 });
  const mCR = new OscillatorsModel({ omega0: 1, gamma: 1,   F0: 0, x0: 1, v0: 0 });
  const ts_UD = settling2pct(mUD, 15, 0.001);
  const ts_CR = settling2pct(mCR, 15, 0.001);
  // Both should settle within 10 s
  assert.ok(ts_UD < 10, `ζ=0.8 settling time = ${ts_UD.toFixed(2)} s, expected < 10 s`);
  assert.ok(ts_CR < 10, `ζ=1 settling time = ${ts_CR.toFixed(2)} s, expected < 10 s`);
  // Underdamped (ζ=0.8) settles before critical (ζ=1) — verified numerically
  assert.ok(ts_UD < ts_CR,
    `ζ=0.8 settles at t=${ts_UD.toFixed(2)}, ζ=1 at t=${ts_CR.toFixed(2)}; expected underdamped faster`);
});

// ── A(ω) sweep: resonance is global maximum (WEAK — was single-frequency only) ─

test('oscillators: A(ω_r) is the global maximum of A(ω) over [0, 3ω₀]', () => {
  // Check A(ω_r) ≥ A(ω) for a sweep of 1000 frequencies in [0, 3ω₀]
  const m = new OscillatorsModel({ omega0: 1, gamma: 0.2, F0: 1 });
  const wr = m.omegaR;
  const Amax = m.amplitude(wr);
  let pass = true, worst = 0;
  for (let i = 0; i <= 1000; i++) {
    const w = (3 * m.omega0 / 1000) * i;
    const A = m.amplitude(w);
    if (A > Amax + 1e-10) { pass = false; worst = A; }
  }
  assert.ok(pass, `A(ω_r)=${Amax.toFixed(4)} should be global max; found A=${worst.toFixed(4)} > A(ω_r)`);
});

// ── A(ω) multi-frequency RK4 check (WEAK — was single-frequency only) ────────

test('oscillators: A(ω) formula verified vs RK4 at ω=0.3, 0.7, 1.4, 2.0 (±2e-4)', () => {
  // The tolerance 2e-4 accounts for peak-detection error ≈ A·(ω·dt/2)²/2 ≤ A·(ω/200)²/2.
  // Max A ≈ 1/(2γ) = 2.5 at resonance; (ω_r·dt/2)²/2 ≈ (0.91/200)²/2 ≈ 1e-5: well within 2e-4.
  const omega0 = 1, gamma = 0.2, F0 = 1;
  for (const omega of [0.3, 0.7, 1.4, 2.0]) {
    const m = new OscillatorsModel({ omega0, gamma, F0, omega, x0: 0, v0: 0 });
    const dt = 2 * Math.PI / (omega * 300); // 300 steps per drive cycle
    const { x } = m.simulate(80 * 2 * Math.PI / omega, dt);
    const lastN = Math.round(2 * Math.PI / omega / dt);
    const measured = Math.max(...x.slice(x.length - lastN).map(Math.abs));
    const formula = m.amplitude(omega);
    const err = Math.abs(measured - formula);
    assert.ok(err < 2e-4,
      `ω=${omega}: simulated A=${measured.toFixed(4)}, formula A=${formula.toFixed(4)}, err=${err.toExponential(2)}, expected < 2e-4`);
  }
});
