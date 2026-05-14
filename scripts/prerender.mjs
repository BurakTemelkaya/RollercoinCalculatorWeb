/**
 * Custom pre-render script — replaces react-snap.
 *
 * How it works:
 *   1. Starts a lightweight static file server on the built `dist/` folder.
 *   2. Launches headless Chrome via Puppeteer.
 *   3. Visits every seed route AND crawls discovered internal links.
 *   4. Captures the fully-rendered HTML and writes it back to `dist/`.
 *
 * Usage:  node scripts/prerender.mjs
 */

import puppeteer from 'puppeteer';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/* ------------------------------------------------------------------ */
/*  Configuration                                                      */
/* ------------------------------------------------------------------ */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.resolve(__dirname, '..', 'dist');
const PORT = 45678;
const NAV_TIMEOUT = 90000;
const CONCURRENCY = 4; // pages rendered in parallel

/** Routes to begin crawling from. Extra pages found via <a> links are
 *  added to the queue automatically. */
const SEED_ROUTES = [
  '/',
  '/en',
  '/tr',
  '/en/event', '/tr/event',
  '/en/about', '/tr/about',
  '/en/privacy', '/tr/privacy',
  '/en/faq', '/tr/faq',
  '/en/guides', '/tr/guides',
  '/en/support', '/tr/support',
  '/en/charts', '/tr/charts',
];

/** File extensions to skip when discovering links. */
const SKIP_EXTENSIONS = new Set([
  'js', 'css', 'png', 'jpg', 'jpeg', 'gif', 'svg', 'ico',
  'json', 'xml', 'webp', 'woff', 'woff2', 'ttf', 'webm',
  'mp4', 'pdf', 'txt', 'map',
]);

/* ------------------------------------------------------------------ */
/*  Static file server                                                 */
/* ------------------------------------------------------------------ */

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.webm': 'video/webm',
};

function resolveFilePath(url) {
  const pathname = url.split('?')[0].split('#')[0];
  let filePath = path.join(DIST_DIR, pathname);

  // If path has no extension → try directory/index.html → SPA fallback
  if (!path.extname(filePath)) {
    const indexPath = path.join(filePath, 'index.html');
    if (fs.existsSync(indexPath)) return indexPath;
    return path.join(DIST_DIR, 'index.html'); // SPA fallback
  }

  if (fs.existsSync(filePath)) return filePath;
  return path.join(DIST_DIR, 'index.html');
}

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const filePath = resolveFilePath(req.url);
      const ext = path.extname(filePath);
      const contentType = MIME[ext] || 'application/octet-stream';

      try {
        const content = fs.readFileSync(filePath);
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
      } catch {
        res.writeHead(404);
        res.end('Not found');
      }
    });

    server.listen(PORT, () => {
      console.log(`📦 Static server running on http://localhost:${PORT}`);
      resolve(server);
    });
  });
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Normalise a route: strip trailing slash (except root). */
function normalise(route) {
  const clean = route.split('#')[0].split('?')[0];
  return clean.length > 1 && clean.endsWith('/') ? clean.slice(0, -1) : clean;
}

/** Return true if the link looks like an internal page route. */
function isInternalPage(href) {
  if (!href || !href.startsWith('/') || href.startsWith('//')) return false;
  const clean = href.split('?')[0].split('#')[0];
  const ext = clean.split('.').pop();
  if (SKIP_EXTENSIONS.has(ext)) return false;
  return true;
}

/* ------------------------------------------------------------------ */
/*  Pre-render logic                                                   */
/* ------------------------------------------------------------------ */

