/**
 * Tests for GibbsModel — Gibbs free energy ΔG = ΔH − TΔS.
 *
 * Checks:
 *   - ΔG formula
 *   - Crossover temperature T* = ΔH/ΔS
 *   - K = exp(−ΔG/RT)
 *   - ΔG = 0 at T_fus for ice fusion preset
 *   - Linearity of ΔG in T (slope = −ΔS)
 *   - K > 1 iff ΔG < 0
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  GibbsModel,
  ICE_FUSION,
} from '../../js/benches/chemistry/thermodynamics/gibbs/GibbsModel.js';
import { CONSTANTS } from '../../js/data/constants.js';

const R = CONSTANTS.R.value;

// ─── ΔG formula ───────────────────────────────────────────────────────────────

test('ΔG(T) = ΔH − T·ΔS exactly', () => {
  const m = new GibbsModel({ dH: 10000, dS: 40 });
  const T = 300;
  assert.ok(Math.abs(m.deltaG(T) - (10000 - 40 * T)) < 1e-10);
});

// ─── Crossover temperature ────────────────────────────────────────────────────

test('crossoverT = ΔH/ΔS', () => {
  const m = new GibbsModel({ dH: 6000, dS: 20 });
  assert.ok(Math.abs(m.crossoverT - 300) < 1e-10, `T*=${m.crossoverT}`);
});

test('ΔG = 0 at crossoverT', () => {
  const m = new GibbsModel({ dH: 5000, dS: 25 });
  assert.ok(Math.abs(m.deltaG(m.crossoverT)) < 1e-8);
});

test('crossoverT is null when ΔS = 0', () => {
  const m = new GibbsModel({ dH: 1000, dS: 0 });
  assert.strictEqual(m.crossoverT, null);
});

// ─── Ice fusion preset ────────────────────────────────────────────────────────

test('ΔG = 0 at T_fus = 273.15 K for ice fusion preset', () => {
  const m = new GibbsModel({ dH: ICE_FUSION.dH, dS: ICE_FUSION.dS });
  assert.ok(
    Math.abs(m.deltaG(ICE_FUSION.Tfus)) < 1e-6,
    `ΔG(273.15) = ${m.deltaG(ICE_FUSION.Tfus)} J/mol`,
  );
});

test('ICE_FUSION.dS = ICE_FUSION.dH / ICE_FUSION.Tfus (ΔS derived)', () => {
  const derived = ICE_FUSION.dH / ICE_FUSION.Tfus;
  assert.ok(
    Math.abs(ICE_FUSION.dS - derived) < 1e-8,
    `dS=${ICE_FUSION.dS}, derived=${derived}`,
  );
});

test('ICE_FUSION.dH = 6010 J/mol (CODATA Key Values)', () => {
  assert.strictEqual(ICE_FUSION.dH, 6010);
});

// ─── Equilibrium constant ────────────────────────────────────────────────────

test('K(T) = exp(−ΔG/(RT))', () => {
  const m = new GibbsModel({ dH: 10000, dS: 40 });
  const T = 400;
  const expected = Math.exp(-m.deltaG(T) / (R * T));
  assert.ok(Math.abs(m.K(T) - expected) < 1e-10);
});

test('K > 1 when ΔG < 0 (spontaneous direction)', () => {
  const m = new GibbsModel({ dH: 6010, dS: 6010 / 273.15 });
  // At T > 273.15 K, ΔG < 0 for ice fusion (melting is spontaneous)
  const K_above = m.K(300);
  const K_below = m.K(250);
  assert.ok(K_above > 1, `K(300 K)=${K_above.toFixed(4)} should be > 1`);
  assert.ok(K_below < 1, `K(250 K)=${K_below.toFixed(4)} should be < 1`);
});

test('K = 1 at crossoverT (ΔG = 0 → equilibrium)', () => {
  const m = new GibbsModel({ dH: 5000, dS: 25 });
  assert.ok(Math.abs(m.K(m.crossoverT) - 1.0) < 1e-8);
});

// ─── Linearity ────────────────────────────────────────────────────────────────

test('ΔG is linear in T: slope = −ΔS', () => {
  const dS = 30;
  const m = new GibbsModel({ dH: 8000, dS });
  const T1 = 250, T2 = 350;
  const slope = (m.deltaG(T2) - m.deltaG(T1)) / (T2 - T1);
  assert.ok(
    Math.abs(slope - (-dS)) < 1e-9,
    `slope=${slope}, expected ${-dS}`,
  );
});

// ─── curve() ─────────────────────────────────────────────────────────────────

test('curve() returns nPts points', () => {
  const m = new GibbsModel();
  assert.strictEqual(m.curve(200, 400, 200).length, 200);
});
