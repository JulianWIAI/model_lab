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

test('Oracle: Dijkstra and Bellman-Ford agree on positive-weight graph', () => {
  const g = new Graph();
  g.addEdge('A','B',2).addEdge('B','C',3).addEdge('A','C',6).addEdge('C','D',1).addEdge('B','D',7);
  const dij = g.dijkstra('A');
  const bf  = g.bellmanFord('A');
  for (const v of ['A','B','C','D']) {
    assert.strictEqual(dij.get(v), bf.get(v), `Mismatch at ${v}: dij=${dij.get(v)}, bf=${bf.get(v)}`);
  }
});