async function renderPage(browser, route, visited, queue, retries = 1) {
  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(30000);

  // Optimizasyon: Gereksiz kaynakları ve reklamları engelle
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    const resourceType = req.resourceType();
    const url = req.url();

    // Görsel, font ve video gibi HTML renderını etkilemeyen kaynakları engelle
    // DİKKAT: 'stylesheet' engellenmemeli! Vite dynamic import'ları CSS dosyalarını bekler, 
    // yüklenemezse hata fırlatır ve App.tsx'teki reload döngüsünü tetikler.
    if (['image', 'font', 'media'].includes(resourceType)) {
      req.abort();
      return;
    }

    // Reklam ve Analytics domainlerini engelle (networkidle'ı sonsuza sokarlar)
    const blockedDomains = [
      'api.rollercoincalculator.app', // Kendi API'ni ekledik
      'ad.a-ads.com', 'a-ads.com', 'adsterra',
      'googletagmanager.com', 'google-analytics.com',
      'challenges.cloudflare.com'
    ];

    if (blockedDomains.some(domain => url.includes(domain))) {
      req.respond({ status: 200, body: '' });
      return;
    }

    req.continue();
  });

  try {
    const url = `http://localhost:${PORT}${route}`;
    // HTML'i hızlıca yükle (domcontentloaded)
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });

    // React'ın hydrate etmesi ve API'den veri çekmesi için sabit bir süre bekle
    // Bu, networkidle beklemekten çok daha güvenli ve hızlıdır.
    await new Promise(r => setTimeout(r, 500));

    // Discover internal links on this page
    const links = await page.evaluate(() =>
      Array.from(document.querySelectorAll('a[href]'))
        .map((a) => a.getAttribute('href'))
    );

    for (const href of links) {
      if (!isInternalPage(href)) continue;
      const norm = normalise(href);
      if (!visited.has(norm) && !queue.includes(norm)) {
        queue.push(norm);
      }
    }

    // Capture rendered HTML
    const html = await page.content();

    // Determine output path
    const outputPath =
      route === '/'
        ? path.join(DIST_DIR, 'index.html')
        : path.join(DIST_DIR, route, 'index.html');

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, html);

    return true;
  } catch (error) {
    if (retries > 0) {
      console.warn(`⚠️  Retrying ${route} due to error: ${error.message}`);
      return await renderPage(browser, route, visited, queue, retries - 1);
    }
    console.error(`❌  Error pre-rendering ${route}: ${error.message}`);
    return false;
  } finally {
    if (!page.isClosed()) {
      await page.close();
    }
  }
}

async function prerender() {
  const server = await startServer();

  const browser = await puppeteer.launch({
    headless: true,
    protocolTimeout: 300000, // 5 min — Docker builds can be slow
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-extensions',
      '--disable-background-networking',
    ],
  });

  const visited = new Set();
  const queue = [...SEED_ROUTES.map(normalise)];
  let crawledCount = 0;
  let errorCount = 0;

  while (queue.length > 0) {
    // Take up to CONCURRENCY routes from the queue
    const batch = [];
    while (batch.length < CONCURRENCY && queue.length > 0) {
      const route = normalise(queue.shift());
      if (visited.has(route)) continue;
      visited.add(route);
      batch.push(route);
    }

    if (batch.length === 0) continue;

    const results = await Promise.all(
      batch.map((route) => renderPage(browser, route, visited, queue))
    );

    for (let i = 0; i < batch.length; i++) {
      crawledCount++;
      const symbol = results[i] ? '✅' : '❌';
      console.log(
        `${symbol}  crawled ${crawledCount} out of ${crawledCount + queue.length} (${batch[i]})`
      );
      if (!results[i]) errorCount++;
    }
  }

  await browser.close();
  server.close();

  console.log(
    `\n🎉 Pre-rendering complete! ${crawledCount - errorCount}/${crawledCount} pages generated.`
  );

  if (errorCount > 0) {
    console.warn(`\n⚠️  Pre-rendering finished with ${errorCount} errors. Proceeding anyway...`);
  }
}

prerender().catch((error) => {
  console.error('Pre-rendering failed:', error);
  console.warn('⚠️  Continuing without pre-rendering — SPA fallback will be used.');
  process.exit(0);
});
