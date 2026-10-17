import { test } from 'node:test';
import assert from 'node:assert/strict';
import { OptionsPricingModel } from '../../js/benches/economics/finance/options-pricing/OptionsPricingModel.js';

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

test('σ→∞: call → S (limit)', () => {
  const m2 = new OptionsPricingModel({ S, K, r, sigma: 1000, T });
  assert.ok(Math.abs(m2.callPrice() - S) < 1, `call=${m2.callPrice()}, S=${S}`);
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
