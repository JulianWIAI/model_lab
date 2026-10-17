# Phase 11 — 8 benches

## Plan header (v4)

| Field | Value |
|---|---|
| Baseline commit | `0b68143` (phase-10c) |
| Baseline tests | 982 (0 fail) |
| Anchors script | `tools/anchors-phase11.mjs` v4 — 188 asserts ALL PASS |
| Date | 2026-10-17 |

git log (top 5): d7d8975 plan v2 | d6b2430 phase-10c review | 0b68143 phase-10c MED | 92c651b Phi CF | a0d17fb plan v1
git tags: phase-10, phase-10b, phase-10c

---

## v1->v2->v3->v4 changes

| Version | Topic | Description |
|---|---|---|
| v1->v2 | Bench replacements | Remove elasticity -> langmuir; remove bayesian-observer -> competitive-exclusion |
| v1->v2 | Ising Predict 1 | Ordered start stays ordered; random start has stripe risk |
| v1->v2 | Population coding | Fisher scales as 1/sigma (not 1/sigma^2); ratio ~2, not ~4 |
| v1->v2 | WC I-equation | Uses w_IE*E (not w_EI*E -- typo in v1) |
| v1->v2 | API name | Random.normalSeeded() not .gaussian() |
| v2->v3 | Bench 7 | competitive-exclusion already built; present 3 candidates for user choice |
| v2->v3 | WC Hopf | Exact algebraic preset wEE=8,wEI=4,wIE=12,wII=0,PE=2,PI=-2; tr=0,det=2,omega=sqrt2 |
| v2->v3 | Graph location | Graph.js in bench folder (1 user); not js/core |
| v2->v3 | Graph addEdge | Accepts negative weights; Dijkstra throws on negative |
| v2->v3 | Graph: F | Computed by face tracing (rotation system) not F=E-V+2 |
| v2->v3 | Graph: girth | K3,3 E>2V-4; Petersen E>5(V-2)/3 -> both non-planar |
| v2->v3 | Inequality field | "distribution" not "network-economics" |
| v2->v3 | Inequality zeta bound | err <= zeta(-1/2)*h^1.5 |
| v2->v3 | Pop coding score | sum(r_i/f_i - T)*f_i' everywhere (not -1) |
| v2->v3 | Pop coding Poisson | Poisson sampler via Knuth, not normalSeeded |
| v2->v3 | Pop coding I16/I8 | Assert ~2.0108 at tight tolerance |
| v2->v3 | Pop coding SD/CRB | SD/CRB ~1.04 (popvec) +/-4*SE; replaces vacuous test |
| v2->v3 | Ising L=4 partition | Enumerate all 2^16 configs; verify ground state -32J |
| v2->v3 | Ising MC averaged | Multi-seed (20 seeds) mean+/-4SE; not single seeded threshold |
| v2->v3 | Langmuir R | R=8.314462618 J/mol/K CODATA 2022; marked source |
| v2->v3 | Langmuir vantHoff | vantHoffPoint(T, dH, K_ref, T_ref) method added |
| v2->v3 | Langmuir kinetic | Kinetic route: tau=1/(k_a*p+k_d); consistent with isotherm |
| v2->v3 | Predict answers | All Predict answers asserted in script (R10) |
| v2->v3 | Symbol tables | Per-bench R3 API symbol table in script and plan |
| v3->v4 | Fix 1: Gini bound | Gini error = 2*integral-L error; bound = 2*zeta*h^1.5 ~ 4.63e-6 at n=2000 |
| v3->v4 | Fix 2: Ising MC | Replace 0.5Tc MC with exact L=4 thermo averages; MC vs exact at T=2.5,Tc; stripe test |
| v3->v4 | Fix 3: WC Hopf->Point | Rename Hopf preset->Hopf point; add limit-cycle (wEE=8.5); FD Jacobian; nullcline verify |
| v3->v4 | Fix 4: Graph directed | BF on directed; Dijkstra {allowNegative}; removeEdge/removeNode; Q3 faces; girth BFS; oracle |
| v3->v4 | Fix 5: PopCoding | Fisher FD; I16/I8 tight 1e-9; Poisson RangeError; Predict1 sqrt2; Predict2 1/sigma breakdown |
| v3->v4 | Fix 6: Langmuir | RK4 vs exact kinetic; dt-halving; drop coverageAt; Hill link; concavity grid |
| v3->v4 | Fix 7: Inequality | lorenz RangeError [0,1]; convexity grid |
| v3->v4 | Fix 8: Citations | All research.papers: "(cited, not fetched)" |
| v3->v4 | Fix 9: MWC bench | Replace 3-candidate section with mwc-allosteric (bench 8) |
| v3->v4 | Fix 10: Plan adds | R9 smoke, R11 agent review, R12 audit, report template, ROADMAP item, tag instructions |

