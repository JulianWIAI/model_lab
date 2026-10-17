/**
 * Tests for InequalityModel — Lorenz curve and Gini coefficient.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { InequalityModel } from '../../js/benches/economics/distribution/inequality/InequalityModel.js';

test('Gini algebraic: Pareto alpha=2 -> 1/3', () => {
  const m = new InequalityModel({ dist: 'pareto', alpha: 2 });
  assert.ok(Math.abs(m.gini() - 1/3) < 1e-15);
});

test('Gini algebraic: Pareto alpha=3 -> 1/5', () => {
  const m = new InequalityModel({ dist: 'pareto', alpha: 3 });
  assert.ok(Math.abs(m.gini() - 0.2) < 1e-15);
});

test('Gini algebraic: Uniform -> 1/3', () => {
  const m = new InequalityModel({ dist: 'uniform' });
  assert.ok(Math.abs(m.gini() - 1/3) < 1e-15);
});

test('Gini algebraic: Exponential -> 0.5', () => {
  const m = new InequalityModel({ dist: 'exponential' });
  assert.ok(Math.abs(m.gini() - 0.5) < 1e-15);
});

test('Gini algebraic: Pareto alpha=1.5 -> 1/2', () => {
  const m = new InequalityModel({ dist: 'pareto', alpha: 1.5 });
  assert.ok(Math.abs(m.gini() - 0.5) < 1e-15);
});

test('lorenz(0) = 0, lorenz(1) = 1', () => {
  for (const dist of ['pareto', 'uniform', 'exponential']) {
    const m = new InequalityModel({ dist });
    assert.strictEqual(m.lorenz(0), 0, `${dist}: lorenz(0)`);
    assert.strictEqual(m.lorenz(1), 1, `${dist}: lorenz(1)`);
  }
});

test('lorenz(p) <= p for all distributions', () => {
  for (const dist of ['pareto', 'uniform', 'exponential']) {
    const m = new InequalityModel({ dist });
    for (let p = 0; p <= 1; p += 0.05) {
      assert.ok(m.lorenz(p) <= p + 1e-12, `${dist}: lorenz(${p}) = ${m.lorenz(p)} > ${p}`);
    }
  }
});

test('Convexity: lorenz(mid) <= (L(p1)+L(p2))/2 + 1e-12', () => {
  for (const dist of ['pareto', 'uniform', 'exponential']) {
    const m = new InequalityModel({ dist });
    for (let p1 = 0; p1 < 1; p1 += 0.1) {
      for (let p2 = p1 + 0.1; p2 <= 1; p2 += 0.1) {
        const mid = (p1 + p2) / 2;
        const Lmid = m.lorenz(mid);
        const avg = (m.lorenz(p1) + m.lorenz(p2)) / 2;
        assert.ok(Lmid <= avg + 1e-12,
          `${dist}: convexity fail at p1=${p1}, p2=${p2}: L(mid)=${Lmid}, avg=${avg}`);
      }
    }
  }
});

test('topShare: Pareto alpha=2 top 10%', () => {
  const m = new InequalityModel({ dist: 'pareto', alpha: 2 });
  const ts = m.topShare(0.9);
  // topShare(0.9) = (1-0.9)^{(alpha-1)/alpha} = 0.1^{1/2} = sqrt(0.1)
  assert.ok(Math.abs(ts - Math.sqrt(0.1)) < 1e-12);
});

test('giniNumerical <= Gini bound: 2*|zeta(-1/2)|*h^1.5', () => {
  const m = new InequalityModel({ dist: 'pareto', alpha: 2 });
  const nPoints = 2000;
  const gAnalytic = m.gini();
  const gNum = m.giniNumerical(nPoints);
  const h = 1 / nPoints;
  // |zeta(-1/2)| ~ 0.2079 (Riemann zeta at -1/2)
  const zetaVal = 0.2079;
  const bound = 2 * zetaVal * Math.pow(h, 1.5);
  const err = Math.abs(gNum - gAnalytic);
  assert.ok(err < bound + 1e-10,
    `Gini error ${err} exceeds bound ${bound}`);
});

test('lorenz RangeError outside [0,1]', () => {
  const m = new InequalityModel({ dist: 'pareto', alpha: 2 });
  assert.throws(() => m.lorenz(-0.1), RangeError);
  assert.throws(() => m.lorenz(1.1), RangeError);
});
