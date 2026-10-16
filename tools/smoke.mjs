/**
 * smoke.mjs — smoke test for model-lab
 *
 * For each bench in the catalog:
 *   - Opens it at 1280px and 400px, light and dark theme (4 screenshots)
 *   - Checks for console errors, failed network requests
 *   - Checks if any readout span still shows "–"
 *   - Analyses canvas pixels for BLANK, SOLID, and SURFACE_MISMATCH flags
 *   - Writes tools/out/smoke.json
 *   - Creates tools/out/contact-sheet.png (grid of thumbnails, red border on failures)
 *
 * Run from repo root: node tools/smoke.mjs
 *
 * CI approach: add a step that runs `npm run smoke && node -e "
 *   const r = JSON.parse(require('fs').readFileSync('tools/out/smoke.json'));
 *   const failed = r.filter(b => !b.pass);
 *   if (failed.length) { console.error(failed.map(b=>b.benchId)); process.exit(1); }
 * "` after `npm test`. The smoke test requires Playwright and Chromium (already in
 * tools/node_modules); run `node tools/node_modules/.bin/playwright install chromium`
 * in the CI setup step.
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

// ── RGB helpers ───────────────────────────────────────────────────────────────

/**
 * Parse a CSS hex colour string "#RRGGBB" or "#RGB" to {r,g,b}.
 * Returns null if unparseable.
 */
