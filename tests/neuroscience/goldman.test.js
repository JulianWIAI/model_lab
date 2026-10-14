/**
 * Tests for GoldmanModel — Goldman–Hodgkin–Katz voltage equation.
 *
 * Checks against analytically known results:
 *   - With a single ion permeable, GHK reduces to the Nernst equation
 *   - Symmetric concentrations give Vm = 0
 *   - Default squid-axon resting potential ≈ −61 mV (Hodgkin & Katz 1949)
 *   - Action-potential peak permeabilities give Vm > 0 (Na⁺-dominated)
 *   - Nernst() helper agrees with (RT/zF)·ln([out]/[in])
 *   - PCl contributes with inverted concentration ratio (Cl⁻ is an anion)
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  GoldmanModel,
  SQUID_AXON,
  SQUID_AXON_REST,
  SQUID_AXON_AP,
} from '../../js/benches/neuroscience/electrophysiology/goldman/GoldmanModel.js';
import { CONSTANTS } from '../../js/data/constants.js';

const R = CONSTANTS.R.value;
const F = CONSTANTS.F.value;
const T = 293.15;
const RT_F_mV = (R * T / F) * 1000;  // ≈ 25.26 mV

// ─── 1. Nernst reduction for K⁺ (PNa=0, PCl=0) ──────────────────────────────
test('GHK reduces to Nernst for K⁺ when PNa=0, PCl=0', () => {
  const m = new GoldmanModel({ PK: 1, PNa: 0, PCl: 0 });
  const expected = RT_F_mV * Math.log(SQUID_AXON.Ko / SQUID_AXON.Ki);
  assert.ok(
    Math.abs(m.Vm - expected) < 1e-8,
    `Vm=${m.Vm} mV, expected Nernst K⁺=${expected} mV`,
  );
});

// ─── 2. Nernst reduction for Na⁺ (PK=0, PCl=0) ──────────────────────────────
test('GHK reduces to Nernst for Na⁺ when PK=0, PCl=0', () => {
  const m = new GoldmanModel({ PK: 0, PNa: 1, PCl: 0 });
  const expected = RT_F_mV * Math.log(SQUID_AXON.Nao / SQUID_AXON.Nai);
  assert.ok(
    Math.abs(m.Vm - expected) < 1e-8,
    `Vm=${m.Vm} mV, expected Nernst Na⁺=${expected} mV`,
  );
});

// ─── 3. Nernst reduction for Cl⁻ (PK=0, PNa=0) ──────────────────────────────
test('GHK reduces to Nernst for Cl⁻ when PK=0, PNa=0', () => {
  const m = new GoldmanModel({ PK: 0, PNa: 0, PCl: 1 });
  // Cl⁻ enters GHK as [Cl]_i / [Cl]_o → Vm = (RT/F)·ln(Cli/Clo) = (RT/(-1)F)·ln(Clo/Cli)
  const expected = RT_F_mV * Math.log(SQUID_AXON.Cli / SQUID_AXON.Clo);
  assert.ok(
    Math.abs(m.Vm - expected) < 1e-8,
    `Vm=${m.Vm} mV, expected Nernst Cl⁻=${expected} mV`,
  );
});

// ─── 4. Symmetric concentrations → Vm = 0 ────────────────────────────────────
test('Vm = 0 when all concentrations are symmetric', () => {
  const m = new GoldmanModel({
    Ki: 100, Ko: 100, Nai: 100, Nao: 100, Cli: 100, Clo: 100,
  });
  assert.ok(Math.abs(m.Vm) < 1e-10, `Vm should be 0; got ${m.Vm}`);
});

// ─── 5. Squid-axon resting potential ─────────────────────────────────────────
test('default squid-axon resting Vm ≈ −61 mV (Hodgkin & Katz 1949)', () => {
  // Numerator: PK·Ko + PNa·Nao + PCl·Cli = 1·20 + 0.04·440 + 0.45·52 = 61
  // Denominator: PK·Ki + PNa·Nai + PCl·Clo = 1·400 + 0.04·50 + 0.45·560 = 654
  // Vm = RT/F · ln(61/654) ≈ −61 mV
  const m = new GoldmanModel();
  assert.ok(
    m.Vm > -65 && m.Vm < -58,
    `Resting Vm should be ≈−61 mV; got ${m.Vm.toFixed(2)} mV`,
  );
});

// ─── 6. Action-potential peak → Vm > 0 ───────────────────────────────────────
test('AP-peak permeabilities (PNa >> PK) give Vm > 0', () => {
  const m = new GoldmanModel({
    PK: SQUID_AXON_AP.PK, PNa: SQUID_AXON_AP.PNa, PCl: SQUID_AXON_AP.PCl,
  });
  assert.ok(m.Vm > 0, `AP-peak Vm should be positive; got ${m.Vm.toFixed(2)} mV`);
});

// ─── 7. nernst() helper ───────────────────────────────────────────────────────
test('nernst() matches (RT/zF)·ln([out]/[in]) for K⁺', () => {
  const m = new GoldmanModel();
  const { EK } = m.nernstPotentials;
  const expected = RT_F_mV * Math.log(SQUID_AXON.Ko / SQUID_AXON.Ki);
  assert.ok(
    Math.abs(EK - expected) < 1e-8,
    `EK=${EK} mV, expected ${expected} mV`,
  );
});

test('nernst() for Cl⁻ (z=−1) gives correct sign (negative)', () => {
  const m = new GoldmanModel();
  const { ECl } = m.nernstPotentials;
  // [Cl]_o (560) >> [Cl]_i (52) → z=−1 → E_Cl < 0
  assert.ok(ECl < 0, `ECl should be negative (Cl⁻ equilibrium potential); got ${ECl.toFixed(2)}`);
});

// ─── 8. vCurve() length and monotonicity ─────────────────────────────────────
test('vCurve() returns correct number of points', () => {
  const m = new GoldmanModel();
  const pts = m.vCurve(0.01, 30, 200);
  assert.strictEqual(pts.length, 200);
});

test('vCurve() is monotonically increasing in PNa (higher PNa → higher Vm)', () => {
  const m = new GoldmanModel();
  const pts = m.vCurve(0.01, 30, 50);
  for (let i = 1; i < pts.length; i++) {
    assert.ok(
      pts[i].Vm >= pts[i - 1].Vm - 1e-9,
      `Vm should increase with PNa at index ${i}`,
    );
  }
});

// ─── 9. SQUID_AXON constants ──────────────────────────────────────────────────
test('SQUID_AXON_REST permeability ratios: PNa=0.04, PCl=0.45', () => {
  assert.strictEqual(SQUID_AXON_REST.PNa, 0.04);
  assert.strictEqual(SQUID_AXON_REST.PCl, 0.45);
});
