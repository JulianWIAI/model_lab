/**
 * Tests for CentralDogmaModel.
 * Key results: codon table, translation, mutation classification.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CentralDogmaModel } from '../../js/benches/biology/molecular/central-dogma/CentralDogmaModel.js';
import { CODONS } from '../../js/data/geneticCode.js';

test('AUG encodes Met (start codon)', () => {
  assert.equal(CODONS['AUG'], 'Met');
});

test('UAA, UAG, UGA are stop codons', () => {
  assert.equal(CODONS['UAA'], 'Stop');
  assert.equal(CODONS['UAG'], 'Stop');
  assert.equal(CODONS['UGA'], 'Stop');
});

test('spot-check 10 codons from the standard table', () => {
  const checks = [
    ['UUU', 'Phe'], ['UUG', 'Leu'], ['UCG', 'Ser'],
    ['UAU', 'Tyr'], ['UGG', 'Trp'], ['CCU', 'Pro'],
    ['CAU', 'His'], ['AAA', 'Lys'], ['GAG', 'Glu'], ['GGG', 'Gly'],
  ];
  for (const [codon, expected] of checks) {
    assert.equal(CODONS[codon], expected, `${codon} should be ${expected}`);
  }
});

test('AUG-GUG-UAA translates to [Met, Val] (stop terminates)', () => {
  const m = new CentralDogmaModel({ dnaCoding: 'ATGGTGTAA' });
  const protein = m.translate();
  assert.equal(protein.length, 2);
  assert.equal(protein[0].aa, 'Met');
  assert.equal(protein[1].aa, 'Val');
});

test('GAG→GTG at DNA codon 7 (sickle-cell) is classified as missense', () => {
  // β-globin: codon 7 is GAG (Glu). Sickle-cell has GTG (Val).
  const orig = new CentralDogmaModel({ dnaCoding: 'ATGGTGCACCTGACTCCTGAGGAG' });
  const mutant = orig.mutate({ pos: 19, type: 'substitution', base: 'T' }); // GAG→GTG: A→T at pos 19
  assert.equal(orig.classifyMutation(mutant), 'missense');
});

test('single-base insertion is classified as frameshift', () => {
  const orig = new CentralDogmaModel({ dnaCoding: 'ATGCCCGAATAA' });
  const mutant = orig.mutate({ pos: 3, type: 'insertion', base: 'A' });
  assert.equal(orig.classifyMutation(mutant), 'frameshift');
});

test('synonymous substitution (CUU→CUC, both Leu) is classified as silent', () => {
  // DNA: CTT → CTC (both Leu in RNA: CUU → CUC)
  const orig = new CentralDogmaModel({ dnaCoding: 'ATGCTTGAATAA' });
  // pos 5 is T in CTT → change to C → CTC
  const mutant = orig.mutate({ pos: 5, type: 'substitution', base: 'C' });
  assert.equal(orig.classifyMutation(mutant), 'silent');
});

test('mrna replaces T with U', () => {
  const m = new CentralDogmaModel({ dnaCoding: 'ATGCGT' });
  assert.equal(m.mrna, 'AUGCGU');
});

test('templateStrand is reverse complement of coding strand', () => {
  const m = new CentralDogmaModel({ dnaCoding: 'ATGC' });
  // complement: TACG, reversed: GCAT
  assert.equal(m.templateStrand, 'GCAT');
});
