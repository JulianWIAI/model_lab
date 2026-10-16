/**
 * smoke.mjs — fast parallel smoke test for model-lab
 *
 * Full run:          node tools/smoke.mjs
 * Single bench:      node tools/smoke.mjs --bench <id>   (light/1280 + dark/400 only)
 * With contact sheet: node tools/smoke.mjs --sheet
 *
 * Target: full 56-bench matrix < 3 minutes; single bench < 15 s.
 *
 * Flags (all preserved from repaired checker):
 *   BLANK            — inkFraction < 0.05% (canvas is empty)
 *   SOLID            — topColorPct > 90%   (informational only, not a fail)
 *   SURFACE_MISMATCH — dominant RGB > 40 from --panel token (CSS token bug)
 *   CONSOLE_ERR      — any JS console error during the viewport test
 *   DASHES           — visible readout span still shows '–'
 *
 * CI:
 *   node tools/smoke.mjs && node -e "
 *     const r = JSON.parse(require('fs').readFileSync('tools/out/smoke.json'));
 *     const f = r.filter(b => !b.pass);
 *     if (f.length) { console.error(f.map(b=>b.benchId)); process.exit(1); }
 *   "
 *
 * Worktree runs: set REPO_ROOT env var to override the default parent of tools/.
 */

import http from 'node:http';
import fs   from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from './node_modules/playwright/index.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Allow worktrees to override repo root; default = parent of tools/
const REPO_ROOT = process.env.REPO_ROOT ?? path.resolve(__dirname, '..');
const OUT_DIR   = path.join(__dirname, 'out');
fs.mkdirSync(OUT_DIR, { recursive: true });

// ── CLI args ──────────────────────────────────────────────────────────────────
const args      = process.argv.slice(2);
const benchArgI = args.indexOf('--bench');
const benchArg  = benchArgI !== -1 ? args[benchArgI + 1] ?? null : null;
const makeSheet = args.includes('--sheet');

// ── Static HTTP server ────────────────────────────────────────────────────────
const MIME = {
  '.html': 'text/html',  '.js':    'application/javascript',
  '.mjs':  'application/javascript', '.css': 'text/css',
  '.json': 'application/json',       '.png': 'image/png',
  '.jpg':  'image/jpeg',             '.svg': 'image/svg+xml',
  '.ico':  'image/x-icon',           '.woff2': 'font/woff2',
  '.woff': 'font/woff',
};

function startServer(root) {
  return new Promise(resolve => {
    const server = http.createServer((req, res) => {
      let urlPath = decodeURIComponent(req.url.split('?')[0]);
      if (urlPath === '/' || urlPath === '') urlPath = '/index.html';
      const filePath    = path.join(root, urlPath);
      const contentType = MIME[path.extname(filePath).toLowerCase()] ?? 'application/octet-stream';
      fs.readFile(filePath, (err, data) => {
        if (err) { res.writeHead(err.code === 'ENOENT' ? 404 : 500); res.end(err.message); }
        else     { res.writeHead(200, { 'Content-Type': contentType }); res.end(data); }
      });
    });
    server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port }));
  });
}

// ── Load catalog ──────────────────────────────────────────────────────────────
const { catalog } = await import(path.join(REPO_ROOT, 'js/catalog.js'));

const allBenches = [];
for (const subject of catalog) {
  for (const field of subject.fields) {
    for (const entry of field.benches) {
      allBenches.push({ subjectId: subject.id, benchId: entry.id, navLabel: entry.navLabel });
    }
  }
}

// ── Filter / viewport selection ───────────────────────────────────────────────
let benchesToTest = allBenches;

const ALL_VIEWPORTS = [
  { theme: 'light', width: 1280, height: 800 },
  { theme: 'light', width: 400,  height: 700 },
  { theme: 'dark',  width: 1280, height: 800 },
  { theme: 'dark',  width: 400,  height: 700 },
];

