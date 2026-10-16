/**
 * EigenvectorsBench — eigenvalue decomposition explorer.
 */
import { Bench } from '../../../../core/Bench.js';
import { EigenvectorsModel } from './EigenvectorsModel.js';
import { EigenvectorsView } from './EigenvectorsView.js';
import { ReadoutPanel } from '../../../../ui/ReadoutPanel.js';
import { ButtonGroup } from '../../../../ui/ButtonGroup.js';

export class EigenvectorsBench extends Bench {
  static meta = {
    id: 'eigenvectors',
    title: 'Eigenvalues & eigenvectors',
    navLabel: 'Eigenvectors',
    canvasLabel: 'Unit circle mapped to ellipse by A; eigenvalue spectrum',
    level: 'university',
    keywords: [
      'eigenvalue', 'eigenvector', 'Jacobi', 'symmetric', 'power iteration',
      'spectral decomposition', 'linear algebra', 'reconstruction', 'trace', 'determinant',
    ],
    related: ['math/fourier'],
  };

  static info = {
    predict: [
      'What does power iteration return for the identity matrix, and is that vector unique?',
      'How many iterations does power iteration need for a matrix with λ₁=10, λ₂=9 to reduce error to 1e-4? (Hint: (9/10)^n < 1e-4, ceil(ln(1e-4)/ln(0.9)) = 88.)',
      'What happens to power iteration applied to [[0,1],[1,0]]? Why does it oscillate?',
    ],
    breaks: [
      'Power iteration only finds the dominant eigenvalue. If |λ₁|=|λ₂|, it oscillates (see [[0,1],[1,0]]).',
      'Defective matrices (incomplete eigenbasis) cause power iteration to converge like 1/n instead of geometrically.',
      'Jacobi works only for symmetric matrices. For non-symmetric matrices, use QR iteration.',
    ],
    derive: [
      { text: 'A symmetric matrix A has A = QDQᵀ where Q is orthogonal and D diagonal.', formula: 'A = Σᵢ λᵢ vᵢ vᵢᵀ' },
      { text: 'Trace = sum of eigenvalues (invariant under similarity transformation):', formula: 'tr(A) = Σᵢ λᵢ' },
      { text: 'Determinant = product of eigenvalues:', formula: 'det(A) = Πᵢ λᵢ' },
      { text: 'The unit circle is mapped to an ellipse with semi-axes equal to |λᵢ| in the eigenvector directions.', formula: 'A·(cos θ·v₁ + sin θ·v₂) = cos θ·λ₁v₁ + sin θ·λ₂v₂' },
      { text: 'Power iteration: after n steps from v₀, angle to dominant eigenvector satisfies:', formula: 'tan θₙ = (λ₂/λ₁)ⁿ · tan θ₀' },
    ],
    research: {
      questions: [
        'Nash (1950) proved that every finite game has at least one Nash equilibrium. What theorem from linear algebra is central to the proof?',
        'How does the Jacobi eigenvalue method relate to the singular value decomposition (SVD)?',
      ],
      challenge: 'Implement the QR algorithm for non-symmetric matrices and compare convergence rates with Jacobi.',
      papers: [
        { authors: 'C. G. J. Jacobi', year: 1846, title: 'Über ein leichtes Verfahren, die in der Theorie der Säcularstörungen vorkommenden Gleichungen numerisch aufzulösen' },
      ],
    },
    notePlaceholder: 'Why does the unit circle become an ellipse…',
  };

  static PRESETS = [
    { label: '[[2,1],[1,2]]', matrix: [[2,1],[1,2]] },
    { label: '[[3,0],[0,1]]', matrix: [[3,0],[0,1]] },
    { label: '[[1,2],[2,1]]', matrix: [[1,2],[2,1]] },
    { label: '3×3 tridiag',   matrix: [[2,-1,0],[-1,2,-1],[0,-1,2]] },
  ];

  build() {
    this.model = new EigenvectorsModel({ matrix: [[2,1],[1,2]] });
    this.eigView = new EigenvectorsView(this.view);

    this.readouts = new ReadoutPanel([
      { key: 'lambda1', label: 'λ₁' },
      { key: 'lambda2', label: 'λ₂' },
      { key: 'trace',   label: 'trace=Σλ' },
      { key: 'det',     label: 'det=Πλ' },
      { key: 'recErr',  label: '‖A-QDQᵀ‖_F' },
    ]);
    this.layout.setReadouts(this.readouts);

    this.layout.addControl(new ButtonGroup({
      id: this.controlId('preset'),
      label: 'Matrix preset',
      options: EigenvectorsBench.PRESETS.map(p => ({ label: p.label, value: p.label })),
      value: '[[2,1],[1,2]]',
      onChange: v => {
        const preset = EigenvectorsBench.PRESETS.find(p => p.label === v);
        if (preset) this.model = new EigenvectorsModel({ matrix: preset.matrix });
      },
    }));
  }

  update(_dt) {}

  draw() {
    this.eigView.draw(this.model);
    try {
      const { values } = this.model.solve();
      this.readouts.set('lambda1', values[0]?.toFixed(6) ?? '–');
      this.readouts.set('lambda2', values[1]?.toFixed(6) ?? '–');
      this.readouts.set('trace',   this.model.trace().toFixed(6));
      this.readouts.set('det',     this.model.determinant().toFixed(6));
      this.readouts.set('recErr',  this.model.reconstructionError().toExponential(2));
    } catch (_) {
      this.readouts.set('lambda1', 'error');
      this.readouts.set('lambda2', 'error');
    }
  }
}
