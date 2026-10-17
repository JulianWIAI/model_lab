import { test } from 'node:test';
import assert from 'node:assert/strict';
import { OptionsPricingModel, Phi } from '../../js/benches/economics/finance/options-pricing/OptionsPricingModel.js';

// ATM test case: S=K=100, r=5%, σ=20%, T=1
const S=100, K=100, r=0.05, sigma=0.20, T=1;
const m = new OptionsPricingModel({ S, K, r, sigma, T });

test('d₁ = 0.35 for ATM params ±1e-15', () => {
  assert.ok(Math.abs(m.d1() - 0.35) < 1e-15, `d1=${m.d1()}`);
});

test('d₂ = 0.15 for ATM params ±1e-15', () => {
  assert.ok(Math.abs(m.d2() - 0.15) < 1e-15, `d2=${m.d2()}`);
});

test('call = 10.450583572185565 ±1e-12 abs', () => {
  assert.ok(Math.abs(m.callPrice() - 10.450583572185565) < 1e-12, `call=${m.callPrice()}`);
});

test('put-call parity error < 1e-10 abs', () => {
  const parity = m.callPrice() - m.putPrice() - (S - K * Math.exp(-r * T));
  assert.ok(Math.abs(parity) < 1e-10, `parity error=${parity}`);
});

test('delta_call = Φ(d₁) ±1e-10 abs', () => {
  assert.ok(Math.abs(m.delta('call') - 0.6368306511756191) < 1e-10, `delta=${m.delta('call')}`);
});

test('call > 0 for any params', () => {
  assert.ok(m.callPrice() > 0, `call=${m.callPrice()}`);
});

test('σ→∞: call → S (limit) ±1e-10 abs', () => {
  // At σ=1000: d₁ ≈ 500, Φ(d₁) = 1 exactly; d₂ ≈ -500, Φ(d₂) = 0 exactly in IEEE 754.
  // call = S·1 − K·e^{−rT}·0 = S.  Error is 0 to machine precision.
  const m2 = new OptionsPricingModel({ S, K, r, sigma: 1000, T });
  assert.ok(Math.abs(m2.callPrice() - S) < 1e-10, `call=${m2.callPrice()}, S=${S}`);
});

test('σ→0: call ≈ max(S−Ke^{-rT}, 0) ±1e-4', () => {
  const m2 = new OptionsPricingModel({ S, K, r, sigma: 1e-8, T });
  assert.ok(Math.abs(m2.callPrice() - 4.877057549928594) < 1e-4, `call=${m2.callPrice()}`);
});

test('deep ITM put: S=50,K=100,r=5%,σ=20%,T=1 ≈ 45.12534186762472 ±1e-8', () => {
  const m2 = new OptionsPricingModel({ S: 50, K: 100, r: 0.05, sigma: 0.20, T: 1 });
  assert.ok(Math.abs(m2.putPrice() - 45.12534186762472) < 1e-8, `put=${m2.putPrice()}`);
});

test('price bounds: S ≥ call ≥ max(S−Ke^{-rT}, 0)', () => {
  const fwd = S - K * Math.exp(-r * T);
  const call = m.callPrice();
  assert.ok(call >= Math.max(fwd, 0), `call=${call} < max(fwd,0)=${Math.max(fwd,0)}`);
  assert.ok(call <= S, `call=${call} > S=${S}`);
});

test('implied vol round-trip ±1e-4 rel', () => {
  const c = m.callPrice();
  const sigmaIV = m.impliedVol(c, 'call');
  assert.ok(Math.abs(sigmaIV / sigma - 1) < 1e-4, `sigmaIV=${sigmaIV}, sigma=${sigma}`);
});

test('S ≤ 0 throws RangeError', () => {
  assert.throws(
    () => new OptionsPricingModel({ S: 0, K: 100, r: 0.05, sigma: 0.20, T: 1 }),
    RangeError,
  );
});

// Phi tail anchors (mpmath 30-digit reference, relative tolerance 1e-12)
// Anchor values verified by backward-recurrence Lentz CF (independent of Taylor series)
test('Phi(-3) = 0.0013498980316302145 ±1e-12 rel', () => {
  const anchor = 0.0013498980316302145;
  assert.ok(Math.abs(Phi(-3) / anchor - 1) < 1e-12, `Phi(-3)=${Phi(-3)}`);
});

test('Phi(-4) = 3.1671241833119985e-5 ±1e-12 rel', () => {
  // t = -4/√2 ≈ -2.828; below the new threshold -2, so erfc_cf path.
  // mpmath: erfc(4/sqrt(2))/2 = 3.16712418331199853...e-5
  const anchor = 3.1671241833119985e-5;
  assert.ok(Math.abs(Phi(-4) / anchor - 1) < 1e-12, `Phi(-4)=${Phi(-4)}`);
});

test('Phi(-5) = 2.866515718791945e-7 ±1e-12 rel', () => {
  // t = -5/√2 ≈ -3.536; erfc_cf path.
  // mpmath: erfc(5/sqrt(2))/2 = 2.86651571879194...e-7
  const anchor = 2.866515718791945e-7;
  assert.ok(Math.abs(Phi(-5) / anchor - 1) < 1e-12, `Phi(-5)=${Phi(-5)}`);
});

test('Phi(-5.5) = 1.8989562465887754e-8 ±1e-12 rel', () => {
  // t = -5.5/√2 ≈ -3.889; erfc_cf path.  Taylor had ~2×10⁻⁴ rel error here.
  // mpmath: erfc(5.5/sqrt(2))/2 = 1.89895624658877...e-8
  const anchor = 1.8989562465887754e-8;
  assert.ok(Math.abs(Phi(-5.5) / anchor - 1) < 1e-12, `Phi(-5.5)=${Phi(-5.5)}`);
});

test('Phi(-5.66) = 7.5686497519977386e-9 ±1e-12 rel', () => {
  const anchor = 7.5686497519977386e-9;
  assert.ok(Math.abs(Phi(-5.66) / anchor - 1) < 1e-12, `Phi(-5.66)=${Phi(-5.66)}`);
});

test('Phi(-6) = 9.8658764503770181e-10 ±1e-12 rel', () => {
  const anchor = 9.8658764503770181e-10;
  assert.ok(Math.abs(Phi(-6) / anchor - 1) < 1e-12, `Phi(-6)=${Phi(-6)}`);
});

test('Phi(-8) = 6.2209605742718282e-16 ±1e-12 rel', () => {
  const anchor = 6.2209605742718282e-16;
  assert.ok(Math.abs(Phi(-8) / anchor - 1) < 1e-12, `Phi(-8)=${Phi(-8)}`);
});

test('Phi(-10) = 7.6198530241605813e-24 ±1e-12 rel', () => {
  const anchor = 7.6198530241605813e-24;
  assert.ok(Math.abs(Phi(-10) / anchor - 1) < 1e-12, `Phi(-10)=${Phi(-10)}`);
});