---

## Context

Phase 10b/c is complete (982 tests pass). Phase 11 adds 8 benches across Physics, Neuroscience,
Math, Economics, Chemistry, and Biology. It also requires one infrastructure commit (Graph.js,
placed in bench folder, not js/core) before the graph-theory bench.

Anchors verified: `tools/anchors-phase11.mjs` v4 -- 188 asserts pass.

One commit per bench (plus one for Graph.js). `npm test` green before every commit. No push.

---

## Shared infrastructure changes

### New catalog fields (add to `js/catalog.js`)

| Subject | Field id | Label | Benches |
|---|---|---|---|
| Physics | `statistical-mechanics` | Statistical Mechanics | ising |
| Math | `graph-theory` | Graph Theory | graph-theory |
| Economics | `distribution` | Income & inequality | inequality |
| Chemistry | `surface` | Surface Chemistry | langmuir |

Existing fields receiving new benches:

| Subject | Existing field id | New bench ids |
|---|---|---|
| Neuroscience | `networks` | population-coding, wilson-cowan |
| Biology | `biochemistry` | mwc-allosteric |

---

## Bench 1 -- ising (physics/statistical-mechanics/ising)

**Level:** university

### IsingModel.js

2D square lattice, periodic BC, Metropolis algorithm.

State: `L` (>=3 int), `J` (>0), `kB` (>0), `T` (>0), `seed`.
Methods: `energy()`, `magnetisation()`, `sweep(n)`, `reset(init,seed)`, `deltaE(row,col)`, `get Tc()`, `get Kc()`.

Key anchors (from script):
- Kc = ln(1+sqrt2)/2, Tc = 2.2691853142130221
- Yang m(Tc/2) = (63/64)^(1/8) = 0.9980333916921637
- L=4 ground state E = -32J, degeneracy = 2
- L=4 exact <|m|> at T=2.5 = 0.76471239322120
- L=4 exact <|m|> at Tc = 0.84386044481343
- Stripe test L=16: E = -448J

### Tests (>=9)

- sinh(2*Kc) = 1 +/-1e-14
- Tc = 2.2691853142130221 +/-1e-14
- L=4 ordered: energy() = -32J, |magnetisation()| = 1
- deltaE at ordered (0,0) = 8J
- Yang formula: (63/64)^(1/8) = 0.9980333916921637
- MC L=4 vs exact: |mean-exact| < 4*SE at T=2.5
- Stripe test: top/bottom half E = -448J
- T=0 -> RangeError, L=2 -> RangeError

### Where it breaks
- Metropolis is slow near Tc (critical slowing down)
- ~4% of random-start runs at T=0.5Tc (L=16, 400 sweeps) freeze in a striped metastable state with |m|~0.078. Use ordered start or Wolff algorithm to avoid.

### research.papers (cited, not fetched)
- Ising (1925), Onsager (1944), Yang (1952)

---

## Bench 2 -- population-coding (neuroscience/networks/population-coding)

**Level:** graduate

### PopulationCodingModel.js

N neurons, Gaussian tuning, Poisson Fisher info, CRB, popvec + MLE decoders.

State: `N` (>=2), `rMax` (>0), `sigma` (>0), `T` (>0; rMax*T>100 -> RangeError), `seed`.
Methods: `tuning(i,theta)`, `fisherInfo(theta)`, `sigmaCRB(theta)`, `drawSpikes(theta)`, `popVectorEstimate(spikes)`, `mlEstimate(spikes)`, `tuningCurves(nPoints)`.

Key anchors:
- I(N=16)/I(N=8) = 2.0108233662082 (tight tolerance 1e-9)
- I(sigma=0.5)/I(sigma=1) ~ 2.034 (1/sigma scaling)
- Fisher FD vs analytic: agree +/-1e-8
- SD/CRB(popvec) ~ 1.04 +/-4*SE

### Tests (>=7)

