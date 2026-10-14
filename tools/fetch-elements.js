#!/usr/bin/env node
/**
 * Fetches the periodic table from PubChem and writes js/data/elements.js.
 *
 * Usage:
 *   node tools/fetch-elements.js > js/data/elements.js
 *
 * Exits with code 1 if the network request fails. Never falls back to
 * typed values; bad data is worse than no data.
 *
 * Fields in the output:
 *   Z              atomic number (integer)
 *   symbol         element symbol string
 *   name           element name string
 *   mass           standard atomic weight from PubChem (float, g/mol), null if absent
 *   group          IUPAC group 1–18 (integer), null for lanthanides Ce–Yb and actinides Th–No
 *   period         period 1–7 (integer, derived from config)
 *   block          's' | 'p' | 'd' | 'f' (derived from PubChem GroupBlock category)
 *   electronegativity  Pauling scale (float), null if absent
 *   vdwRadius      van der Waals radius (pm), from PubChem AtomicRadius column (float), null if absent
 *   ionizationEnergy   first ionization energy (eV) (float), null if absent
 *   electronConfig     superscript notation sorted by (n, l) (string)
 *
 * Source: PubChem REST API Periodic Table JSON
 *   https://pubchem.ncbi.nlm.nih.gov/rest/pug/periodictable/JSON
 *
 * f-block convention:
 *   PubChem labels La (Z=57) and Ac (Z=89) as Lanthanide/Actinide even
 *   though their configs have no 4f/5f electrons. This script follows
 *   PubChem GroupBlock for block assignment. Group numbers for La, Ac,
 *   Lu, Lr are set to 3 (IUPAC 2021 recommendation); for Ce–Yb and
 *   Th–No, group is null.
 */

const PUBCHEM_URL = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug/periodictable/JSON';

// ── Fetch ──────────────────────────────────────────────────────────────────

let json;
try {
  const resp = await fetch(PUBCHEM_URL);
  if (!resp.ok) {
    process.stderr.write(`Error: HTTP ${resp.status} from ${PUBCHEM_URL}\n`);
    process.exit(1);
  }
  json = await resp.json();
} catch (err) {
  process.stderr.write(`Error fetching ${PUBCHEM_URL}: ${err.message}\n`);
  process.exit(1);
}

const cols = json.Table.Columns.Column;
const rows = json.Table.Row;

// Print column names to stderr so contributors know what's available.
process.stderr.write(`PubChem columns (${cols.length}): ${cols.join(', ')}\n`);
process.stderr.write(`Row count: ${rows.length}\n`);

function col(row, name) {
  const idx = cols.indexOf(name);
  if (idx < 0) return null;
  const v = row.Cell[idx];
  return v === '' || v == null ? null : v;
}

// ── Group lookup: Z → IUPAC group number (null for f-block Ce–Yb, Th–No) ──
// Source: IUPAC Nomenclature of Inorganic Chemistry (Red Book), 2005, Table I.
const GROUP = {};
for (const z of [1, 3, 11, 19, 37, 55, 87])        GROUP[z] = 1;
for (const z of [4, 12, 20, 38, 56, 88])            GROUP[z] = 2;
for (const z of [21, 39, 57, 71, 89, 103])          GROUP[z] = 3;  // Sc,Y,La,Lu,Ac,Lr
for (const z of [22, 40, 72, 104])                  GROUP[z] = 4;
for (const z of [23, 41, 73, 105])                  GROUP[z] = 5;
for (const z of [24, 42, 74, 106])                  GROUP[z] = 6;
for (const z of [25, 43, 75, 107])                  GROUP[z] = 7;
for (const z of [26, 44, 76, 108])                  GROUP[z] = 8;
for (const z of [27, 45, 77, 109])                  GROUP[z] = 9;
for (const z of [28, 46, 78, 110])                  GROUP[z] = 10;
for (const z of [29, 47, 79, 111])                  GROUP[z] = 11;
for (const z of [30, 48, 80, 112])                  GROUP[z] = 12;
for (const z of [5,  13, 31, 49, 81, 113])          GROUP[z] = 13;
for (const z of [6,  14, 32, 50, 82, 114])          GROUP[z] = 14;
for (const z of [7,  15, 33, 51, 83, 115])          GROUP[z] = 15;
for (const z of [8,  16, 34, 52, 84, 116])          GROUP[z] = 16;
for (const z of [9,  17, 35, 53, 85, 117])          GROUP[z] = 17;
for (const z of [2,  10, 18, 36, 54, 86, 118])      GROUP[z] = 18;
// Ce–Yb (Z=58–70) and Th–No (Z=90–102): null (f-block interior)
for (let z = 58; z <= 70; z++) GROUP[z] = null;
for (let z = 90; z <= 102; z++) GROUP[z] = null;

// ── Block mapping: PubChem GroupBlock string → 's'|'p'|'d'|'f' ───────────

