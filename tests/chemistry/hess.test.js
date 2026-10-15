import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HessModel, REACTIONS } from '../../js/benches/chemistry/thermodynamics/hess/HessModel.js';

test('methane combustion ΔH° ≈ −890 kJ/mol ±2', () => {
  const m = new HessModel(0);
  assert.ok(Math.abs(m.deltaH() - (-890.30)) < 2, `deltaH=${m.deltaH()}`);
});
test('ethanol combustion ΔH° ≈ −1367 kJ/mol ±5', () => {
  const m = new HessModel(1);
  assert.ok(Math.abs(m.deltaH() - (-1366.8)) < 5, `deltaH=${m.deltaH()}`);
});
test('deltaH equals Σproducts − Σreactants', () => {
  for (let i = 0; i < REACTIONS.length; i++) {
    const m = new HessModel(i);
    const rxn = m.reaction;
    const manual = rxn.products.reduce((s, p) => s + p.n * p.Hf, 0)
                 - rxn.reactants.reduce((s, r) => s + r.n * r.Hf, 0);
    assert.ok(Math.abs(m.deltaH() - manual) < 1e-10);
  }
});
test('O₂ Hf° === 0', () => {
  for (const rxn of REACTIONS) {
    for (const r of [...rxn.reactants, ...rxn.products]) {
      if (r.formula === 'O₂(g)') assert.strictEqual(r.Hf, 0);
    }
  }
});