const SINGLE_VIEWPORTS = [
  { theme: 'light', width: 1280, height: 800 },
  { theme: 'dark',  width: 400,  height: 700 },
];

let viewports = ALL_VIEWPORTS;

if (benchArg) {
  benchesToTest = allBenches.filter(b => b.benchId === benchArg);
  if (benchesToTest.length === 0) {
    console.error(`Bench "${benchArg}" not found in catalog.`);
    process.exit(1);
  }
  viewports = SINGLE_VIEWPORTS;
  console.log(`Single-bench mode: ${benchArg}  (light/1280 + dark/400)`);
}

console.log(`Found ${benchesToTest.length} bench(es) — ${viewports.length} viewport(s) each.`);

// ── RGB helpers ───────────────────────────────────────────────────────────────
function parseHexRgb(hex) {
  if (!hex) return null;
  const s  = hex.trim();
  const m6 = s.match(/^#([0-9a-fA-F]{6})$/);
  if (m6) {
    const n = parseInt(m6[1], 16);
    return { r: (n >> 16) & 0xFF, g: (n >> 8) & 0xFF, b: n & 0xFF };
  }
  const m3 = s.match(/^#([0-9a-fA-F]{3})$/);
  if (m3) {
    const [, rgb] = m3;
    return {
      r: parseInt(rgb[0] + rgb[0], 16),
      g: parseInt(rgb[1] + rgb[1], 16),
      b: parseInt(rgb[2] + rgb[2], 16),
    };
  }
  return null;
}

// ── Canvas-ready helpers (replace fixed 1 s sleep) ───────────────────────────
//
// waitForCanvasReady   — polls until canvas has ≥2 distinct colours (bench drew content).
//                        Used for the first viewport (canvas starts blank after navigation).
//
// waitForRaf           — waits for N completed requestAnimationFrame cycles in the page.
//                        Used after theme/viewport changes so at least N RAF cycles have
//                        fired (bench views redraw inside RAF). Under parallel load RAF
//                        may be throttled; we retry up to maxMs if needed.
//
// waitForCanvasReady polls at 150 ms; waitForRaf waits for true RAF completion.

async function waitForCanvasReady(page, maxMs = 5000) {
  const deadline = Date.now() + maxMs;
  while (Date.now() < deadline) {
    const ready = await page.evaluate(() => {
      const c = document.querySelector('canvas');
      if (!c || !c.width || !c.height) return false;
      const ctx  = c.getContext('2d');
      const pw   = Math.min(c.width,  80);
      const ph   = Math.min(c.height, 80);
      const data = ctx.getImageData(0, 0, pw, ph).data;
      if (data[3] < 16) return false;
      const base = [data[0], data[1], data[2]];
      for (let i = 4; i < data.length; i += 4) {
        if (data[i + 3] > 16 && (
          Math.abs(data[i]     - base[0]) > 12 ||
          Math.abs(data[i + 1] - base[1]) > 12 ||
          Math.abs(data[i + 2] - base[2]) > 12
        )) return true;
      }
      return false;
    });
    if (ready) return;
    await new Promise(r => setTimeout(r, 150));
  }
  // Timed out — proceed with whatever is on canvas
}

// Wait for `n` RAF cycles to complete.  Each cycle = ~16 ms at 60 fps; under
// parallel load it may take longer so we impose a Node-side deadline of maxMs.
async function waitForRaf(page, n = 2, maxMs = 3000) {
  const deadline = Date.now() + maxMs;
  while (Date.now() < deadline) {
    const done = await page.evaluate((n) =>
      new Promise(resolve => {
        let count = 0;
        function tick() {
          if (++count >= n) resolve(true);
          else requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      }), n
    ).catch(() => false);
    if (done) return;
  }
}

// ── Full-canvas pixel analysis (runs in page context) ────────────────────────
async function analyseCanvas(page, surfaceRgb) {
  return page.evaluate((surfaceRgb) => {
    const canvas = document.querySelector('canvas');
    const EMPTY = (error) => ({
      error, bgPct: 0, topColorPct: 0, solid: false, blank: false,
      topColor: null, dominantRgb: null, inkFraction: 0,
      surfaceMismatch: false, surfaceRgb, colorCount: 0,
    });
    if (!canvas)           return EMPTY('no canvas');
    const w = canvas.width; const h = canvas.height;
    if (!w || !h)          return EMPTY('zero-size canvas');

    const ctx   = canvas.getContext('2d');
    const data  = ctx.getImageData(0, 0, w, h).data;
    const total = w * h;

    // Count 4-bit-quantised colours
    const counts = new Map();
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 16) continue; // skip near-transparent
      const key = `${data[i] & 0xF0},${data[i + 1] & 0xF0},${data[i + 2] & 0xF0}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    if (counts.size === 0) return {
      error: 'all transparent', bgPct: 100, topColorPct: 100,
      solid: true, blank: true, topColor: null,
      dominantRgb: null, inkFraction: 0, surfaceMismatch: false, surfaceRgb, colorCount: 0,
    };

    let topColor = null; let topCount = 0;
    for (const [k, v] of counts) { if (v > topCount) { topCount = v; topColor = k; } }
    const topColorPct = topCount / total * 100;

    // Dominant RGB: bucket floor + 8 = bucket centre
    const [dr, dg, db] = topColor.split(',').map(Number);
    const dominantRgb  = { r: dr + 8, g: dg + 8, b: db + 8 };

    // inkFraction: pixels differing from dominant bucket floor by > 20
    let inkCount = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 16) continue;
      if (Math.abs(data[i]     - dr) > 20 ||
          Math.abs(data[i + 1] - dg) > 20 ||
          Math.abs(data[i + 2] - db) > 20) inkCount++;
    }
    const inkFraction = inkCount / total;

    // solid: informational only — high topColorPct is normal for sparse charts
    const solid = topColorPct > 90;
    // blank: almost no ink pixels
    const blank = inkFraction < 0.0005;

    // surfaceMismatch: dominant colour > 40 RGB units from --panel token
    let surfaceMismatch = false;
    if (surfaceRgb) {
      const dist = Math.sqrt(
        (dominantRgb.r - surfaceRgb.r) ** 2 +
        (dominantRgb.g - surfaceRgb.g) ** 2 +
        (dominantRgb.b - surfaceRgb.b) ** 2
      );
      surfaceMismatch = dist > 40;
    }

    return {
      bgPct: topColorPct, topColorPct, solid, blank, topColor,
      dominantRgb, inkFraction, surfaceMismatch, surfaceRgb,
      colorCount: counts.size, error: null,
    };
  }, surfaceRgb);
}

// ── Per-bench test (one Playwright page, all viewports sequential) ────────────
const WAIT_TIMEOUT = 5000;

async function testBench(page, baseUrl, subjectId, benchId, navLabel, vpList) {
  const result = {
    subjectId, benchId, navLabel,
    screenshots: [], consoleErrors: [], networkErrors: [],
    readoutDashes: false, pass: true, failureTypes: [], thumbs: [],
  };
  const consoleErrors = [];
  const networkErrors = [];
  const onConsole  = msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); };
  const onResponse = res => {
    if (!res.ok() && res.url().startsWith(baseUrl))
      networkErrors.push(`${res.status()} ${res.url()}`);
  };
  const onPageErr  = err => consoleErrors.push(`PAGEERROR: ${err.message}`);

  page.on('console',   onConsole);
  page.on('response',  onResponse);
  page.on('pageerror', onPageErr);

  try {
    // Navigate to about:blank first — prevents same-origin hash-only navigation
    // from reusing the previous bench's DOM without a full reload.
    await page.goto('about:blank', { timeout: 5000 });
    await page.goto(`${baseUrl}/#${subjectId}/${benchId}`, {
      waitUntil: 'load', timeout: 15000,
    });
    // Wait until the bench has mounted its DOM (canvas or readout)
    try { await page.waitForSelector('.readout, canvas', { timeout: WAIT_TIMEOUT }); } catch (_) {}

    let firstViewport = true;

    for (const { theme, width, height } of vpList) {
      await page.evaluate(t => document.documentElement.setAttribute('data-theme', t), theme);
      await page.setViewportSize({ width, height });

      if (firstViewport) {
        // First viewport: canvas starts blank — wait for bench to draw any content.
        await waitForCanvasReady(page, 5000);
        firstViewport = false;
      } else {
        // Subsequent viewports: bench redraws inside RAF after theme/resize events.
        // Wait for 3 RAF cycles so the bench's own RAF callbacks run before we sample.
        await waitForRaf(page, 3, 4000);
      }

      // Read --panel surface colour for this theme
      const panelCss = await page.evaluate(() =>
        getComputedStyle(document.documentElement).getPropertyValue('--panel').trim()
      );
      const surfaceRgb = parseHexRgb(panelCss);

      // Pixel analysis via getImageData (no screenshot needed for analysis)
      const pixelInfo = await analyseCanvas(page, surfaceRgb);

      const hasDashes = await page.evaluate(() => {
        const bench = document.querySelector('.bench:not([hidden])');
        if (!bench) return false;
        return [...bench.querySelectorAll('.readout span, .readouts span')]
          .some(s => s.textContent.trim() === '–');
      });

      const consoleErr = consoleErrors.length > 0;
      // SOLID (>90% surface) is NOT a fail — sparse charts are legitimately high.
      // SURFACE_MISMATCH is the correct detector for CSS-token bugs.
      const isFail = pixelInfo.surfaceMismatch || pixelInfo.blank || consoleErr || hasDashes;

      // Screenshot: only on failure (or all viewports when --sheet requested)
      let screenshotPath = null;
      if (isFail || makeSheet) {
        screenshotPath = path.join(OUT_DIR, `${benchId}-${theme}-${width}.png`);
        await page.screenshot({ path: screenshotPath });
      }

      result.screenshots.push({
        theme, width, screenshotPath,
        pixelInfo, hasDashes,
        consoleErrorsAtCapture: [...consoleErrors],
        surfaceRgb, dominantRgb: pixelInfo.dominantRgb,
        inkFraction: pixelInfo.inkFraction,
        surfaceMismatch: pixelInfo.surfaceMismatch,
        fail: isFail,
      });

      // SOLID is informational only — removed from failureTypes
      if (pixelInfo.blank)           result.failureTypes.push(`BLANK@${theme}/${width}`);
      if (pixelInfo.surfaceMismatch) result.failureTypes.push(`SURFACE_MISMATCH@${theme}/${width}`);
      if (hasDashes)                 result.failureTypes.push(`DASHES@${theme}/${width}`);
      if (consoleErr)                result.failureTypes.push(`CONSOLE_ERR@${theme}/${width}`);
    }
  } catch (err) {
    result.failureTypes.push('EXCEPTION');
    consoleErrors.push(`EXCEPTION: ${err.message}`);
  } finally {
    page.off('console',   onConsole);
    page.off('response',  onResponse);
    page.off('pageerror', onPageErr);
  }

  result.consoleErrors   = consoleErrors;
  result.networkErrors   = networkErrors;
  if (networkErrors.length > 0) result.failureTypes.push('NETWORK_ERROR');
  result.readoutDashes   = result.screenshots.some(s => s.hasDashes);
  result.pass            = result.failureTypes.length === 0;
  return result;
}

// ── Contact sheets (--sheet only) ────────────────────────────────────────────
const TILE_W  = 400;  const LABEL_H = 38;
const SHOT_GAP = 3;   const TILE_GAP = 6;
const COLS     = 4;
const SHOT_W   = Math.floor((TILE_W - SHOT_GAP) / 2);   // 198 px
const SHOT_H   = 116;
const TILE_H   = LABEL_H + SHOT_H * 2 + SHOT_GAP * 3;   // 279 px

async function makeContactSheets(results, outDir, browser) {
  const order     = [...new Set(results.map(r => r.subjectId))];
  const bySubject = {};
  for (const r of results) (bySubject[r.subjectId] ??= []).push(r);
  const outPaths  = [];

  for (const subjectId of order) {
    const benches = bySubject[subjectId];
    const numCols = Math.min(benches.length, COLS);
    const numRows = Math.ceil(benches.length / COLS);
    const sheetW  = numCols * TILE_W + (numCols + 1) * TILE_GAP;
    const sheetH  = numRows * TILE_H + (numRows + 1) * TILE_GAP;

    const payload = benches.map(r => ({
      benchId: r.benchId,
      pass:    r.pass,
      shots:   r.screenshots.slice(0, 4).map(s => ({
        label:   `${s.theme} / ${s.width}`,
        fail:    s.fail,
        dataUrl: s.screenshotPath && fs.existsSync(s.screenshotPath)
          ? 'data:image/png;base64,' + fs.readFileSync(s.screenshotPath).toString('base64')
          : null,
      })),
    }));

    const page = await browser.newPage();
    await page.setViewportSize({ width: sheetW, height: sheetH });
    await page.setContent('<html><body style="margin:0;background:#111"><canvas id="cs"></canvas></body></html>');

    await page.evaluate(
      async ({ payload, TILE_W, TILE_H, LABEL_H, SHOT_W, SHOT_H, SHOT_GAP, TILE_GAP, COLS, sheetW, sheetH }) => {
        const canvas = document.getElementById('cs');
        canvas.width = sheetW; canvas.height = sheetH;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#111111';
        ctx.fillRect(0, 0, sheetW, sheetH);
        const loadImg = url => new Promise(res => {
          if (!url) { res(null); return; }
          const img = new Image();
          img.onload = () => res(img); img.onerror = () => res(null); img.src = url;
        });
        for (let bi = 0; bi < payload.length; bi++) {
          const bench = payload[bi];
          const col   = bi % COLS; const row = Math.floor(bi / COLS);
          const tx    = TILE_GAP + col * (TILE_W + TILE_GAP);
          const ty    = TILE_GAP + row * (TILE_H + TILE_GAP);
          ctx.fillStyle = bench.pass ? '#1c2030' : '#2a1020';
          ctx.fillRect(tx, ty, TILE_W, TILE_H);
          ctx.font = 'bold 19px system-ui, sans-serif';
          ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
          ctx.fillStyle = bench.pass ? '#c8d8ff' : '#ff9999';
          ctx.fillText(bench.benchId, tx + 8, ty + LABEL_H / 2);
          const positions = [[0,0],[1,0],[0,1],[1,1]];
          for (let si = 0; si < bench.shots.length; si++) {
            const s = bench.shots[si];
            const [sc, sr] = positions[si];
            const sx = tx + sc * (SHOT_W + SHOT_GAP) + SHOT_GAP;
            const sy = ty + LABEL_H + sr * (SHOT_H + SHOT_GAP) + SHOT_GAP;
            const img = await loadImg(s.dataUrl);
            if (img) {
              const scale = Math.min(SHOT_W / img.naturalWidth, SHOT_H / img.naturalHeight);
              const dw = Math.round(img.naturalWidth * scale);
              const dh = Math.round(img.naturalHeight * scale);
              ctx.fillStyle = '#222'; ctx.fillRect(sx, sy, SHOT_W, SHOT_H);
              ctx.drawImage(img, sx + Math.round((SHOT_W-dw)/2), sy + Math.round((SHOT_H-dh)/2), dw, dh);
            } else {
              ctx.fillStyle = '#333'; ctx.fillRect(sx, sy, SHOT_W, SHOT_H);
            }
            ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(sx, sy, SHOT_W, 14);
            ctx.font = '9px monospace'; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
            ctx.fillStyle = '#ddd'; ctx.fillText(s.label, sx + 3, sy + 7);
            if (s.fail) {
              ctx.strokeStyle = '#ff2020'; ctx.lineWidth = 3;
              ctx.strokeRect(sx + 1.5, sy + 1.5, SHOT_W - 3, SHOT_H - 3);
            }
          }
        }
      },
      { payload, TILE_W, TILE_H, LABEL_H, SHOT_W, SHOT_H, SHOT_GAP, TILE_GAP, COLS, sheetW, sheetH },
    );

    const pngData = await page.evaluate(() =>
      document.getElementById('cs').toDataURL('image/png').split(',')[1]
    );
    await page.close();
    const outPath = path.join(outDir, `contact-${subjectId}.png`);
    fs.writeFileSync(outPath, Buffer.from(pngData, 'base64'));
    outPaths.push(outPath);
  }
  return outPaths;
}

// ── Main: parallel page pool ──────────────────────────────────────────────────
const t0 = Date.now();
const { server, port } = await startServer(REPO_ROOT);
const BASE_URL = `http://127.0.0.1:${port}`;
console.log(`Server at ${BASE_URL}`);

// CONCURRENCY: 6 pages in parallel. One shared context → shared resource cache.
const CONCURRENCY = 6;
const browser  = await chromium.launch({ headless: true });
const context  = await browser.newContext();

const queue    = [...benchesToTest];
// Pre-allocate results array preserving catalog order
const results  = new Array(benchesToTest.length);
const indexMap = new Map(benchesToTest.map((b, i) => [b.benchId, i]));

async function worker() {
  const page = await context.newPage();
  while (true) {
    const bench = queue.shift();
    if (!bench) break;
    const { subjectId, benchId, navLabel } = bench;
    process.stdout.write(`  Testing ${subjectId}/${benchId} ... `);
    try {
      const r = await testBench(page, BASE_URL, subjectId, benchId, navLabel, viewports);
      results[indexMap.get(benchId)] = r;
      console.log(r.pass ? 'PASS' : `FAIL [${r.failureTypes.join(', ')}]`);
    } catch (err) {
      console.log(`ERROR: ${err.message}`);
      results[indexMap.get(benchId)] = {
        subjectId, benchId, navLabel, pass: false,
        failureTypes: ['EXCEPTION'], consoleErrors: [err.message],
        networkErrors: [], readoutDashes: false, screenshots: [],
      };
    }
  }
  await page.close();
}

await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
console.log(`\nCompleted in ${elapsed}s`);

// ── Write smoke.json ──────────────────────────────────────────────────────────
const jsonPath = path.join(OUT_DIR, 'smoke.json');
fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2));
console.log(`Results written to ${jsonPath}`);

