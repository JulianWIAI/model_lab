/**
 * Tests for Graph.js — graph data structure and algorithms.
 *
 * Checks Dijkstra, Bellman-Ford, BFS, DFS, face tracing, Euler characteristic,
 * handshaking lemma, and removeEdge/removeNode.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Graph, eulerCharacteristic, handshakingLemma } from '../../js/benches/math/graph-theory/graph-theory/Graph.js';

test('Dijkstra 5-node: A->D = 4', () => {
  const g = new Graph();
  g.addEdge('A','B',1).addEdge('B','C',2).addEdge('A','C',4).addEdge('C','D',1).addEdge('B','D',5);
  const d = g.dijkstra('A');
  assert.strictEqual(d.get('D'), 4);
  assert.strictEqual(d.get('C'), 3);
  assert.strictEqual(d.get('B'), 1);
});

test('Dijkstra throws RangeError on negative weight (default)', () => {
  const g = new Graph();
  g.addEdge('A','B',-1);
  assert.throws(() => g.dijkstra('A'), RangeError);
});

test('Dijkstra with allowNegative does not throw', () => {
  const g = new Graph();
  g.addEdge('A','B',-1);
  const d = g.dijkstra('A', { allowNegative: true });
  assert.strictEqual(d.get('B'), -1);
});

test('Bellman-Ford directed negative-weight: correct distances', () => {
  const g = new Graph({ directed: true });
  g.addEdge('A','B',3).addEdge('A','C',1).addEdge('C','B',-1);
  const d = g.bellmanFord('A');
  assert.notStrictEqual(d, null);
  assert.strictEqual(d.get('B'), 0); // A->C->B = 1+(-1) = 0
  assert.strictEqual(d.get('C'), 1);
});

test('Bellman-Ford returns null on negative cycle', () => {
  const g = new Graph({ directed: true });
  g.addEdge('A','B',1).addEdge('B','C',-2).addEdge('C','A',0);
  const d = g.bellmanFord('A');
  assert.strictEqual(d, null);
});

test('BFS hop-distances on K4', () => {
  const g = new Graph();
  for (const v of [0,1,2,3]) g.addNode(v);
  g.addEdge(0,1).addEdge(0,2).addEdge(0,3).addEdge(1,2).addEdge(1,3).addEdge(2,3);
  const d = g.bfs(0);
  // All nodes are 1 hop from 0 in K4
  assert.strictEqual(d.get(1), 1);
  assert.strictEqual(d.get(2), 1);
  assert.strictEqual(d.get(3), 1);
});

test('faces(K4 rotation) = 4', () => {
  const g = new Graph();
  // K4 planar embedding: rotation system (CCW)
  const rot = new Map([
    [0, [1, 3, 2]],
    [1, [2, 3, 0]],
    [2, [0, 3, 1]],
    [3, [1, 2, 0]],
  ]);
  assert.strictEqual(g.faces(rot), 4);
});

test('faces(Q3 rotation) = 6', () => {
  const g = new Graph();
  // Q3 cube Schlegel diagram rotation system (CCW)
  const rot = new Map([
    [0, [1, 4, 2]],
    [1, [3, 5, 0]],
    [2, [3, 0, 6]],
    [3, [2, 7, 1]],
    [4, [5, 6, 0]],
    [5, [7, 4, 1]],
    [6, [7, 2, 4]],
    [7, [3, 6, 5]],
  ]);
  assert.strictEqual(g.faces(rot), 6);
});

test('Euler: V-E+F = 2 for K4', () => {
  assert.strictEqual(eulerCharacteristic(4, 6, 4), 2);
});

test('Euler: V-E+F = 2 for Q3 cube', () => {
  assert.strictEqual(eulerCharacteristic(8, 12, 6), 2);
});

test('Handshaking: 2|E| = sum(deg) for K4', () => {
  const g = new Graph();
  for (const v of [0,1,2,3]) g.addNode(v);
  g.addEdge(0,1).addEdge(0,2).addEdge(0,3).addEdge(1,2).addEdge(1,3).addEdge(2,3);
  const hs = handshakingLemma(g);
  assert.ok(hs.equal, `Handshaking failed: lhs=${hs.lhs}, rhs=${hs.rhs}`);
  assert.strictEqual(hs.lhs, 12);
});

test('removeEdge removes edge correctly', () => {
  const g = new Graph();
  g.addEdge('A','B',1).addEdge('A','C',2);
  assert.strictEqual(g.edgeCount, 2);
  g.removeEdge('A','B');
  assert.strictEqual(g.edgeCount, 1);
  const d = g.dijkstra('A');
  assert.strictEqual(d.get('B'), Infinity);
});

test('removeNode removes node and incident edges', () => {
  const g = new Graph();
  g.addEdge('A','B',1).addEdge('A','C',2).addEdge('B','C',3);
  g.removeNode('A');
  assert.strictEqual(g.nodeCount, 2);
  assert.strictEqual(g.edgeCount, 1);
});

test('DFS path A→B→C→D: 4 entries, distinct times 0-3, A has time 0', () => {
  const g = new Graph({ directed: true });
  g.addEdge('A','B',1).addEdge('B','C',1).addEdge('C','D',1);
  const t = g.dfs('A');
  assert.ok(t instanceof Map, 'dfs returns Map');
  assert.strictEqual(t.size, 4, `expected 4 entries, got ${t.size}`);
  assert.strictEqual(t.get('A'), 0, `A time should be 0 (first discovered)`);
  const times = [...t.values()].sort((a, b) => a - b);
  assert.deepStrictEqual(times, [0, 1, 2, 3], `times not distinct [0,3]: ${times}`);
});

test('DFS star center→{A,B,C}: 4 entries', () => {
  const g = new Graph({ directed: true });
  g.addEdge('center','A',1).addEdge('center','B',1).addEdge('center','C',1);
  const t = g.dfs('center');
  assert.strictEqual(t.size, 4, `expected 4 entries, got ${t.size}`);
});

test('DFS disconnected: dfs(X) returns Map with 1 entry (just X, time=0)', () => {
  const g = new Graph();
  g.addNode('X'); g.addNode('Y');
  const t = g.dfs('X');
  assert.strictEqual(t.size, 1, `expected 1 entry, got ${t.size}`);
  assert.strictEqual(t.get('X'), 0, 'X time should be 0');
});

test('Oracle: Dijkstra and Bellman-Ford agree on positive-weight graph', () => {
  const g = new Graph();
  g.addEdge('A','B',2).addEdge('B','C',3).addEdge('A','C',6).addEdge('C','D',1).addEdge('B','D',7);
  const dij = g.dijkstra('A');
  const bf  = g.bellmanFord('A');
  for (const v of ['A','B','C','D']) {
    assert.strictEqual(dij.get(v), bf.get(v), `Mismatch at ${v}: dij=${dij.get(v)}, bf=${bf.get(v)}`);
  }
});

test('girth K4 = 3', () => {
  // K4: complete graph on 4 nodes, every triple forms a triangle
  const g = new Graph();
  for (const n of ['A','B','C','D']) g.addNode(n);
  for (const [a,b] of [['A','B'],['A','C'],['A','D'],['B','C'],['B','D'],['C','D']]) g.addEdge(a,b,1);
  assert.strictEqual(g.girth(), 3);
});

test('girth K3,3 = 4', () => {
  // K3,3 bipartite: shortest cycle has length 4 (no triangles)
  const g = new Graph();
  for (const n of ['A','B','C','D','E','F']) g.addNode(n);
  for (const a of ['A','B','C']) for (const b of ['D','E','F']) g.addEdge(a,b,1);
  assert.strictEqual(g.girth(), 4);
});

test('girth Petersen = 5', () => {
  // Petersen graph: 10 nodes, girth=5
  // Outer pentagon: 0-1-2-3-4-0; spokes: 0-5,1-6,2-7,3-8,4-9; inner pentagram: 5-7-9-6-8-5
  const g = new Graph();
  for (let i = 0; i < 10; i++) g.addNode(String(i));
  const edges = [[0,1],[1,2],[2,3],[3,4],[4,0],[0,5],[1,6],[2,7],[3,8],[4,9],[5,7],[7,9],[9,6],[6,8],[8,5]];
  for (const [a,b] of edges) g.addEdge(String(a),String(b),1);
  assert.strictEqual(g.girth(), 5);
});

test('girth Q3 = 4', () => {
  // Q3: 3-cube graph, girth=4
  const g = new Graph();
  const nodes = ['000','001','010','011','100','101','110','111'];
  for (const n of nodes) g.addNode(n);
  for (let i = 0; i < 8; i++) {
    for (let bit = 0; bit < 3; bit++) {
      const j = i ^ (1 << bit);
      if (j > i) g.addEdge(nodes[i], nodes[j], 1);
    }
  }
  assert.strictEqual(g.girth(), 4);
});

test('girth path P5 = Infinity (acyclic)', () => {
  const g = new Graph();
  for (const n of ['A','B','C','D','E']) g.addNode(n);
  for (const [a,b] of [['A','B'],['B','C'],['C','D'],['D','E']]) g.addEdge(a,b,1);
  assert.strictEqual(g.girth(), Infinity);
});

test('K3,3 non-planar: E=9 > 2V-4=8 (girth>=4 bound)', () => {
  // For bipartite graphs with girth>=4: E <= 2V-4. K3,3: E=9, V=6, 2V-4=8. 9>8 => non-planar.
  const g = new Graph();
  for (const n of ['A','B','C','D','E','F']) g.addNode(n);
  for (const a of ['A','B','C']) for (const b of ['D','E','F']) g.addEdge(a,b,1);
  assert.ok(g.edgeCount > 2*g.nodeCount - 4,
    `K3,3: E=${g.edgeCount} should exceed 2V-4=${2*g.nodeCount-4}`);
});

test('Petersen non-planar: E=15 > 5(V-2)/3=13.33 (girth>=5 bound)', () => {
  // For graphs with girth>=5: E <= 5(V-2)/3. Petersen: E=15, V=10, bound=13.33. 15>13.33 => non-planar.
  const g = new Graph();
  for (let i = 0; i < 10; i++) g.addNode(String(i));
  const edges = [[0,1],[1,2],[2,3],[3,4],[4,0],[0,5],[1,6],[2,7],[3,8],[4,9],[5,7],[7,9],[9,6],[6,8],[8,5]];
  for (const [a,b] of edges) g.addEdge(String(a),String(b),1);
  const E = g.edgeCount, V = g.nodeCount;
  assert.ok(E > 5*(V-2)/3, `Petersen: E=${E} should exceed 5(V-2)/3=${(5*(V-2)/3).toFixed(2)}`);
});

test('Q3 planar boundary: E=12 <= 2V-4=12 (girth>=4, boundary case)', () => {
  const g = new Graph();
  const nodes = ['000','001','010','011','100','101','110','111'];
  for (const n of nodes) g.addNode(n);
  for (let i = 0; i < 8; i++) for (let bit = 0; bit < 3; bit++) { const j = i^(1<<bit); if(j>i) g.addEdge(nodes[i],nodes[j],1); }
  const E = g.edgeCount, V = g.nodeCount;
  assert.ok(E <= 2*V-4, `Q3: E=${E} should be <= 2V-4=${2*V-4} (boundary case)`);
});

test('bellmanFord: undirected negative edge -> null (negative cycle)', () => {
  // An undirected edge A-B:-1 creates the cycle A->B->A with total weight -2.
  // Bellman-Ford must detect this and return null.
  const g = new Graph();
  g.addNode('A'); g.addNode('B');
  g.addEdge('A', 'B', -1);  // adds both A->B and B->A in adjacency
  const result = g.bellmanFord('A');
  assert.strictEqual(result, null, 'undirected negative edge should trigger null (negative cycle)');
});
