/**
 * GraphTheoryBench — explore graph algorithms (Dijkstra, BFS, Euler, faces).
 */
import { Bench } from '../../../../core/Bench.js';
import { Graph, eulerCharacteristic, handshakingLemma } from './Graph.js';
import { GraphTheoryView } from './GraphTheoryView.js';
import { ButtonGroup } from '../../../../ui/ButtonGroup.js';
import { ReadoutPanel } from '../../../../ui/ReadoutPanel.js';

export class GraphTheoryBench extends Bench {
  static meta = {
    id: 'graph-theory',
    title: 'Graph theory explorer',
    navLabel: 'Graph theory',
    canvasLabel: 'Graph visualisation',
    level: 'university',
    keywords: [
      'graph', 'Dijkstra', 'BFS', 'Euler characteristic', 'handshaking lemma',
      'planar graph', 'face tracing', 'shortest path', 'algorithm',
    ],
  };

  static info = {
    formula: 'V - E + F = 2 (Euler, connected planar)',
    predict: [
      'For K4 (complete graph on 4 nodes): V=4, E=6, F=4. Check: 4-6+4=2.',
      'For a tree on n nodes: E = n-1, and the graph is connected with 1 component.',
    ],
    breaks: [
      'Only small graphs are visualised; no layout algorithm (positions are preset).',
      'Dijkstra assumes non-negative weights; use Bellman-Ford for negative edges.',
    ],
    derive: [
      { text: 'Handshaking lemma: sum of all degrees = 2|E|, because each edge contributes 1 to each endpoint.' },
      { text: 'Euler characteristic for a connected planar graph: V - E + F = 2.' },
    ],
    research: {
      questions: [
        'How does Dijkstra fail with negative weights?',
        'What is the girth of K_{3,3}? Of the Petersen graph?',
      ],
      challenge: 'Prove that K_{3,3} is non-planar using Euler\'s formula (E > 2V - 4 for bipartite graphs).',
      papers: [],
    },
    notePlaceholder: 'Try different graph presets and observe Euler\'s formula.',
  };

  build() {
    this._buildK4();
    this.graphView = new GraphTheoryView(this.view);

    this.layout.addControl(new ButtonGroup({
      id: this.controlId('preset'),
      label: 'Graph',
      options: [
        { label: 'K4', value: 'k4' },
        { label: 'Tree', value: 'tree' },
        { label: 'Path', value: 'path' },
      ],
      value: 'k4',
      onChange: (v) => {
        if (v === 'k4') this._buildK4();
        else if (v === 'tree') this._buildTree();
        else this._buildPath();
      },
    }));

    this.readouts = new ReadoutPanel([
      { key: 'V', label: 'V' },
      { key: 'E', label: 'E' },
      { key: 'connected', label: 'Connected' },
      { key: 'handshake', label: 'Handshaking' },
    ]);
    this.layout.setReadouts(this.readouts);
  }

  _buildK4() {
    this.graph = new Graph();
    for (const v of [0,1,2,3]) this.graph.addNode(v);
    this.graph.addEdge(0,1).addEdge(0,2).addEdge(0,3)
              .addEdge(1,2).addEdge(1,3).addEdge(2,3);
    this.positions = new Map([
      [0, {x:0.5,y:0}], [1, {x:0,y:1}], [2, {x:1,y:1}], [3, {x:0.5,y:0.7}],
    ]);
  }

  _buildTree() {
    this.graph = new Graph();
    for (let i = 0; i < 7; i++) this.graph.addNode(i);
    this.graph.addEdge(0,1).addEdge(0,2).addEdge(1,3).addEdge(1,4).addEdge(2,5).addEdge(2,6);
    this.positions = new Map([
      [0, {x:0.5,y:0}], [1, {x:0.25,y:0.4}], [2, {x:0.75,y:0.4}],
      [3, {x:0.1,y:0.8}], [4, {x:0.4,y:0.8}], [5, {x:0.6,y:0.8}], [6, {x:0.9,y:0.8}],
    ]);
  }

  _buildPath() {
    this.graph = new Graph();
    for (let i = 0; i < 5; i++) this.graph.addNode(i);
    for (let i = 0; i < 4; i++) this.graph.addEdge(i, i+1);
    this.positions = new Map([
      [0, {x:0,y:0.5}], [1, {x:0.25,y:0.5}], [2, {x:0.5,y:0.5}],
      [3, {x:0.75,y:0.5}], [4, {x:1,y:0.5}],
    ]);
  }

  update(_dt) {}

  draw() {
    this.graphView.draw(this.graph, this.positions);
    this.readouts.set('V', String(this.graph.nodeCount));
    this.readouts.set('E', String(this.graph.edgeCount));
    this.readouts.set('connected', this.graph.isConnected() ? 'Yes' : 'No');
    const hs = handshakingLemma(this.graph);
    this.readouts.set('handshake', hs.equal ? `2*${this.graph.edgeCount} = ${hs.rhs}` : 'FAIL');
  }
}
