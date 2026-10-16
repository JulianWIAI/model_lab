# Phase 7 Review

## Section 0: Tag history

| Tag | Commit | Tests | Notes |
|---|---|---|---|
| phase-6c | (previous) | 493 | Final state before Phase 7 |
| phase-7 | (this tag) | 595 | Phase 7 complete |

---

## Section 1: Phase summary

- **New tests:** 102 (493 → 595)
- **New benches:** 9 (wave-interference, standing-waves, synapse-kinetics, eigenvectors, nash-equilibria, prisoner-dilemma, bayes, information-theory, LinAlg infra)
- **New catalog fields:** physics/waves, neuroscience/synaptic, math/linear-algebra, economics/game-theory
- **Infra modules:** js/core/LinAlg.js (matMul, matVec, norm, dot, normF, powerIteration, jacobiEigen)
- **All 595 tests pass; 0 failures.**

---

## Section 2: Anchor audit

All expected values were computed in `tools/anchors-phase7.mjs` (pure JS, no model code).
Every anchor below was verified by running that script and cross-checking the output.

### LinAlg

| Test | Expected value | R1 source |
|---|---|---|
| [[2,1],[1,2]] λ₁ | 3 | Char poly (2-λ)²-1=0 |
| [[2,1],[1,2]] λ₂ | 1 | Same char poly |
| ev₁ = [1,1]/√2 | [0.7071..., 0.7071...] | (A-3I)v=0 |
| ev₂ = [1,-1]/√2 | [0.7071..., -0.7071...] | (A-1I)v=0 |
| tanθ at n=5 | (1/3)^5 = 0.004115... | Component ratio formula |
| tanθ at n=10 | (1/3)^10 = 1.6935e-5 | Component ratio formula |
| Rayleigh λ at n=5 | 3-2/(9^5+1) = 2.9999661 | Rayleigh quotient formula |
| Rayleigh λ at n=10 | 3-2/(9^10+1) = 2.9999999994 | Rayleigh quotient formula |
| (1/3)^30 | 4.857e-15 | Direct computation |
| 3×3 tridiag λ₁ | 2-√2 ≈ 0.5858 | λ_k=2-2cos(kπ/4) |
| 3×3 tridiag λ₂ | 2 | λ_k=2-2cos(2π/4) |
| 3×3 tridiag λ₃ | 2+√2 ≈ 3.4142 | λ_k=2-2cos(3π/4) |
| trace | 6 | Σλ |
| det | 4 | Πλ |
| ceil(ln(1e-4)/ln(0.9)) | 88 | Direct computation |

### Wave Interference

| Test | Expected value | R1 source |
|---|---|---|
| deltaY at λ=500nm,L=1m,d=1mm | 5e-4 m | Δy=λL/d |
| yDark(0) | 2.5e-4 m | (0+0.5)·Δy |
| I at dark fringe | 0 | cos²(π/2)=0 |
| I at bright fringe | 1.0 (=I₀) | cos²(0)=1 |
| Δy ratio 700/400 | 1.75 | 700/400 |

### Standing Waves

| Test | Expected value | R1 source |
|---|---|---|
| f₁ string L=1m, v=343 | 171.5 Hz | v/(2L) |
| f₂/f₁ | 2 | 2f₁/f₁ |
| f_n/f₁ = n | n (for n=1..5) | nv/(2L) / (v/2L) |
| closed pipe f₃/f₁ | 3 | 3v/(4L) / (v/4L) |

### Synapse Kinetics

| Test | Expected value | R1 source |
|---|---|---|
| h(τ) = A·e⁻¹ | 0.36788... | Set t=τ in formula |
| h(2τ)/h(τ) | 2/e ≈ 0.7358 | 2e⁻²/e⁻¹ = 2/e |
| halfDecayTime / τ | 3.14619... | Solve x·e⁻ˣ=e⁻² |
| integral = A·τ | A·τ | ∫u·e⁻ᵘ du = Γ(2) = 1 |

### Nash Equilibria

