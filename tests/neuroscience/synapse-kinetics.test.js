/**
 * tests/neuroscience/synapse-kinetics.test.js
 * All expected values from anchors-phase7.mjs.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SynapseKineticsModel } from '../../js/benches/neuroscience/synaptic/synapse-kinetics/SynapseKineticsModel.js';

function assertClose(actual, expected, tol, msg) {
  const diff = Math.abs(actual - expected);
  assert.ok(diff <= tol, `${msg}: |${actual} - ${expected}| = ${diff} > ${tol}`);
}

describe('SynapseKineticsModel', () => {
  const tau = 5.0;
  const A = 1.0;
  const m = new SynapseKineticsModel({ tau, A });

  it('h(τ) = A·e⁻¹ ±1e-10', () => {
    assertClose(m.h(tau), A * Math.exp(-1), 1e-10, 'h(tau)');
  });

  it('h(0) = 0 exactly', () => {
    assert.strictEqual(m.h(0), 0);
  });

  it('h(2τ)/h(τ) = 2/e ±1e-10', () => {
    const ratio = m.h(2 * tau) / m.h(tau);
    assertClose(ratio, 2 / Math.E, 1e-10, 'h(2τ)/h(τ)');
  });

  it('halfDecayTime() ≈ 3.1462·τ ±1e-3·τ', () => {
    const t = m.halfDecayTime();
    // |t - 3.1462*tau| < 0.001*tau
    assertClose(t / tau, 3.1461932206205834, 0.001, 'halfDecayTime/τ');
  });

  it('integral() = A·τ ±1e-10', () => {
    assertClose(m.integral(), A * tau, 1e-10, 'integral');
  });

  it('h(t) > 0 for all t > 0 (10 points)', () => {
    for (let i = 1; i <= 10; i++) {
      const t = i * tau * 0.5;
      assert.ok(m.h(t) > 0, `h(${t}) = ${m.h(t)} ≤ 0`);
    }
  });

  it('h → 0 as t → ∞: h(100τ) very small', () => {
    const h100 = m.h(100 * tau);
    assert.ok(h100 < 1e-30, `h(100τ) = ${h100} not very small`);
  });

  it('tPeak = τ ±1e-12', () => {
    assertClose(m.tPeak, tau, 1e-12, 'tPeak');
  });
});
