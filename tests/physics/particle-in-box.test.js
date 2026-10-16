import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ParticleInBoxModel } from '../../js/benches/physics/quantum/particle-in-box/ParticleInBoxModel.js';

// Anchor constants (independent — no model import)
const H_JS = 6.62607015e-34;
const HBAR = H_JS / (2 * Math.PI);
const ME   = 9.1093837015e-31;
const EV_J = 1.602176634e-19;
const C_SI = 299792458;
const L1NM = 1e-9;

const E1_J = Math.PI ** 2 * HBAR ** 2 / (2 * ME * L1NM ** 2);

// Simpson N=10000 integrator for ∫₀¹ f(t)·L dt
function simpson(f, L, N = 10000) {
  let s = 0;
  const h = 1 / N;
  for (let i = 0; i <= N; i++) {
    const w = (i === 0 || i === N) ? 1 : (i % 2 === 0 ? 2 : 4);
    s += w * f(i / N);
  }
  return s * h / 3 * L;
}

test('E_1(L=1nm) ≈ 6.0247e-20 J ±1e-27', () => {
  const m = new ParticleInBoxModel({ L: L1NM, n: 1 });
  assert.ok(Math.abs(m.energy(1) - E1_J) < 1e-27,
    `E1=${m.energy(1)}, expected≈${E1_J}`);
});

test('E_1 in eV ≈ 0.376030 ±1e-5 eV', () => {
  const m = new ParticleInBoxModel({ L: L1NM, n: 1 });
  assert.ok(Math.abs(m.energyEV(1) - 0.376030) < 1e-5,
    `E1eV=${m.energyEV(1)}`);
});

test('E_2/E_1 = 4 ±1e-15 rel', () => {
  const m = new ParticleInBoxModel({ L: L1NM, n: 1 });
  const ratio = m.energy(2) / m.energy(1);
  assert.ok(Math.abs(ratio - 4) < 4e-15, `ratio=${ratio}`);
});

test('E_3/E_1 = 9 ±1e-15 rel', () => {
  const m = new ParticleInBoxModel({ L: L1NM, n: 1 });
  const ratio = m.energy(3) / m.energy(1);
  assert.ok(Math.abs(ratio - 9) < 9e-15, `ratio=${ratio}`);
});

test('photon λ(2→1) at L=1nm ≈ 1099 nm ±1 nm', () => {
  const m = new ParticleInBoxModel({ L: L1NM, n: 2 });
  const lam = m.photonWavelength(2) * 1e9;
  // Anchor: hc/(3E1) = 1239.842/(3×0.376030) ≈ 1099 nm
  const expected = H_JS * C_SI / (3 * E1_J) * 1e9;
  assert.ok(Math.abs(lam - expected) < 1, `λ=${lam} nm, expected≈${expected} nm`);
});

test('normalization n=1 ±1e-8 (Simpson)', () => {
  const m = new ParticleInBoxModel({ L: L1NM, n: 1 });
  const norm = simpson(t => m.probDensity(t * L1NM, 1), L1NM);
  assert.ok(Math.abs(norm - 1) < 1e-8, `norm1=${norm}`);
});

test('normalization n=2 ±1e-8 (Simpson)', () => {
  const m = new ParticleInBoxModel({ L: L1NM, n: 2 });
  const norm = simpson(t => m.probDensity(t * L1NM, 2), L1NM);
  assert.ok(Math.abs(norm - 1) < 1e-8, `norm2=${norm}`);
});

test('orthogonality ψ₁·ψ₂ ±1e-8 (Simpson)', () => {
  const m = new ParticleInBoxModel({ L: L1NM, n: 1 });
  const ortho = simpson(t => m.psi(t * L1NM, 1) * m.psi(t * L1NM, 2), L1NM);
  assert.ok(Math.abs(ortho) < 1e-8, `ortho=${ortho}`);
});

test('P(0<x<L/3) n=1 ≈ 0.195501 ±1e-6', () => {
  const m  = new ParticleInBoxModel({ L: L1NM, n: 1 });
  const P  = m.cdf(L1NM / 3, 1);
  // Exact: 1/3 - sin(2π/3)/(2π)
  const expected = 1 / 3 - Math.sin(2 * Math.PI / 3) / (2 * Math.PI);
  assert.ok(Math.abs(P - expected) < 1e-6, `P=${P}, expected=${expected}`);
});

test('<x²>_1 = L²(1/3−1/(2π²)) ±1e-30', () => {
  const m  = new ParticleInBoxModel({ L: L1NM, n: 1 });
  const x2 = m.x2Expectation(1);
  const expected = L1NM ** 2 * (1 / 3 - 1 / (2 * Math.PI ** 2));
  assert.ok(Math.abs(x2 - expected) < 1e-30, `x2=${x2}, expected=${expected}`);
});

test('E_1(2L)/E_1(L) = 0.25 ±1e-15 rel', () => {
  const m2L = new ParticleInBoxModel({ L: 2e-9, n: 1 });
  const mL  = new ParticleInBoxModel({ L: 1e-9, n: 1 });
  const ratio = m2L.energy(1) / mL.energy(1);
  assert.ok(Math.abs(ratio - 0.25) < 0.25 * 1e-15, `ratio=${ratio}`);
});

test('energies strictly increasing for n=1..5', () => {
  const m = new ParticleInBoxModel({ L: L1NM, n: 1 });
  for (let k = 1; k < 5; k++) {
    assert.ok(m.energy(k + 1) > m.energy(k),
      `E_${k+1} not > E_${k}`);
  }
});

test('n<1 → RangeError', () => {
  assert.throws(() => new ParticleInBoxModel({ L: L1NM, n: 0 }), RangeError);
});

test('n=0.5 (non-integer) → RangeError', () => {
  assert.throws(() => new ParticleInBoxModel({ L: L1NM, n: 0.5 }), RangeError);
});
