/**
 * Tests for OrbitModel.js
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { OrbitModel, GM_SUN, GM_EARTH, AU, R_EARTH } from '../../js/benches/physics/mechanics/orbits/OrbitModel.js';

const DAYS = 86400; // s per day

// ── Kepler's third law ────────────────────────────────────────────────────────

test('orbits: T_Earth = 365.257 days ±0.02', () => {
  const m = new OrbitModel({ a: AU, e: 0, GM: GM_SUN });
  const T_days = m.period / DAYS;
  assert.ok(Math.abs(T_days - 365.2569) < 0.02,
    `T_Earth = ${T_days.toFixed(4)} days, expected 365.2569`);
});

test('orbits: vis-viva circular orbit v_circ = 29.7847 km/s', () => {
  // v_circ = √(GM/r) = √(GM_SUN/AU)
  const v = Math.sqrt(GM_SUN / AU);
  assert.ok(Math.abs(v / 1000 - 29.7847) < 0.001,
    `v_circ = ${(v / 1000).toFixed(4)} km/s, expected 29.7847`);
});

test('orbits: Earth escape speed 11.186 km/s ±0.01', () => {
  // v_esc = √(2·GM_E/r_E)
  const v_esc = Math.sqrt(2 * GM_EARTH / R_EARTH);
  assert.ok(Math.abs(v_esc / 1000 - 11.186) < 0.01,
    `v_esc = ${(v_esc / 1000).toFixed(4)} km/s, expected 11.186`);
});

test('orbits: period independent of eccentricity (Kepler III)', () => {
  // T depends only on a; test e=0, 0.5, 0.9 give same T
  const a = AU;
  const T0 = new OrbitModel({ a, e: 0 }).period;
  const T5 = new OrbitModel({ a, e: 0.5 }).period;
  const T9 = new OrbitModel({ a, e: 0.9 }).period;
  assert.ok(Math.abs(T0 - T5) / T0 < 1e-10, `T(e=0.5)/T(e=0) error = ${Math.abs(T0 - T5) / T0}`);
  assert.ok(Math.abs(T0 - T9) / T0 < 1e-10, `T(e=0.9)/T(e=0) error = ${Math.abs(T0 - T9) / T0}`);
});

test('orbits: perihelion speed formula at e=0.9, a=1 AU (vis-viva)', () => {
  // v_p = √(GM·(1+e)/(a(1-e))) = √(GM·1.9/(0.1·AU))
  const m = new OrbitModel({ a: AU, e: 0.9 });
  const expected = Math.sqrt(GM_SUN * 1.9 / (0.1 * AU));
  assert.ok(Math.abs(m.vPerihelion / 1000 - expected / 1000) < 0.001,
    `v_p = ${(m.vPerihelion / 1000).toFixed(3)} km/s, expected ${(expected / 1000).toFixed(3)}`);
});

// ── Symplectic vs secular ─────────────────────────────────────────────────────

test('orbits: verlet energy bounded (ratio over 10x time ≤ 3.2)', () => {
  // At dt=T/500 (coarser step), Verlet energy error saturates at a fixed
  // truncation-error level → ratio ≈ 1 (bounded).  Symplectic integrators
  // do not accumulate secular phase-space volume error.
  // Use smaller orbit (0.1 AU) to keep runtime reasonable.
  const mFast = new OrbitModel({ a: 0.1 * AU, e: 0.5, integrator: 'verlet' });
  mFast._dt = mFast.period / 500;
  const { energyErrors: errs } = mFast.integrateOrbits(100);
  const err100 = errs[99];
  // Run more orbits to test ratio
  const { energyErrors: errs1000 } = mFast.integrateOrbits(1000);
  const err1000 = errs1000[999];
  const ratio = err1000 / err100;
  assert.ok(ratio <= 3.2,
    `Verlet energy ratio (1000/100 orbits) = ${ratio.toFixed(2)}, expected ≤ 3.2 (bounded)`);
});

test('orbits: rk4 energy grows secularly (ratio over 10x time ≥ 5)', () => {
  // RK4 has secular drift: |ΔE/E| grows roughly linearly → ratio ≈ 10.
  // At dt=T/500, RK4 drift is large enough to measure clearly.
  const mFast = new OrbitModel({ a: 0.1 * AU, e: 0.5, integrator: 'rk4' });
  mFast._dt = mFast.period / 500;
  const { energyErrors: errs100 } = mFast.integrateOrbits(100);
  const err100 = errs100[99];
  const { energyErrors: errs1000 } = mFast.integrateOrbits(1000);
  const err1000 = errs1000[999];
  const ratio = err1000 / err100;
  assert.ok(ratio >= 5,
    `RK4 energy ratio (1000/100 orbits) = ${ratio.toFixed(2)}, expected ≥ 5 (secular drift)`);
});

test('orbits: kepler II equal areas (angular momentum conservation, Verlet)', () => {
  // L = x·vy − y·vx should be constant
  const m = new OrbitModel({ a: AU, e: 0.5, integrator: 'verlet' });
  m._dt = m.period / 1000;
  const { angMomErrors } = m.integrateOrbits(1);
  assert.ok(angMomErrors[0] < 1e-6,
    `Angular momentum relative error = ${angMomErrors[0]}, expected < 1e-6`);
});

// ── Domain guard (e≥1) ────────────────────────────────────────────────────────

test('orbits: e≥1 throws RangeError (parabolic/hyperbolic orbits not supported)', () => {
  // e=1 (parabolic) and e>1 (hyperbolic) are unbound; the model is for Keplerian ellipses only.
  assert.throws(() => new OrbitModel({ a: AU, e: 1 }), { name: 'RangeError' },
    'e=1 (parabolic) should throw RangeError');
  assert.throws(() => new OrbitModel({ a: AU, e: 1.5 }), { name: 'RangeError' },
    'e=1.5 (hyperbolic) should throw RangeError');
  assert.throws(() => new OrbitModel({ a: AU, e: -0.1 }), { name: 'RangeError' },
    'e<0 (non-physical) should throw RangeError');
  // e=0 and e=0.999 should not throw
  assert.doesNotThrow(() => new OrbitModel({ a: AU, e: 0 }), 'e=0 (circular) should be valid');
  assert.doesNotThrow(() => new OrbitModel({ a: AU, e: 0.999 }), 'e=0.999 should be valid');
});

// ── RK4 secular drift at dt=T/100 ────────────────────────────────────────────

test('orbits: rk4 secular drift ratio ≥ 5 at dt=T/100 (same as T/500 test, coarser step)', () => {
  // Same structure as the existing T/500 test. Coarser step makes secular drift faster.
  const m = new OrbitModel({ a: 0.1 * AU, e: 0.5, integrator: 'rk4' });
  m._dt = m.period / 100;
  const { energyErrors: errs100 } = m.integrateOrbits(100);
  const { energyErrors: errs1000 } = m.integrateOrbits(1000);
  const ratio = errs1000[999] / errs100[99];
  assert.ok(ratio >= 5,
    `RK4 at T/100: energy ratio (1000/100 orbits) = ${ratio.toFixed(2)}, expected ≥ 5 (secular drift)`);
});

test('orbits: rk4 absolute energy error exceeds verlet at dt=T/100 after 1000 orbits', () => {
  // At dt=T/100 (5× coarser than the existing T/500 tests):
  // - Verlet bounded error scales as (dt/T)² → 25× larger than at T/500.
  // - RK4 secular error rate scales as (dt/T)^4 per orbit → 625× larger per orbit.
  // After 1000 orbits: RK4 accumulated secular drift >> Verlet bounded truncation.
  const mV = new OrbitModel({ a: 0.1 * AU, e: 0.7, integrator: 'verlet' });
  const mR = new OrbitModel({ a: 0.1 * AU, e: 0.7, integrator: 'rk4' });
  mV._dt = mV.period / 100;
  mR._dt = mR.period / 100;
  const { energyErrors: eV } = mV.integrateOrbits(1000);
  const { energyErrors: eR } = mR.integrateOrbits(1000);
  assert.ok(eR[999] > eV[999],
    `At dt=T/100 after 1000 orbits: RK4 err=${eR[999].toExponential(2)} > Verlet err=${eV[999].toExponential(2)}`);
});

test('orbits: constants GM_SUN, GM_EARTH, R_EARTH — names and values from OrbitModel.js', () => {
  // OrbitModel.js exports GM_SUN=1.32712440018e20 m³/s², GM_EARTH=3.986004418e14 m³/s², R_EARTH=6.371e6 m.
  // Independent checks: v_circ_Earth = √(GM_SUN/AU) ≈ 29.785 km/s; g = GM_E/R_E² ≈ 9.82 m/s².
  assert.ok(Math.abs(GM_SUN  - 1.32712440018e20) < 1e10,
    `GM_SUN = ${GM_SUN.toExponential(6)}, expected 1.32712440018e20 m³/s²`);
  assert.ok(Math.abs(GM_EARTH - 3.986004418e14) < 1e5,
    `GM_EARTH = ${GM_EARTH.toExponential(6)}, expected 3.986004418e14 m³/s²`);
  assert.ok(Math.abs(R_EARTH - 6.371e6) < 1e3,
    `R_EARTH = ${R_EARTH}, expected 6.371e6 m`);
  // Derived check: surface gravity g = GM_E/R_E² ≈ 9.82 m/s²
  const g = GM_EARTH / R_EARTH ** 2;
  assert.ok(g > 9.75 && g < 9.90,
    `g = GM_E/R_E² = ${g.toFixed(3)} m/s², expected ≈9.82 m/s²`);
});

test('orbits: e=0.5 dt=T/100 — RK4 error < Verlet at orbit 1, > Verlet by orbit 500 (crossover between 200–500)', () => {
  // RK4 starts more accurate (O(dt^4)≈2.95e-5 at orbit 1) than Verlet (O(dt^2)≈1.50e-3) but
  // accumulates secular drift. Verlet energy error is bounded (≈1.06e-2 over 1000 orbits).
  // RK4 secular drift: 2.95e-5 at orbit 1, 1.48e-2 at orbit 500 — crossover between orbit 200–500.
  // Values computed at a=0.1AU, e=0.5, dt=T/100.
  const mV = new OrbitModel({ a: 0.1 * AU, e: 0.5, integrator: 'verlet' });
  const mR = new OrbitModel({ a: 0.1 * AU, e: 0.5, integrator: 'rk4' });
  mV._dt = mV.period / 100;
  mR._dt = mR.period / 100;
  const { energyErrors: eV1 } = mV.integrateOrbits(1);
  const { energyErrors: eR1 } = mR.integrateOrbits(1);
  // Orbit 1: RK4 more accurate (higher-order method, negligible drift yet)
  assert.ok(eR1[0] < eV1[0],
    `Orbit 1: RK4 err=${eR1[0].toExponential(3)} should be < Verlet err=${eV1[0].toExponential(3)}`);
  const { energyErrors: eV500 } = mV.integrateOrbits(500);
  const { energyErrors: eR500 } = mR.integrateOrbits(500);
  // Orbit 500: RK4 secular drift has overtaken Verlet's bounded truncation error
  assert.ok(eR500[499] > eV500[499],
    `Orbit 500: RK4 err=${eR500[499].toExponential(3)} should exceed Verlet err=${eV500[499].toExponential(3)} (crossover before orbit 500)`);
});

test('orbits: e=0.99 (near-parabolic) has finite period and large perihelion speed', () => {
  // e=0.99 is still a bound orbit (e<1); period = 2π√(a³/GM), independent of e
  const m = new OrbitModel({ a: AU, e: 0.99 });
  assert.ok(m.period > 0 && isFinite(m.period), `period should be finite for e=0.99, got ${m.period}`);
  // Perihelion speed >> circular: v_p = √(GM·(1+e)/(a(1−e))) = √(GM·1.99/(0.01·AU))
  const expected = Math.sqrt(GM_SUN * 1.99 / (0.01 * AU));
  assert.ok(Math.abs(m.vPerihelion - expected) < 1, `v_p = ${m.vPerihelion}, expected ${expected}`);
  // Verify period matches Kepler III (same as circular orbit with same a)
  const mCirc = new OrbitModel({ a: AU, e: 0 });
  assert.ok(Math.abs(m.period - mCirc.period) / mCirc.period < 1e-10,
    'Period at e=0.99 should equal period at e=0 (same a)');
});
