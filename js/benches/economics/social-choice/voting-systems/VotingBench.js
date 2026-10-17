/**
 * VotingBench — plurality, Borda, and Condorcet voting rules.
 */
import { Bench } from '../../../../core/Bench.js';
import { VotingModel } from './VotingModel.js';
import { VotingView } from './VotingView.js';
import { ReadoutPanel } from '../../../../ui/ReadoutPanel.js';
import { ButtonGroup } from '../../../../ui/ButtonGroup.js';

export class VotingBench extends Bench {
  static meta = {
    id: 'voting-systems',
    title: 'Voting systems',
    navLabel: 'Voting systems',
    canvasLabel: 'Pairwise matrix and Borda score chart',
    level: 'university',
    keywords: [
      'voting', 'Condorcet', 'Borda', 'plurality', 'Arrow', 'impossibility',
      'social choice', 'preference aggregation',
    ],
    related: ['economics/nash-equilibria'],
  };

  static info = {
    summary: [
      'Three voters each rank three alternatives. Different voting rules can produce different — and sometimes contradictory — winners.',
      'The Condorcet paradox shows that pairwise majority voting can cycle: A beats B, B beats C, yet C beats A.',
      "Arrow's impossibility theorem (1951) proves that no ranked voting rule satisfies unanimity, IIA, and non-dictatorship simultaneously.",
    ],
    symbols: [
      { sym: 'M[i][j]', desc: 'number of voters preferring alternative i over alternative j' },
      { sym: 'm', desc: 'number of voters' },
      { sym: 'n', desc: 'number of alternatives' },
      { sym: 'b(i)', desc: 'Borda score of alternative i: sum over voters of (n − 1 − rank of i)' },
    ],
    predict: [
      'In the Condorcet paradox preset, which alternative wins under plurality? Under Borda?',
      'Can a Condorcet loser ever win under Borda count? (Hint: compare the loser\'s Borda score to the average n(m−1)/2.)',
      'What happens to the pairwise matrix when all voters agree on the ranking?',
    ],
    derive: [
      {
        text: 'Borda score for alternative i across m voters:',
        formula: 'b(i) = Σ_{v=1}^{m} (n − 1 − rank_v(i))',
      },
      {
        text: 'Condorcet winner condition (must beat every other alternative):',
        formula: '∀j ≠ i: M[i][j] > m/2',
      },
      {
        text: "Arrow's theorem: no social welfare function satisfies all three axioms (unanimity, IIA, non-dictatorship) for n ≥ 3.",
        formula: '',
      },
    ],
    papers: [
      { authors: 'K. Arrow', year: 1951, title: "Social Choice and Individual Values" },
      { authors: 'M. de Condorcet', year: 1785, title: 'Essai sur l\'application de l\'analyse à la probabilité des décisions rendues à la pluralité des voix' },
      { authors: 'J.-C. de Borda', year: 1781, title: 'Mémoire sur les élections au scrutin' },
    ],
    breaks: [
      'Plurality ignores all preferences below first place, and can elect a Condorcet loser.',
      'Borda count violates independence of irrelevant alternatives (IIA): adding a new candidate can change the winner.',
      'Condorcet method fails to produce a winner whenever a majority cycle exists (as in the paradox preset).',
    ],
  };

  static PRESETS = [
    {
      label: 'Condorcet paradox',
      alternatives: ['A', 'B', 'C'],
      preferences: [[0,1,2], [1,2,0], [2,0,1]],
    },
    {
      label: 'Clear winner',
      alternatives: ['A', 'B', 'C'],
      preferences: [[0,1,2], [0,1,2], [0,2,1]],
    },
    {
      label: 'Borda vs Condorcet',
      alternatives: ['A', 'B', 'C'],
      preferences: [[0,1,2], [0,1,2], [0,1,2], [1,2,0], [1,2,0]],
    },
    {
      label: '3×ABC + 2×BCA',
      alternatives: ['A', 'B', 'C'],
      preferences: [[0,1,2], [0,1,2], [0,1,2], [1,2,0], [1,2,0]],
    },
    {
      label: '3×ABC + 2×BCA + 2×CBA',
      alternatives: ['A', 'B', 'C'],
      preferences: [[0,1,2], [0,1,2], [0,1,2], [1,2,0], [1,2,0], [2,1,0], [2,1,0]],
    },
  ];

  build() {
    const first = VotingBench.PRESETS[0];
    this.model = new VotingModel({ alternatives: first.alternatives, preferences: first.preferences });
    this.votingView = new VotingView(this.view);

    this.readouts = new ReadoutPanel([
      { key: 'condorcet',  label: 'Condorcet winner' },
      { key: 'borda',      label: 'Borda winner' },
      { key: 'plurality',  label: 'Plurality winner' },
      { key: 'scoreA',     label: 'Borda score A' },
      { key: 'scoreB',     label: 'Borda score B' },
      { key: 'scoreC',     label: 'Borda score C' },
    ]);
    this.layout.setReadouts(this.readouts);

    this.layout.addControl(new ButtonGroup({
      id: this.controlId('preset'),
      label: 'Preset',
      options: VotingBench.PRESETS.map(p => ({ label: p.label, value: p.label })),
      value: first.label,
      onChange: v => {
        const preset = VotingBench.PRESETS.find(p => p.label === v);
        if (preset) {
          this.model = new VotingModel({ alternatives: preset.alternatives, preferences: preset.preferences });
        }
      },
    }));
  }

  update(_dt) {}

  draw() {
    this.votingView.draw(this.model);

    const condorcet = this.model.condorcetWinner();
    const borda     = this.model.bordaWinner();
    const plurality = this.model.pluralityWinner();
    const scores    = this.model.bordaScores();

    this.readouts.set('condorcet', condorcet ?? 'none (cycle)');
    this.readouts.set('borda',     borda     ?? 'tie');
    this.readouts.set('plurality', plurality ?? 'tie');

    // Scores for each alternative (use the actual alternatives list)
    const alts = this.model.alternatives;
    this.readouts.set('scoreA', alts[0] ? String(scores[alts[0]] ?? '–') : '–');
    this.readouts.set('scoreB', alts[1] ? String(scores[alts[1]] ?? '–') : '–');
    this.readouts.set('scoreC', alts[2] ? String(scores[alts[2]] ?? '–') : '–');
  }
}
