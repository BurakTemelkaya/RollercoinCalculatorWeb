// Run after npm run build: node scripts/check-earnings-table.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const mime = { '.js': 'application/javascript', '.css': 'text/css', '.html': 'text/html', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp' };
const server = http.createServer((req, res) => {
    let file = path.join(dist, new URL(req.url, 'http://localhost').pathname);
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(dist, 'index.html');
    res.setHeader('Content-Type', mime[path.extname(file)] ?? 'application/octet-stream');
    res.end(fs.readFileSync(file));
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const coins = ['BTC', 'ETH', 'SOL', 'DOGE', 'BNB', 'LTC', 'XRP', 'TRX', 'POL', 'ALGO', 'USDT', 'RLT', 'RST'].map(displayName => ({
    code: displayName.toLowerCase(), displayName,
    leaguePower: { value: 100, unit: 'Zh' }, leaguePowerFormatted: '100 Zh/s',
    isGameToken: ['RLT', 'RST'].includes(displayName),
}));
const sourceHeader = '.tab-panel .table-section:first-child .table-container thead';
const sourceContainer = '.tab-panel .table-section:first-child .table-container';
const priceSelector = '.coin-market-price';
const errors = [];
let browser;
try {
    browser = await puppeteer.launch({ headless: true, timeout: 15000 });
    const createPage = async (width, columns) => {
        const page = await browser.newPage();
        page.setDefaultTimeout(10000);
        await page.setViewport({ width, height: 900 });
        await page.setBypassServiceWorker(true);
        page.on('pageerror', error => errors.push(error.message));
        await page.setRequestInterception(true);
        page.on('request', req => {
            const url = new URL(req.url());
            if (url.hostname === 'api.binance.com') {
                void req.respond({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify([
                    { symbol: 'BTCUSDT', lastPrice: '62000.25', openPrice: '60000' },
                    { symbol: 'ETHUSDT', lastPrice: '2400.50', openPrice: '2500' },
                    { symbol: 'DOGEUSDT', lastPrice: '0.123456', openPrice: '0.123456' },
                ]) });
            } else if (req.url().startsWith(origin)) void req.continue();
            else void req.abort();
        });
        await page.evaluateOnNewDocument((coins, columns) => {
            if (localStorage.getItem('earnings_test_seeded')) return;
            localStorage.setItem('earnings_test_seeded', 'true');
            localStorage.setItem('rollercoin_web_coins', JSON.stringify(coins));
            localStorage.setItem('rollercoin_web_userpower', JSON.stringify({ value: 100, unit: 'Eh' }));
            localStorage.setItem('rollercoin_web_userpower_timestamp', String(Date.now()));
            localStorage.setItem('rollercoin_web_active_tab', 'calculator');
            localStorage.setItem('rollercoin_web_league_id', 'test-league');
            localStorage.setItem('rollercoin_web_auto_league', 'false');
            localStorage.setItem('rollercoin_web_api_leagues', JSON.stringify([{
                id: 'test-league', name: 'Bronze I', minPower: 0,
                currencies: coins.map(coin => ({
                    name: coin.displayName === 'BTC' ? 'SAT' : ['RLT', 'RST'].includes(coin.displayName) ? coin.displayName : `${coin.displayName}_SMALL`,
                    payout: 1000000,
                })),
            }]));
            if (columns) localStorage.setItem('rollercoin_web_table_columns', JSON.stringify(columns));
        }, coins, columns);
        await page.goto(`${origin}/en`, { waitUntil: 'networkidle0' });
        await page.waitForSelector(sourceHeader);
        return page;
    };
    const moveHeader = async (page, relativeTop) => {
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        await page.evaluate((selector, relativeTop) => {
            const top = document.querySelector(selector).getBoundingClientRect().top;
            const navBottom = document.querySelector('.sticky-navbar').getBoundingClientRect().bottom;
            window.scrollBy(0, top - navBottom - relativeTop);
        }, sourceHeader, relativeTop);
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    };
    const assertAligned = async page => {
        await page.waitForSelector('.fixed-thead-clone').catch(async error => {
            console.error(await page.evaluate(selector => {
                const rect = element => {
                    const r = element?.getBoundingClientRect();
                    return r && { top: r.top, bottom: r.bottom, left: r.left, right: r.right };
                };
                return { scrollY, width: innerWidth, height: document.documentElement.scrollHeight, header: rect(document.querySelector(selector)), section: rect(document.querySelector(selector)?.closest('.table-section')), navbar: rect(document.querySelector('.sticky-navbar')), collapsed: document.querySelector(selector)?.closest('.tab-panel')?.className };
            }, sourceHeader));
            throw error;
        });
        const geometry = await page.evaluate(selector => {
            const original = document.querySelector(selector);
            const clone = document.querySelector('.fixed-thead-clone');
            const cells = element => Array.from(element.querySelectorAll('th')).map(cell => ({ left: cell.getBoundingClientRect().left, width: cell.getBoundingClientRect().width }));
            return { original: cells(original), clone: cells(clone), top: clone.getBoundingClientRect().top, navbarBottom: document.querySelector('.sticky-navbar').getBoundingClientRect().bottom };
        }, sourceHeader);
        assert.ok(Math.abs(geometry.top - geometry.navbarBottom) <= 1, 'Header must sit directly below the navbar');
        assert.equal(geometry.original.length, geometry.clone.length);
        geometry.original.forEach((cell, index) => {
            assert.ok(Math.abs(cell.left - geometry.clone[index].left) <= 1, `Column ${index} left edge must align`);
            assert.ok(Math.abs(cell.width - geometry.clone[index].width) <= 1, `Column ${index} width must align`);
        });
    };
    const openSettings = async page => {
        await page.evaluate(() => {
            const actions = document.querySelector('.tab-panel .table-section:first-child .section-header-row');
            const navBottom = document.querySelector('.sticky-navbar').getBoundingClientRect().bottom;
            window.scrollBy(0, actions.getBoundingClientRect().top - navBottom - 20);
        });
        await page.locator('.tab-panel .table-section:first-child .settings-icon-btn:last-child').click();
        await page.waitForSelector('#show-coin-prices');
    };
    const desktop = await createPage(1440);
    assert.equal(await desktop.$$eval(priceSelector, elements => elements.length), 4, 'Only coins with prices should show them');
    assert.equal(await desktop.$$eval('.table-section:last-child .coin-market-price', elements => elements.length), 0, 'Game tokens have no market price');
    assert.ok(await desktop.$$eval(priceSelector, elements => elements.some(element => element.textContent === '$0.123456')));
    const btcPrice = '.coin-market-price[aria-label^="BTC:"]';
    const ethPrice = '.coin-market-price[aria-label^="ETH:"]';
    const dogePrice = '.coin-market-price[aria-label^="DOGE:"]';
    assert.equal(await desktop.$eval(btcPrice, element => element.classList.contains('price-up')), true);
    assert.equal(await desktop.$eval(ethPrice, element => element.classList.contains('price-down')), true);
    assert.equal(await desktop.$eval(dogePrice, element => element.classList.length), 1, 'Unchanged price stays neutral');
    await desktop.$eval(btcPrice, element => {
        const navBottom = document.querySelector('.sticky-navbar').getBoundingClientRect().bottom;
        window.scrollBy(0, element.getBoundingClientRect().top - navBottom - 70);
    });
    await desktop.hover(btcPrice);
    await desktop.waitForSelector('.coin-price-tooltip');
    const tooltipText = await desktop.$eval('.coin-price-tooltip', element => element.textContent);
    assert.ok(tooltipText.includes('24 hours ago: $60,000.00'));
    assert.ok(tooltipText.includes('Last 24 hours: +3.33%'));
    const tooltipBounds = await desktop.$eval('.coin-price-tooltip', element => {
        const rect = element.getBoundingClientRect();
        return { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right };
    });
    assert.ok(tooltipBounds.top >= 0 && tooltipBounds.bottom <= 900 && tooltipBounds.left >= 0 && tooltipBounds.right <= 1440, 'Tooltip stays within viewport');
    await desktop.mouse.move(0, 0);
    await desktop.waitForFunction(() => !document.querySelector('.coin-price-tooltip'));
    // Keyboard focus exposes the same previous-price detail.
    await desktop.focus(ethPrice);
    await desktop.waitForFunction(() => document.querySelector('.coin-price-tooltip')?.textContent.includes('24 hours ago: $2,500.00'));
    await desktop.keyboard.press('Escape');
    await desktop.waitForFunction(() => !document.querySelector('.coin-price-tooltip'));
    await desktop.waitForSelector('.compact-crypto-amount').catch(async error => {
        console.error(await desktop.$$eval('.data-row', elements => elements.map(element => element.textContent)));
        throw error;
    });
    const compactAmounts = await desktop.$$eval('.compact-crypto-amount', elements => elements.map(element => {
        const sub = element.querySelector('sub');
        const parent = element.closest('.earning-crypto-tooltip');
        return { full: element.getAttribute('aria-label'), count: Number(sub.textContent), tooltip: parent.dataset.full, coin: element.closest('tr').querySelector('.coin-symbol').textContent.trim() };
    }));
    assert.ok(compactAmounts.length > 0, 'Small earnings must use zero-count notation');
    for (const amount of compactAmounts) {
        assert.ok(['ETH', 'BNB', 'SOL'].includes(amount.coin));
        assert.equal(amount.full.match(/^-?0\.(0+)/)[1].length, amount.count, 'Subscript counts fractional leading zeros');
        assert.ok(Number.parseFloat(amount.tooltip) > 0, 'Tooltip keeps a nonzero decimal value');
    }
    await moveHeader(desktop, 2);
    assert.equal(await desktop.$('.fixed-thead-clone'), null, 'Header stays in flow before reaching the navbar');
    await moveHeader(desktop, -1);
    await assertAligned(desktop);
    await moveHeader(desktop, -160);
    await assertAligned(desktop);
    await desktop.evaluate(selector => window.scrollBy(0, document.querySelector(selector).closest('.table-section').getBoundingClientRect().bottom), sourceHeader);
    await desktop.waitForFunction(() => !document.querySelector('.fixed-thead-clone'));
    await moveHeader(desktop, 2);
    await desktop.waitForFunction(() => !document.querySelector('.fixed-thead-clone'));
    await openSettings(desktop);
    await desktop.click('#show-coin-prices');
    await desktop.click('.modal-footer .cancel-btn-outline');
    assert.equal(await desktop.$$eval(priceSelector, elements => elements.length), 4, 'Cancel must keep the original preference');
    await openSettings(desktop);
    assert.equal(await desktop.$eval('#show-coin-prices', input => input.checked), true);
    await desktop.click('#show-coin-prices');
    await desktop.click('.modal-footer .save-btn-primary');
    await desktop.waitForFunction(() => !document.querySelector('.coin-market-price'));
    await desktop.reload({ waitUntil: 'networkidle0' });
    assert.equal(await desktop.$$eval(priceSelector, elements => elements.length), 0, 'Saved disabled preference survives reload');
    await moveHeader(desktop, -1);
    await desktop.locator('.main-tabs-4 > .main-tab:nth-of-type(2)').click();
    await desktop.waitForFunction(() => !document.querySelector('.fixed-thead-clone'));
    console.log('Desktop: sticky threshold, column alignment, table boundary, tab switch, prices, cancel and persistence passed.');

    // createPage uses browser.newPage; clear the origin storage before the fresh mobile visit.
    await desktop.evaluate(() => localStorage.clear());
    const mobile = await createPage(390);
    assert.equal(await mobile.$$eval(priceSelector, elements => elements.length), 0, 'Mobile prices default to hidden');
    await openSettings(mobile);
    assert.equal(await mobile.$eval('#show-coin-prices', input => input.checked), false);
    await mobile.click('#show-coin-prices');
    await mobile.click('.modal-footer .save-btn-primary');
    await mobile.waitForSelector(priceSelector);
    await mobile.reload({ waitUntil: 'networkidle0' });
    assert.equal(await mobile.$$eval(priceSelector, elements => elements.length), 4, 'Mobile opt-in survives reload');
    await moveHeader(mobile, -1);
    await assertAligned(mobile);
    assert.ok(await mobile.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'Mobile prices must not overflow the page');
    await mobile.setViewport({ width: 1440, height: 900 });
    await moveHeader(mobile, -80);
    await assertAligned(mobile);
    await mobile.setViewport({ width: 390, height: 900 });
    await moveHeader(mobile, -80);
    await assertAligned(mobile);
    console.log('Mobile: hidden default, opt-in, reload, fitted columns and resize passed.');

    await mobile.evaluate(() => {
        localStorage.setItem('rollercoin_web_table_columns', JSON.stringify(['blockReward', 'blockDuration', 'hourly', 'daily', 'weekly', 'monthly']));
    });
    await mobile.reload({ waitUntil: 'networkidle0' });
    await moveHeader(mobile, -1);
    await assertAligned(mobile);
    await mobile.$eval(sourceContainer, container => { container.scrollLeft = container.scrollWidth; });
    await mobile.waitForFunction(() => parseFloat(document.querySelector('.fixed-thead-clone table').style.marginLeft) < 0);
    await assertAligned(mobile);
    console.log('Expanded mobile columns: horizontal scroll alignment passed.');
    assert.deepEqual(errors, [], 'No browser runtime errors');
} finally {
    await browser?.close();
    await new Promise(resolve => server.close(resolve));
}
