/**
 * Tests for HadronBuilder.
 * Key results: uud → proton (charge +1), ud̄ → π⁺ (charge +1).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HadronBuilder } from '../../js/benches/physics/particle-physics/quarks/HadronBuilder.js';

test('uud is identified as the proton with charge +1', () => {
  const b = new HadronBuilder();
  b.add('u'); b.add('u'); b.add('d');
  assert.ok(b.complete);
  assert.ok(Math.abs(b.charge - 1) < 1e-10, `charge = ${b.charge}, expected +1`);
  const particle = b.identify();
  assert.ok(particle !== null, 'uud should be a known hadron');
  assert.ok(particle.name.includes('Proton'), `name = "${particle.name}", expected Proton`);
});

test('ud̄ is identified as π⁺ with charge +1', () => {
  const b = new HadronBuilder();
  b.setMode('meson');
  b.add('u'); b.add('d̄');
  assert.ok(b.complete);
  assert.ok(Math.abs(b.charge - 1) < 1e-10, `charge = ${b.charge}, expected +1`);
  const particle = b.identify();
  assert.ok(particle !== null, 'ud̄ should be a known hadron');
  assert.ok(particle.name.includes('π⁺'), `name = "${particle.name}", expected π⁺`);
});

test('udd is the neutron with charge 0', () => {
  const b = new HadronBuilder();
  b.add('u'); b.add('d'); b.add('d');
  assert.ok(Math.abs(b.charge) < 1e-10, `charge = ${b.charge}, expected 0`);
  assert.ok(b.identify()?.name.includes('Neutron'));
});

test('us̄ is K⁺ (kaon) with charge +1', () => {
  const b = new HadronBuilder();
  b.setMode('meson');
  b.add('u'); b.add('s̄');
  assert.ok(Math.abs(b.charge - 1) < 1e-10);
  assert.ok(b.identify()?.name.includes('K⁺'));
});

test('canAdd rejects a second quark of the same anti-ness in meson mode', () => {
  const b = new HadronBuilder();
  b.setMode('meson');
  b.add('u');
  assert.ok(!b.canAdd('d'), 'should not allow a second quark in meson mode (need an antiquark next)');
  assert.ok(b.canAdd('d̄'), 'should allow an antiquark in meson mode');
});

test('canAdd rejects antiquarks in baryon mode', () => {
  const b = new HadronBuilder();
  assert.ok(!b.canAdd('ū'), 'antiquarks not allowed in baryon mode');
  assert.ok(b.canAdd('u'), 'quarks allowed in baryon mode');
});
