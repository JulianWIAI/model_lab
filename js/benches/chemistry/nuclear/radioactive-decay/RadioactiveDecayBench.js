/**
 * RadioactiveDecayBench — radioactive decay with continuous and stochastic modes.
 * Controls: isotope preset, mode toggle, N₀, t-axis window.
 * Readouts: t½, λ, A(0), activity per gram.
 * Stochastic: animated walk built step-by-step in update(); Reset button clears it.
 */
import { Bench } from '../../../../core/Bench.js';
import { RadioactiveDecayModel, ISOTOPES } from './RadioactiveDecayModel.js';
import { RadioactiveDecayView } from './RadioactiveDecayView.js';
import { ButtonGroup } from '../../../../ui/ButtonGroup.js';
import { Slider } from '../../../../ui/Slider.js';
import { ReadoutPanel } from '../../../../ui/ReadoutPanel.js';
import { ActionButton } from '../../../../ui/ActionButton.js';

export class RadioactiveDecayBench extends Bench {
  static meta = {
    id: 'radioactive-decay',
    title: 'Radioactive decay',
    navLabel: 'Radioactive decay',
    canvasLabel: 'N(t) atoms remaining and A(t) activity',
    level: 'intro',
    keywords: [
      'radioactive decay', 'half-life', 'decay constant', 'activity',
      'Becquerel', 'Curie', 'Carbon-14', 'Uranium-238', 'stochastic', 'binomial',
      'nuclear chemistry', 'exponential', 'NUBASE2020',
    ],
    related: ['chemistry/rate-laws'],
  };

  static info = {
    formula:
      'λ = ln(2) / t½\n' +
      'N(t) = N₀·e^(−λ·t)    [t in half-lives]\n' +
      'A(t) = λ·N(t)          [Bq, when t½ in seconds]\n' +
      'age(f) = −ln(f)/λ      [time when N/N₀ = f]\n' +
      'Curie anchor: 1 g Ra-226 ≈ 3.66×10¹⁰ Bq',
    predict: [
      'Start with 1000 C-14 atoms. How many remain after two half-lives (11 400 y)?',
      'Why does the activity curve have exactly the same shape as the N(t) curve?',
      'If you have 1 g of Ra-226, roughly how many atoms decay per second?',
    ],
    breaks: [
      'Single isotope only — no daughter products or decay chains (secular equilibrium not modelled).',
      'λ is treated as constant: independent of temperature and pressure (true for β/α; tiny exception for electron-capture isotopes at extreme pressures).',
      'Stochastic mode shows Binomial(N, p) sampling; for very large N this approaches the continuous curve.',
      'C-14 dating applies only when the initial ¹⁴C/¹²C ratio is known; contamination and reservoir effects are not modelled.',
    ],
    derive: [
      { text: 'Decay rate is proportional to the number of undecayed atoms.', formula: 'dN/dt = −λ·N' },
      { text: 'Separate variables and integrate.', formula: 'dN/N = −λ dt  →  ln N = −λt + C₀' },
      { text: 'Apply N(0) = N₀.', formula: 'N(t) = N₀·e^(−λt)' },
      { text: 'Define t½ by N(t½) = N₀/2; solve for λ.', formula: 'e^(−λt½) = ½  →  λ = ln(2)/t½' },
      { text: 'Activity = decays per second = λ·N(t).', formula: 'A(t) = λ·N(t)  [Bq]' },
    ],
    research: {
      questions: [
        'Archaeologists use the Libby half-life (5568 y) rather than the physical value. Why do calibration conventions matter?',
        'How would you detect the difference between continuous decay and stochastic decay experimentally?',
      ],
      challenge: 'Extend the model to two-isotope secular equilibrium (parent → daughter → stable). Under what condition does A_daughter ≈ A_parent?',
      papers: [
        {
          authors: 'E. Rutherford & F. Soddy',
          year: 1902,
          title: 'The cause and nature of radioactivity, Part I & II',
          url: 'https://doi.org/10.1080/14786440209462856',
        },
        {
          authors: 'W. F. Libby',
          year: 1955,
          title: 'Radiocarbon Dating',
        },
        {
          authors: 'H. Godwin',
          year: 1962,
          title: 'Half-life of radiocarbon',
          url: 'https://doi.org/10.1038/195984a0',
        },
        {
          authors: 'F. G. Kondev et al.',
          year: 2021,
          title: 'The NUBASE2020 evaluation of nuclear physics properties',
          url: 'https://doi.org/10.1088/1674-1137/abddae',
        },
      ],
    },
    notePlaceholder: 'λ = ln 2 / t½ — the simplest first-order rate law in nature…',
  };

