/**
 * Reference data for the quark bench.
 * Quark masses: current-quark masses from the Particle Data Group.
 * Hadron masses: measured values in MeV/c².
 */

/** The three lightest quarks and their antiquarks. Charge in units of the proton charge. */
export const QUARKS = {
  u: { charge: 2 / 3, mass: 2.2, anti: false },
  d: { charge: -1 / 3, mass: 4.7, anti: false },
  s: { charge: -1 / 3, mass: 95, anti: false },
  'ū': { charge: -2 / 3, mass: 2.2, anti: true },
  'd̄': { charge: 1 / 3, mass: 4.7, anti: true },
  's̄': { charge: 1 / 3, mass: 95, anti: true },
};

/** Order used to sort baryon keys, so "duu" and "uud" both become "uud". */
export const QUARK_ORDER = ['u', 'd', 's'];

/**
 * Known particles, keyed by their quark content.
 * Baryons: three quarks in QUARK_ORDER. Mesons: quark followed by antiquark.
 */
export const HADRONS = {
  uud: { name: 'Proton p', mass: 938.27, note: 'Same quarks as the Δ⁺ (1232 MeV). Only the way the quark spins line up differs.' },
  udd: { name: 'Neutron n', mass: 939.57, note: '1.3 MeV heavier than the proton, so a free neutron decays into a proton in about 15 minutes.' },
  uuu: { name: 'Delta Δ⁺⁺', mass: 1232, note: 'Three identical quarks in the same state should be forbidden by the Pauli principle. This puzzle is why colour charge was invented.' },
  ddd: { name: 'Delta Δ⁻', mass: 1232, note: 'The mirror of the Δ⁺⁺ with three down quarks.' },
  uds: { name: 'Lambda Λ⁰ (or Sigma Σ⁰)', mass: 1115.68, note: 'Same quarks, two different particles: the u and d spins combine differently.' },
  uus: { name: 'Sigma Σ⁺', mass: 1189.37, note: 'Contains a strange quark, so it lives about 10⁻¹⁰ s before decaying.' },
  dds: { name: 'Sigma Σ⁻', mass: 1197.45, note: 'Contains a strange quark, so it lives about 10⁻¹⁰ s before decaying.' },
  uss: { name: 'Xi Ξ⁰', mass: 1314.86, note: 'Two strange quarks: each one adds roughly 150–200 MeV of mass.' },
  dss: { name: 'Xi Ξ⁻', mass: 1321.71, note: 'Two strange quarks: each one adds roughly 150–200 MeV of mass.' },
  sss: { name: 'Omega Ω⁻', mass: 1672.45, note: 'Predicted by Gell-Mann from the quark pattern in 1962 and found in 1964.' },
  'uū': { name: 'Pion π⁰', mass: 134.98, note: 'Really a quantum mixture of uū and dd̄.' },
  'dd̄': { name: 'Pion π⁰', mass: 134.98, note: 'Really a quantum mixture of uū and dd̄.' },
  'ud̄': { name: 'Pion π⁺', mass: 139.57, note: 'Pions carry the force that holds protons and neutrons together in nuclei.' },
  'dū': { name: 'Pion π⁻', mass: 139.57, note: 'Pions carry the force that holds protons and neutrons together in nuclei.' },
  'us̄': { name: 'Kaon K⁺', mass: 493.68, note: 'Kaons first revealed that nature is not perfectly mirror-symmetric.' },
  'sū': { name: 'Kaon K⁻', mass: 493.68, note: 'The antiparticle of the K⁺.' },
  'ds̄': { name: 'Kaon K⁰', mass: 497.61, note: 'K⁰ and its antiparticle turn into each other over time.' },
  'sd̄': { name: 'Anti-kaon K̄⁰', mass: 497.61, note: 'K⁰ and its antiparticle turn into each other over time.' },
  'ss̄': { name: 'Phi φ', mass: 1019.46, note: 'A strange quark bound to its own antiquark.' },
};
