/**
 * tests/theme-tokens.test.js
 *
 * Node.js-only test (no browser). Checks that every CSS custom property
 * referenced via theme.color('--token') in js/**‌/*.js files is defined
 * in css/tokens.css for BOTH the light theme (:root) AND the dark theme
 * (:root[data-theme="dark"] / @media prefers-color-scheme: dark).
 *
 * This test FAILS at ba9ced2 (--surface, --text, --on-surface missing)
 * and PASSES at HEAD (all three added in c5aa51f).
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');

// ── Step 1: Collect all JS files under js/ (excluding node_modules) ──────────

function collectJsFiles(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectJsFiles(full));
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      results.push(full);
    }
  }
  return results;
}

const jsFiles = collectJsFiles(path.join(REPO_ROOT, 'js'));

// ── Step 2: Extract token names from theme.color('--token') calls ─────────────

const themeColorRe = /theme\.color\(\s*["'](-{2}[a-z][a-z0-9-]*)["']\s*\)/g;

const tokensFromJs = new Set();
for (const file of jsFiles) {
  const src = fs.readFileSync(file, 'utf8');
  for (const m of src.matchAll(themeColorRe)) {
    tokensFromJs.add(m[1]);
  }
}

// ── Step 3: Parse css/tokens.css ──────────────────────────────────────────────

const cssPath = path.join(REPO_ROOT, 'css/tokens.css');
const css = fs.readFileSync(cssPath, 'utf8');

// Find tokens defined in light :root (outside any media/selector block)
// We scan the top-level :root { ... } block.
function extractTokensInBlock(blockText) {
  const re = /(--[a-z][a-z0-9-]*)\s*:/g;
  const tokens = new Set();
  for (const m of blockText.matchAll(re)) {
    tokens.add(m[1]);
  }
  return tokens;
}

// Parse blocks naively: find :root { ... } (light, no media wrapper)
// and dark blocks.

// Light :root — everything before @media (and :root[data-theme="dark"])
// Strategy: split by major blocks and classify.
const lightTokens = new Set();
const darkTokens = new Set();

// Extract all :root { ... } and media/selector blocks
// We'll use a bracket-depth scanner.
let i = 0;
const len = css.length;

function skipToChar(s, start, ch) {
  let depth = 0;
  for (let j = start; j < s.length; j++) {
    if (s[j] === '{') depth++;
    if (s[j] === '}') {
      depth--;
      if (depth === 0) return j;
    }
  }
  return s.length - 1;
}

// Find all top-level rule blocks: scan for '{', extract selector and block.
i = 0;
while (i < len) {
  // skip whitespace and comments
  if (css[i] === '/' && css[i+1] === '*') {
    const end = css.indexOf('*/', i + 2);
    i = end < 0 ? len : end + 2;
    continue;
  }
  const braceStart = css.indexOf('{', i);
  if (braceStart < 0) break;

  const selector = css.slice(i, braceStart).trim();
  const braceEnd = skipToChar(css, braceStart, '}');
  const block = css.slice(braceStart + 1, braceEnd);

  const isDark =
    selector.includes('prefers-color-scheme: dark') ||
    selector.includes('data-theme="dark"') ||
    selector.includes("data-theme='dark'");

  if (!isDark && selector.includes(':root')) {
    // light :root — but may also contain nested dark blocks if we got a media block
    for (const t of extractTokensInBlock(block)) lightTokens.add(t);
  } else if (isDark) {
    // dark block — may contain a nested :root selector
    for (const t of extractTokensInBlock(block)) darkTokens.add(t);
  } else if (selector.includes('@media')) {
    // media block — recurse: look for nested :root
    // Re-scan the block body
    const innerBraceStart = block.indexOf('{');
    if (innerBraceStart >= 0) {
      const innerBraceEnd = skipToChar(block, innerBraceStart, '}');
      const innerBlock = block.slice(innerBraceStart + 1, innerBraceEnd);
      const innerSelector = block.slice(0, innerBraceStart).trim();
      if (innerSelector.includes(':root')) {
        for (const t of extractTokensInBlock(innerBlock)) darkTokens.add(t);
      }
    }
  }

  i = braceEnd + 1;
}

// ── Step 4: Check all JS-referenced tokens are defined in both themes ─────────

describe('theme-tokens', () => {
  it('all tokens in js/**/*.js theme.color() calls are defined in :root (light)', () => {
    const missing = [...tokensFromJs].filter(t => !lightTokens.has(t));
    assert.deepEqual(
      missing, [],
      `Tokens missing from light :root in css/tokens.css:\n  ${missing.join(', ')}\n` +
      `(Light tokens found: ${[...lightTokens].sort().join(', ')})`
    );
  });

  it('all tokens in js/**/*.js theme.color() calls are defined in dark theme', () => {
    // A token is "defined for dark" if:
    //   (a) it is explicitly declared in the dark block, OR
    //   (b) it is declared in light as `--t: var(--u)` and --u is defined in dark
    //       (the alias inherits the dark value through CSS variable resolution).
    // This matches runtime browser behaviour: at ba9ced2 --surface etc. were
    // completely absent from the file, so (b) could not apply. At HEAD they exist
    // in light with var() references to tokens that ARE in dark.

    // Build a map of light var()-aliases: token → referenced token
    const lightAliases = new Map(); // '--surface' → '--panel'
    const lightAliasRe = /(--[a-z][a-z0-9-]*)\s*:\s*var\((--[a-z][a-z0-9-]*)\)/g;
    for (const m of css.matchAll(lightAliasRe)) {
      lightAliases.set(m[1], m[2]);
    }

    function definedInDark(token) {
      if (darkTokens.has(token)) return true;
      // Check if it's a var()-alias whose target is in dark
      const target = lightAliases.get(token);
      if (target && darkTokens.has(target)) return true;
      return false;
    }

    const missing = [...tokensFromJs].filter(t => !definedInDark(t));
    assert.deepEqual(
      missing, [],
      `Tokens missing from dark theme in css/tokens.css:\n  ${missing.join(', ')}\n` +
      `(Dark tokens found: ${[...darkTokens].sort().join(', ')})\n` +
      `(Light aliases: ${[...lightAliases.entries()].map(([k,v])=>`${k}→${v}`).join(', ')})`
    );
  });

  it('var(--token) references in css/tokens.css resolve to defined tokens', () => {
    // Extract all var(--token) usages
    const varRe = /var\((--[a-z][a-z0-9-]*)\)/g;
    const missing = [];
    for (const m of css.matchAll(varRe)) {
      const t = m[1];
      if (!lightTokens.has(t)) {
        missing.push(`${t} (used in var() but not defined in light :root)`);
      }
    }
    assert.deepEqual(
      missing, [],
      `var() references in tokens.css that don't resolve:\n  ${missing.join('\n  ')}`
    );
  });
});
