/**
 * Tests for LinkageModel — Haldane and Kosambi mapping functions.
 *
 * Reference values:
 *   Haldane(0.05) = −0.5·ln(0.9) = 0.052680 Morgans
 *   Kosambi(0.1) < Haldane(0.1)  (Kosambi corrects for interference)
 *   LOD(P=9, R=1, θ=0.1): log₁₀[0.1¹·0.9⁹/0.5¹⁰] ≈ 1.59
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LinkageModel } from '../../js/benches/biology/genetics/linkage/LinkageModel.js';

function near(got, want, tol, label) {
  assert.ok(
    Math.abs(got - want) <= tol,
    `${label}: expected ${want} ±${tol}, got ${got}`,
  );
}

test('haldane(0) === 0', () => {
  const m = new LinkageModel();
  assert.equal(m.haldane(0), 0);
});

test('kosambi(0) === 0', () => {
  const m = new LinkageModel();
  assert.equal(m.kosambi(0), 0);
});

test('haldane(0.5) is Infinity (chromosomes unlinked)', () => {
  const m = new LinkageModel();
  assert.equal(m.haldane(0.5), Infinity);
});

test('kosambi(0.5) is Infinity', () => {
  const m = new LinkageModel();
  assert.equal(m.kosambi(0.5), Infinity);
});

test('haldane(0.1) > kosambi(0.1) (Haldane overestimates without interference)', () => {
  const m = new LinkageModel();
  assert.ok(
    m.haldane(0.1) > m.kosambi(0.1),
    `haldane(0.1)=${m.haldane(0.1)} should be > kosambi(0.1)=${m.kosambi(0.1)}`,
  );
});

test('haldane(0.05) ≈ 0.052680 Morgans (= −0.5·ln(0.9))', () => {
  const m = new LinkageModel();
  near(m.haldane(0.05), -0.5 * Math.log(0.9), 1e-10, 'Haldane(0.05)');
});

test('haldaneInverse(haldane(0.1)) ≈ 0.1 (±1e-9)', () => {
  const m = new LinkageModel();
  near(m.haldaneInverse(m.haldane(0.1)), 0.1, 1e-9, 'Haldane inverse round-trip');
});

test('kosambiInverse(kosambi(0.2)) ≈ 0.2 (±1e-9)', () => {
  const m = new LinkageModel();
  near(m.kosambiInverse(m.kosambi(0.2)), 0.2, 1e-9, 'Kosambi inverse round-trip');
});

test('haldaneInverse(0) === 0; kosambiInverse(0) === 0', () => {
  const m = new LinkageModel();
  assert.equal(m.haldaneInverse(0), 0);
  assert.equal(m.kosambiInverse(0), 0);
});

test('haldaneInverse result in [0, 0.5) for M > 0', () => {
  const m = new LinkageModel();
  for (const M of [0.01, 0.1, 0.5, 1, 2, 5]) {
    const th = m.haldaneInverse(M);
    assert.ok(th >= 0 && th < 0.5, `haldaneInverse(${M}) = ${th} should be in [0, 0.5)`);
  }
});

test('kosambi(0.25) in cM matches 25·tanh(1)/0.5 relationship', () => {
  // kosambi(θ) = 0.25·ln((1+2θ)/(1-2θ)); for θ=0.25: ln(1.5/0.5)=ln(3)
  const m = new LinkageModel();
  const expected = 0.25 * Math.log(3); // Morgans
  near(m.kosambi(0.25), expected, 1e-10, 'Kosambi(0.25)');
});

test('lodScore with 90 parental, 10 recombinant, θ=0.1: LOD > 0', () => {
  const m = new LinkageModel({ theta: 0.1 });
  const lod = m.lodScore(90, 10, 0.1);
  assert.ok(lod > 0, `LOD = ${lod} should be positive`);
});

test('lodScore(50,50,0.5) is −Infinity (θ=0.5 is the null)', () => {
  const m = new LinkageModel();
  assert.equal(m.lodScore(50, 50, 0.5), -Infinity);
});

test('curveData returns three arrays of correct length', () => {
  const m = new LinkageModel();
  const { thetas, haldaneCM, kosambiCM } = m.curveData(100);
  assert.equal(thetas.length, 100);
  assert.equal(haldaneCM.length, 100);
  assert.equal(kosambiCM.length, 100);
});
