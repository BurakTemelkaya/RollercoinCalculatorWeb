// Run after npm run build: node scripts/check-account-power-ui.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';
import os from 'node:os';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const mime = { '.js': 'application/javascript', '.css': 'text/css', '.html': 'text/html', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp' };
const server = http.createServer((req, res) => {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    let file = path.join(dist, pathname);
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(dist, 'index.html');
    res.setHeader('Content-Type', mime[path.extname(file)] ?? 'application/octet-stream');
    res.end(fs.readFileSync(file));
});
const miner = { id: 'test_miner', name: 'Test Miner', fileName: 'crypto_combo', imageVersion: 1, level: 0, percent: 500, power: 100, width: 2, createdDate: '2026-01-01', isCanBeSoldOnMp: true };
const rack = { id: 'test_rack', name: 'Regular Rack 8', capacity: 8, powerBonus: 1000, createdDate: '2026-01-01' };
const account = {
    userProfileResponseDto: { avatar_Id: 'test_account', gender: 'male', name: 'BURAK', registration: '2020-01-01', league_Id: '1' },
    userPowerResponseDto: { miners: 100, bonus: 12.5, bonus_percent: 1250, racks: 10, games: 25, temp: 20, freon: 15, hamster_expedition_bonus_percent: 125, hamster_expedition_bonus_power: 37.5, current_Power: 220, max_Power: 122.5, decrease: 0 }
};
const accountRoom = {
    is_user_from_session: false,
    rooms: [{ _id: 'account_room', room_info: { room_id: 'type', level: 0, cols: 8, rows: 3 } }],
    racks: [{ _id: 'account_rack', rack_id: rack.id, placement: { user_room_id: 'account_room', x: 0, y: 0 }, name: rack.name, bonus_percent: 1000, cells: 8, type: 'rack' }],
    miners: [{ _id: 'account_miner', miner_id: miner.id, placement: { user_rack_id: 'account_rack', x: 0, y: 0 }, name: miner.name, power: miner.power, bonus_percent: miner.percent, width: 2, level: 0, type: 'miner', filename: miner.fileName, is_in_set: false, updated: miner.createdDate }]
};

await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const errors = [];
let browser;
try {
    browser = await puppeteer.launch({ headless: true, timeout: 15000 });
    const page = await browser.newPage();
    page.setDefaultTimeout(10000);
    await page.setViewport({ width: 1440, height: 1000 });
    await page.setBypassServiceWorker(true);
    page.on('pageerror', error => errors.push(error.message));
    await page.setRequestInterception(true);
    page.on('request', req => {
        const pathname = new URL(req.url()).pathname;
        let data;
        if (pathname === '/api/Rack/get-set-rack-list') data = [];
        else if (pathname === '/api/Miner') data = { items: [miner], index: 0, pages: 1 };
        else if (pathname === '/api/Rack') data = { items: [rack], index: 0, pages: 1 };
        if (data !== undefined) void req.respond({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(data) });
        else if (req.url().startsWith(origin)) void req.continue();
        else void req.abort();
    });
    const click = async selector => {
        await page.waitForSelector(selector, { visible: true });
        await page.$eval(selector, e => e.scrollIntoView({ block: 'center', behavior: 'instant' }));
        await page.locator(selector).click();
        if (selector.startsWith('.main-tabs-4')) await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 450)));
    };
    const earningsEmpty = '.tab-panel:first-child .calculator-empty-state';
    const withdrawEmpty = '.tab-panel:nth-child(4) .calculator-empty-state';
    await page.goto(`${origin}/tr`, { waitUntil: 'networkidle0' });
    await page.waitForSelector(earningsEmpty, { visible: true });
    assert(await page.$eval(earningsEmpty, e => e.getBoundingClientRect().height < 220), 'Initial notice reserves excessive vertical space');
    const checkActiveHeight = async () => {
        await page.waitForFunction(() => {
            const active = [...document.querySelectorAll('.main-tabs-4 > .main-tab')].findIndex(tab => tab.classList.contains('active'));
            const panel = document.querySelectorAll('.tab-slider-track > .tab-panel')[active];
            const viewport = document.querySelector('.tab-slider-viewport');
            return panel && Math.abs(viewport.getBoundingClientRect().height - panel.getBoundingClientRect().height) < 1
                && panel.getBoundingClientRect().height > 0
                && document.querySelectorAll('.tab-panel:not(.collapsed)').length === 1;
        });
    };
    await checkActiveHeight();
    assert((await page.$eval(earningsEmpty, e => e.textContent)).includes('kullanıcı adınızı'));
    assert((await page.$eval(earningsEmpty, e => e.textContent)).includes('gücünüzü girin'));
    await click('.main-tabs-4 > .main-tab:nth-of-type(4)');
    await page.waitForSelector(withdrawEmpty, { visible: true });
    await checkActiveHeight();
    assert((await page.$eval(withdrawEmpty, e => e.textContent)).includes('Çekim süresini görmek'));
    await page.setViewport({ width: 390, height: 844 });
    await page.$eval(withdrawEmpty, e => e.scrollIntoView({ block: 'center' }));
    await (await page.$(withdrawEmpty)).screenshot({ path: path.join(os.tmpdir(), 'rollercoin-empty-state.png') });
    await page.setViewport({ width: 1440, height: 1000 });
    const seedAccount = async room => page.evaluate((account, room) => {
        const coins = ['BTC', 'DOGE'].map(displayName => ({ code: displayName.toLowerCase(), displayName, leaguePower: { value: 1000, unit: 'Gh' }, leaguePowerFormatted: '1 Th/s', isGameToken: false }));
        localStorage.setItem('rollercoin_web_userpower', JSON.stringify({ value: 220, unit: 'Gh' }));
        localStorage.setItem('rollercoin_web_userpower_timestamp', String(Date.now()));
        localStorage.setItem('rollercoin_web_fetched_user', JSON.stringify(account));
        if (room) localStorage.setItem('rollercoin_web_fetched_room', JSON.stringify(room));
        localStorage.setItem('rollercoin_web_coins', JSON.stringify(coins));
        localStorage.setItem('rollercoin_web_active_tab', 'calculator');
    }, account, room);
    await seedAccount(null);
    await page.reload({ waitUntil: 'networkidle0' });
    await page.waitForSelector('.earnings-tables');
    assert.equal(await page.$(earningsEmpty), null);
    await click('.main-tabs-4 > .main-tab:nth-of-type(4)');
    await page.waitForSelector('.withdraw-grid');
    assert.equal(await page.$(withdrawEmpty), null);
    const expected = { miners: '100 Gh/s', racks: '10 Gh/s', bonus: '12.5 Gh/s', games: '25 Gh/s', temp: '20 Gh/s', freon: '15 Gh/s', hamster: '37.5 Gh/s', current_Power: '220 Gh/s', max_Power: '122.5 Gh/s' };
    const checkBreakdown = async scope => {
        await page.waitForSelector(`${scope} .account-power-breakdown`, { visible: true });
        if ((await page.viewport()).width >= 1024) {
            assert(await page.$eval(`${scope} .account-power-sources`, grid =>
                new Set([...grid.children].map(card => card.getBoundingClientRect().top)).size === 1), `${scope}: seventh card must fit in the same desktop row`);
        }
        assert(await page.$eval(`${scope} .account-power-breakdown`, card => {
            const last = card.lastElementChild;
            return card.getBoundingClientRect().bottom - last.getBoundingClientRect().bottom <= 22;
        }), `${scope}: excessive bottom gap`);
        for (const [key, value] of Object.entries(expected)) {
            assert.equal(await page.$eval(`${scope} [data-power-source="${key}"] dd`, e => e.textContent), value, `${scope}: ${key}`);
        }
        assert((await page.$eval(`${scope} [data-power-source="hamster"] .account-power-percent`, e => e.textContent)).includes('1,25%'));
        assert((await page.$eval(`${scope} [data-power-source="bonus"] .account-power-percent`, e => e.textContent)).includes('12,5%'));
        assert(await page.$$eval(`${scope} .account-power-breakdown dt, ${scope} .account-power-breakdown dd`, elements => elements.every(element => getComputedStyle(element).textAlign === 'center')), `${scope}: statistics must be centered`);
    };
    await click('.main-tabs-4 > .main-tab:nth-of-type(2)');
    await checkBreakdown('.manual-simulator');
    await checkActiveHeight();
    await click('.manual-simulator .simulator-start-button:nth-child(2)');
    assert.equal(await page.$('.manual-simulator .account-power-breakdown'), null);
    await click('.manual-simulator .simulator-start-button:first-child');
    await checkBreakdown('.manual-simulator');
    await click('.main-tabs-4 > .main-tab:nth-of-type(3)');
    await page.waitForSelector('.beautiful-fetch-room');
    await checkBreakdown('.room-power-simulator');
    await checkActiveHeight();
    // A room is not required for the account snapshot, and room power must not replace API hamster power.
    await seedAccount(accountRoom);
    await page.reload({ waitUntil: 'networkidle0' });
    await click('.main-tabs-4 > .main-tab:nth-of-type(3)');
    await page.waitForSelector('[data-rack-id="account_rack"]');
    await checkBreakdown('.room-power-simulator');
    await click('.room-power-simulator .simulator-start-button');
    assert.equal(await page.$('.room-power-simulator .account-power-breakdown'), null);
    await click('.room-power-simulator .simulator-start-button:nth-child(2)');
    await checkBreakdown('.room-power-simulator');
    for (const width of [390, 320]) {
        await page.setViewport({ width, height: 844 });
        for (const [tab, scope] of [[2, '.manual-simulator'], [3, '.room-power-simulator']]) {
            await click(`.main-tabs-4 > .main-tab:nth-of-type(${tab})`);
            await checkBreakdown(scope);
            assert(await page.$eval(`${scope} .account-power-breakdown`, card => {
                const bounds = card.getBoundingClientRect();
                return bounds.left >= 0 && bounds.right <= innerWidth && card.scrollWidth <= card.clientWidth;
            }), `${scope} overflows ${width}px`);
            if (width === 390) await (await page.$(`${scope} .account-power-breakdown`)).screenshot({ path: path.join(os.tmpdir(), `rollercoin-account-power-${tab}.png`) });
        }
    }
    await page.evaluate(() => {
        const saved = JSON.parse(localStorage.getItem('rollercoin_web_fetched_user'));
        saved.userPowerResponseDto.freon = 0;
        saved.userPowerResponseDto.hamster_expedition_bonus_percent = 0;
        saved.userPowerResponseDto.hamster_expedition_bonus_power = 0;
        localStorage.setItem('rollercoin_web_fetched_user', JSON.stringify(saved));
    });
    await page.reload({ waitUntil: 'networkidle0' });
    for (const [tab, scope] of [[2, '.manual-simulator'], [3, '.room-power-simulator']]) {
        await click(`.main-tabs-4 > .main-tab:nth-of-type(${tab})`);
        await page.waitForSelector(`${scope} .account-power-breakdown`);
        assert.equal(await page.$(`${scope} [data-power-source="hamster"]`), null);
        assert.equal(await page.$(`${scope} [data-power-source="freon"]`), null);
    }
    await page.evaluate(() => {
        const saved = JSON.parse(localStorage.getItem('rollercoin_web_fetched_user'));
        delete saved.userPowerResponseDto.hamster_expedition_bonus_power;
        saved.userPowerResponseDto.hamster_expedition_bonus_percent = 125;
        localStorage.setItem('rollercoin_web_fetched_user', JSON.stringify(saved));
    });
    await page.reload({ waitUntil: 'networkidle0' });
    for (const [tab, scope] of [[2, '.manual-simulator'], [3, '.room-power-simulator']]) {
        await click(`.main-tabs-4 > .main-tab:nth-of-type(${tab})`);
        await page.waitForSelector(`${scope} .account-power-breakdown`);
        assert.equal(await page.$(`${scope} [data-power-source="hamster"]`), null);
    }
    // Rapidly revisit a tab before the previous slide finishes.
    await page.evaluate(() => {
        const tabs = document.querySelectorAll('.main-tabs-4 > .main-tab');
        tabs[1].click();
    });
    await page.waitForFunction(() => document.querySelectorAll('.main-tabs-4 > .main-tab')[1].classList.contains('active'));
    await page.evaluate(() => document.querySelectorAll('.main-tabs-4 > .main-tab')[0].click());
    await page.waitForFunction(() => document.querySelectorAll('.main-tabs-4 > .main-tab')[0].classList.contains('active'));
    await page.evaluate(() => document.querySelectorAll('.main-tabs-4 > .main-tab')[1].click());
    await page.waitForFunction(() => document.querySelectorAll('.main-tabs-4 > .main-tab')[1].classList.contains('active'));
    await checkActiveHeight();
    await page.reload({ waitUntil: 'networkidle0' });
    await page.waitForSelector('.manual-simulator .account-power-breakdown');
    await checkActiveHeight();
    assert.deepEqual(errors, []);
    console.log('Passed: Turkish empty earnings/withdraw notices, populated-state replacement, all account power fields in both simulators, exact API hamster power, fractional percentages, room-free account view, zero/empty starts, zero/missing fields and 390px/320px layouts.');
} finally {
    await browser?.close();
    await new Promise(resolve => server.close(resolve));
}
