import { test } from 'node:test';
import assert from 'node:assert/strict';
import { VSEPRModel } from '../../js/benches/chemistry/bonding/vsepr/VSEPRModel.js';

test('12 geometries present', () => {
  assert.strictEqual(VSEPRModel.geometries.length, 12);
});
test('forType(AX2E2) has correct properties', () => {
  const g = VSEPRModel.forType('AX2E2');
  assert.strictEqual(g.name, 'Bent (4)');
  assert.strictEqual(g.lonePairs, 2);
  assert.strictEqual(g.ligands, 2);
});
test('H2O (AX2E2) realAngle === 104.5, idealAngle === 109.5', () => {
  const g = VSEPRModel.forType('AX2E2');
  assert.strictEqual(g.realAngle, 104.5);
  assert.strictEqual(g.idealAngle, 109.5);
});
test('NH3 (AX3E) realAngle === 107', () => {
  const g = VSEPRModel.forType('AX3E');
  assert.strictEqual(g.realAngle, 107);
});
test('AX4 positions all at unit length, pairwise dot ≈ −1/3 ±1e-6', () => {
  const g = VSEPRModel.forType('AX4');
  const pts = g.positions3D;
  assert.strictEqual(pts.length, 4);
  // unit length
  for (const p of pts) {
    const len = Math.sqrt(p.reduce((s, v) => s + v*v, 0));
    assert.ok(Math.abs(len - 1) < 1e-10, `len=${len}`);
  }
  // pairwise dot product ≈ -1/3
  for (let i = 0; i < pts.length; i++) {
    for (let j = i+1; j < pts.length; j++) {
      const dot = pts[i].reduce((s, v, k) => s + v * pts[j][k], 0);
      assert.ok(Math.abs(dot - (-1/3)) < 1e-6, `dot[${i}][${j}]=${dot}`);
    }
  }
});
test('AX6 positions pairwise dot ≈ 0 ±1e-6', () => {
  const g = VSEPRModel.forType('AX6');
  const pts = g.positions3D;
  for (let i = 0; i < pts.length; i++) {
    for (let j = i+1; j < pts.length; j++) {
      const dot = pts[i].reduce((s, v, k) => s + v * pts[j][k], 0);
      assert.ok(Math.abs(dot) < 1e-10 || Math.abs(Math.abs(dot) - 1) < 1e-10,
        `unexpected dot[${i}][${j}]=${dot}`);
    }
  }
});
test('rotate preserves ligand distances ±1e-8', () => {
  const m = new VSEPRModel('AX4');
  const before = m.atoms3D(1).ligands.map(l => Math.sqrt(l.pos.reduce((s,v)=>s+v*v,0)));
  m.rotate(30, 45);
  const after  = m.atoms3D(1).ligands.map(l => Math.sqrt(l.pos.reduce((s,v)=>s+v*v,0)));
  for (let i = 0; i < before.length; i++) {
    assert.ok(Math.abs(before[i] - after[i]) < 1e-8, `dist changed at ligand ${i}`);
  }
});