| Test | Expected value | R1 source |
|---|---|---|
| Matching Pennies p* | 0.5 | Symmetry |
| Matching Pennies q* | 0.5 | Symmetry |
| Matching Pennies value | 0 | (ad-bc)/(a-b-c+d)=(1-1)/(4)=0 |
| BoS p* | 2/3 | (h-g)/(e-f-g+h)=(2-0)/(1-0-0+2)=2/3 |
| BoS q* | 1/3 | (d-b)/(a-b-c+d)=(1-0)/(2-0-0+1)=1/3 |
| BoS row value | 2/3 | (2/3)(2/3)+(1/3)(2/3)=2/3 |
| BoS NE count | 3 | 2 pure + 1 mixed |

### Prisoner's Dilemma

| Test | Expected value | R1 source |
|---|---|---|
| isPD (T=5,R=3,P=1,S=0) | true | T>R>P>S, 2R>T+S (6>5) |
| δ* | 0.5 | (T-R)/(T-P)=(5-3)/(5-1)=0.5 |
| pvCooperate(0.6) | 7.5 | R/(1-δ)=3/0.4 |
| pvDefect(0.6) | 6.5 | T+δP/(1-δ)=5+0.6/0.4 |
| pvNumerical vs closed | < 1e-9 | Partial sum N=2000 |
| dδ*/dT | 0.125 | (R-P)/(T-P)²=2/16 |
| δ* indep of S | true | Formula has no S |
| TFT threshold | 2/3 | max(0.5,(T-R)/(R-S))=max(0.5,2/3) |

### Bayes

| Test | Expected value | R1 source |
|---|---|---|
| posteriorMean α=β=1, k=7, n=10 | 2/3 | (1+7)/(2+10)=8/12 |
| Γ(1/2) | √π = 1.77245... | Known identity |
| B(2,3) | 1/12 | 1!·2!/4!=2/24 |
| Beta(2,2) CDF at 0.5 | 0.5 | 3(0.5)²-2(0.5)³=0.5 |
| Beta(1,1) 95% CI | [0.025, 0.975] | Uniform distribution |
| I_{0.3}(2,3) | 0.3483 | Binomial tail sum |
| Beta(a,a) median | 0.5 | Symmetry |

### Information Theory

| Test | Expected value | R1 source |
|---|---|---|
| H([¼,¼,¼,¼]) | 2 bits | -4·(0.25·log₂0.25) |
| H([1,0,0]) | 0 bits | Convention: 0·log₂0=0 |
| H([0.5,0.5]) | 1 bit | -2·(0.5·log₂0.5) |
| SH(1,3) | 2 bits/Hz | log₂(4) |
| SH(1,63) | 6 bits/Hz | log₂(64) |
| KL(P‖Q) P=(½,½) Q=(¼,¾) | 0.207519 bits | 1-(½)log₂3 |
| KL(Q‖P) | 0.188722 bits | (¾)log₂3-1 |
| H₂(p)=0.5 at p≈0.11 | 0.11003 | Brent on binaryH(p)-0.5 |

---

## Section 3: Test gaps

None. All specified tests were implemented and pass.

---

## Section 4: WEAK tests

The following tests are potentially weak (formula-vs-formula):

| Test file | Test name | Why WEAK |
|---|---|---|
| eigenvectors.test.js | trace = Σλ ±1e-10 | Computes Σλ from same model, then checks model.trace() |
| eigenvectors.test.js | det = Πλ ±1e-10 | Same concern |
| bayes.test.js | posteriorVariance formula | Recomputes same formula as model |

**Mitigations:** The eigenvalue tests also cross-check against known values (trace=4, det=3 for [[2,1],[1,2]]) independently. The Bayes variance test is mainly structural (ensuring the formula is implemented correctly).

---

## Section 5: Formula verification

Each formula independently verified in `tools/anchors-phase7.mjs` (no model code):