- Fisher two-way (direct sum vs fisherInfo()) agree +/-1e-10
- Single neuron at preferred: Fisher contribution = 0
- sigma-scaling: I(0.5)/I(1) ~ 2.034 +/-0.1
- N-scaling: I(16)/I(8) = 2.0108233662082 +/-1e-9
- sigma_CRB = 1/sqrt(I) +/-1e-14
- popvec SD/CRB ~ 1.04 +/-4*SE
- RangeError when rMax*T > 100

### research.papers (cited, not fetched)
- Seung & Sompolinsky (1993), Pouget, Dayan & Zemel (2000)

---

## Bench 3 -- wilson-cowan (neuroscience/networks/wilson-cowan)

**Level:** graduate

### WilsonCowanModel.js

Two coupled populations (E, I), sigmoid, RK4 integration.

State: `wEE,wEI,wIE,wII,tauE,tauI,PE,PI,rE,rI,kappa,thetaS`.
Methods: `dEdt(E,I)`, `dIdt(E,I)`, `sigmoid(x)`, `sigmoidPrime(x)`, `fixedPoints()`, `jacobian(E,I)`, `stability(E,I)`, `run(E0,I0,tMax,dt)`, `nullclineE()`, `nullclineI()`.

Presets:
- **Default** (wEE=12,wEI=4,wIE=13,wII=11,PE=-2,PI=-3.5): 3 FPs (stable-node, saddle, stable-node)
- **Hopf point** (wEE=8,wEI=4,wIE=12,wII=0,PE=2,PI=-2): FP=(0.5,0.5) exactly, tr=0, det=2, omega=sqrt2
- **Limit cycle** (wEE=8.5, rest as Hopf point): tr>0, det>0, peak-to-peak amplitude ~0.289

### Tests (>=10)

- S(0) = 0.5 (kappa=1, thetaS=0)
- S'(x) = S(x)*(1-S(x))
- FP residuals < 1e-10; stability types correct
- RK4 convergence to FP1/FP3: |err|<1e-8 at t=50
- Saddle test: perturbation along unstable eigenvector grows > 0.1
- FD Jacobian vs analytic +/-1e-8 (with tau/r params)
- Hopf point: tr=0, det=2 +/-1e-14
- Limit cycle: peak-to-peak > 0.1
- Nullclines: 10 points verified +/-1e-10
- dt-halving ratio ~ 16 (4th order)

### research.papers (cited, not fetched)
- Wilson & Cowan (1972)

---

## [infra] Graph.js

**File:** `js/benches/math/graph-theory/graph-theory/Graph.js`

### API

```
class Graph {
  constructor({ directed = false })
  addNode(id), addEdge(u,v,weight=1), removeEdge(u,v), removeNode(id)
  degree(v), degrees(), adjacencyList()
  dijkstra(source, {allowNegative=false})  // throws RangeError on negative (default)
  bellmanFord(source)                       // returns null if negative cycle
  bfs(source), dfs(source)
  faces(rotationSystem)                     // face count F via rotation system
  isConnected(), components()
  get nodeCount(), get edgeCount()
}
export function eulerCharacteristic(V, E, F)
export function handshakingLemma(graph)
```

### Tests (>=9)

- Dijkstra 5-node: A->D = 4
- Dijkstra throws RangeError on negative weight
- Bellman-Ford directed negative-weight: correct distances
- BF returns null on negative cycle
- BFS hop-distances
- faces(K4 rotation) = 4; faces(Q3 rotation) = 6
- Euler: V-E+F = 2 for K4, Q3
- Handshaking: 2|E| = sum(deg)
- removeEdge, removeNode work correctly
- Oracle: Dijkstra and BF agree on positive-weight graph

---

## Bench 4 -- graph-theory (math/graph-theory/graph-theory)

**Level:** university. Explorer bench using Graph.js.

### Tests (>=5)

- Euler K4, Q3
- Disconnected: V-E+F = 1+C
- Handshaking
- Dijkstra reference
- Tree: E = V-1

---

## Bench 5 -- inequality (economics/distribution/inequality)

**Level:** intro. Field: `distribution`.

### InequalityModel.js

Lorenz curve and Gini for Pareto, Uniform, Exponential.

