/**
 * Tests for GeneticCodeModel and js/data/geneticCode.js.
 *
 * Mutation counts are derived independently from CODONS and compared:
 *   61 sense codons × 3 positions × 3 alternative bases = 549 total mutations
 *   silent=134, missense=392, nonsense=23  (Standard Genetic Code, Table 1)
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GeneticCodeModel } from '../../js/benches/biology/molecular/genetic-code/GeneticCodeModel.js';
import { CODONS, AMINO_ACIDS } from '../../js/data/geneticCode.js';

test('CODONS has exactly 64 entries', () => {
  assert.equal(Object.keys(CODONS).length, 64);
});

test('AUG encodes Met; UAA encodes Stop', () => {
  assert.equal(CODONS['AUG'], 'Met');
  assert.equal(CODONS['UAA'], 'Stop');
});

test('Three stop codons: UAA, UAG, UGA', () => {
  const stops = Object.keys(CODONS).filter((c) => CODONS[c] === 'Stop');
  assert.deepEqual(stops.sort(), ['UAA', 'UAG', 'UGA']);
});

test('AMINO_ACIDS has 21 entries (20 AA + Stop)', () => {
  assert.equal(AMINO_ACIDS.length, 21);
});

test('All AMINO_ACIDS entries have name, abbrev3, abbrev1, color', () => {
  for (const aa of AMINO_ACIDS) {
    assert.ok(aa.name,    `missing name: ${JSON.stringify(aa)}`);
    assert.ok(aa.abbrev3, `missing abbrev3: ${JSON.stringify(aa)}`);
    assert.ok(aa.abbrev1, `missing abbrev1: ${JSON.stringify(aa)}`);
    assert.ok(aa.color,   `missing color: ${JSON.stringify(aa)}`);
  }
});

test('synonymousMutations("UCU") includes UCC, UCA, UCG (Ser 4-fold box) — length ≥ 3', () => {
  const m = new GeneticCodeModel();
  const syns = m.synonymousMutations('UCU');
  assert.ok(syns.includes('UCC'), 'UCC (Ser) should be synonymous with UCU');
  assert.ok(syns.includes('UCA'), 'UCA (Ser) should be synonymous with UCU');
  assert.ok(syns.includes('UCG'), 'UCG (Ser) should be synonymous with UCU');
  assert.ok(syns.length >= 3, `Expected ≥ 3 synonymous codons for UCU, got ${syns.length}`);
});

test('synonymousMutations("AUG") is empty (Met has only one codon)', () => {
  const m = new GeneticCodeModel();
  assert.deepEqual(m.synonymousMutations('AUG'), []);
});

test('synonymousMutations("UAA") is empty (Stop codons excluded)', () => {
  const m = new GeneticCodeModel();
  assert.deepEqual(m.synonymousMutations('UAA'), []);
});

test('classifyMutation: UCU→UCC is silent, UCU→UAU is missense, UCU→UAA is nonsense', () => {
  const m = new GeneticCodeModel();
  assert.equal(m.classifyMutation('UCU', 'UCC'), 'silent');
  assert.equal(m.classifyMutation('UCU', 'UAU'), 'missense');  // Ser→Tyr
  assert.equal(m.classifyMutation('UCU', 'UAA'), 'nonsense');  // Ser→Stop
});

test('Mutation counts: silent=134, missense=392, nonsense=23, total=549', () => {
  const counts = GeneticCodeModel.countMutations();
  // Independently derived from the Standard Genetic Code:
  // 61 sense codons × 9 single-base substitutions = 549 mutations total.
  assert.equal(counts.total,    549, `total = ${counts.total}`);
  assert.equal(counts.silent,   134, `silent = ${counts.silent}`);
  assert.equal(counts.missense, 392, `missense = ${counts.missense}`);
  assert.equal(counts.nonsense,  23, `nonsense = ${counts.nonsense}`);
});

test('Relative ordering: missense > silent > nonsense', () => {
  const { silent, missense, nonsense } = GeneticCodeModel.countMutations();
  assert.ok(missense > silent,  `missense ${missense} should be > silent ${silent}`);
  assert.ok(silent > nonsense,  `silent ${silent} should be > nonsense ${nonsense}`);
});

test('codonWheel has 4 first bases, 4 second bases each, 4 entries each', () => {
  const m = new GeneticCodeModel();
  const w = m.codonWheel();
  const b1Keys = Object.keys(w);
  assert.equal(b1Keys.length, 4);
  for (const b1 of b1Keys) {
    const b2Keys = Object.keys(w[b1]);
    assert.equal(b2Keys.length, 4);
    for (const b2 of b2Keys) {
      assert.equal(w[b1][b2].length, 4, `Expected 4 entries for ${b1}${b2}, got ${w[b1][b2].length}`);
    }
  }
});

test('codonWheel entries have codon, aa, color', () => {
  const m = new GeneticCodeModel();
  const w = m.codonWheel();
  const entry = w['U']['U'][0]; // UUU
  assert.equal(entry.codon, 'UUU');
  assert.equal(entry.aa, 'Phe');
  assert.ok(entry.color.startsWith('#'), 'color should be a hex string');
});
