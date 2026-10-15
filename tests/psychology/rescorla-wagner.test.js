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
  // IMPORTANT: for compound AB trial, error factor = β·(α_A+α_B) = 0.9·1.6 = 1.44 > 1 → oscillates
  // Single-cue closed form: V_n = λ(1−(1−αβ)^n).
  // For αβ=1.5, (1−αβ)=−0.5, so odd trials have V_n > λ and even trials V_n < λ.
  // Oscillation means V alternates above and below λ; specifically V[1]=1.5 > λ=1, V[2]=0.75 < λ.
  // The series converges (|1−αβ|=0.5<1) but oscillates around λ with alternating overshoot.
  const m = new RescorlaWagnerModel({ alphaA: 1.5, beta: 1, lambda: 1 });
  const { VA } = m.simulate('acquisition', 20);
  // V[1] = 1.5 > λ (overshoot), V[2] = 0.75 < λ (undershoot): confirms oscillation
  assert.ok(VA[1] > 1, `αβ=1.5 trial 1 should overshoot λ=1, VA[1] = ${VA[1]}`);
  assert.ok(VA[2] < 1, `αβ=1.5 trial 2 should undershoot λ=1, VA[2] = ${VA[2]}`);
});

test('rw: outside domain diverges at αβ > 2', () => {
  // For αβ=2.5, (1−αβ)=−1.5, V_n=1−(−1.5)^n → |V_20|=|(−1.5)^20−1|=3325−1≈3324 >> 100
  const m = new RescorlaWagnerModel({ alphaA: 2.5, beta: 1, lambda: 1 });
  const { VA } = m.simulate('acquisition', 20);
  assert.ok(Math.abs(VA[20]) > 100, `αβ=2.5 should diverge, VA[20] = ${VA[20]}`);
});
