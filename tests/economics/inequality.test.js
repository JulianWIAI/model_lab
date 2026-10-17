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

test('topShare identity: topShare(q) === 1 - lorenz(q) for all distributions', () => {
  const models = [
    new InequalityModel({ dist: 'pareto', alpha: 2 }),
    new InequalityModel({ dist: 'uniform' }),
    new InequalityModel({ dist: 'exponential' }),
  ];
  for (const m of models) {
    for (const q of [0.1, 0.5, 0.8, 0.99]) {
      const ts = m.topShare(q);
      const expected = 1 - m.lorenz(q);
      assert.ok(
        Math.abs(ts - expected) < 1e-10,
        `${m.dist}: topShare(${q})=${ts}, 1-lorenz(${q})=${expected}, diff=${Math.abs(ts-expected)}`,
      );
    }
  }
});

test('lorenzCurve: returns nPoints+1 points with p in [0,1] and L=lorenz(p)', () => {
  const m = new InequalityModel({ dist: 'pareto', alpha: 2 });
  const curve = m.lorenzCurve(10);
  assert.strictEqual(curve.length, 11);
  assert.strictEqual(curve[0].p, 0);
  assert.strictEqual(curve[0].L, 0);
  assert.strictEqual(curve[10].p, 1);
  assert.strictEqual(curve[10].L, 1);
  for (const { p, L } of curve) {
    assert.ok(Math.abs(L - m.lorenz(p)) < 1e-14, `p=${p}: curve L=${L}, lorenz=${m.lorenz(p)}`);
  }
});

test('topShare exponential: numerical integration agrees +/-1e-5', () => {
  // For exponential(lambda=1): Q(u) = -ln(1-u), mu = 1
  // L(q) = integral_0^q Q(u) du = integral_0^q -ln(1-u) du
  // Computed via trapezoid on 10000 points
  const m = new InequalityModel({ dist: 'exponential' });
  const q = 0.5;
  const N = 10000;
  let trapSum = 0;
  for (let i = 0; i < N; i++) {
    const u0 = (i / N) * q;
    const u1 = ((i + 1) / N) * q;
    const Q0 = -Math.log(1 - u0);
    const Q1 = -Math.log(1 - u1);
    trapSum += (Q0 + Q1) / 2 * (u1 - u0);
  }
  const lorenzNumerical = trapSum; // divided by mu=1
  const lorenzAnalytic = m.lorenz(q);
  assert.ok(
    Math.abs(lorenzNumerical - lorenzAnalytic) < 1e-5,
    `Numerical L(0.5)=${lorenzNumerical}, analytic=${lorenzAnalytic}`,
  );
  const topShareNumerical = 1 - lorenzNumerical;
  const topShareAnalytic = m.topShare(q);
  assert.ok(
    Math.abs(topShareNumerical - topShareAnalytic) < 1e-5,
    `Numerical topShare(0.5)=${topShareNumerical}, analytic=${topShareAnalytic}`,
  );
});
