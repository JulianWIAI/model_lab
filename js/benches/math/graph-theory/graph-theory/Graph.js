/**
 * Graph — adjacency-list graph data structure with standard algorithms.
 *
 * Supports directed and undirected graphs with weighted edges.
 * Placed in the bench folder (single user: GraphTheoryBench).
 */
export class Graph {
  constructor({ directed = false } = {}) {
    this._directed = directed;
    this._adj = new Map();
    this._nodes = new Set();
  }

  addNode(id) {
    if (!this._nodes.has(id)) { this._nodes.add(id); this._adj.set(id, []); }
    return this;
  }

  addEdge(u, v, weight = 1) {
    this.addNode(u); this.addNode(v);
    this._adj.get(u).push({ to: v, weight });
    if (!this._directed) this._adj.get(v).push({ to: u, weight });
    return this;
  }

  removeEdge(u, v) {
    if (this._adj.has(u)) this._adj.set(u, this._adj.get(u).filter(e => e.to !== v));
    if (!this._directed && this._adj.has(v)) this._adj.set(v, this._adj.get(v).filter(e => e.to !== u));
    return this;
  }

  removeNode(id) {
    this._nodes.delete(id);
    this._adj.delete(id);
    for (const [, edges] of this._adj) {
      for (let i = edges.length - 1; i >= 0; i--) {
        if (edges[i].to === id) edges.splice(i, 1);
      }
    }
    return this;
  }

  degree(v) { return (this._adj.get(v) || []).length; }
  degrees() { const m = new Map(); for (const v of this._nodes) m.set(v, this.degree(v)); return m; }
  adjacencyList() { return this._adj; }
  get nodeCount() { return this._nodes.size; }
  get edgeCount() {
    let s = 0;
    for (const [, e] of this._adj) s += e.length;
    return this._directed ? s : s / 2;
  }

  dijkstra(source, { allowNegative = false } = {}) {
    for (const [, edges] of this._adj) {
      for (const { weight } of edges) {
        if (weight < 0 && !allowNegative) throw new RangeError('Dijkstra: negative edge weight');
      }
    }
    const dist = new Map();
    for (const v of this._nodes) dist.set(v, Infinity);
    dist.set(source, 0);
    const visited = new Set();
    while (true) {
      let u = null;
      for (const v of this._nodes)
        if (!visited.has(v) && (u === null || dist.get(v) < dist.get(u))) u = v;
      if (u === null || dist.get(u) === Infinity) break;
      visited.add(u);
      for (const { to, weight } of (this._adj.get(u) || [])) {
        if (!visited.has(to)) {
          const d = dist.get(u) + weight;
          if (d < dist.get(to)) dist.set(to, d);
        }
      }
    }
    return dist;
  }

  bellmanFord(source) {
    const dist = new Map();
    for (const v of this._nodes) dist.set(v, Infinity);
    dist.set(source, 0);
    const n = this._nodes.size;
    for (let i = 0; i < n - 1; i++) {
      for (const [u, edges] of this._adj)
        for (const { to, weight } of edges)
          if (dist.get(u) !== Infinity && dist.get(u) + weight < dist.get(to))
            dist.set(to, dist.get(u) + weight);
    }
    for (const [u, edges] of this._adj)
      for (const { to, weight } of edges)
        if (dist.get(u) !== Infinity && dist.get(u) + weight < dist.get(to)) return null;
    return dist;
  }

  bfs(source) {
    const dist = new Map();
    for (const v of this._nodes) dist.set(v, Infinity);
    dist.set(source, 0);
    const queue = [source]; let qi = 0;
    while (qi < queue.length) {
      const u = queue[qi++];
      for (const { to } of (this._adj.get(u) || []))
        if (dist.get(to) === Infinity) { dist.set(to, dist.get(u) + 1); queue.push(to); }
    }
    return dist;
  }

  dfs(source) {
    const time = new Map();
    let t = 0;
    const visit = (v) => {
      time.set(v, t++);
      for (const { to } of (this._adj.get(v) || []))
        if (!time.has(to)) visit(to);
    };
    visit(source);
    return time;
  }

  isConnected() {
    if (this._nodes.size === 0) return true;
    const [start] = this._nodes;
    const d = this.bfs(start);
    let count = 0;
    for (const v of d.values()) if (v < Infinity) count++;
    return count === this._nodes.size;
  }

  components() {
    const seen = new Set();
    let c = 0;
    for (const v of this._nodes) {
      if (!seen.has(v)) {
        c++;
        const d = this.bfs(v);
        for (const [w, dist] of d) if (dist < Infinity) seen.add(w);
      }
    }
    return c;
  }

  /**
   * Compute the girth (length of shortest cycle) by BFS from each node.
   * Returns Infinity if the graph is acyclic (tree or forest).
   * O(V·(V+E)) time. Assumes undirected graph (directed graphs need DFS).
   */
  girth() {
    let g = Infinity;
    for (const start of this._nodes.keys()) {
      // BFS from start; if we find a back-edge to an already-visited node at distance d,
      // cycle length = dist[start→neighbor] + dist[start→current] + 1
      const dist = new Map([[start, 0]]);
      const parent = new Map([[start, null]]);
      const queue = [start];
      outer: while (queue.length > 0) {
        const u = queue.shift();
        const du = dist.get(u);
        for (const { to: v } of (this._adj.get(u) || [])) {
          if (!dist.has(v)) {
            dist.set(v, du + 1);
            parent.set(v, u);
            queue.push(v);
          } else if (parent.get(u) !== v) {
            // back edge: cycle length = du + dist.get(v) + 1
            const cycleLen = du + dist.get(v) + 1;
            if (cycleLen < g) g = cycleLen;
            if (g === 3) break outer; // can't get smaller
          }
        }
      }
    }
    return g;
  }

  faces(rotationSystem) {
    const dartsSeen = new Set();
    let F = 0;
    for (const [u, nbrs] of rotationSystem) {
      for (const v of nbrs) {
        const key = `${u}->${v}`;
        if (dartsSeen.has(key)) continue;
        let [a, b] = [u, v];
        const maxSteps = rotationSystem.size * 3 + 10;
        for (let steps = 0; steps <= maxSteps; steps++) {
          dartsSeen.add(`${a}->${b}`);
          const nb = rotationSystem.get(b);
          const pos = nb.indexOf(a);
          const next = nb[(pos - 1 + nb.length) % nb.length];
          [a, b] = [b, next];
          if (a === u && b === v) break;
        }
        F++;
      }
    }
    return F;
  }
}

export function eulerCharacteristic(V, E, F) { return V - E + F; }

export function handshakingLemma(graph) {
  let rhs = 0;
  for (const [, edges] of graph.adjacencyList()) rhs += edges.length;
  const lhs = 2 * graph.edgeCount;
  return { lhs, rhs, equal: lhs === rhs };
}
