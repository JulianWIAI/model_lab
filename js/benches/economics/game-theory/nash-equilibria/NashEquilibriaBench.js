/**
 * NashEquilibriaBench — 2×2 normal-form game explorer.
 */
import { Bench } from '../../../../core/Bench.js';
import { NashEquilibriaModel } from './NashEquilibriaModel.js';
import { NashEquilibriaView } from './NashEquilibriaView.js';
import { ReadoutPanel } from '../../../../ui/ReadoutPanel.js';
import { ButtonGroup } from '../../../../ui/ButtonGroup.js';

export class NashEquilibriaBench extends Bench {
  static meta = {
    id: 'nash-equilibria',
    title: 'Nash equilibria',
    navLabel: 'Nash equilibria',
    canvasLabel: 'Best-response diagram with Nash equilibria',
    level: 'university',
    keywords: [
      'Nash equilibrium', 'game theory', '2×2 game', 'mixed strategy',
      'pure strategy', 'best response', 'Matching Pennies', 'Battle of Sexes',
    ],
    related: ['psychology/prisoner-dilemma'],
  };

  static info = {
    predict: [
      'In Matching Pennies, is there ever a pure Nash equilibrium?',
      'In Battle of Sexes, how many Nash equilibria exist in total?',
      'At the mixed NE of Battle of Sexes, what is each player\'s expected payoff?',
    ],
    breaks: [
      'Nash (1950, unverified) guarantees at least one NE exists for every finite game.',
      'Degenerate cases (equal payoffs for all strategies) may have infinitely many NE.',
      'Mixed NE may not be in (0,1)×(0,1): check for dominated strategies first.',
    ],
    derive: [
      { text: 'Row is indifferent between row0 and row1 when Col mixes at q*:', formula: 'q*·a + (1-q*)·b = q*·c + (1-q*)·d  →  q* = (d-b)/(a-b-c+d)' },
      { text: 'Col is indifferent between col0 and col1 when Row mixes at p*:', formula: 'p* = (h-g)/(e-f-g+h)' },
      { text: 'Row payoff at mixed NE:', formula: 'V_row = (ad-bc)/(a-b-c+d)' },
      { text: 'Nash (1950) guarantees at least one NE (pure or mixed) exists for every finite game by Brouwer\'s fixed-point theorem.', formula: '' },
    ],
    research: {
      questions: [
        'What is the "folk theorem" in repeated games, and how does it relate to the one-shot Nash equilibrium?',
        'What does the cross-check between best-response grid and closed-form formula tell you about numerical accuracy?',
      ],
      challenge: 'Extend to a 3×3 game. How many NE can a 3×3 game have? Implement a support enumeration algorithm.',
      papers: [
        { authors: 'J. Nash', year: 1950, title: 'Equilibrium Points in n-Person Games (unverified)' },
        { authors: 'J. Nash', year: 1951, title: 'Non-Cooperative Games' },
      ],
    },
    notePlaceholder: 'Under what conditions does a unique Nash equilibrium exist…',
  };

  static GAMES = [
    {
      label: 'Matching Pennies',
      A: [[1,-1],[-1,1]],
      B: [[-1,1],[1,-1]],
    },
    {
      label: 'Battle of Sexes',
      A: [[2,0],[0,1]],
      B: [[1,0],[0,2]],
    },
    {
      label: "Prisoner's Dilemma",
      A: [[3,0],[5,1]],
      B: [[3,5],[0,1]],
    },
    {
      label: 'Coordination',
      A: [[2,0],[0,1]],
      B: [[2,0],[0,1]],
    },
  ];

  build() {
    this.model = new NashEquilibriaModel({ A: NashEquilibriaBench.GAMES[0].A, B: NashEquilibriaBench.GAMES[0].B });
    this.nashView = new NashEquilibriaView(this.view);

    this.readouts = new ReadoutPanel([
      { key: 'pstar',   label: 'p* (Row)' },
      { key: 'qstar',   label: 'q* (Col)' },
      { key: 'rowVal',  label: 'Row value' },
      { key: 'colVal',  label: 'Col value' },
      { key: 'countNE', label: '# NE' },
    ]);
    this.layout.setReadouts(this.readouts);

    this.layout.addControl(new ButtonGroup({
      id: this.controlId('game'),
      label: 'Game preset',
      options: NashEquilibriaBench.GAMES.map(g => ({ label: g.label, value: g.label })),
      value: 'Matching Pennies',
      onChange: v => {
        const game = NashEquilibriaBench.GAMES.find(g => g.label === v);
        if (game) this.model = new NashEquilibriaModel({ A: game.A, B: game.B });
      },
    }));
  }

  update(_dt) {}

  draw() {
    this.nashView.draw(this.model);
    const { p, q, rowValue, colValue, degenerate } = this.model.mixedNE();
    if (degenerate) {
      this.readouts.set('pstar',   'degenerate');
      this.readouts.set('qstar',   'degenerate');
      this.readouts.set('rowVal',  '–');
      this.readouts.set('colVal',  '–');
    } else {
      this.readouts.set('pstar',   p?.toFixed(4) ?? '–');
      this.readouts.set('qstar',   q?.toFixed(4) ?? '–');
      this.readouts.set('rowVal',  rowValue?.toFixed(4) ?? '–');
      this.readouts.set('colVal',  colValue?.toFixed(4) ?? '–');
    }
    this.readouts.set('countNE', String(this.model.countNE()));
  }
}
