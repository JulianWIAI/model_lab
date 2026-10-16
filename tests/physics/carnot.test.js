import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CarnotModel } from '../../js/benches/physics/thermodynamics/carnot/CarnotModel.js';

test('η(T_h=500, T_c=300) = 0.4 ±1e-15', () => {
  const m = new CarnotModel({ Th: 500, Tc: 300 });
  assert.ok(Math.abs(m.eta - 0.4) < 1e-15, `eta=${m.eta}`);
});

test('η(T_h=500, T_c=0) = 1.0 ±1e-15', () => {
  const m = new CarnotModel({ Th: 500, Tc: 0 });
  assert.ok(Math.abs(m.eta - 1.0) < 1e-15, `eta=${m.eta}`);
});

test('COP_hp(500,300) = 2.5 ±1e-10', () => {
  const m = new CarnotModel({ Th: 500, Tc: 300 });
  assert.ok(Math.abs(m.copHeatPump - 2.5) < 1e-10, `COP_hp=${m.copHeatPump}`);
});

test('COP_ref(500,300) = 1.5 ±1e-10', () => {
  const m = new CarnotModel({ Th: 500, Tc: 300 });
  assert.ok(Math.abs(m.copRefrigerator - 1.5) < 1e-10, `COP_ref=${m.copRefrigerator}`);
});

test('COP_hp − COP_ref = 1 ±1e-15', () => {
  const m = new CarnotModel({ Th: 500, Tc: 300 });
  assert.ok(Math.abs(m.copHeatPump - m.copRefrigerator - 1) < 1e-15,
    `diff=${m.copHeatPump - m.copRefrigerator}`);
});

test('η × COP_hp = 1 ±1e-15', () => {
  const m = new CarnotModel({ Th: 500, Tc: 300 });
  assert.ok(Math.abs(m.eta * m.copHeatPump - 1) < 1e-15,
    `product=${m.eta * m.copHeatPump}`);
});

test('COP_hp(T_c=0) = 1 ±1e-15', () => {
  const m = new CarnotModel({ Th: 500, Tc: 0 });
  assert.ok(Math.abs(m.copHeatPump - 1) < 1e-15, `COP_hp=${m.copHeatPump}`);
});

test('T-S shoelace area = W = (T_h−T_c)·ΔS ±1e-10', () => {
  const m    = new CarnotModel({ Th: 800, Tc: 300, dS: 2 });
  const area = m.tsShoelaceArea();
  const W    = m.W;
  assert.ok(Math.abs(area - W) < 1e-10, `area=${area}, W=${W}`);
});

test('η monotone decreasing: η(100) > η(200) > η(300) at T_h=500', () => {
  const m1 = new CarnotModel({ Th: 500, Tc: 100 });
  const m2 = new CarnotModel({ Th: 500, Tc: 200 });
  const m3 = new CarnotModel({ Th: 500, Tc: 300 });
  assert.ok(m1.eta > m2.eta && m2.eta > m3.eta,
    `etas: ${m1.eta}, ${m2.eta}, ${m3.eta}`);
});

test('T_c >= T_h → RangeError', () => {
  assert.throws(() => new CarnotModel({ Th: 500, Tc: 500 }), RangeError);
  assert.throws(() => new CarnotModel({ Th: 500, Tc: 600 }), RangeError);
});