// ── Contact sheets (--sheet only) ─────────────────────────────────────────────
if (makeSheet) {
  try {
    const sheets = await makeContactSheets(results, OUT_DIR, browser);
    for (const p of sheets) console.log(`Contact sheet: ${p}`);
  } catch (err) {
    console.error(`Contact sheet failed: ${err.message}`);
  }
}

await browser.close();
server.close();

// ── Summary ───────────────────────────────────────────────────────────────────
const total  = results.length;
const passed = results.filter(r => r.pass).length;
const failed = total - passed;

const byType = {};
for (const r of results) {
  for (const t of r.failureTypes) {
    const base = t.replace(/@.*/, '');
    byType[base] = (byType[base] ?? 0) + 1;
  }
}

console.log('\n═══════════════════════════════════════');
console.log('SMOKE TEST SUMMARY');
console.log('═══════════════════════════════════════');
console.log(`Total benches : ${total}`);
console.log(`Passed        : ${passed}`);
console.log(`Failed        : ${failed}`);
if (Object.keys(byType).length) {
  console.log('\nFailure breakdown:');
  for (const [type, count] of Object.entries(byType)) {
    console.log(`  ${type.padEnd(22)} ${count}`);
  }
}
console.log('\nFailed benches:');
for (const r of results.filter(r => !r.pass)) {
  console.log(`  ${r.subjectId}/${r.benchId} — ${r.failureTypes.join(', ')}`);
}

