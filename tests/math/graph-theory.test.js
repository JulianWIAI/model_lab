/**
 * Tests for GraphTheoryBench — explorer bench using Graph.js.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Graph, eulerCharacteristic, handshakingLemma } from '../../js/benches/math/graph-theory/graph-theory/Graph.js';

test('Disconnected graph: components count', () => {
  const g = new Graph();
  g.addEdge(0,1).addEdge(2,3);
  assert.strictEqual(g.components(), 2);
  assert.ok(!g.isConnected());
});

test('Tree: E = V-1', () => {
  const g = new Graph();
  for (let i = 0; i < 7; i++) g.addNode(i);
  g.addEdge(0,1).addEdge(0,2).addEdge(1,3).addEdge(1,4).addEdge(2,5).addEdge(2,6);
  assert.strictEqual(g.edgeCount, g.nodeCount - 1);
  assert.ok(g.isConnected());
});
