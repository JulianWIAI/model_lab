/**
 * Tests for SpectraModel — Rydberg formula with reduced-mass correction.
 *
 * Reference values:
 *   Balmer-α  H  (3→2): λ_vac = 36/(5·R_H)·1e9 nm  ≈ 656.46 nm
 *   Balmer-α  H  (3→2): λ_air ≈ 656.28 nm  (λ_vac / 1.000277)
 *   Balmer-α  D  (3→2): λ_vac ≈ 656.28 nm  (reduced-mass shift ~0.18 nm)
 *   Lyman-α   H  (2→1): λ_vac ≈ 121.57 nm  (no air correction — below 200 nm)
 *   Balmer limit (n₂→∞): λ_vac → n₁²/R_H·1e9 = 4/R_H·1e9 ≈ 364.6 nm
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SpectraModel } from '../../js/benches/chemistry/atomic/spectra/SpectraModel.js';
import { CONSTANTS } from '../../js/data/constants.js';

const TOL = 0.05; // ±0.05 nm tolerance

function near(got, want, tol = TOL, label = '') {
  assert.ok(
    Math.abs(got - want) <= tol,
    `${label}: expected ${want} ±${tol} nm, got ${got.toFixed(4)} nm`,
  );
}

test('Rinf and md present in constants.js', () => {
  assert.ok(CONSTANTS.Rinf, 'Rinf must be defined');
  assert.ok(CONSTANTS.md,   'md must be defined');
  // NIST values to 4 sig figs
  assert.ok(Math.abs(CONSTANTS.Rinf.value - 1.097_373e7) < 1e2, 'Rinf value');
  assert.ok(Math.abs(CONSTANTS.md.value - 3.3436e-27) < 1e-31, 'md value');
});

test('H Balmer-α (3→2): λ_vac ≈ 656.46 nm', () => {
  const m = new SpectraModel({ isotope: 'H' });
  near(m.wavelengthVac(2, 3), 656.46, TOL, 'H Balmer-α vac');
});

test('H Balmer-α (3→2): λ_air ≈ 656.28 nm', () => {
  const m = new SpectraModel({ isotope: 'H' });
  near(m.wavelengthAir(2, 3), 656.28, TOL, 'H Balmer-α air');
});

test('D Balmer-α (3→2): λ_vac ≈ 656.28 nm (reduced-mass blue-shift)', () => {
  const m = new SpectraModel({ isotope: 'D' });
  near(m.wavelengthVac(2, 3), 656.28, TOL, 'D Balmer-α vac');
});

test('H/D isotope shift: D − H Balmer-α vac ≈ −0.18 nm', () => {
  const mH = new SpectraModel({ isotope: 'H' });
  const mD = new SpectraModel({ isotope: 'D' });
  const shift = mD.wavelengthVac(2, 3) - mH.wavelengthVac(2, 3);
  assert.ok(
    Math.abs(shift - (-0.179)) < 0.02,
    `Expected shift ≈ −0.18 nm, got ${shift.toFixed(4)} nm`,
  );
});

test('H Lyman-α (2→1): λ_vac ≈ 121.57 nm', () => {
  const m = new SpectraModel({ isotope: 'H' });
  near(m.wavelengthVac(1, 2), 121.57, TOL, 'Lyman-α vac');
});

test('H Lyman-α: no air correction (< 200 nm)', () => {
  const m = new SpectraModel({ isotope: 'H' });
  // Air wavelength must equal vacuum wavelength for λ < 200 nm
  assert.equal(m.wavelengthAir(1, 2), m.wavelengthVac(1, 2));
});

test('H Balmer limit (n₂=1000 approximates ∞): λ_vac ≈ 364.70 nm (reduced-mass)', () => {
  // With R_H (reduced mass), limit = 4/R_H × 1e9 ≈ 364.705 nm (not 364.6 which uses R_∞).
  const m = new SpectraModel({ isotope: 'H' });
  near(m.wavelengthVac(2, 1000), 364.70, 0.1, 'Balmer limit');
});

test('H Balmer series monotonically decreasing as n₂ increases 3→9', () => {
  const m = new SpectraModel({ isotope: 'H' });
  let prev = m.wavelengthVac(2, 3);
  for (let n2 = 4; n2 <= 9; n2++) {
    const lam = m.wavelengthVac(2, n2);
    assert.ok(lam < prev, `λ(2,${n2}) = ${lam} should be < λ(2,${n2 - 1}) = ${prev}`);
    prev = lam;
  }
});

test('wavelengthToColor(656) is red (R > G and R > B)', () => {
  const hex = SpectraModel.wavelengthToColor(656);
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  assert.ok(r > g, `R=${r} should be > G=${g} for red 656 nm`);
  assert.ok(r > b, `R=${r} should be > B=${b} for red 656 nm`);
});

test('wavelengthToColor(486) is blue-green (B > R)', () => {
  const hex = SpectraModel.wavelengthToColor(486); // Hβ ≈ 486 nm (cyan-blue)
  const r = parseInt(hex.slice(1, 3), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  assert.ok(b > r, `B=${b} should be > R=${r} for ~486 nm`);
});

test('wavelengthToColor outside visible returns grey', () => {
  assert.equal(SpectraModel.wavelengthToColor(200), '#888888');
  assert.equal(SpectraModel.wavelengthToColor(800), '#888888');
});

test('seriesData returns correct structure for Balmer', () => {
  const m = new SpectraModel({ isotope: 'H' });
  const s = m.seriesData('balmer');
  assert.equal(s.n1, 2);
  assert.equal(s.lines.length, 9);
  assert.ok(s.lines[0].visible, 'Balmer-α should be visible (656 nm)');
});

test('photonEnergy at 656 nm ≈ 1.89 eV (Balmer-α)', () => {
  const eV = SpectraModel.photonEnergy(656.46);
  assert.ok(Math.abs(eV - 1.89) < 0.01, `Expected ≈ 1.89 eV, got ${eV.toFixed(4)} eV`);
});
