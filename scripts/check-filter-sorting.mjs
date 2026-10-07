// Run after npm run build: node scripts/check-filter-sorting.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import puppeteer from 'puppeteer';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const mime = { '.js': 'application/javascript', '.css': 'text/css', '.html': 'text/html', '.png': 'image/png', '.svg': 'image/svg+xml' };
const server = http.createServer((req, res) => {
    let file = path.join(dist, new URL(req.url, 'http://localhost').pathname);
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(dist, 'index.html');
    res.setHeader('Content-Type', mime[path.extname(file)] ?? 'application/octet-stream');
    res.end(fs.readFileSync(file));
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const label = params => `${params.get('SortBy') || 'newest'}:${params.get('IsDescending')}:${params.get('PageRequest.PageIndex')}`;
const result = url => {
    const params = url.searchParams;
    const name = label(params);
    const index = Number(params.get('PageRequest.PageIndex'));
    let item;
    if (url.pathname === '/api/Miner') item = { id: name, name, imageVersion: 1, level: 0, percent: 100, power: 100, width: 2, createdDate: '2026-01-01' };
    if (url.pathname === '/api/Rack') item = { id: name, name, capacity: 8, powerBonus: 100, createdDate: '2026-01-01' };
    if (url.pathname === '/api/Merges') item = {
        id: name, resultItemName: name, resultItemId: name, resultItemLevel: 0, resultItemPower: 100, resultItemPercent: 100,
        resultItemBonus: 100, resultItemWidth: 2, resultItemFileName: 'test', resultItemImageVersion: 1,
        amount: 1000000, discountedAmount: 1000000, craftingTimeSeconds: 60, resultCount: 1, totalSoldCount: 0,
        totalCountLimit: 0, limitType: 'none', currencyId: 1, xpReward: 1
    };
    return { items: [item], index, size: 20, count: 40, pages: 2, hasPrevious: index > 0, hasNext: index < 1 };
};
let browser;
try {
    browser = await puppeteer.launch({ headless: true, timeout: 15000 });
    const page = await browser.newPage();
    page.setDefaultTimeout(10000);
    await page.setViewport({ width: 1440, height: 1000 });
    await page.setBypassServiceWorker(true);
    await page.setRequestInterception(true);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    let slowEndpoint;
    page.on('request', async req => {
        const url = new URL(req.url());
        if (['/api/Miner', '/api/Rack', '/api/Merges'].includes(url.pathname)) {
            const slow = slowEndpoint === url.pathname;
            if (slow) slowEndpoint = undefined;
            await delay(slow ? 800 : 10);
            await req.respond({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(result(url)) });
        } else if (['/api/Rack/get-set-rack-list', '/api/Miner/get-sellable'].includes(url.pathname)) {
            await req.respond({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: '[]' });
        } else if (req.url().startsWith(origin)) await req.continue();
        else await req.abort();
    });
    const click = async selector => {
        await page.waitForSelector(selector, { visible: true });
        await page.$eval(selector, element => element.scrollIntoView({ block: 'center', behavior: 'instant' }));
        await page.locator(selector).click();
    };
    const waitLabel = async (selector, name) => {
        await page.waitForFunction((selector, name) => document.querySelector(selector)?.textContent.trim() === name, {}, selector, name);
    };
    const checkRequest = async (endpoint, action, expected, resultSelector) => {
        // Finish debounced searches from the previous interaction before observing
        // the first request caused by this selection.
        await page.waitForNetworkIdle({ idleTime: 500 });
        const nextRequest = page.waitForRequest(req => new URL(req.url()).pathname === endpoint);
        await action();
        const params = new URL((await nextRequest).url()).searchParams;
        for (const [key, value] of Object.entries(expected)) assert.equal(params.get(key), value === null ? null : String(value), `${endpoint}: ${key} must reflect the first selection`);
        await waitLabel(resultSelector, label(params));
    };
    const checkRace = async (endpoint, select, slowValue, fastValue, resultSelector) => {
        slowEndpoint = endpoint;
        const olderRequest = page.waitForRequest(req => new URL(req.url()).pathname === endpoint);
        await page.select(select, slowValue);
        const olderUrl = (await olderRequest).url();
        const olderResponse = page.waitForResponse(res => res.url() === olderUrl);
        const latestRequest = page.waitForRequest(req => new URL(req.url()).pathname === endpoint);
        await page.select(select, fastValue);
        const latestParams = new URL((await latestRequest).url()).searchParams;
        await waitLabel(resultSelector, label(latestParams));
        // Both replies must finish before checking that the slow older one was ignored.
        await olderResponse;
        await delay(900);
        assert.equal(await page.$eval(resultSelector, element => element.textContent.trim()), label(latestParams), `${endpoint}: an older response overwrote the selected sort`);
        assert.equal(await page.$eval(select, element => element.value), fastValue);
    };

    await page.goto(`${origin}/en`, { waitUntil: 'networkidle0' });
    await click('.main-tabs-4 > .main-tab:nth-of-type(3)');
    const room = '.room-power-simulator';
    const roomSort = `${room} .inv-sort-select`;
    const roomResult = `${room} .inv-miner-card-name`;
    await page.waitForSelector(roomSort);
    for (const value of ['power-asc', 'newest-desc', 'newest-asc', 'percent-desc', 'percent-asc', 'name-asc', 'name-desc', 'power-desc']) {
        const [sort, direction] = value.split('-');
        await checkRequest('/api/Miner', () => page.select(roomSort, value), { SortBy: sort, IsDescending: direction === 'desc', 'PageRequest.PageIndex': 0 }, roomResult);
    }
    await checkRace('/api/Miner', roomSort, 'name-asc', 'power-asc', roomResult);
    await click(`${room} .inv-tab:first-child`);
    await waitLabel(roomResult, 'RackBonus:true:0');
    for (const value of ['Date-asc', 'Date-desc', 'RackBonus-asc', 'RackBonus-desc']) {
        const [sort, direction] = value.split('-');
        await checkRequest('/api/Rack', () => page.select(roomSort, value), { SortBy: sort, IsDescending: direction === 'desc', 'PageRequest.PageIndex': 0 }, roomResult);
    }
    await checkRace('/api/Rack', roomSort, 'Date-asc', 'RackBonus-asc', roomResult);
    await checkRequest('/api/Rack', () => click(`${room} .inv-nav-btn:last-child`), { 'PageRequest.PageIndex': 1 }, roomResult);
    await checkRequest('/api/Rack', () => page.select(roomSort, 'Date-desc'), { SortBy: 'Date', IsDescending: true, 'PageRequest.PageIndex': 0 }, roomResult);
    console.log('Desktop miner/rack selectors apply the first choice, reset pagination, and ignore late responses.');

    await page.setViewport({ width: 390, height: 844 });
    await click(`${room} .room-add-rack-button`);
    const mobileSort = '.mobile-inventory-modal .inv-sort-select';
    const mobileResult = '.mobile-inventory-modal .inv-miner-card-name';
    await checkRequest('/api/Rack', () => page.select(mobileSort, 'RackBonus-desc'), { SortBy: 'RackBonus', IsDescending: true }, mobileResult);
    await checkRequest('/api/Rack', () => page.select(mobileSort, 'Date-asc'), { SortBy: 'Date', IsDescending: false }, mobileResult);
    await click('.mobile-inventory-modal .inv-tab:nth-child(2)');
    await checkRequest('/api/Miner', () => page.select(mobileSort, 'percent-desc'), { SortBy: 'percent', IsDescending: true }, mobileResult);
    await checkRequest('/api/Miner', () => page.select(mobileSort, 'name-asc'), { SortBy: 'name', IsDescending: false }, mobileResult);
    await click('.mobile-inventory-modal .mobile-inv-close');
    console.log('Mobile miner and rack selectors use the newly selected field and direction.');

    await page.setViewport({ width: 1440, height: 1000 });
    await click('.main-tabs-4 > .main-tab:nth-of-type(2)');
    await click('.manual-simulator .main-tabs .main-tab:nth-child(2)');
    const manualSort = '.manual-simulator select:has(option[value="newest"])';
    const manualResult = '.manual-simulator .miner-search-results > div > span:first-of-type';
    for (const [sort, apiSort] of [['percent', 'bonus'], ['name', 'name'], ['newest', 'date'], ['power', 'power']]) {
        await checkRequest('/api/Miner', () => page.select(manualSort, sort), { SortBy: apiSort, IsDescending: true }, manualResult);
    }
    await checkRequest('/api/Miner', () => click(`${manualSort} + button`), { SortBy: 'power', IsDescending: false }, manualResult);
    await checkRace('/api/Miner', manualSort, 'name', 'percent', manualResult);
    console.log('Power simulator sort fields, direction, and rapid selections update the displayed results immediately.');

    await page.goto(`${origin}/en/merges`, { waitUntil: 'networkidle0' });
    const mergeSort = '.merge-sort-select';
    const mergeResult = '.merge-card-name';
    for (const sort of ['power', 'percent', 'name', 'newest']) {
        await checkRequest('/api/Merges', () => page.select(mergeSort, sort), { SortBy: sort === 'newest' ? null : sort, IsDescending: true }, mergeResult);
    }
    await checkRace('/api/Merges', mergeSort, 'name', 'power', mergeResult);
    await checkRequest('/api/Merges', () => click('.pagination-nav:last-child'), { 'PageRequest.PageIndex': 1 }, mergeResult);
    await checkRequest('/api/Merges', () => click('.merge-sort-dir-btn.desc'), { SortBy: 'power', IsDescending: false, 'PageRequest.PageIndex': 0 }, mergeResult);
    const powerInputs = '.rc-filter-inputs:has(select option[value="Eh"])';
    await page.type(`${powerInputs} > div:first-child input`, '1');
    await checkRequest('/api/Merges', () => click(`${powerInputs} > button`), { MinMinerPower: 1000000 }, mergeResult);
    await page.select(`${powerInputs} > div:first-child select`, 'Eh');
    await checkRequest('/api/Merges', () => click(`${powerInputs} > button`), { MinMinerPower: 1000000000 }, mergeResult);
    await page.type(`${powerInputs} > div:nth-child(2) input`, '1');
    await checkRequest('/api/Merges', () => click(`${powerInputs} > button`), { MaxMinerPower: 1000000 }, mergeResult);
    await page.select(`${powerInputs} > div:nth-child(2) select`, 'Eh');
    await checkRequest('/api/Merges', () => click(`${powerInputs} > button`), { MaxMinerPower: 1000000000 }, mergeResult);
    console.log('Merge sorting ignores late responses, resets pagination, and applies unit-only min/max power changes.');
    assert.deepEqual(errors, [], 'Browser runtime errors');
} finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
}
