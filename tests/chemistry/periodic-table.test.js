/**
 * Tests for PeriodicTableModel.
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

test('Fe (Z=26) Aufbau config = [Ar] 3d⁶ 4s²', () => {
  const m = new PeriodicTableModel();
  const config = m.aufbauConfig(26);
  assert.equal(config, '[Ar] 3d⁶ 4s²', `got "${config}"`);
});

test('Cr (Z=24) exception = [Ar] 3d⁵ 4s¹', () => {
  const m = new PeriodicTableModel();
  const config = m.aufbauConfig(24);
  assert.equal(config, '[Ar] 3d⁵ 4s¹', `got "${config}"`);
});

test('Cu (Z=29) exception = [Ar] 3d¹⁰ 4s¹', () => {
  const m = new PeriodicTableModel();
  const config = m.aufbauConfig(29);
  assert.equal(config, '[Ar] 3d¹⁰ 4s¹', `got "${config}"`);
});

test('Aufbau for non-exception elements matches elements.js electronConfig', () => {
  const m = new PeriodicTableModel();
  // Check a few known non-exception elements with simple configs
  // Z=11 Na: [Ne] 3s¹
  assert.equal(m.aufbauConfig(11), '[Ne] 3s¹', `Na: got "${m.aufbauConfig(11)}"`);
  // Z=17 Cl: [Ne] 3s² 3p⁵
  assert.equal(m.aufbauConfig(17), '[Ne] 3s² 3p⁵', `Cl: got "${m.aufbauConfig(17)}"`);
  // Z=20 Ca: [Ar] 4s²
  assert.equal(m.aufbauConfig(20), '[Ar] 4s²', `Ca: got "${m.aufbauConfig(20)}"`);
});
