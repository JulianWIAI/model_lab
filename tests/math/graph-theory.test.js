/**
 * Tests for GraphTheoryBench — explorer bench using Graph.js.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Graph, eulerCharacteristic, handshakingLemma } from '../../js/benches/math/graph-theory/graph-theory/Graph.js';

test('Euler K4: V-E+F = 2', () => {
  assert.strictEqual(eulerCharacteristic(4, 6, 4), 2);
});

test('Euler Q3: V-E+F = 2', () => {
  assert.strictEqual(eulerCharacteristic(8, 12, 6), 2);
});

test('Disconnected graph: components count', () => {
  const g = new Graph();
  g.addEdge(0,1).addEdge(2,3);
  assert.strictEqual(g.components(), 2);
  assert.ok(!g.isConnected());
});

test('Handshaking K4', () => {
  const g = new Graph();
  for (const v of [0,1,2,3]) g.addNode(v);
  g.addEdge(0,1).addEdge(0,2).addEdge(0,3).addEdge(1,2).addEdge(1,3).addEdge(2,3);
  const hs = handshakingLemma(g);
  assert.ok(hs.equal);
  assert.strictEqual(hs.lhs, 12);
});

test('Dijkstra reference: 5-node shortest path', () => {
  const g = new Graph();
  g.addEdge('A','B',1).addEdge('B','C',2).addEdge('A','C',4).addEdge('C','D',1);
  const d = g.dijkstra('A');
  assert.strictEqual(d.get('D'), 4);
});

test('Tree: E = V-1', () => {
  const g = new Graph();
  for (let i = 0; i < 7; i++) g.addNode(i);
  g.addEdge(0,1).addEdge(0,2).addEdge(1,3).addEdge(1,4).addEdge(2,5).addEdge(2,6);
  assert.strictEqual(g.edgeCount, g.nodeCount - 1);
  assert.ok(g.isConnected());
});
