/**
 * Tests for EnzymeKineticsModel.
 * Key results: Km definition, inhibitor effects, LM fitting.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EnzymeKineticsModel } from '../../js/benches/biology/biochemistry/enzyme-kinetics/EnzymeKineticsModel.js';

test('v = Vmax/2 when [S] = Km (definition of Km)', () => {
  const m = new EnzymeKineticsModel({ Vmax: 100, Km: 10 });
  const v = m.v(10);
  assert.ok(Math.abs(v - 50) < 1e-10, `v(Km) = ${v}, expected 50`);
});

test('competitive inhibitor increases apparent Km, leaves Vmax unchanged', () => {
  const base = new EnzymeKineticsModel({ Vmax: 100, Km: 10, inhibitorType: 'none' });
  const inh = new EnzymeKineticsModel({ Vmax: 100, Km: 10, inhibitorType: 'competitive', inhibitorConc: 10, Ki: 10 });
  assert.ok(inh.apparentKm > base.apparentKm, `apparent Km ${inh.apparentKm} should be > ${base.apparentKm}`);
  assert.ok(Math.abs(inh.apparentVmax - base.apparentVmax) < 1e-10, 'Vmax should be unchanged');
});

test('uncompetitive inhibitor decreases both apparent Km and Vmax', () => {
  const base = new EnzymeKineticsModel({ Vmax: 100, Km: 10 });
  const inh = new EnzymeKineticsModel({ Vmax: 100, Km: 10, inhibitorType: 'uncompetitive', inhibitorConc: 10, Kiprime: 10 });
  assert.ok(inh.apparentKm < base.Km, `apparent Km ${inh.apparentKm} should be < ${base.Km}`);
  assert.ok(inh.apparentVmax < base.Vmax, `apparent Vmax ${inh.apparentVmax} should be < ${base.Vmax}`);
});

test('fitMM recovers known Km=10, Vmax=100 from noise-free data to within 0.1%', () => {
  const model = new EnzymeKineticsModel({ Vmax: 100, Km: 10 });
  const sValues = [1, 2, 5, 10, 20, 50, 100, 200];
  const vValues = sValues.map((s) => model.v(s));
  const fit = EnzymeKineticsModel.fitMM(sValues, vValues);
  assert.ok(fit !== null, 'fit should converge');
  assert.ok(Math.abs(fit.Km - 10) / 10 < 0.001, `Km = ${fit.Km}, expected 10`);
  assert.ok(Math.abs(fit.Vmax - 100) / 100 < 0.001, `Vmax = ${fit.Vmax}, expected 100`);
});

test('Lineweaver-Burk slope = Km/Vmax', () => {
  const model = new EnzymeKineticsModel({ Vmax: 100, Km: 10 });
  // LB: 1/v = (Km/Vmax) * (1/s) + 1/Vmax
  // Slope = Km/Vmax = 10/100 = 0.1
  const p1 = model.vLineweaver(5);
  const p2 = model.vLineweaver(20);
  const slope = (p2.y - p1.y) / (p2.x - p1.x);
  const expected = model.apparentKm / model.apparentVmax;
  assert.ok(Math.abs(slope - expected) < 1e-10, `slope = ${slope}, expected ${expected}`);
});
