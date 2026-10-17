/**
 * Tests for PopulationCodingModel — Gaussian tuning, Poisson Fisher info, CRB.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PopulationCodingModel } from '../../js/benches/neuroscience/networks/population-coding/PopulationCodingModel.js';

test('Fisher two-way: direct sum vs fisherInfo() agree +/-1e-10', () => {
  const m = new PopulationCodingModel({ N: 16, sigma: 0.5, rMax: 50, T: 0.1 });
  const theta = 0.3;
  let Isum = 0;
  for (let i = 0; i < m.N; i++) {
    const f = m.tuning(i, theta);
    const fp = m._tuningPrime(i, theta);
    if (f > 1e-15) Isum += m.T * fp * fp / f;
  }
  assert.ok(
    Math.abs(Isum - m.fisherInfo(theta)) < 1e-10,
    `Direct=${Isum}, API=${m.fisherInfo(theta)}`,
  );
});

test('Single neuron at preferred direction: Fisher contribution = 0', () => {
  const m = new PopulationCodingModel({ N: 16, sigma: 0.5 });
  // neuron 0 has preferred direction at -pi + 0 = -pi
  const theta_pref = -Math.PI;
  const fp = m._tuningPrime(0, theta_pref);
  assert.ok(Math.abs(fp) < 1e-10, `f'(preferred) = ${fp}, expected ~0`);
});

test('sigma-scaling: I(0.5)/I(1) = 2.043982952864164 +/-1e-9', () => {
  const m1 = new PopulationCodingModel({ N: 16, sigma: 0.5 });
  const m2 = new PopulationCodingModel({ N: 16, sigma: 1.0 });
  const ratio = m1.fisherInfo(0) / m2.fisherInfo(0);
  // Deterministic ratio: no stochasticity, tighten to ±1e-9
  assert.ok(
    Math.abs(ratio - 2.043982952864164) < 1e-9,
    `Ratio I(0.5)/I(1) = ${ratio}, expected 2.043982952864164`,
  );
});

test('N-scaling: I(16)/I(8) = 2.0108233662082 +/-1e-9 at sigma=1', () => {
  const m16 = new PopulationCodingModel({ N: 16, sigma: 1.0 });
  const m8  = new PopulationCodingModel({ N: 8,  sigma: 1.0 });
  const ratio = m16.fisherInfo(0) / m8.fisherInfo(0);
  assert.ok(
    Math.abs(ratio - 2.0108233662082) < 1e-9,
    `Ratio I(16)/I(8) = ${ratio}, expected 2.0108233662082`,
  );
});

test('sigma_CRB = 1/sqrt(I) to machine precision', () => {
  const m = new PopulationCodingModel({ N: 16, sigma: 0.5 });
  const theta = 0.5;
  const I = m.fisherInfo(theta);
  const crb = m.sigmaCRB(theta);
  assert.ok(
    Math.abs(crb - 1 / Math.sqrt(I)) < 1e-14,
    `CRB=${crb}, 1/sqrt(I)=${1/Math.sqrt(I)}`,
  );
});

test('popvec SD/CRB ~ 1.04 +/-4*SE', () => {
  const nTrials = 1000;
  const m = new PopulationCodingModel({ N: 16, sigma: 0.5, T: 0.1, seed: 42 });
  const theta0 = 0;
  const crb = m.sigmaCRB(theta0);
  let sumSq = 0;
  for (let t = 0; t < nTrials; t++) {
    const spikes = m.drawSpikes(theta0);
    const est = m.popVectorEstimate(spikes);
    // Wrap to [-pi, pi]
    let err = est - theta0;
    while (err > Math.PI) err -= 2 * Math.PI;
    while (err < -Math.PI) err += 2 * Math.PI;
    sumSq += err * err;
  }
  const sd = Math.sqrt(sumSq / nTrials);
  const ratio = sd / crb;
  // SE of ratio estimate ~ ratio / sqrt(2*nTrials)
  const se = ratio / Math.sqrt(2 * nTrials);
  assert.ok(
    Math.abs(ratio - 1.04) < 4 * se,
    `SD/CRB = ${ratio.toFixed(4)}, expected ~1.04, 4*SE=${(4*se).toFixed(4)}`,
  );
});

test('MLE mean ≈ 0 and SD/CRB ~ 1.0 +/-4*SE', () => {
  const nTrials = 1000;
  const m = new PopulationCodingModel({ N: 16, sigma: 0.5, T: 0.1, seed: 99 });
  const theta0 = 0;
  const crb = m.sigmaCRB(theta0);
  const errs = [];
  for (let t = 0; t < nTrials; t++) {
    const spikes = m.drawSpikes(theta0);
    const est = m.mlEstimate(spikes);
    let err = est - theta0;
    while (err > Math.PI) err -= 2 * Math.PI;
    while (err < -Math.PI) err += 2 * Math.PI;
    errs.push(err);
  }
  const mean = errs.reduce((a, b) => a + b, 0) / nTrials;
  const sd = Math.sqrt(errs.reduce((a, b) => a + b*b, 0) / nTrials);
  const ratio = sd / crb;
  // SE of mean ≈ sd/sqrt(nTrials); SE of ratio ≈ ratio/sqrt(2*nTrials)
  const seMean = sd / Math.sqrt(nTrials);
  const seRatio = ratio / Math.sqrt(2 * nTrials);
  assert.ok(
    Math.abs(mean) < 4 * seMean,
    `MLE mean=${mean.toFixed(4)}, 4*seMean=${(4*seMean).toFixed(4)}`,
  );
  assert.ok(
    Math.abs(ratio - 1.0) < 4 * seRatio,
    `MLE SD/CRB = ${ratio.toFixed(4)}, expected ~1.0, 4*SE=${(4*seRatio).toFixed(4)}`,
  );
});

test('RangeError when rMax*T > 100', () => {
  assert.throws(
    () => new PopulationCodingModel({ rMax: 200, T: 1 }),
    RangeError,
  );
});
