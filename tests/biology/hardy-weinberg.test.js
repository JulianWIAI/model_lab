/**
 * Tests for HardyWeinbergModel.
 *
 * Key analytic results tested:
 *   Neutral: p constant over 1000 generations.
 *   Selection only (waa=0): q declines, equilibrium not at 0 unless mu=0.
 *   Mutation–selection balance (recessive):
 *     waa=0 (s=1), mu=0.001: q̂ ≈ √(μ/s) = √0.001 ≈ 0.0316
 *   Mutation–selection balance (dominant, h=0.5):
 *     q̂ ≈ μ/(h·s) = 0.001/(0.5·1) = 0.002
 *   Migration equilibrium: p → migrantFreq at high m.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HardyWeinbergModel } from '../../js/benches/biology/genetics/hardy-weinberg/HardyWeinbergModel.js';

function near(got, want, tol, label) {
  assert.ok(
    Math.abs(got - want) <= tol,
    `${label}: expected ${want} ±${tol}, got ${got}`,
  );
}

test('Neutral (w=1, mu=nu=0, m=0): p unchanged after 1000 generations', () => {
  const m = new HardyWeinbergModel({ p: 0.3, wAA: 1, wAa: 1, waa: 1 });
  for (let i = 0; i < 1000; i++) m.step();
  near(m.p, 0.3, 1e-10, 'neutral p after 1000 gen');
});

test('genotypeFrequencies(): AA + Aa + aa === 1', () => {
  const m = new HardyWeinbergModel({ p: 0.4 });
  const { AA, Aa, aa } = m.genotypeFrequencies();
  near(AA + Aa + aa, 1, 1e-12, 'genotype sum');
});

test('genotypeFrequencies() at p=0.5: AA=0.25, Aa=0.5, aa=0.25', () => {
  const m = new HardyWeinbergModel({ p: 0.5 });
  const { AA, Aa, aa } = m.genotypeFrequencies();
  near(AA, 0.25, 1e-12, 'AA at p=0.5');
  near(Aa, 0.5,  1e-12, 'Aa at p=0.5');
  near(aa, 0.25, 1e-12, 'aa at p=0.5');
});

test('Selection only (waa=0, mu=0): q declines from 0.5 after 100 gen', () => {
  const m = new HardyWeinbergModel({ p: 0.5, waa: 0, mu: 0, nu: 0 });
  for (let i = 0; i < 100; i++) m.step();
  assert.ok(m.p > 0.5, `p should increase (aa selected against): p=${m.p}`);
});

test('Mutation–selection balance recessive (waa=0, mu=0.001): q̂ ≈ 0.0316 ±0.005', () => {
  // q̂ = √(μ/s) where s=1 (recessive lethal), q̂ = √0.001 ≈ 0.03162
  const m = new HardyWeinbergModel({
    p: 0.9, wAA: 1, wAa: 1, waa: 0, mu: 0.001, nu: 0,
  });
  const eq = m.equilibrium();
  const qEq = 1 - eq;
  near(qEq, Math.sqrt(0.001), 0.005, 'q̂ recessive mut-sel balance');
});

test('Mutation–selection balance dominant (wAa≈waa<wAA, h=0.5): q̂ ≈ μ/(h·s) ±0.001', () => {
  // Dominant deleterious allele a: wAA=1, wAa=1-h·s=1-0.5*1=0.5, waa=0 (s=1, h=0.5)
  // q̂ ≈ μ/(h·s) = 0.001/(0.5) = 0.002
  const m = new HardyWeinbergModel({
    p: 0.98, wAA: 1, wAa: 0.5, waa: 0, mu: 0.001, nu: 0,
  });
  const eq = m.equilibrium();
  const qEq = 1 - eq;
  near(qEq, 0.001 / 0.5, 0.001, 'q̂ dominant mut-sel balance');
});

test('Migration only (w=1, mu=0, m=0.1, mp=0.8): equilibrium p → 0.8 (±0.01)', () => {
  const m = new HardyWeinbergModel({
    p: 0.2, wAA: 1, wAa: 1, waa: 1, mu: 0, nu: 0,
    migrationRate: 0.1, migrantFreq: 0.8,
  });
  const eq = m.equilibrium();
  near(eq, 0.8, 0.01, 'migration equilibrium');
});

test('reset() restores initial state', () => {
  const m = new HardyWeinbergModel({ p: 0.3 });
  for (let i = 0; i < 50; i++) m.step();
  assert.ok(m.generation === 50);
  m.reset();
  assert.equal(m.generation, 0);
  near(m.p, 0.3, 1e-12, 'p after reset');
});

test('history[0] === p0 and history[1] set after first step', () => {
  const m = new HardyWeinbergModel({ p: 0.6, waa: 0 });
  assert.equal(m.history[0], 0.6);
  m.step();
  assert.ok(m.history[1] > 0.6, 'p should increase when aa selected against');
});
