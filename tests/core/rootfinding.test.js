/**
 * Tests for js/core/RootFinding.js
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RootFinding } from '../../js/core/RootFinding.js';

test('bisect: finds √2 to ten significant figures', () => {
  const root = RootFinding.bisect((x) => x * x - 2, 1, 2);
  assert.ok(Math.abs(root - Math.SQRT2) < 1e-9, `root = ${root}, expected √2 = ${Math.SQRT2}`);
});

test('brent: finds √2 to ten significant figures', () => {
  const root = RootFinding.brent((x) => x * x - 2, 1, 2);
  assert.ok(Math.abs(root - Math.SQRT2) < 1e-9, `root = ${root}, expected √2 = ${Math.SQRT2}`);
});

test('bisect: finds root of x³ − x − 2 ≈ 1.52138', () => {
  // Only real root: x ≈ 1.5213797068045676
  const exact = 1.5213797068045676;
  const root = RootFinding.bisect((x) => x ** 3 - x - 2, 1, 2);
  assert.ok(Math.abs(root - exact) < 1e-8, `root = ${root}, expected ≈ ${exact}`);
});

test('brent: finds root of x³ − x − 2 ≈ 1.52138 faster than bisect', () => {
  const exact = 1.5213797068045676;
  const root = RootFinding.brent((x) => x ** 3 - x - 2, 1, 2);
  assert.ok(Math.abs(root - exact) < 1e-10, `root = ${root}, expected ≈ ${exact}`);
});

test('bisect: finds negative root of x² − 3 in [−2, −1]', () => {
  // −√3 ≈ −1.732; f(−2) = 1 > 0, f(−1) = −2 < 0.
  const root = RootFinding.bisect((x) => x * x - 3, -2, -1);
  assert.ok(Math.abs(root + Math.sqrt(3)) < 1e-9, `root = ${root}, expected −√3 = ${-Math.sqrt(3)}`);
});

test('bisect: throws RangeError when bracket has no sign change', () => {
  assert.throws(
    () => RootFinding.bisect((x) => x * x, 1, 2),
    { message: /opposite signs/ },
  );
});

test('brent: throws RangeError when bracket has no sign change', () => {
  assert.throws(
    () => RootFinding.brent((x) => x * x, 1, 2),
    { message: /opposite signs/ },
  );
});
