/**
 * tests/math/information-theory.test.js
 * All expected values from anchors-phase7.mjs.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { InformationTheoryModel } from '../../js/benches/math/probability/information-theory/InformationTheoryModel.js';
import { RootFinding } from '../../js/core/RootFinding.js';

function assertClose(actual, expected, tol, msg) {
  const diff = Math.abs(actual - expected);
  assert.ok(diff <= tol, `${msg}: |${actual} - ${expected}| = ${diff} > ${tol}`);
}

// Seeded Mulberry32
function makeRng(seed) {
  let s = seed >>> 0;
  return function next() {
    let t = (s + 0x6D2B79F5) | 0;
    s = t;
    t = Math.imul(t ^ (t >>> 15), 1 | t);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe('InformationTheoryModel', () => {
  const m = new InformationTheoryModel();

  it('uniform n=4: entropy = 2 bits ±1e-10', () => {
    assertClose(m.entropy([0.25,0.25,0.25,0.25]), 2, 1e-10, 'H uniform4');
  });

  it('deterministic p=[1,0,0]: entropy = 0 ±1e-15', () => {
    assertClose(m.entropy([1,0,0]), 0, 1e-15, 'H deterministic');
  });

  it('fair coin [0.5,0.5]: entropy = 1 bit ±1e-10', () => {
    assertClose(m.entropy([0.5,0.5]), 1, 1e-10, 'H fair coin');
  });

  it('shannonHartley(1,3) = 2 ±1e-10', () => {
    assertClose(m.shannonHartley(1, 3), 2, 1e-10, 'SH(1,3)');
  });

  it('shannonHartley(1,0) = 0 ±1e-15', () => {
    assertClose(m.shannonHartley(1, 0), 0, 1e-15, 'SH(1,0)');
  });

  it('shannonHartley(1,63) = 6 ±1e-10', () => {
    assertClose(m.shannonHartley(1, 63), 6, 1e-10, 'SH(1,63)');
  });

  it('KL(P‖P) = 0 ±1e-15', () => {
    const P = [0.3, 0.4, 0.3];
    assertClose(m.klDivergence(P, P), 0, 1e-15, 'KL(P‖P)');
  });

  it('KL([0.5,0.5],[0.25,0.75]) = 1-(1/2)log₂3 ≈ 0.207519 ±1e-6', () => {
    const kl = m.klDivergence([0.5,0.5],[0.25,0.75]);
    // From anchors: 1 - (1/2)*log₂(3) = 0.207519...
    assertClose(kl, 1 - 0.5*Math.log2(3), 1e-6, 'KL(P‖Q)');
  });

  it('KL([0.25,0.75],[0.5,0.5]) ≈ 0.188722 ±1e-6', () => {
    const kl = m.klDivergence([0.25,0.75],[0.5,0.5]);
    // From anchors: (3/4)*log₂(3) - 1
    assertClose(kl, (3/4)*Math.log2(3) - 1, 1e-6, 'KL(Q‖P)');
  });

  it('KL divergence ≥ 0 for 20 seeded random distributions', () => {
    const next = makeRng(42);
    for (let i = 0; i < 20; i++) {
      const n = 3;
      // Generate two random distributions
      const rawP = Array.from({ length: n }, () => next());
      const sumP = rawP.reduce((a, b) => a + b, 0);
      const P = rawP.map(x => x / sumP);
      const rawQ = Array.from({ length: n }, () => next() + 0.01); // avoid 0
      const sumQ = rawQ.reduce((a, b) => a + b, 0);
      const Q = rawQ.map(x => x / sumQ);
      const kl = m.klDivergence(P, Q);
      assert.ok(kl >= -1e-12, `KL[${i}] = ${kl} < 0`);
    }
  });

  it('KL with Q[i]=0 and P[i]>0 → Infinity', () => {
    const kl = m.klDivergence([0.5, 0.5], [0, 1]);
    assert.strictEqual(kl, Infinity);
  });

  it('binaryEntropy(0.5) = 1 ±1e-10', () => {
    assertClose(m.binaryEntropy(0.5), 1, 1e-10, 'H₂(0.5)');
  });

  it('binaryEntropy(p) = binaryEntropy(1-p) ±1e-15', () => {
    for (const p of [0.1, 0.3, 0.7, 0.9]) {
      assertClose(m.binaryEntropy(p), m.binaryEntropy(1-p), 1e-15, `H₂(${p})=H₂(${1-p})`);
    }
  });

  it('H₂(p)=0.5 near p≈0.11: binaryEntropy(0.1102) ≈ 0.5', () => {
    // Use brent to find p precisely
    const p = RootFinding.brent(p => m.binaryEntropy(p) - 0.5, 0.001, 0.499, 1e-10);
    assertClose(m.binaryEntropy(p), 0.5, 1e-10, 'H₂(p)=0.5');
    assert.ok(p > 0.10 && p < 0.12, `p=${p} not near 0.11`);
  });

  it('hMax(n) = log₂(n) ±1e-10 for n=2,4,8', () => {
    for (const n of [2, 4, 8]) {
      assertClose(m.hMax(n), Math.log2(n), 1e-10, `hMax(${n})`);
    }
  });
});
