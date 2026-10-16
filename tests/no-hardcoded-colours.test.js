/**
 * tests/no-hardcoded-colours.test.js
 *
 * Checks that Phase 7 View.js files contain no hardcoded color literals.
 * All colours must be obtained via theme.color('--token').
 *
 * Patterns detected as violations:
 *   - Hex literals:            /#[0-9a-fA-F]{3,6}\b/
 *   - rgb/rgba function calls: /\brgba?\s*\(/
 *   - hsl/hsla function calls: /\bhsla?\s*\(/
 *   - Color keyword strings:   /'red'|'blue'|'green'|'black'|'white'|'orange'|'purple'/
 *                               and double-quoted equivalents
 *
 * Also checks that each file calls theme.color('-- at least once.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');

const PHASE7_VIEWS = [
  'js/benches/physics/waves/wave-interference/WaveInterferenceView.js',
  'js/benches/physics/waves/standing-waves/StandingWavesView.js',
  'js/benches/neuroscience/synaptic/synapse-kinetics/SynapseKineticsView.js',
  'js/benches/math/linear-algebra/eigenvectors/EigenvectorsView.js',
  'js/benches/economics/game-theory/nash-equilibria/NashEquilibriaView.js',
  'js/benches/psychology/learning/prisoner-dilemma/PrisonerDilemmaView.js',
  'js/benches/math/probability/bayes/BayesView.js',
  'js/benches/math/probability/information-theory/InformationTheoryView.js',
].map(f => path.join(REPO_ROOT, f));

// Patterns that indicate a hardcoded colour
const BAD_PATTERNS = [
  { re: /#[0-9a-fA-F]{3,6}\b/, label: 'hex colour literal' },
  { re: /\brgba?\s*\(/, label: 'rgb/rgba() call' },
  { re: /\bhsla?\s*\(/, label: 'hsl/hsla() call' },
  { re: /['"](?:red|blue|green|black|white|orange|purple)['"]/, label: 'color keyword string' },
];

function findViolations(src) {
  const lines = src.split('\n');
  const hits = [];
  for (let ln = 0; ln < lines.length; ln++) {
    const line = lines[ln];
    // Skip comment lines (simple heuristic: starts with optional whitespace then // or *)
    const trimmed = line.trimStart();
    if (trimmed.startsWith('//') || trimmed.startsWith('*')) continue;
    for (const { re, label } of BAD_PATTERNS) {
      if (re.test(line)) {
        hits.push({ lineNo: ln + 1, line: line.trimEnd(), label });
      }
    }
  }
  return hits;
}

describe('no-hardcoded-colours (Phase 7 views)', () => {
  for (const filePath of PHASE7_VIEWS) {
    const rel = path.relative(REPO_ROOT, filePath);
    const src = fs.readFileSync(filePath, 'utf8');

    it(`${rel}: no hardcoded colour values`, () => {
      const violations = findViolations(src);
      assert.deepEqual(
        violations, [],
        `Hardcoded colours found in ${rel}:\n` +
        violations.map(v => `  line ${v.lineNo} [${v.label}]: ${v.line}`).join('\n')
      );
    });

    it(`${rel}: uses theme.color('--...') at least once`, () => {
      assert.ok(
        /theme\.color\(['"]--/.test(src),
        `${rel} does not call theme.color('--...'). All colours must use theme tokens.`
      );
    });
  }
});
