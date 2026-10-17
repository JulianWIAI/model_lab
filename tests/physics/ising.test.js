/**
 * Tests for IsingModel — 2D Ising model with Metropolis dynamics.
 *
 * Checks critical temperature, ground state energy, Yang magnetisation,
 * L=4 exact averages, deltaE, and MC convergence.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { IsingModel } from '../../js/benches/physics/statistical-mechanics/ising/IsingModel.js';

test('sinh(2*Kc) = 1 to machine precision', () => {
  const m = new IsingModel();
  assert.ok(
    Math.abs(Math.sinh(2 * m.Kc) - 1) < 1e-14,
    `sinh(2Kc) = ${Math.sinh(2 * m.Kc)}, expected 1`,
  );
});

test('Tc = 2.2691853142130221 +/-1e-14', () => {
  const m = new IsingModel();
  assert.ok(
    Math.abs(m.Tc - 2.2691853142130221) < 1e-14,
    `Tc = ${m.Tc}, expected 2.2691853142130221`,
  );
});

test('L=4 ordered: energy() = -32J, |magnetisation()| = 1', () => {
  const m = new IsingModel({ L: 4, T: 1, init: 'ordered' });
  assert.strictEqual(m.energy(), -32);
  assert.strictEqual(Math.abs(m.magnetisation()), 1);
});

test('deltaE at ordered (0,0) = 8J', () => {
  const m = new IsingModel({ L: 4, T: 1, init: 'ordered' });
  // In fully ordered state, flipping any spin costs 8J (4 neighbours, all aligned)
  assert.strictEqual(m.deltaE(0, 0), 8);
});

test('Yang formula: (63/64)^(1/8) at T=Tc/2', () => {
  // Yang spontaneous magnetisation: m(T) = [1 - sinh^{-4}(2K)]^{1/8}
  // At T = Tc/2, K = J/(kB*T) = 1/(Tc/2) = 2/Tc
  // sinh(2K) = sinh(4/Tc)
  const Tc = 2 / Math.log(1 + Math.SQRT2);
  const K = 1 / (Tc / 2);
  const s = Math.sinh(2 * K);
  const yang = Math.pow(1 - Math.pow(s, -4), 1/8);
  const expected = Math.pow(63/64, 1/8);
  assert.ok(
    Math.abs(yang - expected) < 1e-14,
    `Yang at Tc/2: ${yang}, expected ${expected}`,
  );
  assert.ok(Math.abs(expected - 0.9980333916921637) < 1e-14);
});

test('MC L=4 vs exact <|m|> at T=2.5: |mean - exact| < 4*SE', () => {
  // exact canonical average <|m|>_{L=4, T=2.5} computed by summing all 2^16 configurations
  const L4 = 4, N4 = 16, T4 = 2.5;
  const bonds4 = [];
  for (let r = 0; r < L4; r++)
    for (let c = 0; c < L4; c++) {
      bonds4.push([r*L4+c, r*L4+(c+1)%L4]);
      bonds4.push([r*L4+c, ((r+1)%L4)*L4+c]);
    }
  let Z4 = 0, num4 = 0;
  for (let cfg = 0; cfg < (1 << N4); cfg++) {
    let E = 0;
    for (const [a, b] of bonds4) {
      const sa = ((cfg >> a) & 1) ? 1 : -1;
      const sb = ((cfg >> b) & 1) ? 1 : -1;
      E -= sa * sb; // E = -J * Σ s_i s_j, J=1
    }
    let M = 0;
    for (let i = 0; i < N4; i++) M += ((cfg >> i) & 1) ? 1 : -1;
    const w = Math.exp(-E / T4);
    Z4 += w;
    num4 += Math.abs(M / N4) * w;
  }
  const exact = num4 / Z4;
  const nSeeds = 20;
  const samples = [];
  for (let s = 0; s < nSeeds; s++) {
    const m = new IsingModel({ L: 4, T: 2.5, seed: 1000 + s, init: 'random' });
    m.sweep(200); // equilibrate
    let sum = 0;
    const nSample = 200;
    for (let i = 0; i < nSample; i++) {
      m.sweep(5);
      sum += Math.abs(m.magnetisation());
    }
    samples.push(sum / nSample);
  }
  const mean = samples.reduce((a,b) => a+b, 0) / nSeeds;
  const variance = samples.reduce((a,b) => a + (b - mean)**2, 0) / (nSeeds - 1);
  const se = Math.sqrt(variance / nSeeds);
  assert.ok(
    Math.abs(mean - exact) < 4 * se,
    `MC mean |m|=${mean.toFixed(6)}, exact=${exact}, SE=${se.toFixed(6)}, diff=${Math.abs(mean-exact).toFixed(6)}`,
  );
});

test('Stripe test L=16: top half +1, bottom half -1, E = -448J', () => {
  const L = 16;
  const m = new IsingModel({ L, T: 1, init: 'ordered' });
  // Set bottom half to -1
  for (let r = L/2; r < L; r++)
    for (let c = 0; c < L; c++)
      m.spins[r * L + c] = -1;
  // Stripe: two horizontal domain walls, each of length L
  // E = -(2*L*L - 2*L)*J = -(2*256 - 32) = -480... wait
  // Actually: E = -J * sum of nn bonds. All aligned bonds contribute -J, misaligned +J.
  // Total bonds = 2*L*L (horizontal + vertical, periodic BC)
  // Aligned: all except the two horizontal walls at row L/2-1 to L/2 and row L-1 to 0
  // Misaligned bonds: 2 * L = 32
  // E = -J*(2*L*L - 2*misaligned) + J*misaligned = ... Let me just compute it
  const E = m.energy();
  // In a perfect horizontal stripe with periodic BC:
  // Horizontal bonds: all aligned = L*L bonds contributing -J each = -256
  // Vertical bonds: L*(L-1) aligned + L*1 misaligned at row 7->8 boundary, but periodic BC
  // Actually with periodic BC, row 15 wraps to row 0, creating another domain wall
  // Vertical bonds per column: L bonds. Of these, L-2 are aligned, 2 are misaligned (at row 7->8 and 15->0)
  // Vertical: L*(L-2)*(-J) + L*2*(+J) = -L*(L-2) + 2L = -L*(L-4)
  // Total E = -L^2 + -L*(L-4) = -L^2 - L^2 + 4L = -2L^2 + 4L = -512 + 64 = -448
  assert.strictEqual(E, -448, `Stripe E=${E}, expected -448`);
});

test('T=0 -> RangeError', () => {
  assert.throws(() => new IsingModel({ T: 0 }), RangeError);
});

test('L=2 -> RangeError', () => {
  assert.throws(() => new IsingModel({ L: 2 }), RangeError);
});
