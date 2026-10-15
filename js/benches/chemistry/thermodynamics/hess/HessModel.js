/**
 * HessModel — Hess's law: enthalpy from standard formation enthalpies.
 *
 * ΔH°_rxn = Σ n_i·ΔHf°(products_i) − Σ m_j·ΔHf°(reactants_j)
 *
 * Reference:
 *   Hess, G.H. (1840). Thermochemische Untersuchungen. Ann. Phys. 50, 385–404.
 *   doi:10.1002/andp.18401260402
 *
 * Formation enthalpies:
 *   NIST WebBook fetch attempted (2026-10-15) for CH₄ (C74828), CO₂ (C124389),
 *   H₂O (C7732185), C₂H₅OH (C64175) — pages returned link stubs only, no
 *   numerical data extractable. Fetch failed to return ΔfH° values.
 *   Using CODATA/JANAF values (not fetched from primary source).
 */

export const REACTIONS = Object.freeze([
  {
    name: 'Methane combustion',
    equation: 'CH₄(g) + 2O₂(g) → CO₂(g) + 2H₂O(l)',
    reactants: [
      { formula: 'CH₄(g)',  Hf: -74.87, n: 1 },
      { formula: 'O₂(g)',   Hf:   0.00, n: 2 },
    ],
    products: [
      { formula: 'CO₂(g)',  Hf: -393.51, n: 1 },
      { formula: 'H₂O(l)', Hf: -285.83, n: 2 },
    ],
    // Source: CODATA/JANAF values — NIST fetch failed 2026-10-15
    // CH₄(g): −74.87 kJ/mol; CO₂(g): −393.51 kJ/mol; H₂O(l): −285.83 kJ/mol
  },
  {
    name: 'Ethanol combustion',
    equation: 'C₂H₅OH(l) + 3O₂(g) → 2CO₂(g) + 3H₂O(l)',
    reactants: [
      { formula: 'C₂H₅OH(l)', Hf: -277.69, n: 1 },
      { formula: 'O₂(g)',      Hf:    0.00, n: 3 },
    ],
    products: [
      { formula: 'CO₂(g)',  Hf: -393.51, n: 2 },
      { formula: 'H₂O(l)', Hf: -285.83, n: 3 },
    ],
    // Source: CODATA/JANAF values — NIST fetch failed 2026-10-15
    // C₂H₅OH(l): −277.69 kJ/mol
  },
]);

export class HessModel {
  constructor(reactionIndex = 0) {
    this.reactionIndex = reactionIndex;
  }

  get reaction() { return REACTIONS[this.reactionIndex]; }

  deltaH() {
    const rxn = this.reaction;
    const sumProd = rxn.products.reduce((s, p)  => s + p.n * p.Hf, 0);
    const sumReac = rxn.reactants.reduce((s, r) => s + r.n * r.Hf, 0);
    return sumProd - sumReac;  // kJ/mol
  }

  enthalpyLevels() {
    const rxn = this.reaction;
    const Hreac = rxn.reactants.reduce((s, r) => s + r.n * r.Hf, 0);
    const Hprod = rxn.products.reduce((s, p)  => s + p.n * p.Hf, 0);
    return [
      { label: 'Elements (ΔHf° = 0)', H: 0,     isProduct: false },
      { label: 'Reactants',           H: Hreac, isProduct: false },
      { label: 'Products',            H: Hprod, isProduct: true  },
    ];
  }
}
