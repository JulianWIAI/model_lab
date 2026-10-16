/**
 * tests/math/eigenvectors.test.js
 * All expected values from anchors-phase7.mjs.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { EigenvectorsModel } from '../../js/benches/math/linear-algebra/eigenvectors/EigenvectorsModel.js';
import { powerIteration, dot, norm } from '../../js/core/LinAlg.js';

function assertClose(actual, expected, tol, msg) {
  const diff = Math.abs(actual - expected);
  assert.ok(diff <= tol, `${msg}: |${actual} - ${expected}| = ${diff} > ${tol}`);
}

describe('EigenvectorsModel', () => {
  const m = new EigenvectorsModel({ matrix: [[2,1],[1,2]] });

  it('[[2,1],[1,2]] → λ=[3,1] ±1e-10', () => {
    const { values } = m.solve();
    assertClose(values[0], 3, 1e-10, 'λ₁');
    assertClose(values[1], 1, 1e-10, 'λ₂');
  });

  it('first eigenvector = [1,1]/√2 up to sign ±1e-10', () => {
    const { vectors } = m.solve();
    const INV_SQRT2 = 1 / Math.sqrt(2);
    const v = vectors[0];
    const d1 = norm([v[0] - INV_SQRT2, v[1] - INV_SQRT2]);
    const d2 = norm([v[0] + INV_SQRT2, v[1] + INV_SQRT2]);
    assert.ok(Math.min(d1, d2) < 1e-10, `v₁ not ±[1,1]/√2`);
  });

  it('eigenvectors orthonormal ±1e-10', () => {
    const { vectors } = m.solve();
    assertClose(dot(vectors[0], vectors[1]), 0, 1e-10, 'orthogonal');
    assertClose(norm(vectors[0]), 1, 1e-10, '‖v₁‖');
    assertClose(norm(vectors[1]), 1, 1e-10, '‖v₂‖');
  });

  it('reconstruction ±1e-10', () => {
    assertClose(m.reconstructionError(), 0, 1e-10, 'reconstruction');
  });

  it('power iteration residual < 1e-10 after 30 iters', () => {
    const r = m.powerIterResult({ n: 30, v0: [1, 0] });
    assert.ok(r.residual < 1e-10, `residual = ${r.residual}`);
  });

  it('[[0,1],[1,0]] does not converge: iters exhausted', () => {
    const m2 = new EigenvectorsModel({ matrix: [[0,1],[1,0]] });
    const r = m2.powerIterResult({ n: 100, v0: [1, 0] });
    assert.strictEqual(r.iters, 100, `expected 100, got ${r.iters}`);
  });

  it('ceil(ln(1e-4)/ln(0.9)) = 88', () => {
    assert.strictEqual(Math.ceil(Math.log(1e-4) / Math.log(0.9)), 88);
  });

  it('trace = Σλ ±1e-10', () => {
    const { values } = m.solve();
    const traceExpected = values.reduce((a, b) => a + b, 0);
    assertClose(m.trace(), traceExpected, 1e-10, 'trace');
    // Also check trace=4 for [[2,1],[1,2]]
    assertClose(m.trace(), 4, 1e-10, 'trace=4');
  });

  it('det = Πλ ±1e-10', () => {
    const { values } = m.solve();
    const detExpected = values.reduce((a, b) => a * b, 1);
    assertClose(m.determinant(), detExpected, 1e-10, 'det');
    // Also check det=3 for [[2,1],[1,2]]
    assertClose(m.determinant(), 3, 1e-10, 'det=3');
  });

  it('unit circle ellipse semi-axes = |λ₁|=3, |λ₂|=1', () => {
    const { values } = m.solve();
    assertClose(Math.abs(values[0]), 3, 1e-10, '|λ₁|=3');
    assertClose(Math.abs(values[1]), 1, 1e-10, '|λ₂|=1');
  });
});