  build() {
    this._tHalfMax  = 4;  // time-axis window in half-lives
    this._dtHalf    = 0.01; // stochastic step size (in half-lives)
    this._running   = false; // stochastic walk active?

    this.model = new RadioactiveDecayModel({
      N0: 1000, isotopeId: 'c14', mode: 'continuous',
    });
    this.decayView = new RadioactiveDecayView(this.view);

    this._updateStageNote();

    // ── Isotope preset ──
    this.layout.addControl(new ButtonGroup({
      id: this.controlId('isotope'),
      label: 'Isotope',
      options: ISOTOPES.map(iso => ({ label: iso.symbol, value: iso.id })),
      value: 'c14',
      onChange: (v) => {
        this.model.isotopeId = v;
        this._resetStochastic();
        this._updateStageNote();
      },
    }));

    // ── Mode toggle ──
    this.layout.addControl(new ButtonGroup({
      id: this.controlId('mode'),
      label: 'Mode',
      options: [
        { label: 'Continuous', value: 'continuous' },
        { label: 'Stochastic', value: 'stochastic' },
      ],
      value: 'continuous',
      onChange: (v) => {
        this.model.mode = v;
        this._resetStochastic();
        this._running = (v === 'stochastic');
        this._resetBtn.disabled = (v !== 'stochastic');
      },
    }));

    // ── N₀ slider ──
    this.layout.addControl(new Slider({
      id: this.controlId('N0'),
      label: 'N₀ (initial atoms)',
      min: 100, max: 10000, step: 100,
      value: this.model.N0,
      format: v => v.toFixed(0),
      onInput: (v) => {
        this.model.N0 = v;
        this._resetStochastic();
      },
    }));

    // ── t-axis window ──
    this.layout.addControl(new Slider({
      id: this.controlId('tmax'),
      label: 't max (half-lives)',
      min: 1, max: 8, step: 0.5,
      value: this._tHalfMax,
      format: v => v.toFixed(1),
      onInput: (v) => { this._tHalfMax = v; },
    }));

    // ── Reset stochastic walk ──
    this._resetBtn = new ActionButton({
      label: 'Reset walk',
      onClick: () => this._resetStochastic(),
    });
    this._resetBtn.disabled = true; // enabled only in stochastic mode
    this.layout.addControl(this._resetBtn);

    // ── Readouts ──
    this.readouts = new ReadoutPanel([
      { key: 'tHalf',    label: 't½' },
      { key: 'lambda',   label: 'λ' },
      { key: 'A0',       label: 'A(0)' },
      { key: 'Agram',    label: 'A per gram' },
      { key: 'stochN',   label: 'N (stochastic)' },
    ]);
    this.layout.setReadouts(this.readouts);
  }

  /** Advance one step per frame when in stochastic mode and walk not yet complete. */
  update(_dt) {
    if (this.model.mode !== 'stochastic' || !this._running) return;
    if (this.model._t >= this._tHalfMax) {
      this._running = false;
      return;
    }
    const step = this.model.stepStochastic(this._dtHalf);
    this.decayView.stochasticHistory.push({ t: step.t, N: step.N });
  }

  draw() {
    this.decayView.draw(this.model, this._tHalfMax);
    this._updateReadouts();
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  _resetStochastic() {
    this.model.resetStochastic();
    this.decayView.stochasticHistory = [];
    if (this.model.mode === 'stochastic') {
      this._running = true;
    }
  }

  _updateStageNote() {
    const iso = this.model.isotope;
    if (iso.id === 'c14') {
      this.layout.setStageNote(
        'C-14 t½: NUBASE2020 = 5700 y · Godwin 1962 = 5730 y · Libby 1955 = 5568 y (radiocarbon convention)',
      );
    } else {
      const unitLabel = iso.unit === 'y' ? 'y' : iso.unit === 'd' ? 'd' : 's';
      this.layout.setStageNote(
        `${iso.name} (${iso.symbol}): t½ = ${iso.tHalf.toExponential(4)} ${unitLabel}  (NUBASE2020)`,
      );
    }
  }

  _updateReadouts() {
    const m = this.model;
    const iso = m.isotope;

    // t½ display
    let tHalfStr;
    if (iso.unit === 'y') {
      const y = iso.tHalf;
      tHalfStr = y >= 1e9 ? `${(y / 1e9).toPrecision(4)} Gy` :
                 y >= 1e6 ? `${(y / 1e6).toPrecision(4)} My` :
                            `${y.toPrecision(4)} y`;
    } else if (iso.unit === 'd') {
      tHalfStr = `${iso.tHalf.toPrecision(5)} d`;
    } else {
      tHalfStr = `${iso.tHalf.toExponential(3)} s`;
    }
    this.readouts.set('tHalf', tHalfStr);

    // λ in s⁻¹
    this.readouts.set('lambda', `${m.lambda.toExponential(4)} s⁻¹`);

    // A(0)
    const A0 = m.A(0);
    this.readouts.set('A0', _fmtBq(A0));

    // Activity per gram (if molar mass known)
    const Ag = m.activityPerGram();
    this.readouts.set('Agram', Ag !== null ? `${_fmtBq(Ag)} / g` : '—');

    // Stochastic N
    if (m.mode === 'stochastic') {
      this.readouts.set('stochN', `${m._N} (t = ${m._t.toFixed(2)} t½)`);
    } else {
      this.readouts.set('stochN', '—');
    }
  }
}

/** Format an activity value with G/M/k/Bq suffix. */
function _fmtBq(v) {
  if (v >= 1e9) return `${(v / 1e9).toPrecision(4)} GBq`;
  if (v >= 1e6) return `${(v / 1e6).toPrecision(4)} MBq`;
  if (v >= 1e3) return `${(v / 1e3).toPrecision(4)} kBq`;
  return `${v.toPrecision(4)} Bq`;
}