// ── Per-viewport × category flag table ───────────────────────────────────────
const VIEWPORTS_ALL = ['light/1280', 'light/400', 'dark/1280', 'dark/400'];
const CATS          = ['blank', 'solid', 'surface_mismatch', 'console_err', 'readout_dash', 'no_canvas'];
const vpCounts      = {};
for (const vp of VIEWPORTS_ALL) vpCounts[vp] = Object.fromEntries(CATS.map(c => [c, 0]));

for (const r of results) {
  for (const s of r.screenshots) {
    const vp = `${s.theme}/${s.width}`;
    if (!vpCounts[vp]) continue;
    const pi = s.pixelInfo ?? {};
    if (pi.blank)                                    vpCounts[vp]['blank']++;
    if (pi.solid)                                    vpCounts[vp]['solid']++;
    if (pi.surfaceMismatch)                          vpCounts[vp]['surface_mismatch']++;
    if (pi.error === 'no canvas')                    vpCounts[vp]['no_canvas']++;
    if ((s.consoleErrorsAtCapture ?? []).length > 0) vpCounts[vp]['console_err']++;
    if (s.hasDashes)                                 vpCounts[vp]['readout_dash']++;
  }
}

const COL_W = 12;
console.log('\nPer-viewport flag counts:');
console.log('  ' + 'category'.padEnd(18) + VIEWPORTS_ALL.map(v => v.padEnd(COL_W)).join(''));
console.log('  ' + '─'.repeat(18 + COL_W * VIEWPORTS_ALL.length));
for (const cat of CATS) {
  const row       = VIEWPORTS_ALL.map(vp => String(vpCounts[vp][cat] ?? 0).padEnd(COL_W)).join('');
  const anyNonZero = VIEWPORTS_ALL.some(vp => (vpCounts[vp][cat] ?? 0) > 0);
  console.log('  ' + cat.padEnd(18) + row + (anyNonZero ? ' ◄' : ''));
}

