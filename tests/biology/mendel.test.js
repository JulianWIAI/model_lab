/**
 * Tests for MendelModel.
 * Key results: 3:1 ratio, chi-square p-values.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MendelModel } from '../../js/benches/biology/genetics/mendel/MendelModel.js';

test('monohybrid Aa×Aa complete dominance gives 3:1 phenotype ratio', () => {
  const m = new MendelModel();
  m.crossType = 'mono';
  m.dominance = 'complete';
  m.parentA = 'Aa';
  m.parentB = 'Aa';
  const { phenotypeRatios } = m.punnettSquare();
  // Should have 2 phenotypes: A_ (0.75) and aa (0.25)
  assert.equal(phenotypeRatios.length, 2);
  const dominant = phenotypeRatios.find(r => r.label.includes('_') || r.label.includes('A'));
  const recessive = phenotypeRatios.find(r => r.label === 'aa');
  assert.ok(dominant, 'should have a dominant phenotype');
  assert.ok(recessive, 'should have a recessive phenotype');
  assert.ok(Math.abs(dominant.p - 0.75) < 0.001, `dominant p = ${dominant.p}, expected 0.75`);
  assert.ok(Math.abs(recessive.p - 0.25) < 0.001, `recessive p = ${recessive.p}, expected 0.25`);
});

test('monohybrid Aa×Aa incomplete dominance gives 3 phenotypes (1:2:1)', () => {
  const m = new MendelModel();
  m.crossType = 'mono';
  m.dominance = 'incomplete';
  m.parentA = 'Aa';
  m.parentB = 'Aa';
  const { phenotypeRatios } = m.punnettSquare();
  assert.equal(phenotypeRatios.length, 3, `expected 3 phenotypes, got ${phenotypeRatios.length}`);
});

test('dihybrid AaBb×AaBb complete dominance gives 9:3:3:1', () => {
  const m = new MendelModel();
  m.crossType = 'di';
  m.dominance = 'complete';
  m.recombFreq = 0.5;
  m.parentA = 'AaBb';
  m.parentB = 'AaBb';
  const { phenotypeRatios } = m.punnettSquare();
  assert.equal(phenotypeRatios.length, 4, `expected 4 phenotypes, got ${phenotypeRatios.length}`);
  phenotypeRatios.sort((a, b) => b.p - a.p);
  assert.ok(Math.abs(phenotypeRatios[0].p - 9/16) < 0.001, `A_B_ p = ${phenotypeRatios[0].p}, expected 9/16`);
  assert.ok(Math.abs(phenotypeRatios[1].p - 3/16) < 0.001);
  assert.ok(Math.abs(phenotypeRatios[2].p - 3/16) < 0.001);
  assert.ok(Math.abs(phenotypeRatios[3].p - 1/16) < 0.001);
});

test('chiSquarePValue(3.84, 1) ≈ 0.05', () => {
  const p = MendelModel.chiSquarePValue(3.84, 1);
  assert.ok(Math.abs(p - 0.05) < 0.005, `p = ${p}, expected ~0.05`);
});

test("Mendel's peas 315:108:101:32 vs 9:3:3:1 — p-value > 0.05 (data fits)", () => {
  const m = new MendelModel();
  const observed = [315, 108, 101, 32];
  const total = 556;
  const expected = [9/16, 3/16, 3/16, 1/16]; // proportions
  const { pValue } = m.chiSquare(observed, expected);
  assert.ok(pValue > 0.05, `p = ${pValue}, expected > 0.05`);
});
