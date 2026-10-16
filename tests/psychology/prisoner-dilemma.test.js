/**
 * tests/psychology/prisoner-dilemma.test.js
 * All expected values from anchors-phase7.mjs.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PrisonerDilemmaModel } from '../../js/benches/psychology/learning/prisoner-dilemma/PrisonerDilemmaModel.js';

function assertClose(actual, expected, tol, msg) {
  const diff = Math.abs(actual - expected);
  assert.ok(diff <= tol, `${msg}: |${actual} - ${expected}| = ${diff} > ${tol}`);
}

describe('PrisonerDilemmaModel', () => {
  const m = new PrisonerDilemmaModel({ T: 5, R: 3, P: 1, S: 0, delta: 0.6 });

  it('isPD() true with defaults', () => {
    assert.strictEqual(m.isPD(), true);
  });

  it('isPD() false when 2R≤T+S: T=5,R=2,P=1,S=0', () => {
    const m2 = new PrisonerDilemmaModel({ T: 5, R: 2, P: 1, S: 0 });
    assert.strictEqual(m2.isPD(), false, '2*2=4 < 5+0=5');
  });

  it('isPD() false when T≤R: T=3,R=3', () => {
    const m2 = new PrisonerDilemmaModel({ T: 3, R: 3, P: 1, S: 0 });
    assert.strictEqual(m2.isPD(), false, 'T=R not T>R');
  });

  it('deltastar() = 0.5 ±1e-10', () => {
    assertClose(m.deltastar(), 0.5, 1e-10, 'δ*');
  });

  it('pvCooperate(0.6) = 7.5 ±1e-10', () => {
    assertClose(m.pvCooperate(0.6), 7.5, 1e-10, 'pvCoop');
  });

  it('pvDefect(0.6) = 6.5 ±1e-10', () => {
    assertClose(m.pvDefect(0.6), 6.5, 1e-10, 'pvDef');
  });

  it('pvCooperate > pvDefect at delta=0.6', () => {
    assert.ok(m.pvCooperate(0.6) > m.pvDefect(0.6));
  });

  it('pvCooperate < pvDefect at delta=0.4', () => {
    assert.ok(m.pvCooperate(0.4) < m.pvDefect(0.4));
  });

  it('grimTrigger cooperates at delta=0.6', () => {
    const { actions } = m.grimTrigger({ nRounds: 20, delta: 0.6 });
    assert.ok(actions.every(a => a.row === 'C' && a.col === 'C'), 'all cooperate');
  });

  it('grimTrigger defects at delta=0.4', () => {
    const { actions } = m.grimTrigger({ nRounds: 20, delta: 0.4 });
    assert.ok(actions.every(a => a.row === 'D' && a.col === 'D'), 'all defect');
  });

  it('pvNumerical(0.6, N=2000) ≈ pvCooperate(0.6) ±1e-9', () => {
    assertClose(m.pvNumerical(0.6, 2000), m.pvCooperate(0.6), 1e-9, 'pvNumerical vs closed form');
  });

  it('deltaStarDerivTwrtT() = 0.125 ±1e-10', () => {
    // (R-P)/(T-P)² = (3-1)/(5-1)² = 2/16 = 0.125
    assertClose(m.deltaStarDerivTwrtT(), 0.125, 1e-10, 'dδ*/dT');
  });

  it('δ* independent of S: change S from 0 to -1', () => {
    const m2 = new PrisonerDilemmaModel({ T: 5, R: 3, P: 1, S: -1 });
    assertClose(m2.deltastar(), m.deltastar(), 1e-15, 'δ* unchanged');
  });

  it('TFT threshold = max(0.5, 2/3) = 2/3 ±1e-10', () => {
    assertClose(m.tftThreshold(), 2/3, 1e-10, 'TFT threshold');
  });
});