function blockFromGroupBlock(gb, z) {
  // H (Z=1) and He (Z=2) are s-block by electron configuration despite PubChem
  // labelling them "Nonmetal" and "Noble gas"
  if (z <= 2) return 's';
  if (!gb) return null;
  const g = gb.toLowerCase();
  if (g.includes('lanthanide') || g.includes('actinide')) return 'f';
  if (g.includes('transition') || g.includes('post-transition')) return 'd';
  if (g.includes('alkali') || g.includes('alkaline')) return 's';
  return 'p'; // noble gas, nonmetal, metalloid, halogen
}

// ── Period: highest principal quantum number in the electron configuration ──

function periodFromConfig(config) {
  if (!config) return null;
  const matches = config.match(/\d+(?=[spdf])/g);
  if (!matches) return null;
  return Math.max(...matches.map(Number));
}

// ── Superscript conversion and canonical sorting ───────────────────────────
// PubChem uses plain digits: "[Ar]3d5 4s1" → "[Ar] 3d⁵ 4s¹"
// Output is sorted by (n, l) for conventional spectroscopic notation,
// e.g. "[Ar] 3d⁶ 4s²" rather than "[Ar] 4s² 3d⁶".

const L_FOR = { s: 0, p: 1, d: 2, f: 3 };

function toSup(n) {
  return String(n).split('').map(d => '⁰¹²³⁴⁵⁶⁷⁸⁹'[+d]).join('');
}

function convertConfig(raw) {
  if (!raw) return null;
  // Strip trailing parenthetical annotations like "(calculated)", "(predicted)"
  const cleaned = raw.replace(/\s*\([^)]*\)\s*/g, '').trim();
  // Extract noble gas core: "[Xe]" or "[Xe] "
  const coreMatch = cleaned.match(/^\[([A-Za-z]+)\]\s*/);
  const core = coreMatch ? `[${coreMatch[1]}]` : '';
  const rest = coreMatch ? cleaned.slice(coreMatch[0].length) : cleaned;
  // Parse subshells: "3d5", "4s2", "4f14"
  const subRe = /(\d+)([spdf])(\d+)/g;
  const parts = [];
  let m;
  while ((m = subRe.exec(rest)) !== null) {
    parts.push({
      n: parseInt(m[1], 10),
      l: L_FOR[m[2]] ?? 0,
      label: `${m[1]}${m[2]}`,
      sup: toSup(parseInt(m[3], 10)),
    });
  }
  // Sort by (n, l) — puts 3d before 4s, 4f before 5d before 6s, etc.
  parts.sort((a, b) => a.n !== b.n ? a.n - b.n : a.l - b.l);
  const suffix = parts.map(p => `${p.label}${p.sup}`).join(' ');
  return core ? `${core} ${suffix}` : suffix;
}

// ── Build element array ────────────────────────────────────────────────────

const elements = rows.map((row) => {
  const z = parseInt(col(row, 'AtomicNumber'), 10);
  const gb  = col(row, 'GroupBlock');
  const raw = col(row, 'ElectronConfiguration');
  return {
    Z:                 z,
    symbol:            col(row, 'Symbol'),
    name:              col(row, 'Name'),
    mass:              parseFloat(col(row, 'AtomicMass'))      || null,
    group:             GROUP[z] ?? null,
    period:            periodFromConfig(raw),
    block:             blockFromGroupBlock(gb, z),
    electronegativity: parseFloat(col(row, 'Electronegativity')) || null,
    vdwRadius:         parseFloat(col(row, 'AtomicRadius'))    || null,
    ionizationEnergy:  parseFloat(col(row, 'IonizationEnergy')) || null,
    electronConfig:    convertConfig(raw),
  };
});

// ── Validate ───────────────────────────────────────────────────────────────

if (elements.length !== 118) {
  process.stderr.write(`Validation error: expected 118 elements, got ${elements.length}\n`);
  process.exit(1);
}
const zSet = new Set(elements.map(e => e.Z));
if (zSet.size !== 118) {
  process.stderr.write(`Validation error: duplicate Z values detected\n`);
  process.exit(1);
}
process.stderr.write(`Validation OK: 118 unique elements\n`);

// ── Emit ───────────────────────────────────────────────────────────────────

const today = new Date().toISOString().slice(0, 10);

process.stdout.write(`/**
 * Periodic table data — 118 elements fetched from PubChem.
 *
 * Fields: Z, symbol, name, mass (g/mol), group (1–18 or null),
 *   period (1–7), block (s/p/d/f), electronegativity (Pauling scale),
 *   vdwRadius (van der Waals radius, pm), ionizationEnergy (eV, 1st),
 *   electronConfig (superscript, sorted by n then l).
 *
 * Regenerate: node tools/fetch-elements.js > js/data/elements.js
 */

export const SOURCE = Object.freeze({
  name: 'PubChem Periodic Table (REST API)',
  url: 'https://pubchem.ncbi.nlm.nih.gov/rest/pug/periodictable/JSON',
  retrieved: '${today}',
});

export const ELEMENTS = Object.freeze(${JSON.stringify(elements, null, 2)});
`);