State: `dist`, `alpha`, `b`, `lambda`.
Methods: `lorenz(p)` (RangeError if p not in [0,1]), `gini()`, `giniNumerical(nPoints=2000)`, `topShare(q)`, `lorenzCurve(nPoints)`.

Key anchors:
- Gini bound: 2 * |zeta(-1/2)| * h^1.5 ~ 4.63e-6 at n=2000
- Lorenz convexity verified on grid

### Tests (>=9)

- Gini algebraic (5 distributions)
- lorenz(0)=0, lorenz(1)=1
- lorenz(p) <= p
- Convexity: lorenz(mid) <= (lorenz(p1)+lorenz(p2))/2 + 1e-12
- topShare
- giniNumerical <= Gini bound
- lorenz RangeError outside [0,1]

### research.papers (cited, not fetched)
- Lorenz (1905), Gini (1912)

---

## Bench 6 -- langmuir (chemistry/surface/langmuir)

**Level:** university

### LangmuirModel.js

State: `K` (>0), `pMin`, `pMax`.
Methods: `coverage(p)`, `halfCoverageP()`, `langmuirPlot()`, `isothermCurve()`, `vantHoffPoint(T,dH,K_ref,T_ref)`, `kineticRelaxationRate(p,k_ads,k_des)`, `kineticCurve(theta0,p,k_ads,k_des,tMax)`.

Note: `coverageAt` removed (v4 fix 6); use `coverage(p)` only.

### Tests (>=9)

- coverage(0)=0, coverage at Kp=1 = 0.5, coverage at Kp=9 = 0.9
- p/theta = 1/K + p (linearised)
- halfCoverageP = 1/K
- vantHoff dH=0 -> K unchanged; ln ratio
- Kinetic RK4 vs exact +/-1e-8
- dt-halving ~ 16
- Concavity grid
- Hill n=1 = Langmuir
- RangeError p<0, K<=0

### research.papers (cited, not fetched)
- Langmuir (1918)

---

## Bench 7 -- mwc-allosteric (biology/biochemistry/mwc-allosteric)

**Level:** graduate

### MWCModel.js

MWC two-state allosteric model.

State: `n` (int>=1), `L` (>0), `c` (0<c<=1), `K_R` (>0), `alphaMax`.
Methods: `saturation(alpha)`, `rStateFraction(alpha)`, `enumeratedSaturation(alpha)` (n<=12), `halfSaturationAlpha()`, `hillCoeff()`, `curve(alphaMax,nPoints)`.

Key anchors:
- R(0) = 1/(1+L) = 1/101 at L=100
- c=1: reduces to Langmuir (Y=alpha/(1+alpha))
- n=1: Y = alpha*K_eff/(1+alpha*K_eff) where K_eff = (1+Lc)/(1+L)
- Hill coeff h ~ 2.362 (n=4, L=100, c=0.01); h>1 (cooperative), h<n
- c=1 -> h=1 (non-cooperative)
- Enumeration vs closed form agree +/-1e-12

### Tests (>=8)

- saturation(0) = 0
- rStateFraction(0) = 1/(1+L)
- enum vs closed-form at alpha=0.5,1,5
- c=1 -> Langmuir
- n=1 reduction
- hillCoeff > 1
- saturation(1e6) -> 1
- RangeError for bad params (n<1, L<=0, c>1, c<=0)

### research.papers (cited, not fetched)
- Monod, Wyman & Changeux (1965)

---

## R3 Symbol Tables

| Model | Core APIs used |
|---|---|
| IsingModel | `Random.next()`, `new Random(seed)` |
| PopulationCodingModel | `Random.next()` [Poisson via Knuth], `RootFinding.brent` [MLE refine] |
| WilsonCowanModel | `Integrators.rk4`, `LinAlg.eigen2x2`, `RootFinding.brent` [Newton] |
| Graph.js (bench) | (standalone -- no js/core imports) |
| InequalityModel | (pure math -- no js/core imports) |
| LangmuirModel | `Integrators.rk4` [kinetic route] |
| MWCModel | `RootFinding.brent` [halfSaturationAlpha] |

---

## R4 Domain Tables

