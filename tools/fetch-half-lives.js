#!/usr/bin/env node
/**
 * Fetches half-lives for C-14, U-238, I-131, Ra-226 from the IAEA LiveChart of Nuclides API.
 *
 * API endpoint (IAEA NuDat3 JSON):
 *   https://nds.iaea.org/relnsd/v0/data?fields=ground_states&nuclides=<symbol><mass>
 *
 * Usage (writes retrieved values to stdout, errors to stderr):
 *   node tools/fetch-half-lives.js
 *
 * Exits with code 1 if any fetch fails. Never falls back to memory values.
 */

const ISOTOPES = [
  { symbol: 'C',  mass: 14,  id: 'c14'  },
  { symbol: 'U',  mass: 238, id: 'u238' },
  { symbol: 'I',  mass: 131, id: 'i131' },
  { symbol: 'Ra', mass: 226, id: 'ra226' },
];

const BASE = 'https://nds.iaea.org/relnsd/v0/data';

const results = [];

for (const iso of ISOTOPES) {
  const url = `${BASE}?fields=ground_states&nuclides=${iso.symbol.toLowerCase()}${iso.mass}`;
  process.stderr.write(`Fetching ${iso.id} from ${url}\n`);

  let json;
  try {
    const resp = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    });
    if (!resp.ok) {
      process.stderr.write(`Error: HTTP ${resp.status} from ${url}\n`);
      process.exit(1);
    }
    json = await resp.json();
  } catch (err) {
    process.stderr.write(`Error fetching ${url}: ${err.message}\n`);
    process.exit(1);
  }

  // LiveChart returns an array; first element is the ground state
  const row = Array.isArray(json) ? json[0] : (json.nuclides?.[0] ?? null);
  if (!row) {
    process.stderr.write(`Error: no data row returned for ${iso.id}\n`);
    process.exit(1);
  }

  // Half-life is in field 'half_life' (value) and 'half_life_unit'
  const hl    = row.half_life       ?? row.t12            ?? null;
  const hlUnit = row.half_life_unit  ?? row.t12_unit       ?? null;
  const hlUnc = row.half_life_unc   ?? row.t12_unc         ?? null;

  if (hl === null || hl === undefined) {
    process.stderr.write(`Error: no half_life field for ${iso.id}. Row keys: ${Object.keys(row).join(', ')}\n`);
    process.exit(1);
  }

  results.push({ id: iso.id, symbol: iso.symbol, mass: iso.mass, hl, hlUnit, hlUnc });
  process.stderr.write(`  ${iso.id}: t½ = ${hl} ${hlUnit} ±${hlUnc}\n`);
}

// Print results as JS
process.stdout.write('// Half-lives fetched from IAEA LiveChart of Nuclides\n');
process.stdout.write(`// Retrieved: ${new Date().toISOString().slice(0, 10)}\n`);
process.stdout.write('// URL: https://nds.iaea.org/relnsd/v0/data\n\n');
for (const r of results) {
  process.stdout.write(`// ${r.id}: t½ = ${r.hl} ${r.hlUnit} ±${r.hlUnc}\n`);
}
