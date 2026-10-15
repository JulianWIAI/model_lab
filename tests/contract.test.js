/**
 * Contract tests — static analysis.
 *
 * Scans every *Bench.js and *View.js for method calls on `this.layout`,
 * axes objects, and ReadoutPanel instances, then asserts each called
 * method actually exists in the real class source.
 *
 * Runs in Node without a browser; no DOM is needed because the test
 * reads source text rather than importing the classes.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '..');

// ── helpers ───────────────────────────────────────────────────────────────────

function readSource(relPath) {
  return fs.readFileSync(path.join(REPO, relPath), 'utf8');
}

/** Collect all .js files under a directory tree. */
function jsFiles(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...jsFiles(full));
    else if (entry.name.endsWith('.js')) results.push(full);
  }
  return results;
}

/** Extract every `receiver.method(` call from source text. */
function methodCalls(src, receiver) {
  const re = new RegExp(`\\b${receiver}\\.([a-zA-Z_$][\\w$]*)\\s*[(?]`, 'g');
  const methods = new Set();
  for (const m of src.matchAll(re)) methods.add(m[1]);
  return methods;
}

/** Collect public method and getter names defined in a class source file. */
function classMembers(src) {
  const names = new Set();
  // Method definitions:  methodName(  or  async methodName(  or  #methodName( (private, skip)
  for (const m of src.matchAll(/^\s+(?:async\s+)?([a-zA-Z_$][\w$]*)\s*\(/gm)) {
    names.add(m[1]);
  }
  // Getter definitions:  get propName()
  for (const m of src.matchAll(/\bget\s+([a-zA-Z_$][\w$]*)\s*\(/g)) {
    names.add(m[1]);
  }
  return names;
}

// ── 1. BenchLayout contract ────────────────────────────────────────────────────

test('BenchLayout: all this.layout.X() calls in bench files have a matching method', () => {
  const benchDir = path.join(REPO, 'js/benches');
  const layoutSrc = readSource('js/ui/BenchLayout.js');
  const defined = classMembers(layoutSrc);

  const calledMethods = new Set();
  for (const file of jsFiles(benchDir)) {
    if (!file.endsWith('Bench.js')) continue;
    const src = fs.readFileSync(file, 'utf8');
    for (const m of methodCalls(src, 'this\\.layout')) calledMethods.add(m);
  }

  const missing = [...calledMethods].filter(m => !defined.has(m));
  assert.deepStrictEqual(
    missing,
    [],
    `BenchLayout is missing methods called by bench files: ${missing.join(', ')}`,
  );
});

// ── 2. ReadoutPanel contract ───────────────────────────────────────────────────
// Checks benches that create a ReadoutPanel via `new ReadoutPanel([...])`:
// every key passed to `this.readouts.set('key', ...)` must be registered
// in the same file's ReadoutPanel constructor.
//
// Benches that call `this.layout.setReadout('key', ...)` without mounting
// a ReadoutPanel are NOT checked here — that pattern is a silent no-op by
// design (see BenchLayout.setReadout) and is caught at runtime by the
// Playwright smoke test.

test('ReadoutPanel: readouts.set(key) keys are registered in the same bench file', () => {
  const benchDir = path.join(REPO, 'js/benches');

  const failures = [];
  for (const file of jsFiles(benchDir)) {
    if (!file.endsWith('Bench.js')) continue;
    const src = fs.readFileSync(file, 'utf8');

    // Only apply to benches that actually construct a ReadoutPanel
    if (!src.includes('new ReadoutPanel(')) continue;

    // Keys registered:  { key: 'foo' }  or  { id: 'foo' }
    const registeredKeys = new Set();
    for (const m of src.matchAll(/\{\s*(?:key|id)\s*:\s*['"]([^'"]+)['"]/g)) {
      registeredKeys.add(m[1]);
    }

    // Keys used via the local readouts panel: this.readouts.set('foo', ...)
    const usedKeys = new Set();
    for (const m of src.matchAll(/this\.readouts?\s*\.set\s*\(\s*['"]([^'"]+)['"]/g)) {
      usedKeys.add(m[1]);
    }

    // Every used key must be registered
    for (const k of usedKeys) {
      if (!registeredKeys.has(k)) {
        failures.push(`${path.relative(REPO, file)}: key '${k}' used but not registered`);
      }
    }
  }

  assert.deepStrictEqual(failures, [], failures.join('\n'));
});

// ── 3. Axes contract ──────────────────────────────────────────────────────────

test('Axes: all axes.X() calls in view files have a matching method or getter', () => {
  const benchDir = path.join(REPO, 'js/benches');
  const axesSrc = readSource('js/core/Axes.js');
  const defined = classMembers(axesSrc);

  const calledMethods = new Set();
  for (const file of jsFiles(benchDir)) {
    if (!file.endsWith('View.js')) continue;
    const src = fs.readFileSync(file, 'utf8');
    // Collect calls on any variable named 'axes', 'axTop', 'axBot', 'ax'
    for (const varName of ['axes', 'axTop', 'axBot', 'axLeft', 'axRight', 'ax']) {
      for (const m of methodCalls(src, varName)) calledMethods.add(m);
    }
  }

  // Exclude JS built-ins that might be matched from array/object methods
  const builtins = new Set(['length', 'forEach', 'map', 'filter', 'push', 'pop', 'slice']);
  const missing = [...calledMethods].filter(m => !defined.has(m) && !builtins.has(m));

  assert.deepStrictEqual(
    missing,
    [],
    `Axes is missing methods/getters called by view files: ${missing.join(', ')}`,
  );
});
