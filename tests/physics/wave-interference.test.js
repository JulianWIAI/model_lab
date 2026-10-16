/**
 * tests/physics/wave-interference.test.js
 * All expected values from anchors-phase7.mjs.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { WaveInterferenceModel } from '../../js/benches/physics/waves/wave-interference/WaveInterferenceModel.js';

function assertClose(actual, expected, tol, msg) {
  const diff = Math.abs(actual - expected);
  assert.ok(diff <= tol, `${msg}: |${actual} - ${expected}| = ${diff} > ${tol}`);
}

describe('WaveInterferenceModel', () => {
  const m = new WaveInterferenceModel({ lambda: 500e-9, d: 1e-3, L: 1.0, I0: 1.0 });

  it('deltaY = λL/d = 5e-4 m', () => {
    assertClose(m.deltaY, 5e-4, 1e-12, 'deltaY');
  });

  it('yDark(0) = deltaY/2 = 2.5e-4 m', () => {
    assertClose(m.yDark(0), 2.5e-4, 1e-12, 'yDark(0)');
  });

  it('I at dark fringe = 0 ±1e-12', () => {
    assertClose(m.intensity(m.yDark(0)), 0, 1e-12, 'I at dark fringe');
  });

  it('I at bright fringe y=0 = I0', () => {
    assertClose(m.intensity(0), 1.0, 1e-12, 'I at y=0');
  });

  it('Δy ratio 700nm/400nm = 1.75 ±1e-10', () => {
    const m700 = new WaveInterferenceModel({ lambda: 700e-9, d: 1e-3, L: 1.0 });
    const m400 = new WaveInterferenceModel({ lambda: 400e-9, d: 1e-3, L: 1.0 });
    assertClose(m700.deltaY / m400.deltaY, 1.75, 1e-10, 'ratio');
  });

  it('RangeError on d=0', () => {
    assert.throws(() => new WaveInterferenceModel({ d: 0 }), RangeError);
  });

  it('RangeError on lambda=0', () => {
    assert.throws(() => new WaveInterferenceModel({ lambda: 0 }), RangeError);
  });

  it('RangeError on L=0', () => {
    assert.throws(() => new WaveInterferenceModel({ L: 0 }), RangeError);
  });

  it('I(y) in [0, I0] for all y in curve', () => {
    const curve = m.curve({ nPoints: 100 });
    for (const { I } of curve) {
      assert.ok(I >= -1e-12, `I = ${I} < 0`);
      assert.ok(I <= m.I0 + 1e-12, `I = ${I} > I0`);
    }
  });
});