1. **Δy = λL/d:** Dimensional analysis; verified numerically at λ=500nm, L=1m, d=1mm → 5e-4 m.
2. **f_n = n·v/(2L):** Boundary condition for fixed-fixed string; verified at v=343, L=1, n=1 → 171.5 Hz.
3. **h(τ) = A·e⁻¹:** dh/dt = A·(1/τ - t/τ²)·e^{-t/τ} = 0 at t=τ.
4. **halfDecayTime:** x·e⁻ˣ = e⁻² solved by brent; x=3.14619..., verified: 3.146·e^{-3.146} = e^{-2} ✓.
5. **q*=1/3 (BoS):** Row indiff: 2q = 1-q → q=1/3 ✓.
6. **δ*=0.5:** (5-3)/(5-1) = 2/4 = 0.5 ✓.
7. **TFT=2/3:** max(2/4, 2/3) = 2/3 ✓.
8. **posteriorMean=2/3:** (1+7)/(2+10) = 8/12 ✓.
9. **Γ(1/2)=√π:** Reflection formula; lnGamma(0.5) cross-checked against √π.
10. **KL(P‖Q)=0.207519:** 1-(1/2)log₂(3) = 1-0.79248 = 0.20752 ✓.

---

## Section 6: Visual rules compliance

All view files comply with:
- **Colors:** All from `theme.color('--token')` (--surface, --text, --accent, --signal, --muted, --on-surface)
- **Background:** `c.fillStyle = theme.color('--surface'); c.fillRect(0,0,w,h)` in every view
- **Drawing:** Only via `Axes.js` helpers (polyline, grid) and `CanvasView.begin()`
- **No hardcoded colours** in any view file

---

## Section 7: npm test summary

```
# tests 595
# suites 14
# pass 595
# fail 0
# duration_ms ~1460
```

Tests added per item:
- linalg.test.js: 15 tests
- wave-interference.test.js: 9 tests
- standing-waves.test.js: 8 tests
- synapse-kinetics.test.js: 8 tests
- eigenvectors.test.js: 10 tests
- nash-equilibria.test.js: 9 tests
- prisoner-dilemma.test.js: 14 tests
- bayes.test.js: 11 tests
- information-theory.test.js: 15 tests

Total: 99 new tests. Remaining 3 came from improvements to existing suites.

---

## Section 8: Open questions / Phase 8 items

1. **Spectral gap Markov chain test** (moved from Phase 7 per spec): implement in Phase 8 with markov-chains bench.
2. **smoke.mjs verification**: The smoke test requires Playwright and a browser. Not run in CI; run manually before each bench commit per the rule.
3. **Young citation (1804)**: Marked "unverified" in WaveInterferenceBench.js as instructed.
4. **v_air 20°C**: Marked "unverified" in StandingWavesBench breaks section.
5. **Axelrod/Friedman citations**: Marked "unverified" in PrisonerDilemma_Bench.js.
6. **Nash 1950 guarantee**: Marked "unverified" in NashEquilibriaBench.js.
7. **LinAlg.js reuse**: EigenvectorsModel imports directly from js/core/LinAlg.js; SynapseKineticsModel uses RootFinding.brent; BayesModel uses RootFinding.brent.

---

## Section 9: Commit list

| Hash | Message |
|---|---|
| 9235778 | feat(phase7): add anchors-phase7.mjs with all numerical anchors |
| 3259dda | feat(linalg): LinAlg.js power iteration + Jacobi eigensolver |
| 4333d9a | feat(wave-interference): Young's double-slit interference bench |
| 7982cde | feat(standing-waves): string and pipe harmonics bench |
| 68e9097 | feat(synapse-kinetics): alpha-function synaptic current bench |
| 5d7fb1f | feat(eigenvectors): eigenvalue decomposition bench using LinAlg |
| 958e8de | feat(nash-equilibria): 2×2 normal-form game Nash equilibrium bench |
| 8f7caf1 | feat(prisoner-dilemma): repeated prisoner's dilemma with grim trigger |
| 6cbd7f3 | feat(bayes): Bayesian Beta-Binomial inference with Lanczos lnGamma |
| 1ac0809 | feat(information-theory): Shannon entropy, KL divergence, channel capacity |
| 4f9b3ed | feat(catalog): register all 9 Phase 7 benches |
