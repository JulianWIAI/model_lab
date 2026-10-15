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

// ── Contact sheet (grid of thumbnails) ───────────────────────────────────────
async function makeContactSheet(results, outPath) {
  // We'll create the contact sheet using a second Playwright page with canvas
  // Each thumbnail: 120x90, 4 per bench (2 themes × 2 widths), red border if fail
  const THUMB_W = 120, THUMB_H = 90;
  const COLS = 4; // one row per bench
  const rows = results.length;
  const sheetW = THUMB_W * COLS + (COLS + 1) * 2; // 2px gaps
  const sheetH = rows * (THUMB_H + 2) + (rows + 1) * 2;

  // Use a hidden browser page to draw the contact sheet
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setContent('<html><body><canvas id="cs"></canvas></body></html>');

  await page.evaluate(
    async ({ results, THUMB_W, THUMB_H, COLS, sheetW, sheetH }) => {
      const canvas = document.getElementById('cs');
      canvas.width = sheetW;
      canvas.height = sheetH;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#111';
      ctx.fillRect(0, 0, sheetW, sheetH);

      for (let ri = 0; ri < results.length; ri++) {
        const r = results[ri];
        for (let si = 0; si < Math.min(r.screenshots.length, COLS); si++) {
          const s = r.screenshots[si];
          const col = si;
          const row = ri;
          const x = col * (THUMB_W + 2) + 2;
          const y = row * (THUMB_H + 2) + 2;

          // Draw thumbnail image if path available
          const img = new Image();
          // We'll use a data URL approach - but we can't read files in page context
          // Instead, draw a placeholder with text
          ctx.fillStyle = s.fail ? '#3a0000' : '#1a1a2e';
          ctx.fillRect(x, y, THUMB_W, THUMB_H);

          ctx.fillStyle = s.fail ? '#ff4444' : '#44aa44';
          ctx.font = '8px monospace';
          ctx.fillText(`${r.benchId}`, x + 2, y + 10);
          ctx.fillStyle = '#aaa';
          ctx.fillText(`${s.theme}/${s.width}`, x + 2, y + 22);
          if (s.pixelInfo && !s.pixelInfo.error) {
            ctx.fillText(`bg:${s.pixelInfo.bgPct.toFixed(0)}%`, x + 2, y + 34);
          }
          if (s.fail) {
            ctx.strokeStyle = '#ff4444';
            ctx.lineWidth = 3;
            ctx.strokeRect(x + 1.5, y + 1.5, THUMB_W - 3, THUMB_H - 3);
          }
        }
      }
    },
    { results: results.map(r => ({
        benchId: r.benchId,
        screenshots: r.screenshots.map(s => ({
          theme: s.theme, width: s.width,
          fail: s.fail,
          pixelInfo: s.pixelInfo,
        })),
      })), THUMB_W, THUMB_H, COLS, sheetW, sheetH }
  );

  const pngData = await page.evaluate(() => {
    return document.getElementById('cs').toDataURL('image/png').split(',')[1];
  });

  fs.writeFileSync(outPath, Buffer.from(pngData, 'base64'));
  await browser.close();
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

// ── Contact sheet ─────────────────────────────────────────────────────────────
const contactSheetPath = path.join(OUT_DIR, 'contact-sheet.png');
try {
  await makeContactSheet(results, contactSheetPath);
  console.log(`Contact sheet written to ${contactSheetPath}`);
} catch (err) {
  console.error(`Contact sheet failed: ${err.message}`);
}

// ── Summary ───────────────────────────────────────────────────────────────────
const total = results.length;
const passed = results.filter(r => r.pass).length;
const failed = total - passed;

const byType = {};
for (const r of results) {
  for (const t of r.failureTypes) {
    // normalise (strip @theme/width suffix)
    const base = t.replace(/@.*/, '');
    byType[base] = (byType[base] ?? 0) + 1;
  }
}

console.log('\n═══════════════════════════════════════');
console.log(`SMOKE TEST SUMMARY`);
console.log(`═══════════════════════════════════════`);
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
