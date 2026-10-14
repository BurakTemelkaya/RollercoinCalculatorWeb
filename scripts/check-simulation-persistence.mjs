// Run after npm run build: node scripts/check-earnings-table.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';
import os from 'node:os';

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

const coins = ['BTC', 'DOGE'].map(displayName => ({
    code: displayName.toLowerCase(), displayName, leaguePower: { value: 1000, unit: 'Gh' },
    leaguePowerFormatted: '1 Th/s', isGameToken: false,
}));
const account = {
    userProfileResponseDto: { avatar_Id: 'saved-account', name: 'Saved Account', league_Id: 'test-league' },
    userPowerResponseDto: { miners: 100, current_Power: 100, max_Power: 100, bonus: 0, racks: 0, games: 0, temp: 0, freon: 0 },
};
const errors = [];
let browser;
try {
    browser = await puppeteer.launch({ headless: true, timeout: 15000 });
    const page = await browser.newPage();
    page.setDefaultTimeout(10000);
    await page.setViewport({ width: 1440, height: 1000 });
    await page.setBypassServiceWorker(true);
    page.on('pageerror', err => errors.push(err.message));
    await page.setRequestInterception(true);
    page.on('request', req => {
        const pathname = new URL(req.url()).pathname;
        if (pathname === '/api/RollercoinUser') {
            void req.respond({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ ...account, userProfileResponseDto: { ...account.userProfileResponseDto, avatar_Id: 'different-account' } }) });
        } else if (pathname === '/api/Rack/get-set-rack-list') {
            void req.respond({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: '[]' });
        } else if (req.url().startsWith(origin)) void req.continue();
        else void req.abort();
    });
    await page.evaluateOnNewDocument((coins, account) => {
        if (localStorage.getItem('persistence-test')) return;
        localStorage.setItem('persistence-test', '1');
        localStorage.setItem('rollercoin_web_coins', JSON.stringify(coins));
        localStorage.setItem('rollercoin_web_userpower', JSON.stringify({ value: 100, unit: 'Gh' }));
        localStorage.setItem('rollercoin_web_userpower_timestamp', String(Date.now()));
        localStorage.setItem('rollercoin_web_fetched_user', JSON.stringify(account));
        localStorage.setItem('rollercoin_web_added_miners', JSON.stringify([{ id: 'saved-miner', name: 'Saved Miner', power: 50, bonus: 5, rackBonus: 10 }]));
        localStorage.setItem('rollercoin_web_league_id', 'test-league');
        localStorage.setItem('rollercoin_web_auto_league', 'false');
        localStorage.setItem('rollercoin_web_block_duration_mode', 'manual');
        localStorage.setItem('rollercoin_web_block_durations', JSON.stringify({ BTC: 600, DOGE: 600 }));
        localStorage.setItem('rollercoin_web_balances', JSON.stringify({ DOGE: 50 }));
        localStorage.setItem('rollercoin_web_custom_min_withdraws', JSON.stringify({ DOGE: 100 }));
        localStorage.setItem('rollercoin_web_table_columns', JSON.stringify(['daily']));
        localStorage.setItem('rollercoin_web_api_leagues', JSON.stringify([{
            id: 'test-league', name: 'Test League', minPower: 0,
            currencies: [{ name: 'SAT', payout: 1e10 }, { name: 'DOGE_SMALL', payout: 1e4 }],
        }]));
    }, coins, account);
    const click = async selector => {
        await page.waitForSelector(selector, { visible: true });
        await page.$eval(selector, e => e.scrollIntoView({ block: 'center', behavior: 'instant' }));
        await page.locator(selector).click();
        if (selector.startsWith('.main-tabs-4')) {
            // App collapses the outgoing panel after its 400 ms slide.
            await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 450)));
        }
    };
    const type = async (selector, value) => {
        await click(selector);
        await page.keyboard.down('Control');
        await page.keyboard.press('a');
        await page.keyboard.up('Control');
        await page.keyboard.type(value);
        await page.keyboard.press('Tab');
    };
    const openPanel = async () => {
        await click('.main-tabs-4 > .main-tab:nth-of-type(1)');
        if (!await page.$('.simulator-panel')) {
            await click('.table-section:first-child .settings-icon-btn:nth-child(2)');
        }
        await page.waitForSelector('.simulator-panel', { visible: true });
    };
    const dogeCard = async () => page.evaluate(() => [...document.querySelectorAll('.withdraw-card')].find(card => card.querySelector('.coin-name')?.textContent === 'DOGE')?.textContent);
    await page.goto(`${origin}/en`, { waitUntil: 'networkidle0' });
    await click('.main-tabs-4 > .main-tab:nth-of-type(2)');
    await page.waitForSelector('.ms-miner-list');
    assert((await page.$eval('.ms-miner-list', e => e.textContent)).includes('Saved Miner'), 'Hydrating the cached account erased miners');
    await openPanel();
    await click('.source-col .sim-add-btn');
    await type('.source-col .sim-val-input', '80');
    await click('.target-col [role="combobox"]');
    await page.locator('[role="option"]').filter(e => e.textContent.includes('DOGE')).click();
    await click('.target-col .sim-add-btn');
    await type('.target-col .sim-val-input', '30');
    const allocation = await page.evaluate(() => JSON.parse(localStorage.getItem('rollercoin_web_power_allocations')));
    assert.deepEqual(allocation, { source: { BTC: 80 }, target: { DOGE: 30 } });
    await click('.main-tabs-4 > .main-tab:nth-of-type(4)');
    await page.waitForSelector('.withdraw-allocation');
    // 50 DOGE remaining; 144 blocks/day * (30 / 1030) * 1 DOGE/block => 11 days 22 hours.
    assert((await dogeCard()).includes('With 30% of your power'));
    assert((await dogeCard()).includes('11 days 22 hours'), await dogeCard());
    await click('.withdraw-toggle-btn:nth-of-type(2)');
    const expectedDate = new Date(Date.now() + (50 / (144 * 30 / 1030)) * 86400000).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' });
    assert.equal(await page.$eval('.withdraw-allocation strong', e => e.textContent), expectedDate);
    await click('.withdraw-toggle-btn:nth-of-type(1)');
    await page.setViewport({ width: 390, height: 844 });
    const card = await page.$('.withdraw-card:has(.withdraw-allocation)');
    await card.scrollIntoView();
    assert(await card.evaluate(card => card.scrollWidth <= card.clientWidth), 'Withdrawal allocation overflows on mobile');
    await card.screenshot({ path: path.join(os.tmpdir(), 'rollercoin-withdraw-allocation.png') });
    await page.setViewport({ width: 1440, height: 1000 });
    await page.reload({ waitUntil: 'networkidle0' });
    await page.waitForSelector('.withdraw-allocation');
    assert((await dogeCard()).includes('11 days 22 hours'));
    assert(await page.$('.simulator-panel'), 'Previously open allocation panel was closed by reload');
    await openPanel();
    assert.equal(await page.$eval('.source-col .sim-val-input', e => e.value), '80');
    assert.equal(await page.$eval('.target-col .sim-val-input', e => e.value), '30');
    await type('.target-col .sim-val-input', '0');
    await click('.main-tabs-4 > .main-tab:nth-of-type(4)');
    assert((await dogeCard()).includes('No earnings at this allocation'));
    // Balance already sufficient must remain withdrawable, even at 0% power.
    await page.evaluate(() => localStorage.setItem('rollercoin_web_balances', JSON.stringify({ DOGE: 100 })));
    await page.reload({ waitUntil: 'networkidle0' });
    await page.waitForSelector('.withdraw-allocation');
    assert.equal(await page.$eval('.withdraw-allocation strong', e => e.textContent), 'Ready to withdraw! ✨');
    await openPanel();
    await click('.source-col .sim-remove-btn');
    await click('.target-col .sim-remove-btn');
    await page.reload({ waitUntil: 'networkidle0' });
    await openPanel();
    assert.equal(await page.$$eval('.sim-list-item', e => e.length), 0);
    await click('.table-section:first-child .settings-icon-btn:nth-child(2)');
    await page.waitForSelector('.simulator-panel', { hidden: true });
    await page.reload({ waitUntil: 'networkidle0' });
    await page.waitForSelector('.earnings-tables');
    assert.equal(await page.$('.simulator-panel'), null, 'Previously closed allocation panel opened after reload');
    await click('.main-tabs-4 > .main-tab:nth-of-type(2)');
    await click('.manual-simulator .simulator-start-button:nth-child(3)');
    await type('.manual-simulator .simulator-power-input input', '1');
    await page.select('.manual-simulator .simulator-power-input select', 'Th');
    await type('.manual-simulator .simulator-baseline-inputs > label:nth-child(2) input', '10');
    await type('.manual-simulator .ms-input-row .input-group:first-child input', '25');
    await page.select('.manual-simulator .ms-input-row select', 'Gh');
    await click('.manual-simulator .ms-input-row button');
    await page.reload({ waitUntil: 'networkidle0' });
    await page.waitForSelector('.manual-simulator .ms-miner-list');
    assert.equal(await page.$$eval('.ms-miner-list > div', e => e.length), 2);
    assert.equal(await page.$eval('.simulator-power-input input', e => e.value), '1');
    assert.equal(await page.$eval('.simulator-power-input select', e => e.value), 'Th');
    assert.equal(await page.$eval('.simulator-baseline-inputs > label:nth-child(2) input', e => e.value), '10');
    await click('.ms-miner-list > div:first-child button');
    await page.reload({ waitUntil: 'networkidle0' });
    await page.waitForSelector('.manual-simulator .ms-miner-list');
    assert.equal(await page.$$eval('.ms-miner-list > div', e => e.length), 1);
    // Expiring API data must not expire user-created simulations.
    await page.evaluate(() => localStorage.setItem('rollercoin_web_userpower_timestamp', String(Date.now() - 600000)));
    await page.reload({ waitUntil: 'networkidle0' });
    await page.waitForSelector('.manual-simulator .ms-miner-list');
    assert.equal(await page.$$eval('.ms-miner-list > div', e => e.length), 1);
    await type('.manual-simulator .user-fetcher-row input', 'OTHER');
    await click('.manual-simulator .user-fetcher-row button');
    await page.waitForFunction(() => JSON.parse(localStorage.getItem('rollercoin_web_added_miners')).length === 0);
    assert.equal(await page.$('.ms-miner-list'), null);
    await page.evaluate(() => {
        localStorage.setItem('rollercoin_web_power_allocations', '{broken');
        localStorage.setItem('rollercoin_web_added_miners', '{}');
        localStorage.setItem('rollercoin_web_manual_baseline', '{broken');
    });
    await page.reload({ waitUntil: 'networkidle0' });
    await page.waitForSelector('.manual-simulator');
    assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('rollercoin_web_power_allocations'))), { source: {}, target: {} });
    assert.equal(await page.$('.ms-miner-list'), null);
    assert.deepEqual(errors, []);
    console.log('Passed: cached account hydration, allocation add/edit/remove/reload, 30% pool-adjusted withdrawal, zero power, ready balance, miner add/remove/reload, custom baseline restore and account switching.');
} finally {
    await browser?.close();
    await new Promise(resolve => server.close(resolve));
}
