/**
 * tests/physics/standing-waves.test.js
 * All expected values from anchors-phase7.mjs.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { StandingWavesModel } from '../../js/benches/physics/waves/standing-waves/StandingWavesModel.js';

function assertClose(actual, expected, tol, msg) {
  const diff = Math.abs(actual - expected);
  assert.ok(diff <= tol, `${msg}: |${actual} - ${expected}| = ${diff} > ${tol}`);
}

describe('StandingWavesModel', () => {
  it('f₁ string L=1m, v=343 m/s = 171.5 Hz ±1e-10', () => {
    const m = new StandingWavesModel({ L: 1.0, v: 343, mode: 'string', n: 1 });
    assertClose(m.frequency(1), 171.5, 1e-10, 'f₁');
  });

  it('f₂/f₁ = 2 exactly ±1e-15', () => {
    const m = new StandingWavesModel({ L: 1.0, v: 343, mode: 'string', n: 2 });
    const f1 = new StandingWavesModel({ L: 1.0, v: 343, mode: 'string', n: 1 }).frequency();
    assertClose(m.frequency() / f1, 2, 1e-15, 'f₂/f₁');
  });

  it('f_n/f₁ = n for n=1..5 ±1e-15', () => {
    const base = new StandingWavesModel({ L: 1.0, v: 343, mode: 'string', n: 1 });
    const f1 = base.frequency();
    for (let n = 1; n <= 5; n++) {
      const m = new StandingWavesModel({ L: 1.0, v: 343, mode: 'string', n });
      assertClose(m.frequency() / f1, n, 1e-15, `f${n}/f₁`);
    }
  });

  it('closed pipe: only odd harmonics (m=1,3,5 present; m=2,4 absent)', () => {
    const m = new StandingWavesModel({ L: 1.0, v: 343, mode: 'closed', n: 1 });
    const freqs = m.frequencies(5).map(f => f.n);
    assert.ok(freqs.includes(1), 'm=1 present');
    assert.ok(freqs.includes(3), 'm=3 present');
    assert.ok(freqs.includes(5), 'm=5 present');
    assert.ok(!freqs.includes(2), 'm=2 absent');
    assert.ok(!freqs.includes(4), 'm=4 absent');
  });

  it('closed pipe f₃/f₁ = 3 ±1e-15', () => {
    const m = new StandingWavesModel({ L: 1.0, v: 343, mode: 'closed', n: 1 });
    const f1c = m.frequency(1);
    const f3c = m.frequency(3);
    assertClose(f3c / f1c, 3, 1e-15, 'f₃/f₁ closed');
  });

  it('open pipe f₂/f₁ = 2 ±1e-15', () => {
    const m = new StandingWavesModel({ L: 1.0, v: 343, mode: 'open', n: 1 });
    const f1 = m.frequency(1);
    const f2 = m.frequency(2);
    assertClose(f2 / f1, 2, 1e-15, 'open pipe f₂/f₁');
  });

  it('node positions for n=2: x=0, L/2, L ±1e-12', () => {
    const m = new StandingWavesModel({ L: 1.0, v: 343, mode: 'string', n: 2 });
    const nodes = m.nodePositions(2);
    assertClose(nodes[0], 0,   1e-12, 'node[0]');
    assertClose(nodes[1], 0.5, 1e-12, 'node[1]');
    assertClose(nodes[2], 1.0, 1e-12, 'node[2]');
  });

  it('n=1 fundamental node positions: x=0, L ±1e-12', () => {
    const m = new StandingWavesModel({ L: 1.0, v: 343, mode: 'string', n: 1 });
    const nodes = m.nodePositions(1);
    assert.strictEqual(nodes.length, 2, 'n=1 has 2 nodes');
    assertClose(nodes[0], 0,   1e-12, 'node[0]');
    assertClose(nodes[1], 1.0, 1e-12, 'node[1]');
  });
});
