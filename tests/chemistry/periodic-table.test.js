/**
 * Tests for PeriodicTableModel and js/data/elements.js (PubChem data).
 *
 * The exhaustive-exceptions test compares aufbauConfig() against the
 * PubChem electronConfig for every element. Any element where they disagree
 * must either be listed in EXCEPTIONS (so aufbauConfig returns the correct
 * PubChem value) or the test will fail. This catches both missing exceptions
 * and stale exception strings.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PeriodicTableModel } from '../../js/benches/chemistry/atomic/periodic-table/PeriodicTableModel.js';
import { ELEMENTS } from '../../js/data/elements.js';

test('118 unique elements by Z', () => {
  assert.equal(ELEMENTS.length, 118);
  const zSet = new Set(ELEMENTS.map((e) => e.Z));
  assert.equal(zSet.size, 118, 'all Z values must be unique');
});

test('PubChem data has real vdwRadius field (not old atomicRadius)', () => {
  // H vdwRadius from PubChem = 120 pm (van der Waals), not 53 pm (Bohr radius)
  const H = ELEMENTS.find((e) => e.Z === 1);
  assert.ok(H.vdwRadius !== undefined, 'vdwRadius field must exist');
  assert.ok(H.vdwRadius >= 100, `H vdwRadius = ${H.vdwRadius} pm, expected ≥100 (van der Waals)`);
});

test('Fe (Z=26) Aufbau config = [Ar] 3d⁶ 4s² (matches PubChem)', () => {
  const m = new PeriodicTableModel();
  const config = m.aufbauConfig(26);
  const pubchem = ELEMENTS.find((e) => e.Z === 26).electronConfig;
  assert.equal(config, '[Ar] 3d⁶ 4s²', `got "${config}"`);
  assert.equal(config, pubchem, `Aufbau and PubChem disagree: aufbau="${config}" pubchem="${pubchem}"`);
});

test('Cr (Z=24) exception = [Ar] 3d⁵ 4s¹ (matches PubChem)', () => {
  const m = new PeriodicTableModel();
  const config = m.aufbauConfig(24);
  const pubchem = ELEMENTS.find((e) => e.Z === 24).electronConfig;
  assert.equal(config, '[Ar] 3d⁵ 4s¹', `got "${config}"`);
  assert.equal(config, pubchem, `Exception string does not match PubChem: "${config}" vs "${pubchem}"`);
});

test('Cu (Z=29) exception = [Ar] 3d¹⁰ 4s¹ (matches PubChem)', () => {
  const m = new PeriodicTableModel();
  const config = m.aufbauConfig(29);
  const pubchem = ELEMENTS.find((e) => e.Z === 29).electronConfig;
  assert.equal(config, '[Ar] 3d¹⁰ 4s¹', `got "${config}"`);
  assert.equal(config, pubchem);
});

test('Au (Z=79) exception = [Xe] 4f¹⁴ 5d¹⁰ 6s¹ (matches PubChem)', () => {
  const m = new PeriodicTableModel();
  const config = m.aufbauConfig(79);
  const pubchem = ELEMENTS.find((e) => e.Z === 79).electronConfig;
  assert.equal(config, '[Xe] 4f¹⁴ 5d¹⁰ 6s¹', `got "${config}"`);
  assert.equal(config, pubchem);
});

test('La (Z=57) exception = [Xe] 5d¹ 6s² (matches PubChem)', () => {
  const m = new PeriodicTableModel();
  const config = m.aufbauConfig(57);
  const pubchem = ELEMENTS.find((e) => e.Z === 57).electronConfig;
  assert.equal(config, '[Xe] 5d¹ 6s²', `got "${config}"`);
  assert.equal(config, pubchem);
});

test('Gd (Z=64) exception = [Xe] 4f⁷ 5d¹ 6s² (matches PubChem)', () => {
  const m = new PeriodicTableModel();
  const config = m.aufbauConfig(64);
  const pubchem = ELEMENTS.find((e) => e.Z === 64).electronConfig;
  assert.equal(config, '[Xe] 4f⁷ 5d¹ 6s²', `got "${config}"`);
  assert.equal(config, pubchem);
});

test('Ac (Z=89) exception = [Rn] 6d¹ 7s² (matches PubChem)', () => {
  const m = new PeriodicTableModel();
  const config = m.aufbauConfig(89);
  const pubchem = ELEMENTS.find((e) => e.Z === 89).electronConfig;
  assert.equal(config, '[Rn] 6d¹ 7s²', `got "${config}"`);
  assert.equal(config, pubchem);
});

test('U (Z=92) exception = [Rn] 5f³ 6d¹ 7s² (matches PubChem)', () => {
  const m = new PeriodicTableModel();
  const config = m.aufbauConfig(92);
  const pubchem = ELEMENTS.find((e) => e.Z === 92).electronConfig;
  assert.equal(config, '[Rn] 5f³ 6d¹ 7s²', `got "${config}"`);
  assert.equal(config, pubchem);
});

/**
 * Exhaustive check: for every element, aufbauConfig(Z) must equal
 * elements.js electronConfig. Elements where simple Aufbau disagrees with
 * PubChem must be listed in EXCEPTIONS (so aufbauConfig returns the correct
 * PubChem value). If a new PubChem anomaly is found or an exception string
 * goes stale, this test fails and names the element.
 */
test('aufbauConfig matches PubChem electronConfig for all 118 elements', () => {
  const m = new PeriodicTableModel();
  const mismatches = [];
  for (const el of ELEMENTS) {
    const got = m.aufbauConfig(el.Z);
    if (got !== el.electronConfig) {
      mismatches.push(`Z=${el.Z} ${el.symbol}: aufbau="${got}" pubchem="${el.electronConfig}"`);
    }
  }
  assert.deepEqual(
    mismatches,
    [],
    `${mismatches.length} config mismatch(es):\n${mismatches.join('\n')}`,
  );
});
