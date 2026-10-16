/**
 * AgeStructureBench — Leslie matrix age-structured population explorer.
 */
import { Bench } from '../../../../core/Bench.js';
import { LeslieModel } from './LeslieModel.js';
import { AgeStructureView } from './AgeStructureView.js';
import { Slider } from '../../../../ui/Slider.js';
import { ReadoutPanel } from '../../../../ui/ReadoutPanel.js';

export class AgeStructureBench extends Bench {
  static meta = {
    id: 'age-structure',
    title: 'Age-structured population (Leslie)',
    navLabel: 'Age structure',
    canvasLabel: 'Population trajectories (log N) and stable age distribution',
    level: 'university',
    keywords: [
      'Leslie matrix', 'age structure', 'Perron-Frobenius', 'eigenvalue',
      'stable age distribution', 'net reproductive rate', 'Euler-Lotka',
      'population ecology', 'demography',
    ],
    related: ['biology/ecology/logistic'],
  };

  static info = {
    formula:
      'n(t+1) = L·n(t)\n' +
      'λ = dominant eigenvalue  (primitive L only)\n' +
      'R₀ = Σᵢ lᵢ·fᵢ    r = ln(λ)',
    predict: [
      'Increase f₂ from 5 to 10. Does λ increase? How does R₀ change?',
      'Set s₀=0.25 (stationary value). What is λ? What does R₀ equal?',
      'The 2-age matrix [[0,4],[0.5,0]] is imprimitive. What does the population do over time?',
    ],
    breaks: [
      'Deterministic only: no demographic stochasticity.',
      'Time-invariant fecundities and survivals; no environmental variation.',
      'Age structure only: stage-structured models use Lefkovitch matrices.',
      'No spatial structure; assumes closed population.',
    ],
    derive: [
      { text: 'n(t+1) = L·n(t). Long-run: n(t) ≈ c·λᵗ·w (Perron-Frobenius, primitive L).' },
      { text: 'Char poly (3-age): det(L−λI) = −λ³ + f₁s₀λ + f₂s₀s₁ = 0.' },
      { text: 'Divide by λ³: Euler-Lotka equation Σ lᵢfᵢ/λ^i = 1.' },
      { text: 'At λ=1: s₀(f₁+s₁f₂)=1 → s₀=1/(f₁+s₁f₂) (stationary formula).' },
    ],
    research: {
      questions: [
        'Why does R₀>1 imply λ>1 for a primitive Leslie matrix?',
        'How does the stable age distribution change as fecundity is concentrated in older age classes?',
      ],
      challenge: 'Derive the Euler-Lotka equation from the characteristic polynomial of the 3-age Leslie matrix.',
      papers: [
        {
          authors: 'Leslie, P.H.',
          year: 1945,
          title: 'On the use of matrices in certain population mathematics',
          url: 'https://doi.org/10.1093/biomet/33.3.183',
        },
        {
          authors: 'Caswell, H.',
          year: 2001,
          title: 'Matrix Population Models, 2nd ed.',
          url: null,
        },
      ],
    },
    notePlaceholder: 'Why does R₀>1 guarantee eventual population growth even if the initial age distribution is non-stable?',
  };

  build() {
    this._f1 = 1;
    this._f2 = 5;
    this._s0 = 0.4;
    this._s1 = 0.6;
    this._T  = 100;

    this._updateModel();
    this._view = new AgeStructureView(this.view);

    this.layout.setStageNote(
      'n(t+1) = L·n(t)   R₀ = l₁f₁ + l₂f₂   r = ln(λ)',
    );

    this._f2Slider = new Slider({
      id: this.controlId('f2'),
      label: 'Fecundity f₂',
      min: 0, max: 15, step: 0.5,
      value: this._f2,
      format: v => v.toFixed(1),
      onInput: (v) => { this._f2 = v; this._updateModel(); },
    });
    this.layout.addControl(this._f2Slider);

    this._s0Slider = new Slider({
      id: this.controlId('s0'),
      label: 'Survival s₀',
      min: 0.05, max: 1, step: 0.05,
      value: this._s0,
      format: v => v.toFixed(2),
      onInput: (v) => { this._s0 = v; this._updateModel(); },
    });
    this.layout.addControl(this._s0Slider);

    this._readouts = new ReadoutPanel([
      { key: 'lambda',  label: 'λ' },
      { key: 'r',       label: 'r' },
      { key: 'R0',      label: 'R₀' },
      { key: 'prim',    label: 'Primitive' },
    ]);
    this.layout.setReadouts(this._readouts);
  }

  _updateModel() {
    this.model = new LeslieModel({
      fecundities: [0, this._f1, this._f2],
      survivals:   [this._s0, this._s1],
    });
    this._n0      = [1, 0, 0];
    this._history = this.model.simulate(this._n0, this._T);
    this._eigen   = this.model.dominantEigen();
  }

  update(_dt) {}

  draw() {
    this._view.draw(this.model, this._history, this._eigen);
    const { lambda } = this._eigen;
    const r  = this.model.intrinsicRate();
    const R0 = this.model.netReproductiveRate();
    this._readouts.set('lambda', lambda.toFixed(5));
    this._readouts.set('r',      r !== null ? r.toFixed(5) : 'N/A');
    this._readouts.set('R0',     R0.toFixed(4));
    this._readouts.set('prim',   String(this.model.isPrimitive()));
  }
}
