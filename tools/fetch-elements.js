#!/usr/bin/env node
/**
 * Fetches element data from PubChem and writes js/data/elements.js.
 * Run: node tools/fetch-elements.js > js/data/elements.js
 *
 * Source: PubChem Periodic Table JSON API
 */

const URL = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug/periodictable/JSON';

const resp = await fetch(URL);
const json = await resp.json();
const table = json.Table;
const cols = table.Columns.Column;
const rows = table.Row;

function col(row, name) {
  const idx = cols.indexOf(name);
  if (idx < 0) return null;
  const cell = row.Cell[idx];
  return cell === '' || cell === undefined ? null : cell;
}

const elements = rows.map((row) => ({
  Z: parseInt(col(row, 'AtomicNumber'), 10),
  symbol: col(row, 'Symbol'),
  name: col(row, 'Name'),
  mass: parseFloat(col(row, 'AtomicMass')) || null,
  group: parseInt(col(row, 'GroupBlock'), 10) || null,
  period: parseInt(col(row, 'Period'), 10) || null,
  block: col(row, 'GroupBlock') || null,
  electronegativity: parseFloat(col(row, 'Electronegativity')) || null,
  atomicRadius: parseFloat(col(row, 'AtomicRadius')) || null,
  ionizationEnergy: parseFloat(col(row, 'IonizationEnergy')) || null,
  electronConfig: col(row, 'ElectronConfiguration') || null,
}));

const today = new Date().toISOString().slice(0, 10);

console.log(`/**
 * Periodic table data from PubChem (118 elements).
 * Retrieved: ${today}
 * Source: PubChem REST API - Periodic Table JSON
 */

export const SOURCE = Object.freeze({
  name: 'PubChem Periodic Table',
  url: 'https://pubchem.ncbi.nlm.nih.gov/rest/pug/periodictable/JSON',
  retrieved: '${today}',
});

export const ELEMENTS = Object.freeze(${JSON.stringify(elements, null, 2)});
`);
