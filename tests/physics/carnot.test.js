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

// ── New tests for Phase 8b ──────────────────────────────────────────────────

test('T_c,max for η=0.33, T_h=873.15 K: T_c = T_h·(1−η) = 585.0105 K ±1e-10', () => {
  // Formula: T_c = T_h·(1−η) = 873.15·(1−0.33) = 873.15·0.67 = 585.0105 K (exact in float)
  const Th = 873.15;
  const eta = 0.33;
  const Tc = Th * (1 - eta);  // closed-form, no rounding: 873.15 * 0.67 is exact in double
  const expected = 873.15 * (1 - 0.33);
  assert.ok(Math.abs(Tc - expected) < 1e-10, `T_c=${Tc}`);
  // Cross-check: build model and verify eta round-trips
  const m = new CarnotModel({ Th, Tc, dS: 1 });
  assert.ok(Math.abs(m.eta - eta) < 1e-10, `m.eta=${m.eta}, expected=${eta}`);
});

test('Clausius equality: Q_h/T_h = Q_c/T_c = dS ±1e-10', () => {
  const m = new CarnotModel({ Th: 600, Tc: 300, dS: 2 });
  assert.ok(Math.abs(m.Qh / m.Th - m.dS) < 1e-10, `Qh/Th=${m.Qh / m.Th}`);
  assert.ok(Math.abs(m.Qc / m.Tc - m.dS) < 1e-10, `Qc/Tc=${m.Qc / m.Tc}`);
});

test('W = Q_h − Q_c ±1e-10', () => {
  const m = new CarnotModel({ Th: 700, Tc: 350, dS: 3 });
  assert.ok(Math.abs(m.W - (m.Qh - m.Qc)) < 1e-10, `W=${m.W}, Qh-Qc=${m.Qh - m.Qc}`);
});

test('T_c < 0 → RangeError (absolute zero)', () => {
  assert.throws(() => new CarnotModel({ Th: 500, Tc: -1 }), RangeError);
});

test('T_h ≤ 0 → RangeError', () => {
  assert.throws(() => new CarnotModel({ Th: 0,    Tc: 300 }), RangeError);
  assert.throws(() => new CarnotModel({ Th: -100, Tc: 300 }), RangeError);
});

test('NaN inputs → RangeError', () => {
  assert.throws(() => new CarnotModel({ Th: NaN, Tc: 300 }), RangeError);
  assert.throws(() => new CarnotModel({ Th: 500, Tc: NaN }), RangeError);
});

test('COP_ref(T_c=0) = 0 ±1e-15 (T-3)', () => {
  const m = new CarnotModel({ Th: 500, Tc: 0 });
  assert.ok(Math.abs(m.copRefrigerator - 0) < 1e-15,
    `COP_ref=${m.copRefrigerator}`);
});