| Model | Domain | RangeError |
|---|---|---|
| IsingModel | L>=3 int, J>0, kB>0, T>0, seed any | T<=0, L<3, J<=0 |
| PopCodingModel | N>=2, rmax>0, sigma>0, T>0 | rmax*T>100 (Knuth diverges) |
| WilsonCowan | wEE,wEI,wIE,wII>=0; kappa>0; tauE,tauI>0; PE,PI any | kappa<=0, tau<=0 |
| Graph.dijkstra | non-negative weights | negative edge weight (default) |
| Graph.addEdge | any real weight | (no throw) |
| InequalityModel | alpha>1 (Pareto); b>0 (Uniform); lambda>0 (Exp) | lorenz: p outside [0,1] |
| LangmuirModel | K>0; p>=0 | K<=0; p<0 |
| MWCModel | n>=1 int; L>0; 0<c<=1; K_R>0 | n<1, L<=0, c<=0, c>1 |

---

## Implementation order

1. `[infra] Graph.js` -- bench folder + tests/math/graph.test.js
2. `ising` -- L=32 default; MC tests use L=4 for exact comparison
3. `population-coding` -- Gaussian tuning + Poisson Fisher info
4. `wilson-cowan` -- RK4 + Newton + Hopf point + limit cycle
5. `graph-theory` -- explorer bench using Graph.js
6. `inequality` -- closed-form Lorenz + Gini + zeta bound
7. `langmuir` -- isotherm + vantHoff + kinetic RK4
8. `mwc-allosteric` -- two-state allosteric + enumeration

One commit per item. `npm test` before every commit.

---

## R9 (Smoke tests)

Before each bench commit: `npm run smoke -- --bench <id>` (2 viewports: light/1280 + dark/400)
After all benches: `npm run smoke` (full 4-viewport run; target < 4 min)

## R11 (Independent agent review)

After all commits: spawn a separate agent to review all Phase 11 model files,
test files, and plan for R8-type issues (wrong math, vacuous tests, missing guards).
Record findings in `docs/reviews/phase-11-agent-findings.md`.
MED/HIGH issues: fix before tagging or justify in writing.

## R12 (Audit table)

Run `node tools/gen-test-audit-phase11.mjs` to generate test audit (PRESENT/WEAK/MISSING).
Results appear in `docs/reviews/phase-11-test-audit.md`.

---

## Report template

Section 0: Baseline and summary (table: tag, commit, tests, notes)
Section 1: Tests added (per bench)
Section 2: R8 flags corrected
Section 3: SOURCES fetch attempts (all "cited, not fetched")
Section 4: Commit list
Section 5: Known deferred items
Section 6: R9 smoke test results
Section 7: R12 audit (PRESENT/WEAK/MISSING counts)
Section 9: Independent agent review (R11) findings

---

## ROADMAP item (deferred)

Navigation at 400 px pushes the bench several screens below the fold when there are many subjects;
UI/UX pass later (next project) -- track as deferred.

## Tag instructions

After all commits: `git tag phase-11 HEAD` (do NOT move existing tags phase-10, phase-10b, phase-10c)

---

## Estimated tests per bench

| Bench | Est. new tests | Running total |
|---|---|---|
| [infra] Graph.js | +9 | 991 |
| ising | +9 | 1000 |
| population-coding | +7 | 1007 |
| wilson-cowan | +10 | 1017 |
| graph-theory | +5 | 1022 |
| inequality | +9 | 1031 |
| langmuir | +9 | 1040 |
| mwc-allosteric | +8 | 1048 |
| **Total** | **+66** | **~1048** |

---

## Appendix: Reference algorithms (from anchors script)

### refDijkstra
```js
function refDijkstra(adj, source, nodes) {
  const dist = {};
  for (const v of nodes) dist[v] = Infinity;
  dist[source] = 0;
  const visited = new Set();
  while (true) {
    let u = null;
    for (const v of nodes)
      if (!visited.has(v) && (u === null || dist[v] < dist[u])) u = v;
    if (u === null || dist[u] === Infinity) break;
    visited.add(u);
    for (const {to, w} of (adj[u] || []))
      if (dist[u] + w < dist[to]) dist[to] = dist[u] + w;
  }
  return dist;
}
```

### refBFS
```js
function refBFS(adj, source, nodes) {
  const dist = {};
  for (const v of nodes) dist[v] = Infinity;
  dist[source] = 0;
  const queue = [source]; let qi = 0;
  while (qi < queue.length) {
    const u = queue[qi++];
    for (const {to} of (adj[u] || []))
      if (dist[to] === Infinity) { dist[to] = dist[u] + 1; queue.push(to); }
  }
  return dist;
}
```
