/**
 * Tests for RateLawsModel — integrated rate laws for 0th, 1st, 2nd order reactions.
 *
 * Checks exact analytical solutions:
 *   0th: [A] = [A]₀ − kt  (and clamped at 0)
 *   1st: [A] = [A]₀ · exp(−kt)
 *   2nd: [A] = [A]₀ / (1 + k·[A]₀·t)
 *   Half-life formulas for each order.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RateLawsModel } from '../../js/benches/chemistry/kinetics/rate-laws/RateLawsModel.js';

// ─── 0th order ────────────────────────────────────────────────────────────────

test('0th order: [A](t) = [A]₀ − k·t for t < [A]₀/k', () => {
  const m = new RateLawsModel({ order: 0, A0: 1.0, k: 0.05 });
  const t = 5;
  assert.ok(
    Math.abs(m.concentration(t) - (1.0 - 0.05 * t)) < 1e-12,
    `Expected ${1.0 - 0.05 * t}, got ${m.concentration(t)}`,
  );
});

test('0th order: [A] clamped at 0 for t > [A]₀/k', () => {
  const m = new RateLawsModel({ order: 0, A0: 1.0, k: 0.05 });
  assert.strictEqual(m.concentration(100), 0);
});

test('0th order: t½ = [A]₀/(2k)', () => {
  const m = new RateLawsModel({ order: 0, A0: 1.0, k: 0.05 });
  const expected = 1.0 / (2 * 0.05);
  assert.ok(
    Math.abs(m.halfLife() - expected) < 1e-12,
    `Expected t½=${expected}, got ${m.halfLife()}`,
  );
});

test('0th order: [A] at t=t½ is [A]₀/2', () => {
  const m = new RateLawsModel({ order: 0, A0: 1.0, k: 0.05 });
  assert.ok(
    Math.abs(m.concentration(m.halfLife()) - 0.5) < 1e-12,
  );
});

// ─── 1st order ────────────────────────────────────────────────────────────────

test('1st order: [A](t) = [A]₀ · exp(−kt)', () => {
  const m = new RateLawsModel({ order: 1, A0: 2.0, k: 0.1 });
  const t = 10;
  const expected = 2.0 * Math.exp(-0.1 * t);
  assert.ok(
    Math.abs(m.concentration(t) - expected) < 1e-12,
    `Expected ${expected}, got ${m.concentration(t)}`,
  );
});

test('1st order: t½ = ln(2)/k', () => {
  const m = new RateLawsModel({ order: 1, A0: 1.0, k: 0.2 });
  const expected = Math.LN2 / 0.2;
  assert.ok(
    Math.abs(m.halfLife() - expected) < 1e-12,
    `Expected t½=${expected}, got ${m.halfLife()}`,
  );
});

test('1st order: [A] at t=t½ is [A]₀/2', () => {
  const m = new RateLawsModel({ order: 1, A0: 1.5, k: 0.3 });
  assert.ok(
    Math.abs(m.concentration(m.halfLife()) - 0.75) < 1e-10,
  );
});

test('1st order: half-life is independent of [A]₀', () => {
  const m1 = new RateLawsModel({ order: 1, A0: 0.5, k: 0.1 });
  const m2 = new RateLawsModel({ order: 1, A0: 2.0, k: 0.1 });
  assert.ok(
    Math.abs(m1.halfLife() - m2.halfLife()) < 1e-12,
    'First-order half-life must not depend on [A]₀',
  );
});

// ─── 2nd order ────────────────────────────────────────────────────────────────

test('2nd order: [A](t) = [A]₀ / (1 + k·[A]₀·t)', () => {
  const m = new RateLawsModel({ order: 2, A0: 1.0, k: 0.5 });
  const t = 4;
  const expected = 1.0 / (1 + 0.5 * 1.0 * t);
  assert.ok(
    Math.abs(m.concentration(t) - expected) < 1e-12,
    `Expected ${expected}, got ${m.concentration(t)}`,
  );
});

test('2nd order: t½ = 1/(k·[A]₀)', () => {
  const m = new RateLawsModel({ order: 2, A0: 1.0, k: 0.5 });
  const expected = 1 / (0.5 * 1.0);
  assert.ok(
    Math.abs(m.halfLife() - expected) < 1e-12,
    `Expected t½=${expected}, got ${m.halfLife()}`,
  );
});

test('2nd order: [A] at t=t½ is [A]₀/2', () => {
  const m = new RateLawsModel({ order: 2, A0: 1.0, k: 0.5 });
  assert.ok(
    Math.abs(m.concentration(m.halfLife()) - 0.5) < 1e-10,
  );
});

test('2nd order: half-life increases as [A]₀ decreases (successive half-lives lengthen)', () => {
  // At t = t½, remaining [A] = A0/2. New t½ from that point = 1/(k·A0/2) = 2·original t½
  const m = new RateLawsModel({ order: 2, A0: 1.0, k: 0.5 });
  const t1 = m.halfLife();              // 1/(0.5·1) = 2 s
  // Second half-life: from [A]=0.5, t½ = 1/(0.5·0.5) = 4 s
  const m2 = new RateLawsModel({ order: 2, A0: 0.5, k: 0.5 });
  assert.ok(m2.halfLife() > t1, 'Second half-life should be longer');
});

// ─── curve() ──────────────────────────────────────────────────────────────────

test('curve() returns nPoints points all in [0, [A]₀]', () => {
  for (const order of [0, 1, 2]) {
    const m = new RateLawsModel({ order, A0: 1.0, k: 0.1 });
    const pts = m.curve(50, 200);
    assert.strictEqual(pts.length, 200, `order=${order}: wrong length`);
    for (const { A } of pts) {
      assert.ok(A >= 0 && A <= m.A0 + 1e-10, `order=${order}: A=${A} out of range`);
    }
  }
});

test('curve() is non-increasing (concentration cannot increase)', () => {
  for (const order of [0, 1, 2]) {
    const m = new RateLawsModel({ order, A0: 1.0, k: 0.1 });
    const pts = m.curve(50, 100);
    for (let i = 1; i < pts.length; i++) {
      assert.ok(
        pts[i].A <= pts[i - 1].A + 1e-10,
        `order=${order}: concentration increased at index ${i}`,
      );
    }
  }
});

// ─── initial conditions ───────────────────────────────────────────────────────

test('[A](0) = [A]₀ for all orders', () => {
  for (const order of [0, 1, 2]) {
    const m = new RateLawsModel({ order, A0: 1.5, k: 0.1 });
    assert.ok(
      Math.abs(m.concentration(0) - 1.5) < 1e-12,
      `order=${order}: [A](0) should be 1.5`,
    );
  }
});
