/**
 * Tests for RescorlaWagnerModel.js
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RescorlaWagnerModel } from '../../js/benches/psychology/learning/rescorla-wagner/RescorlaWagnerModel.js';

// ── Acquisition closed form ───────────────────────────────────────────────────

test('rw: acquisition closed form ±1e-10', () => {
  // V_n = λ(1−(1−αβ)^n), single cue, αβ=0.25, λ=1
  const m = new RescorlaWagnerModel({ alphaA: 0.5, beta: 0.5, lambda: 1 });
  const { VA } = m.simulate('acquisition', 20);
  for (let n = 1; n <= 20; n++) {
    const expected = 1 * (1 - (1 - 0.25) ** n);
    assert.ok(Math.abs(VA[n] - expected) < 1e-10,
      `Acquisition n=${n}: VA=${VA[n]}, expected=${expected}`);
  }
});

test('rw: extinction closed form ±1e-10', () => {
  // V_n = V_0·(1−αβ)^n, αβ=0.25, V_0=λ=1
  const m = new RescorlaWagnerModel({ alphaA: 0.5, beta: 0.5, lambda: 1 });
  const { VA } = m.simulate('extinction', 20);
  for (let n = 0; n <= 20; n++) {
    const expected = 1 * (1 - 0.25) ** n;
    assert.ok(Math.abs(VA[n] - expected) < 1e-10,
      `Extinction n=${n}: VA=${VA[n]}, expected=${expected}`);
  }
});

// ── Blocking ──────────────────────────────────────────────────────────────────

test('rw: blocking delta-V_B = 0 ±1e-6', () => {
  // Phase 1: 50 A+ trials → VA≈λ; Phase 2: AB+ → ΔVB≈0
  // With αβ=0.25, after 50 trials VA=1−(0.75)^50≈1−5.6e-7, leaving residual error
  // that propagates to VB over the phase-2 AB+ trials; tolerance 1e-6 is tight but achievable.
  const m = new RescorlaWagnerModel({ alphaA: 0.5, alphaB: 0.5, beta: 0.5, lambda: 1 });
  const { VB } = m.simulate('blocking', 150);
  // After 150 trials (100 phase-2 AB+ trials), VB should still ≈ 0
  assert.ok(Math.abs(VB[VB.length - 1]) < 1e-6,
    `Blocking: V_B = ${VB[VB.length - 1]}, expected ≈ 0`);
});

// ── Overshadowing ─────────────────────────────────────────────────────────────

test('rw: overshadowing asymptote ±1e-6', () => {
  // α_A=0.6, α_B=0.4, β=0.5; asymptote V_A=0.6, V_B=0.4
  const m = new RescorlaWagnerModel({ alphaA: 0.6, alphaB: 0.4, beta: 0.5, lambda: 1 });
  const { VA, VB } = m.simulate('overshadowing', 1000);
  assert.ok(Math.abs(VA[VA.length - 1] - 0.6) < 1e-6,
    `V_A asymptote = ${VA[VA.length - 1]}, expected 0.6`);
  assert.ok(Math.abs(VB[VB.length - 1] - 0.4) < 1e-6,
    `V_B asymptote = ${VB[VB.length - 1]}, expected 0.4`);
});

// ── Overexpectation ───────────────────────────────────────────────────────────

test('rw: overexpectation V=lambda/2 ±1e-6', () => {
  // After training A+ and B+ separately to λ, AB+ reduces both to λ/2
  const m = new RescorlaWagnerModel({ alphaA: 0.5, alphaB: 0.5, beta: 0.5, lambda: 1 });
  const { VA, VB } = m.simulate('overexpectation', 1000);
  assert.ok(Math.abs(VA[VA.length - 1] - 0.5) < 1e-6,
    `V_A overexpectation = ${VA[VA.length - 1]}, expected 0.5`);
  assert.ok(Math.abs(VB[VB.length - 1] - 0.5) < 1e-6,
    `V_B overexpectation = ${VB[VB.length - 1]}, expected 0.5`);
});

// ── Conditioned inhibition ────────────────────────────────────────────────────

test('rw: conditioned inhibition ±1e-10', () => {
  // Alternate A+/AX−; α=0.5, β=0.5 → αβ=0.25; slowest eigenvalue 0.75/pair
  // After 600 trials (300 pairs): residual = (0.75)^300 ≈ 1e-38 → machine zero
  const m = new RescorlaWagnerModel({ alphaA: 0.5, alphaB: 0.5, beta: 0.5, lambda: 1 });
  const { VA, VB } = m.simulate('conditioned-inhibition', 600);
  assert.ok(Math.abs(VA[VA.length - 1] - 1) < 1e-10,
    `V_A conditioned inhibition = ${VA[VA.length - 1]}, expected 1`);
  assert.ok(Math.abs(VB[VB.length - 1] + 1) < 1e-10,
    `V_X conditioned inhibition = ${VB[VB.length - 1]}, expected -1`);
});

// ── Blocking phase-1 length stated ───────────────────────────────────────────

test('rw: blocking phase-1 = 50 A+ trials — VA[50] = 1−(0.75)^50 ≈ 1−5.55e-7', () => {
  // Model hardcodes phase-1 = min(50, nTrials) single-cue A+ trials before compound AB+.
  // After 50 A+ trials with αβ=0.25: VA[50] = 1−(0.75)^50 (closed-form acquisition formula).
  // VB[50] = 0 since B is not presented during phase-1.
  const m = new RescorlaWagnerModel({ alphaA: 0.5, alphaB: 0.5, beta: 0.5, lambda: 1 });
  const { VA, VB } = m.simulate('blocking', 50); // exactly 50 trials = phase-1 only
  const expectedVA50 = 1 - (0.75) ** 50; // ≈ 1 − 5.55e-7
  assert.ok(Math.abs(VA[50] - expectedVA50) < 1e-10,
    `VA[50] = ${VA[50].toFixed(12)}, expected 1−0.75^50 = ${expectedVA50.toFixed(12)}`);
  assert.ok(Math.abs(VB[50]) < 1e-15,
    `VB[50] = ${VB[50]}, expected 0 (B not presented in phase-1)`);
});

// ── Conditioned inhibition ≥300 pairs ─────────────────────────────────────────

test('rw: conditioned inhibition — 300 pairs (600 trials) needed for 1e-10 convergence; not converged at 50 pairs', () => {
  // Alternating A+/AX− pairs. Slowest eigenvalue (1−αβ)=0.75 per pair.
  // Residual after n pairs ≈ (0.75)^n: at 50 pairs ≈ 5.6e-7 >> 1e-10; at 300 pairs ≈ 1.6e-38 ≈ 0.
  const m = new RescorlaWagnerModel({ alphaA: 0.5, alphaB: 0.5, beta: 0.5, lambda: 1 });
  // After 50 pairs (100 trials): residual > 1e-10 — 300 pairs are needed
  const { VA: VA100, VB: VB100 } = m.simulate('conditioned-inhibition', 100);
  const residual50pairs = Math.abs(VA100[100] - 1) + Math.abs(VB100[100] + 1);
  assert.ok(residual50pairs > 1e-10,
    `At 50 pairs: residual = ${residual50pairs.toExponential(2)}, expected > 1e-10 (not yet converged)`);
  // After 300 pairs (600 trials): within 1e-10 of asymptote VA=1, VX=−1
  const { VA: VA600, VB: VB600 } = m.simulate('conditioned-inhibition', 600);
  assert.ok(Math.abs(VA600[600] - 1) < 1e-10,
    `At 300 pairs: VA = ${VA600[600].toFixed(12)}, expected 1 ±1e-10`);
  assert.ok(Math.abs(VB600[600] + 1) < 1e-10,
    `At 300 pairs: VX = ${VB600[600].toFixed(12)}, expected -1 ±1e-10`);
});

// ── Domain boundaries ─────────────────────────────────────────────────────────

test('rw: boundary ab=0 no learning', () => {
  // αβ=0: no updates
  const m = new RescorlaWagnerModel({ alphaA: 0, alphaB: 0, beta: 0.5, lambda: 1 });
  const { VA } = m.simulate('acquisition', 50);
  for (let n = 0; n <= 50; n++) {
    assert.ok(Math.abs(VA[n]) < 1e-15, `VA[${n}] should be 0, got ${VA[n]}`);
  }
});

test('rw: boundary ab=1 one-trial learning', () => {
  // αβ=1: one trial reaches λ and stays
  const m = new RescorlaWagnerModel({ alphaA: 1, beta: 1, lambda: 1 });
  const { VA } = m.simulate('acquisition', 10);
  assert.ok(Math.abs(VA[1] - 1) < 1e-15, `After 1 trial VA=${VA[1]}, expected 1`);
  for (let n = 1; n <= 10; n++) {
    assert.ok(Math.abs(VA[n] - 1) < 1e-15, `VA[${n}] should stay at 1, got ${VA[n]}`);
  }
});

test('rw: outside domain oscillates at compound β·Σα > 1', () => {
  // IMPORTANT: this tests a COMPOUND AB trial where β·(α_A+α_B) = 0.9·1.6 = 1.44 > 1.
  // In a compound trial both A and B are present: ΔV_A = α_A·β·(λ−V_A−V_B)
  //                                                    ΔV_B = α_B·β·(λ−V_A−V_B)
  // Total update Δ(V_A+V_B) = β·(α_A+α_B)·(λ−ΣV) with β·Σα = 0.9·1.6 = 1.44 > 1 → oscillates.
  // Both V_A and V_B should alternate above/below their asymptotes.
  const m = new RescorlaWagnerModel({ alphaA: 0.8, alphaB: 0.8, beta: 0.9, lambda: 1 });
  const { VA, VB } = m.simulate('overshadowing', 30); // overshadowing uses compound AB+ trials
  // With β·Σα=1.44 > 1: total V_A+V_B should oscillate above and below λ=1
  // After trial 1: ΔV total = 0.9·1.6·(1−0) = 1.44 → V_A+V_B = 1.44 > λ=1 (overshoot)
  const sum1 = VA[1] + VB[1];
  assert.ok(sum1 > 1, `β·Σα=1.44: after trial 1, V_A+V_B = ${sum1.toFixed(4)} should overshoot λ=1`);
  // After trial 2: ΔV total = 0.9·1.6·(1−1.44) = −0.634 → sum ≈ 0.806 < λ=1 (undershoot)
  const sum2 = VA[2] + VB[2];
  assert.ok(sum2 < 1, `β·Σα=1.44: after trial 2, V_A+V_B = ${sum2.toFixed(4)} should undershoot λ=1`);
});

test('rw: outside domain diverges at αβ > 2', () => {
  // For αβ=2.5, (1−αβ)=−1.5, V_n=1−(−1.5)^n → |V_20|=|(−1.5)^20−1|=3325−1≈3324 >> 100
  const m = new RescorlaWagnerModel({ alphaA: 2.5, beta: 1, lambda: 1 });
  const { VA } = m.simulate('acquisition', 20);
  assert.ok(Math.abs(VA[20]) > 100, `αβ=2.5 should diverge, VA[20] = ${VA[20]}`);
});
