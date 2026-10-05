// Run after npm run build: node scripts/check-pwa-cache.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const manifest = JSON.parse(fs.readFileSync(path.join(dist, '.vite/manifest.json'), 'utf8'));
const worker = fs.readFileSync(path.join(dist, 'sw.js'), 'utf8');
const faqFile = manifest['src/components/FaqPage.tsx'].file;
const unusedFiles = [
  'src/components/admin/BlogEditor.tsx',
  'src/components/HamstersPage.tsx',
].map(key => manifest[key].file);
unusedFiles.push(Object.values(manifest).find(chunk => chunk.file.includes('vendor-html2canvas-')).file);
const requests = [];
let workerVersion = 1;
const mime = { '.js': 'application/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml' };
const server = http.createServer((req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  requests.push(pathname.slice(1));
  res.setHeader('Cache-Control', 'no-store');
  if (pathname === '/sw.js') {
    res.setHeader('Content-Type', 'application/javascript');
    res.end(`${worker}\n// Test deployment ${workerVersion}\n`);
    return;
  }
  let file = path.join(dist, pathname);
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(dist, 'index.html');
  res.setHeader('Content-Type', mime[path.extname(file)] ?? 'application/octet-stream');
  res.end(fs.readFileSync(file));
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
let browser;
try {
  console.log('Launching browser for PWA cache checks...');
  browser = await puppeteer.launch({ headless: true, timeout: 15000 });
  const page = await browser.newPage();
  await page.setCacheEnabled(false);
  await page.setRequestInterception(true);
  page.on('request', req => {
    if (req.url().startsWith(origin)) req.continue();
    else req.abort(); // Test app assets without external API/ad requests.
  });
  await page.goto(`${origin}/en`, { waitUntil: 'networkidle0' });
  console.log('App loaded; waiting for service worker control...');
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  assert(!requests.includes(faqFile), 'FAQ was downloaded before visiting it');
  for (const file of unusedFiles) assert(!requests.includes(file), `${file} was eagerly downloaded`);
  const initialJS = [...new Set(requests.filter(file => file.endsWith('.js') && file !== 'sw.js'))];
  console.log(`Initial visit requested ${initialJS.length} of ${Object.values(manifest).filter(chunk => chunk.file.endsWith('.js')).length} JS chunks.`);

  await page.evaluate(() => {
    history.pushState(null, '', '/en/faq');
    dispatchEvent(new PopStateEvent('popstate'));
  });
  await page.waitForFunction(file => performance.getEntriesByType('resource').some(entry => entry.name.endsWith(file)), {}, faqFile);
  await page.waitForFunction(async file => {
    const cache = await caches.open('rollercoin-lazy-assets-v1');
    return !!(await cache.match(`/${file}`));
  }, {}, faqFile);
  assert(requests.includes(faqFile), 'FAQ did not download on first visit');
  console.log('FAQ downloaded on demand and entered the runtime cache.');

  const updateStart = requests.length;
  workerVersion++;
  await page.evaluate(async () => (await navigator.serviceWorker.ready).update());
  await page.waitForFunction(async () => !!(await navigator.serviceWorker.ready).waiting);
  const updateAssets = requests.slice(updateStart).filter(file => file.startsWith('assets/'));
  assert.deepEqual(updateAssets, [], 'An unchanged asset was re-downloaded during SW update');
  for (const file of unusedFiles) assert(!requests.includes(file), `${file} was downloaded during update`);
  console.log('Background SW update reused unchanged shell files and fetched no lazy chunks.');

  await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready;
    await new Promise(resolve => {
      navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true });
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    });
  });
  const repeatStart = requests.length;
  await page.goto(`${origin}/en/faq`, { waitUntil: 'networkidle0' });
  assert(!requests.slice(repeatStart).includes(faqFile), 'Cached FAQ was downloaded again after update');
  console.log('Reopening FAQ after activation reused its cached JS.');

  const missing = '/assets/missing-12345678.js';
  await page.evaluate(url => fetch(url), missing);
  const cachedFallback = await page.evaluate(async url => (await caches.open('rollercoin-lazy-assets-v1')).match(url).then(Boolean), missing);
  assert(!cachedFallback, 'HTML fallback was cached as JavaScript');
  console.log('Missing chunk HTML responses are not cached.');

  await page.setOfflineMode(true);
  const offline = await page.evaluate(async file => {
    const response = await fetch(`/${file}`);
    return response.ok && response.headers.get('content-type').includes('javascript');
  }, faqFile);
  assert(offline, 'Visited page JS unavailable offline');
  console.log('Previously visited page JS remains available offline.');
} finally {
  if (browser) await browser.close();
  server.closeAllConnections();
  await new Promise(resolve => server.close(resolve));
}
