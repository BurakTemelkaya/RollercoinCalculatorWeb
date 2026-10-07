// Run after npm run build: node scripts/check-merge-miner-status.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const mime = { '.js': 'application/javascript', '.css': 'text/css', '.html': 'text/html', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png' };
const server = http.createServer((req, res) => {
    let file = path.join(dist, new URL(req.url, 'http://localhost').pathname);
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(dist, 'index.html');
    res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
    res.end(fs.readFileSync(file));
});
const recipes = [
    { sellable: true, set: true }, { sellable: false, set: false }, { sellable: null, set: null },
    {}, // Older API responses omit both fields.
].map((status, index) => ({
    id: `recipe-${index}`, amount: 1000000, discountedAmount: 1000000, craftingTimeSeconds: 60,
    resultCount: 1, totalSoldCount: 0, totalCountLimit: 0, limitType: 'none', currencyId: 1, xpReward: 10,
    resultItemId: `miner-${index}`, resultItemName: 'Test Miner', resultItemLevel: index + 1,
    resultItemPower: 1000000, resultItemPercent: 500, resultItemWidth: 2,
    resultItemFileName: 'test', resultItemImageVersion: 1,
    resultItemIsCanBeSoldOnMp: status.sellable, resultItemIsInSet: status.set,
    requiredItems: [
        { itemId: `input-${index}`, type: 'miners', count: 2, itemName: 'Input Miner', level: index,
            fileName: 'input', imageVersion: 1, power: 500000, percent: 250, width: 2,
            isCanBeSoldOnMp: status.sellable, isInSet: status.set },
        { itemId: 'part', type: 'mutation_components', count: 10, itemName: 'Fan', level: 1,
            price: 100000, fileName: null, isCanBeSoldOnMp: true, isInSet: true },
    ],
}));
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const screenshotDir = process.env.MERGE_STATUS_SCREENSHOT_DIR;
let browser;
try {
    browser = await puppeteer.launch({ headless: true, timeout: 15000 });
    for (const mobile of [false, true]) {
        const page = await browser.newPage();
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.setViewport(mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 });
        await page.setBypassServiceWorker(true);
        await page.setRequestInterception(true);
        page.on('request', req => {
            const url = new URL(req.url());
            if (url.pathname.startsWith('/api/')) {
                let data;
                if (url.pathname === '/api/Merges/get-by-miner-name') data = recipes;
                else if (url.pathname === '/api/Merges/GetById') data = recipes.find(recipe => recipe.id === url.searchParams.get('id'));
                else if (url.pathname === '/api/Merges') data = { items: recipes, index: 0, size: 10, count: recipes.length, pages: 1, hasPrevious: false, hasNext: false };
                if (data !== undefined) return req.respond({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(data) });
                return req.respond({ status: 401, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: '{}' });
            }
            if (url.origin === origin) return req.continue();
            // Use a tiny local fixture for remote miner/CDN requests.
            if (req.resourceType() === 'image') return req.respond({ status: 200, contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="32"><rect width="48" height="32" fill="#536981"/></svg>' });
            return req.abort();
        });

        await page.goto(`${origin}/en/merges/miner/Test%20Miner`, { waitUntil: 'networkidle0' });
        try {
            await page.waitForSelector('.miner-level-card', { timeout: 10000 });
        } catch (error) {
            console.error({ url: page.url(), errors, text: await page.$eval('body', body => body.innerText.slice(0, 2000)) });
            throw error;
        }
        assert.equal(await page.$$eval('.miner-level-card', cards => cards.length), 4);
        const levelStatuses = await page.$$eval('.miner-level-card', cards => cards.map(card => ({
            result: [...card.querySelectorAll('.miner-level-result .miner-status-badge')].map(img => img.alt),
            requirements: [...card.querySelectorAll('.miner-level-requirements .miner-status-badge')].map(img => img.alt),
        })));
        assert.deepEqual(levelStatuses, [
            { result: ['Sellable', 'Set miner'], requirements: ['Sellable', 'Set miner'] },
            { result: ['Not sellable'], requirements: ['Not sellable'] },
            { result: [], requirements: [] }, { result: [], requirements: [] },
        ]);
        assert.equal(await page.$$eval('.miner-levels-grand-total .miner-status-badge', badges => badges.length), 3);
        assert.equal(await page.$eval('.miner-status-badge--unsellable', badge => getComputedStyle(badge).filter.includes('hue-rotate')), true);
        const overlaps = await page.$$eval('.miner-level-img-wrap, .req-item-img-wrap', wraps => wraps.some(wrap => {
            const level = wrap.querySelector('.miner-level-badge, .req-item-badge');
            if (!level) return false;
            const a = level.getBoundingClientRect();
            return [...wrap.querySelectorAll('.miner-status-badge')].some(badge => {
                const b = badge.getBoundingClientRect();
                return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
            });
        }));
        assert.equal(overlaps, false, 'Status badges overlap level badges');
        if (screenshotDir) {
            fs.mkdirSync(screenshotDir, { recursive: true });
            await page.screenshot({ path: path.join(screenshotDir, `merge-status-${mobile ? 'mobile' : 'desktop'}.png`), fullPage: true });
        }

        await page.goto(`${origin}/tr/merges`, { waitUntil: 'networkidle0' });
        await page.waitForSelector('.merge-card');
        assert.deepEqual(await page.$$eval('.merge-card', cards => cards.map(card => [...card.querySelectorAll('.miner-status-badge')].map(img => img.alt))), [
            ['Satılabilir', 'Set madencisi'], ['Satılamaz'], [], [],
        ]);
        await page.click('.merge-card');
        await page.waitForSelector('.merge-result-section');
        assert.equal(await page.$$eval('.merge-result-section .miner-status-badge', badges => badges.length), 2);
        assert.equal(await page.$$eval('.merge-required-list .miner-status-badge', badges => badges.length), 2);
        assert.deepEqual(errors, [], 'Browser runtime errors');
        await page.close();
    }
    console.log('Merge miner status checks passed: desktop/mobile, list/detail/levels/totals, translated labels, false/null/missing flags, component exclusion and level badge separation.');
} finally {
    if (browser) await browser.close();
    server.close();
}
