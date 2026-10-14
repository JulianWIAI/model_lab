/**
 * Tests for OrbitalModel.
 * Key results: radial function normalisation, node counts, most probable radius.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { OrbitalModel } from '../../js/benches/chemistry/atomic/orbitals/OrbitalModel.js';

// Numerical integral ∫₀^∞ r² R_nl(r)² dr using Riemann sum
function integrateRadial(n, l, rMax = 300, steps = 10000) {
  const m = new OrbitalModel({ n, l, m: 0 });
  const dr = rMax / steps;
  let sum = 0;
  for (let i = 0; i < steps; i++) {
    const r = (i + 0.5) * dr;
    sum += m.radialDistribution(r) * dr;
  }
  return sum;
}

test('radial function is normalised for 1s (n=1, l=0)', () => {
  const integral = integrateRadial(1, 0);
  assert.ok(Math.abs(integral - 1) < 0.01, `∫r²R² dr = ${integral}, expected 1`);
});

test('radial function is normalised for 2s (n=2, l=0)', () => {
  const integral = integrateRadial(2, 0);
  assert.ok(Math.abs(integral - 1) < 0.01, `∫r²R² dr = ${integral}, expected 1`);
});

test('radial function is normalised for 2p (n=2, l=1)', () => {
  const integral = integrateRadial(2, 1);
  assert.ok(Math.abs(integral - 1) < 0.01, `∫r²R² dr = ${integral}, expected 1`);
});

test('radial function is normalised for 3d (n=3, l=2)', () => {
  const integral = integrateRadial(3, 2, 600, 20000);
  assert.ok(Math.abs(integral - 1) < 0.015, `∫r²R² dr = ${integral}, expected 1`);
});

test('radial nodes: 1s=0, 2s=1, 3s=2', () => {
  assert.equal(new OrbitalModel({ n: 1, l: 0 }).radialNodes, 0);
  assert.equal(new OrbitalModel({ n: 2, l: 0 }).radialNodes, 1);
  assert.equal(new OrbitalModel({ n: 3, l: 0 }).radialNodes, 2);
});

test('most probable radius of 1s = 1 Bohr (a₀)', () => {
  const m = new OrbitalModel({ n: 1, l: 0, m: 0 });
  const rMPR = m.mostProbableRadius;
  assert.ok(Math.abs(rMPR - 1) < 0.05, `r_MPR = ${rMPR}, expected 1 a₀`);
});

test('Laguerre L_2^0(x) = 1 - 2x + x²/2', () => {
  // L_p^alpha(x) with p=2, alpha=0
  for (const x of [0, 1, 2, 3]) {
    const computed = OrbitalModel.assocLaguerre(2, 0, x);
    const expected = 1 - 2 * x + x * x / 2;
    assert.ok(Math.abs(computed - expected) < 1e-12, `L_2^0(${x}) = ${computed}, expected ${expected}`);
  }
});
