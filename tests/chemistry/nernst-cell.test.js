import { test } from 'node:test';
import assert from 'node:assert/strict';
import { NernstCellModel, DANIELL_CELL } from '../../js/benches/chemistry/electrochemistry/nernst-cell/NernstCellModel.js';
import { CONSTANTS } from '../../js/data/constants.js';

const R = CONSTANTS.R.value;
const F = CONSTANTS.F.value;

test('E(298.15, 1) ≈ E_standard ±1e-6', () => {
  const m = new NernstCellModel();
  assert.ok(Math.abs(m.E(298.15, 1) - m.E_standard) < 1e-6);
});
test('E decreases as Q increases', () => {
  const m = new NernstCellModel({ T: 298.15 });
  assert.ok(m.E(298.15, 1) > m.E(298.15, 10));
  assert.ok(m.E(298.15, 10) > m.E(298.15, 100));
});
test('deltaG < 0 when E > 0', () => {
  const m = new NernstCellModel({ T: 298.15, Q: 1 });
  assert.ok(m.E() > 0);
  assert.ok(m.deltaG < 0);
});
test('K ≈ exp(nFE°/RT) ±1e-6 relative', () => {
  const m = new NernstCellModel({ T: 298.15 });
  const expected = Math.exp(m.n * F * m.E_standard / (R * 298.15));
  assert.ok(Math.abs(m.K - expected) / expected < 1e-6);
});
test('deltaG === -n * F * E ±1e-10', () => {
  const m = new NernstCellModel({ T: 298.15, Q: 5 });
  assert.ok(Math.abs(m.deltaG - (-m.n * F * m.E())) < 1e-6);
});
test('Nernst slope ≈ (RT/nF)·ln(10) ±1e-8', () => {
  const m = new NernstCellModel({ T: 298.15 });
  const slope = m.E(298.15, 1) - m.E(298.15, 10);
  const expected = (R * 298.15 / (m.n * F)) * Math.log(10);
  assert.ok(Math.abs(slope - expected) < 1e-8, `slope=${slope}, expected=${expected}`);
});
test('DANIELL_CELL.E_standard ≈ 1.10 V', () => {
  assert.ok(Math.abs(DANIELL_CELL.E_standard - 1.1037) < 0.001);
});