function parseHexRgb(hex) {
  if (!hex) return null;
  const s = hex.trim();
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

/**
 * Euclidean RGB distance.
 */
function euclideanRgbDistance(c1, c2) {
  const dr = c1.r - c2.r;
  const dg = c1.g - c2.g;
  const db = c1.b - c2.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

// ── Pixel analysis helper (runs in page context) ──────────────────────────────
async function analyseCanvas(page, surfaceRgb) {
  return page.evaluate((surfaceRgb) => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return {
      error: 'no canvas', bgPct: 0, topColorPct: 0, solid: false, blank: false,
      topColor: null, dominantRgb: null, inkFraction: 0,
      surfaceMismatch: false, surfaceRgb,
    };

    const w = canvas.width;
    const h = canvas.height;
    if (!w || !h) return {
      error: 'zero-size canvas', bgPct: 0, topColorPct: 0, solid: false, blank: false,
      topColor: null, dominantRgb: null, inkFraction: 0,
      surfaceMismatch: false, surfaceRgb,
    };

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

    if (counts.size === 0) return {
      error: 'all transparent', bgPct: 100, topColorPct: 100,
      solid: true, blank: true, topColor: null,
      dominantRgb: null, inkFraction: 0, surfaceMismatch: false, surfaceRgb,
    };

    // Most common colour = background candidate
    let topColor = null;
    let topCount = 0;
    for (const [k, v] of counts) {
      if (v > topCount) { topCount = v; topColor = k; }
    }

    const topColorPct = topCount / total * 100;
    const bgPct = topColorPct;

    // dominantRgb: the center of the most common bucket
    const [dr, dg, db] = topColor.split(',').map(Number);
    // Bucket center: the & 0xF0 value is the bucket floor; center = floor + 8
    const dominantRgb = { r: dr + 8, g: dg + 8, b: db + 8 };

    // inkFraction: fraction of pixels where ANY channel differs from dominant by > 20
    // "dominant" here means the top bucket's floor values (dr, dg, db)
    let inkCount = 0;
    for (let i = 0; i < data.length; i += 4) {
      const a = data[i+3];
      if (a < 16) continue;
      const pixR = data[i];
      const pixG = data[i+1];
      const pixB = data[i+2];
      if (Math.abs(pixR - dr) > 20 ||
          Math.abs(pixG - dg) > 20 ||
          Math.abs(pixB - db) > 20) {
        inkCount++;
      }
    }
    const inkFraction = inkCount / total;

    // solid: topColorPct > 90 (NOT the old colorCount <= 2 shortcut)
    const solid = topColorPct > 90;

    // blank: inkFraction < 0.0005 (< 0.05% of pixels differ from background)
    const blank = inkFraction < 0.0005;

    // surfaceMismatch: euclidean distance between dominantRgb and expected surfaceRgb > 40
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
      bgPct, topColorPct, solid, blank, topColor,
      dominantRgb, inkFraction, surfaceMismatch, surfaceRgb,
      colorCount: counts.size, error: null,
    };
  }, surfaceRgb);
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

      // Get the computed --panel colour for this theme (the canvas surface token).
      // We read this once per theme, before taking screenshots.
      const surfaceCssRaw = await page.evaluate(() =>
        getComputedStyle(document.documentElement).getPropertyValue('--panel').trim()
      );
      // Parse hex → {r,g,b}. If not a hex (e.g. a var() that didn't resolve), fall back to null.
      const surfaceRgb = parseHexRgb(surfaceCssRaw);

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

        // Canvas pixel analysis — pass surfaceRgb into page context
        const pixelInfo = await analyseCanvas(page, surfaceRgb);

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

        // Capture thumbnail
        const thumbPath = path.join(OUT_DIR, `thumb-${benchId}-${theme}-${width}.png`);
        await page.screenshot({ path: thumbPath, clip: { x: 0, y: 0, width: Math.min(width, 1280), height: Math.min(width === 400 ? 700 : 800, 800) } });

        const consoleErr = consoleErrors.length > 0;
        const isFail = pixelInfo.solid || pixelInfo.blank || consoleErr ||
                       hasDashes || pixelInfo.surfaceMismatch;

        result.screenshots.push({
          theme, width,
          screenshotPath,
          thumbPath,
          pixelInfo,
          hasDashes,
          consoleErrorsAtCapture: [...consoleErrors],
          surfaceRgb,
          dominantRgb: pixelInfo.dominantRgb,
          inkFraction: pixelInfo.inkFraction,
          surfaceMismatch: pixelInfo.surfaceMismatch,
          fail: isFail,
        });

        if (pixelInfo.solid)          result.failureTypes.push(`SOLID@${theme}/${width}`);
        if (pixelInfo.blank)          result.failureTypes.push(`BLANK@${theme}/${width}`);
        if (pixelInfo.surfaceMismatch) result.failureTypes.push(`SURFACE_MISMATCH@${theme}/${width}`);
        if (hasDashes)                result.failureTypes.push(`DASHES@${theme}/${width}`);
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

// ── Per-viewport × category flag table ───────────────────────────────────────
// Categories (updated):
//   blank          – inkFraction < 0.0005 (< 0.05% non-background pixels)
//   solid          – topColorPct > 90 (> 90% of pixels are the dominant colour)
//   surface_mismatch – dominantRgb differs from --panel by > 40 RGB distance
//   console_err    – any JS errors present at time of screenshot
//   readout_dash   – a visible readout span still shows '–'
//   no_canvas      – pixelInfo.error === 'no canvas' (element missing)
const VIEWPORTS = ['light/1280', 'light/400', 'dark/1280', 'dark/400'];
const CATS      = ['blank', 'solid', 'surface_mismatch', 'console_err', 'readout_dash', 'no_canvas'];
const counts    = {};
for (const vp of VIEWPORTS) counts[vp] = Object.fromEntries(CATS.map(c => [c, 0]));

for (const r of results) {
  for (const s of r.screenshots) {
    const vp = `${s.theme}/${s.width}`;
    if (!counts[vp]) continue;
    const pi = s.pixelInfo ?? {};
    if (pi.blank)                                          counts[vp]['blank']++;
    if (pi.solid)                                          counts[vp]['solid']++;
    if (pi.surfaceMismatch)                                counts[vp]['surface_mismatch']++;
    if (pi.error === 'no canvas')                          counts[vp]['no_canvas']++;
    if ((s.consoleErrorsAtCapture ?? []).length > 0)       counts[vp]['console_err']++;
    if (s.hasDashes)                                       counts[vp]['readout_dash']++;
  }
}

const COL_W = 12;
console.log('\nPer-viewport failure counts:');
console.log('  ' + 'category'.padEnd(16) + VIEWPORTS.map(v => v.padEnd(COL_W)).join(''));
console.log('  ' + '─'.repeat(16 + COL_W * VIEWPORTS.length));
for (const cat of CATS) {
  const row = VIEWPORTS.map(vp => String(counts[vp][cat]).padEnd(COL_W)).join('');
  const anyNonZero = VIEWPORTS.some(vp => counts[vp][cat] > 0);
  const marker = anyNonZero ? ' ◄' : '';
  console.log('  ' + cat.padEnd(16) + row + marker);
}

// ── All-benches × 4-viewports detail table ────────────────────────────────────
console.log('\nAll benches × 4 viewports (B=blank S=solid M=surface_mismatch E=console_err D=dash N=no_canvas):');
const HDR_COLS = ['light/1280', 'light/400', 'dark/1280', 'dark/400'];
const COL_W2 = 14;
console.log('  ' + 'bench'.padEnd(30) + HDR_COLS.map(v => v.padEnd(COL_W2)).join(''));
console.log('  ' + '─'.repeat(30 + COL_W2 * HDR_COLS.length));
for (const r of results) {
  const cells = r.screenshots.map(s => {
    const pi = s.pixelInfo ?? {};
    let flags = '';
    if (pi.blank)          flags += 'B';
    if (pi.solid)          flags += 'S';
    if (pi.surfaceMismatch) flags += 'M';
    if ((s.consoleErrorsAtCapture ?? []).length > 0) flags += 'E';
    if (s.hasDashes)       flags += 'D';
    if (pi.error === 'no canvas') flags += 'N';
    return (flags || 'ok').padEnd(COL_W2);
  });
  const rowLabel = `${r.subjectId}/${r.benchId}`.padEnd(30);
  console.log('  ' + rowLabel + cells.join(''));
}
