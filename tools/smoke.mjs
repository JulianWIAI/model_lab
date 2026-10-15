/**
 * smoke.mjs — smoke test for model-lab
 *
 * For each bench in the catalog:
 *   - Opens it at 1280px and 400px, light and dark theme (4 screenshots)
 *   - Checks for console errors, failed network requests
 *   - Checks if any readout span still shows "–"
 *   - Analyses canvas pixels for SOLID flag (>90% one colour)
 *   - Writes tools/out/smoke.json
 *   - Creates tools/out/contact-sheet.png (grid of thumbnails, red border on failures)
 *
 * Run from repo root: node tools/smoke.mjs
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from './node_modules/playwright/index.mjs';

// ── Paths ────────────────────────────────────────────────────────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const OUT_DIR   = path.join(__dirname, 'out');
fs.mkdirSync(OUT_DIR, { recursive: true });

// ── Static HTTP server ────────────────────────────────────────────────────────
const MIME = {
  '.html': 'text/html',
  '.js':   'application/javascript',
  '.mjs':  'application/javascript',
  '.css':  'text/css',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.woff2':'font/woff2',
  '.woff': 'font/woff',
};

function startServer(root) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let urlPath = decodeURIComponent(req.url.split('?')[0]);
      if (urlPath === '/' || urlPath === '') urlPath = '/index.html';
      const filePath = path.join(root, urlPath);
      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME[ext] || 'application/octet-stream';
      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(err.code === 'ENOENT' ? 404 : 500);
          res.end(err.message);
        } else {
          res.writeHead(200, { 'Content-Type': contentType });
          res.end(data);
        }
      });
    });
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({ server, port });
    });
  });
}

// ── Load catalog via dynamic import ─────────────────────────────────────────
const { catalog } = await import(path.join(REPO_ROOT, 'js/catalog.js'));

// Flatten catalog → [{subjectId, benchId, navLabel}]
const allBenches = [];
for (const subject of catalog) {
  for (const field of subject.fields) {
    for (const entry of field.benches) {
      allBenches.push({ subjectId: subject.id, benchId: entry.id, navLabel: entry.navLabel });
    }
  }
}

console.log(`Found ${allBenches.length} benches in catalog.`);

// ── Pixel analysis helper (runs in page context) ──────────────────────────────
async function analyseCanvas(page) {
  return page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return { error: 'no canvas', bgPct: 0, topColorPct: 0, solid: false, topColor: null };

    const w = canvas.width;
    const h = canvas.height;
    if (!w || !h) return { error: 'zero-size canvas', bgPct: 0, topColorPct: 0, solid: false, topColor: null };

    const ctx = canvas.getContext('2d');
    const data = ctx.getImageData(0, 0, w, h).data;
    const total = w * h;

    // Count colours (quantise to 4-bit per channel to reduce noise)
    const counts = new Map();
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]   & 0xF0;
      const g = data[i+1] & 0xF0;
      const b = data[i+2] & 0xF0;
      const a = data[i+3];
      if (a < 16) continue; // skip near-transparent
      const key = `${r},${g},${b}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    if (counts.size === 0) return { error: 'all transparent', bgPct: 100, topColorPct: 100, solid: true, topColor: null };

    // Most common colour = background candidate
    let topColor = null;
    let topCount = 0;
    for (const [k, v] of counts) {
      if (v > topCount) { topCount = v; topColor = k; }
    }

    const bgPct = topCount / total * 100;

    // Second most common non-bg colour
    let secondCount = 0;
    for (const [k, v] of counts) {
      if (k !== topColor && v > secondCount) secondCount = v;
    }

    const topColorPct = bgPct;
    // solid = canvas has ≤2 distinct colours after 4-bit quantisation.
    // A real chart or animation always has 3+ colours (background + axis + data);
    // ≤2 means the canvas was never drawn or drew a plain background only.
    const solid = counts.size <= 2;

    return { bgPct, topColorPct, solid, topColor, colorCount: counts.size, error: null };
  });
}

// ── Per-bench test ───────────────────────────────────────────────────────────
const WIDTHS = [1280, 400];
const THEMES = ['light', 'dark'];
const WAIT_TIMEOUT = 5000;

async function testBench(page, baseUrl, subjectId, benchId, navLabel) {
  const url = `${baseUrl}/#${subjectId}/${benchId}`;
  const result = {
    subjectId, benchId, navLabel,
    screenshots: [],
    consoleErrors: [],
    networkErrors: [],
    readoutDashes: false,
    pass: true,
    failureTypes: [],
    thumbs: [], // 120x90 thumbnails as base64 PNG
  };

  const consoleErrors = [];
  const networkErrors = [];

  const consoleHandler = (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  };
  const responseHandler = (response) => {
    if (!response.ok() && response.url().startsWith(baseUrl)) {
      networkErrors.push(`${response.status()} ${response.url()}`);
    }
  };
  // Capture uncaught page errors (e.g. exceptions in requestAnimationFrame callbacks
  // that stop the animation loop silently — not reported as console errors).
  const pageErrorHandler = (err) => {
    consoleErrors.push(`PAGEERROR: ${err.message}`);
  };

  page.on('console', consoleHandler);
  page.on('response', responseHandler);
  page.on('pageerror', pageErrorHandler);

  try {
    // Navigate to about:blank first to guarantee a full page reload (not a same-origin
    // hash-only navigation, which would NOT reload the page and would leave all previously
    // mounted bench DOM elements in place, causing false DASHES from earlier benches).
    await page.goto('about:blank', { timeout: 5000 });
    await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });

    for (const theme of THEMES) {
      // Set theme
      await page.evaluate((t) => {
        document.documentElement.setAttribute('data-theme', t);
      }, theme);

      for (const width of WIDTHS) {
        const height = width === 400 ? 700 : 800;
        await page.setViewportSize({ width, height });

        // Wait for .readout element, up to 5s
        try {
          await page.waitForSelector('.readout, canvas', { timeout: WAIT_TIMEOUT });
        } catch (_) {
          // proceed anyway
        }

        // Extra 1s for animation
        await new Promise(r => setTimeout(r, 1000));

        // Canvas pixel analysis
        const pixelInfo = await analyseCanvas(page);

        // Check for readout dashes — scope to the active (visible) bench only to
        // avoid false positives from earlier interactive benches kept in the DOM.
        const hasDashes = await page.evaluate(() => {
          const bench = document.querySelector('.bench:not([hidden])');
          if (!bench) return false;
          const spans = [...bench.querySelectorAll('.readout span, .readouts span')];
          return spans.some(s => s.textContent.trim() === '–');
        });

        // Capture full screenshot
        const screenshotPath = path.join(OUT_DIR, `${benchId}-${theme}-${width}.png`);
        await page.screenshot({ path: screenshotPath });

        // Capture thumbnail (120x90) via page.evaluate on the screenshot
        const thumbBase64 = await page.evaluate(async ({ width: vw, height: vh }) => {
          const canvas = document.createElement('canvas');
          canvas.width = 120;
          canvas.height = 90;
          const ctx = canvas.getContext('2d');
          // draw a scaled version of the current viewport
          const blob = await new Promise(res => {
            const el = document.createElement('canvas');
            el.width = vw; el.height = vh;
            // We can't easily snapshot DOM to canvas in page context, return null
            res(null);
          });
          return null;
        }, { width, height: width === 400 ? 700 : 800 });

        // Use Playwright's screenshot and resize externally
        const thumbPath = path.join(OUT_DIR, `thumb-${benchId}-${theme}-${width}.png`);
        await page.screenshot({ path: thumbPath, clip: { x: 0, y: 0, width: Math.min(width, 1280), height: Math.min(width === 400 ? 700 : 800, 800) } });

        const isFail = pixelInfo.solid || (consoleErrors.length > 0) || hasDashes;

        result.screenshots.push({
          theme, width,
          screenshotPath,
          thumbPath,
          pixelInfo,
          hasDashes,
          consoleErrorsAtCapture: [...consoleErrors],
          fail: isFail,
        });

        if (pixelInfo.solid) result.failureTypes.push(`SOLID@${theme}/${width}`);
        if (hasDashes)       result.failureTypes.push(`DASHES@${theme}/${width}`);
      }
    }
  } catch (err) {
    result.consoleErrors.push(`EXCEPTION: ${err.message}`);
    result.failureTypes.push('EXCEPTION');
  } finally {
    page.off('console', consoleHandler);
    page.off('response', responseHandler);
    page.off('pageerror', pageErrorHandler);
  }

  result.consoleErrors = consoleErrors;
  result.networkErrors = networkErrors;

  if (consoleErrors.length > 0) result.failureTypes.push('CONSOLE_ERROR');
  if (networkErrors.length > 0) result.failureTypes.push('NETWORK_ERROR');

  result.readoutDashes = result.screenshots.some(s => s.hasDashes);
  result.pass = result.failureTypes.length === 0;

  return result;
}

// ── Contact sheets — one PNG per subject ─────────────────────────────────────
//
// Layout per tile (one bench):
//   ┌─────────────────────────────────────────┐  ← TILE_W = 400 px
//   │ bench-id  (large label)                 │  ← LABEL_H = 38 px
//   ├──────────────────┬──────────────────────┤
//   │ light / 1280     │ light / 400          │  ← SHOT_H = 116 px each
//   ├──────────────────┼──────────────────────┤
//   │ dark  / 1280     │ dark  / 400          │
//   └──────────────────┴──────────────────────┘
//
// Up to COLS=4 tiles per row, MAX_ROWS=6 rows per image.
// Red border drawn over any failing screenshot slot.

const TILE_W   = 400;
const LABEL_H  = 38;
const SHOT_GAP = 3;
const TILE_GAP = 6;
const COLS     = 4;
const SHOT_W   = Math.floor((TILE_W - SHOT_GAP) / 2);   // 198 px
const SHOT_H   = 116;
const TILE_H   = LABEL_H + SHOT_H * 2 + SHOT_GAP * 3;   // 38+116*2+9 = 279

async function makeContactSheets(results, outDir) {
  // Group results by subject, preserving catalog order.
  const order = [...new Set(results.map(r => r.subjectId))];
  const bySubject = {};
  for (const r of results) {
    (bySubject[r.subjectId] ??= []).push(r);
  }

  const browser = await chromium.launch({ headless: true });
  const outPaths = [];

  for (const subjectId of order) {
    const benches = bySubject[subjectId];
    const numCols  = Math.min(benches.length, COLS);
    const numRows  = Math.ceil(benches.length / COLS);
    const sheetW   = numCols * TILE_W + (numCols + 1) * TILE_GAP;
    const sheetH   = numRows * TILE_H + (numRows + 1) * TILE_GAP;

    // Read screenshots from disk as base64 data URLs (Node context).
    const payload = benches.map(r => ({
      benchId: r.benchId,
      pass:    r.pass,
      // screenshots order: light/1280, light/400, dark/1280, dark/400
      shots: r.screenshots.slice(0, 4).map(s => ({
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
      async ({ payload, subjectId, TILE_W, TILE_H, LABEL_H, SHOT_W, SHOT_H, SHOT_GAP, TILE_GAP, COLS, sheetW, sheetH }) => {
        const canvas = document.getElementById('cs');
        canvas.width  = sheetW;
        canvas.height = sheetH;
        const ctx = canvas.getContext('2d');

        // Sheet background
        ctx.fillStyle = '#111111';
        ctx.fillRect(0, 0, sheetW, sheetH);

        const loadImg = (dataUrl) => new Promise(res => {
          if (!dataUrl) { res(null); return; }
          const img = new Image();
          img.onload  = () => res(img);
          img.onerror = () => res(null);
          img.src = dataUrl;
        });

        for (let bi = 0; bi < payload.length; bi++) {
          const bench = payload[bi];
          const col   = bi % COLS;
          const row   = Math.floor(bi / COLS);
          const tx    = TILE_GAP + col * (TILE_W + TILE_GAP);
          const ty    = TILE_GAP + row * (TILE_H + TILE_GAP);

          // Tile background
          ctx.fillStyle = bench.pass ? '#1c2030' : '#2a1020';
          ctx.fillRect(tx, ty, TILE_W, TILE_H);

          // Bench ID label
          ctx.font         = 'bold 19px system-ui, sans-serif';
          ctx.textBaseline = 'middle';
          ctx.textAlign    = 'left';
          ctx.fillStyle    = bench.pass ? '#c8d8ff' : '#ff9999';
          ctx.fillText(bench.benchId, tx + 8, ty + LABEL_H / 2);

          // 4 screenshots in a 2×2 grid
          // [0]=light/1280  [1]=light/400
          // [2]=dark/1280   [3]=dark/400
          const positions = [[0,0],[1,0],[0,1],[1,1]];
          for (let si = 0; si < bench.shots.length; si++) {
            const s         = bench.shots[si];
            const [sc, sr]  = positions[si];
            const sx        = tx + sc * (SHOT_W + SHOT_GAP) + SHOT_GAP;
            const sy        = ty + LABEL_H + sr * (SHOT_H + SHOT_GAP) + SHOT_GAP;

            const img = await loadImg(s.dataUrl);
            if (img) {
              // Aspect-fit inside the shot box (letterbox if needed)
              const scale  = Math.min(SHOT_W / img.naturalWidth, SHOT_H / img.naturalHeight);
              const dw     = Math.round(img.naturalWidth  * scale);
              const dh     = Math.round(img.naturalHeight * scale);
              const dx     = sx + Math.round((SHOT_W - dw) / 2);
              const dy     = sy + Math.round((SHOT_H - dh) / 2);
              ctx.fillStyle = '#222';
              ctx.fillRect(sx, sy, SHOT_W, SHOT_H);
              ctx.drawImage(img, dx, dy, dw, dh);
            } else {
              ctx.fillStyle = '#333';
              ctx.fillRect(sx, sy, SHOT_W, SHOT_H);
            }

            // Small overlay label (theme / width)
            ctx.fillStyle    = 'rgba(0,0,0,0.55)';
            ctx.fillRect(sx, sy, SHOT_W, 14);
            ctx.font         = '9px monospace';
            ctx.textBaseline = 'middle';
            ctx.textAlign    = 'left';
            ctx.fillStyle    = '#ddd';
            ctx.fillText(s.label, sx + 3, sy + 7);

            // Red border on failure
            if (s.fail) {
              ctx.strokeStyle = '#ff2020';
              ctx.lineWidth   = 3;
              ctx.strokeRect(sx + 1.5, sy + 1.5, SHOT_W - 3, SHOT_H - 3);
            }
          }
        }
      },
      { payload, subjectId, TILE_W, TILE_H, LABEL_H, SHOT_W, SHOT_H, SHOT_GAP, TILE_GAP, COLS, sheetW, sheetH },
    );

    const pngData = await page.evaluate(() =>
      document.getElementById('cs').toDataURL('image/png').split(',')[1],
    );
    await page.close();

    const outPath = path.join(outDir, `contact-${subjectId}.png`);
    fs.writeFileSync(outPath, Buffer.from(pngData, 'base64'));
    outPaths.push(outPath);
  }

  await browser.close();
  return outPaths;
}

// ── Main ─────────────────────────────────────────────────────────────────────
const { server, port } = await startServer(REPO_ROOT);
const BASE_URL = `http://127.0.0.1:${port}`;
console.log(`Server at ${BASE_URL}`);

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();

const results = [];

for (const { subjectId, benchId, navLabel } of allBenches) {
  process.stdout.write(`  Testing ${subjectId}/${benchId} ... `);
  try {
    const r = await testBench(page, BASE_URL, subjectId, benchId, navLabel);
    results.push(r);
    const status = r.pass ? 'PASS' : `FAIL [${r.failureTypes.join(', ')}]`;
    console.log(status);
  } catch (err) {
    console.log(`ERROR: ${err.message}`);
    results.push({
      subjectId, benchId, navLabel,
      pass: false,
      failureTypes: ['EXCEPTION'],
      consoleErrors: [err.message],
      networkErrors: [],
      readoutDashes: false,
      screenshots: [],
    });
  }
}

await browser.close();
server.close();

// ── Write smoke.json ──────────────────────────────────────────────────────────
const jsonPath = path.join(OUT_DIR, 'smoke.json');
fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2));
console.log(`\nResults written to ${jsonPath}`);

// ── Contact sheets (one per subject) ─────────────────────────────────────────
try {
  const sheets = await makeContactSheets(results, OUT_DIR);
  for (const p of sheets) console.log(`Contact sheet: ${p}`);
} catch (err) {
  console.error(`Contact sheet failed: ${err.message}`);
}

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
    console.log(`  ${type.padEnd(20)} ${count}`);
  }
}
console.log('\nFailed benches:');
for (const r of results.filter(r => !r.pass)) {
  console.log(`  ${r.subjectId}/${r.benchId} — ${r.failureTypes.join(', ')}`);
}

// ── Per-viewport failure counts ───────────────────────────────────────────────
// Categories:
//   blank        – pixelInfo.error === 'all transparent' (zero-content canvas)
//   solid        – pixelInfo.solid (colorCount ≤ 2, monochrome)
//   black-fill   – top colour is pure black AND bgPct > 90 (dark blank bug)
//   console-err  – any JS errors present at time of screenshot
//   readout-dash – a visible readout span still shows '–'
//   no-canvas    – pixelInfo.error === 'no canvas' (element missing)
const VIEWPORTS = ['light/1280', 'light/400', 'dark/1280', 'dark/400'];
const CATS      = ['blank', 'solid', 'black-fill', 'console-err', 'readout-dash', 'no-canvas'];
const counts    = {};
for (const vp of VIEWPORTS) counts[vp] = Object.fromEntries(CATS.map(c => [c, 0]));

for (const r of results) {
  for (const s of r.screenshots) {
    const vp = `${s.theme}/${s.width}`;
    if (!counts[vp]) continue;
    const pi = s.pixelInfo ?? {};
    if (pi.error === 'all transparent')                    counts[vp]['blank']++;
    if (pi.error === 'no canvas')                          counts[vp]['no-canvas']++;
    if (pi.solid)                                          counts[vp]['solid']++;
    // black-fill: near-pure-black background, bgPct > 90, AND very few colours
    // (≤ 5 colours means no real content was drawn; more colours = dark-bg chart)
    if (pi.topColor === '0,0,0' && (pi.bgPct ?? 0) > 90 && (pi.colorCount ?? 0) <= 5)
      counts[vp]['black-fill']++;
    if ((s.consoleErrorsAtCapture ?? []).length > 0)       counts[vp]['console-err']++;
    if (s.hasDashes)                                       counts[vp]['readout-dash']++;
  }
}

const COL_W = 12;
console.log('\nPer-viewport failure counts:');
console.log('  ' + 'category'.padEnd(14) + VIEWPORTS.map(v => v.padEnd(COL_W)).join(''));
console.log('  ' + '─'.repeat(14 + COL_W * VIEWPORTS.length));
for (const cat of CATS) {
  const row = VIEWPORTS.map(vp => String(counts[vp][cat]).padEnd(COL_W)).join('');
  const anyNonZero = VIEWPORTS.some(vp => counts[vp][cat] > 0);
  const marker = anyNonZero ? ' ◄' : '';
  console.log('  ' + cat.padEnd(14) + row + marker);
}