// ── All-benches × 4-viewports detail table ────────────────────────────────────
console.log('\nAll benches × viewports (B=blank S=solid M=surface_mismatch E=console_err D=dash N=no_canvas):');
const HDR  = ['light/1280', 'light/400', 'dark/1280', 'dark/400'];
const CW2  = 14;
console.log('  ' + 'bench'.padEnd(32) + HDR.map(v => v.padEnd(CW2)).join(''));
console.log('  ' + '─'.repeat(32 + CW2 * HDR.length));
for (const r of results) {
  // Build a cell for each of the 4 canonical viewports (bench may only have 2 in --bench mode)
  const cells = HDR.map(h => {
    const s = r.screenshots.find(ss => `${ss.theme}/${ss.width}` === h);
    if (!s) return '—'.padEnd(CW2);
    const pi = s.pixelInfo ?? {};
    let flags = '';
    if (pi.blank)                                    flags += 'B';
    if (pi.solid)                                    flags += 'S';
    if (pi.surfaceMismatch)                          flags += 'M';
    if ((s.consoleErrorsAtCapture ?? []).length > 0) flags += 'E';
    if (s.hasDashes)                                 flags += 'D';
    if (pi.error === 'no canvas')                    flags += 'N';
    return (flags || 'ok').padEnd(CW2);
  });
  console.log('  ' + `${r.subjectId}/${r.benchId}`.padEnd(32) + cells.join(''));
}
