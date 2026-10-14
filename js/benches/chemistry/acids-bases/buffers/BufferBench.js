/**
 * BufferBench — interactive buffer capacity explorer.
 */
import { Bench } from '../../../../core/Bench.js';
import { BufferModel, PRESETS } from './BufferModel.js';
import { BufferView } from './BufferView.js';
import { ButtonGroup } from '../../../../ui/ButtonGroup.js';
import { Slider } from '../../../../ui/Slider.js';
import { ReadoutPanel } from '../../../../ui/ReadoutPanel.js';

export class BufferBench extends Bench {
  static meta = {
    id: 'buffers',
    title: 'Buffer capacity',
    navLabel: 'Buffer capacity',
    canvasLabel: 'Buffer capacity β(pH) and species fractions for polyprotic acids',
    level: 'university',
    keywords: [
      'buffer', 'buffer capacity', 'Henderson-Hasselbalch', 'pKa',
      'species fractions', 'speciation', 'polyprotic', 'acetic acid',
      'phosphoric acid', 'carbonic acid', 'citric acid', 'ammonium',
      'acid-base', 'pH', 'Var', 'beta',
    ],
    related: ['chemistry/titration', 'biology/enzyme-kinetics'],
  };

  static info = {
    formula:
      'α_k = h^(n−k)·Π Ka_j / D    (exact species fractions)\n' +
      'D = Σ h^(n−k)·Π Ka_j\n' +
      'β = 2.303·(h + Kw/h + C·Var)\n' +
      'Var = Σ α_k·k² − (Σ α_k·k)²   (charge variance)',
    predict: [
      'At what pH does acetic acid buffer best? Why at that point and not elsewhere?',
      'Phosphoric acid has three pKa values. How many β peaks appear, and where?',
      'What happens to β as the total concentration C increases? Why?',
    ],
    breaks: [
      'Activity coefficients are ignored (dilute solution assumption, I → 0).',
      'pKa values are for 25 °C, 1 atm. They shift with temperature and ionic strength.',
      'The model treats carbonic acid as a simple diprotic system; CO₂(aq) + H₂O ⇌ H₂CO₃ hydration kinetics are not modelled.',
    ],
    derive: [
      { text: 'Write the n equilibrium constants Ka₁…Kaₙ for successive deprotonation.' },
      { text: 'Mass balance: C = Σ_k [HA_k]. Divide each term by D to get fraction α_k.' },
      { text: 'Buffer capacity β = −d[B]/d(pH) at constant volume = 2.303·(h + Kw/h + C·Var).', formula: 'Var = ⟨k²⟩ − ⟨k⟩²' },
      { text: 'β peaks wherever the charge variance is maximised — always at a pKa for a monoprotic acid.' },
    ],
    research: {
      questions: [
        'Can two overlapping pKas increase β over a wider pH range than a single one?',
        'The bicarbonate buffer in blood operates near pKa2=10.3, far from blood pH 7.4. Why is it still effective?',
      ],
      challenge: 'Verify numerically that the variance formula and the derivative −d[B]/d(pH) give identical β curves.',
      papers: [
        { authors: 'D. A. Skoog, D. M. West, F. J. Holler, S. R. Crouch', year: 2014, title: 'Fundamentals of Analytical Chemistry, 9th ed. §16' },
        { authors: 'H. S. Harned & R. Davis', year: 1943, title: 'The Ionization Constant of Carbonic Acid in Water', url: 'https://doi.org/10.1021/ja01190a023' },
        { authors: 'A. E. Martell & R. M. Smith', year: 1976, title: 'Critical Stability Constants, Vol. 4' },
      ],
    },
    notePlaceholder: 'How wide is the useful buffering range (β > β_max/2) for each acid?',
  };

  build() {
    this.model = new BufferModel({ presetIndex: 0, C: 0.1 });
    this.bufferView = new BufferView(this.view);

    this.layout.addControl(new ButtonGroup({
      id: this.controlId('preset'),
      label: 'Acid',
      options: PRESETS.map((p, i) => ({ label: p.name, value: i })),
      value: 0,
      onChange: (v) => {
        this.model.presetIndex = v;
        this.layout.setStageNote(PRESETS[v].note ? `⚠ ${PRESETS[v].note}` : '');
      },
    }));

    this.layout.addControl(new Slider({
      id: this.controlId('C'),
      label: 'Concentration C (mol/L)',
      min: -3,
      max: 0,
      step: 0.01,
      value: -1, // 0.1 mol/L
      format: (v) => `${Math.pow(10, v).toFixed(3)} mol/L`,
      onInput: (v) => { this.model.C = Math.pow(10, v); },
    }));

    this.layout.addControl(new Slider({
      id: this.controlId('pH'),
      label: 'Cursor pH',
      min: 0,
      max: 14,
      step: 0.01,
      value: 7,
      format: (v) => v.toFixed(2),
      onInput: (v) => { this.model.pH = v; },
    }));

    this.readouts = new ReadoutPanel([
      { key: 'acid',    label: 'Acid' },
      { key: 'pH',      label: 'pH (cursor)' },
      { key: 'beta',    label: 'β (mol/L/pH)' },
      { key: 'dom',     label: 'Dominant species' },
      { key: 'pKas',    label: 'pKa values' },
    ]);
    this.layout.setReadouts(this.readouts);
  }

  update(_dt) {}

  draw() {
    this.bufferView.draw(this.model);

    const pH = this.model.pH;
    const alpha = this.model.fractions(pH);
    const maxIdx = Array.from(alpha).reduce((mi, v, i, a) => (v > a[mi] ? i : mi), 0);
    const domLabel = `α${_sub(maxIdx)} (${(alpha[maxIdx] * 100).toFixed(1)} %)`;

    this.readouts.set('acid',  this.model.preset.name);
    this.readouts.set('pH',    pH.toFixed(2));
    this.readouts.set('beta',  this.model.bufferCapacity(pH).toFixed(5));
    this.readouts.set('dom',   domLabel);
    const pKaStr = this.model.preset.pKas.join(', ') + (this.model.preset.note ? '  ⚠ unverified' : '');
    this.readouts.set('pKas',  pKaStr);
  }
}

function _sub(n) {
  return String(n).split('').map((d) => '₀₁₂₃₄₅₆₇₈₉'[+d]).join('');
}
