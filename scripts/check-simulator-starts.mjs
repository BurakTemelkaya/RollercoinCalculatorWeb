// Run after npm run build: node scripts/check-simulator-starts.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

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
    userPowerResponseDto: { miners: 100, bonus: 5, bonus_percent: 500, racks: 10, games: 25, temp: 20, freon: 0, current_Power: 160, max_Power: 160, decrease: 0 }
};
const accountRoom = {
    is_user_from_session: false,
    rooms: [{ _id: 'account_room', room_info: { room_id: 'type', level: 0, cols: 8, rows: 3 } }],
    racks: [{ _id: 'account_rack', rack_id: rack.id, placement: { user_room_id: 'account_room', x: 0, y: 0 }, name: rack.name, bonus_percent: 1000, cells: 8, type: 'rack' }],
    miners: [{ _id: 'account_miner', miner_id: miner.id, placement: { user_rack_id: 'account_rack', x: 0, y: 0 }, name: miner.name, power: miner.power, bonus_percent: miner.percent, width: 2, level: 0, type: 'miner', filename: miner.fileName, is_in_set: false, updated: miner.createdDate }]
};
const paginated = item => ({ items: [item], index: 0, size: 20, count: 1, pages: 1, hasPrevious: false, hasNext: false });
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
let browser;
try {
    browser = await puppeteer.launch({ headless: true, timeout: 15000 });
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 1000 });
    await page.setBypassServiceWorker(true);
    await page.setRequestInterception(true);
    const errors = [];
    const requests = [];
    page.on('pageerror', err => errors.push(err.message));
    page.on('request', req => {
        const url = new URL(req.url());
        requests.push(url.pathname);
        let data;
        if (url.pathname === '/api/Miner') data = paginated(miner);
        else if (url.pathname === '/api/Rack') data = paginated(rack);
        else if (url.pathname === '/api/Rack/get-set-rack-list') data = [];
        else if (url.pathname === '/api/Miner/get-sellable') data = [{ minerId: miner.id, isSellable: true }];
        else if (url.pathname === '/api/RollercoinUser') data = account;
        else if (url.pathname === '/api/RollercoinUser/room') data = accountRoom;
        if (data !== undefined) {
            void req.respond({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(data) });
        } else if (req.url().startsWith(origin)) void req.continue();
        else void req.abort();
    });
    page.on('dialog', dialog => {
        errors.push(`Unexpected dialog: ${dialog.message()}`);
        void dialog.dismiss();
    });
    const click = async selector => {
        await page.waitForSelector(selector, { visible: true });
        await page.$eval(selector, element => element.scrollIntoView({ block: 'center', behavior: 'instant' }));
        await page.locator(selector).click();
    };
    const waitText = async (selector, text) => {
        try {
            await page.waitForFunction((selector, text) => document.querySelector(selector)?.textContent.includes(text), { timeout: 10000 }, selector, text);
        } catch (error) {
            const actual = await page.$eval(selector, element => element.textContent).catch(() => '(missing)');
            throw new Error(`${selector}: expected ${text}, got ${actual}`, { cause: error });
        }
    };
    const type = async (selector, value) => {
        await click(selector);
        await page.keyboard.press('Home');
        await page.keyboard.down('Shift');
        await page.keyboard.press('End');
        await page.keyboard.up('Shift');
        await page.keyboard.type(value);
    };
    const roomSelector = '.room-power-simulator';
    const manualSelector = '.manual-simulator';
    await page.goto(`${origin}/en`, { waitUntil: 'networkidle0' });
    assert.equal(await page.$$eval('.main-tabs-4 > .main-tab', elements => elements.length), 4);
    await click('.main-tabs-4 > .main-tab:nth-of-type(3)');
    await page.waitForSelector(`${roomSelector} .racks-grid`);
    assert.equal(await page.$$eval(`${roomSelector} [data-rack-id]`, elements => elements.length), 0);
    await waitText(`${roomSelector} .lpd-stat:nth-child(2) .label`, 'Miner Bonus');
    await waitText(`${roomSelector} .lpd-header .lpd-power-val`, '0');
    await click(`${roomSelector} .room-details-toggle`);
    await page.hover(`${roomSelector} .room-stat-help`);
    await page.waitForFunction(() => getComputedStyle(document.querySelector('.room-rack-bonus-tooltip')).visibility === 'visible');
    await waitText(`${roomSelector} .room-rack-bonus-tooltip`, 'total base miner power');
    await page.mouse.move(0, 0);
    await page.waitForFunction(() => getComputedStyle(document.querySelector('.room-rack-bonus-tooltip')).visibility === 'hidden');
    await click(`${roomSelector} .room-details-toggle`);
    assert(!requests.includes('/api/RollercoinUser'), 'Anonymous opening fetched an account');
    await click(`${roomSelector} .inv-tab:first-child`);
    await click(`${roomSelector} .inv-rack-card`);
    await page.waitForSelector(`${roomSelector} [data-rack-id]`);
    await click(`${roomSelector} .inv-tab:nth-child(2)`);
    await click(`${roomSelector} .inv-miner-card`);
    await waitText(`${roomSelector} .lpd-stat:nth-child(1) .value`, '100');
    await waitText(`${roomSelector} .lpd-stat:nth-child(2) .value`, '5.00%');
    await waitText(`${roomSelector} .lpd-header`, '115');
    await click(`${roomSelector} .simulator-start-button`);
    await page.waitForFunction(selector => document.querySelectorAll(`${selector} [data-rack-id]`).length === 0, {}, roomSelector);
    await waitText(`${roomSelector} .lpd-stat:nth-child(2) .value`, '0.00%');
    console.log('Anonymous room opens, catalog additions calculate power, and empty-room reset clears the layout.');

    await click('.main-tabs-4 > .main-tab:nth-of-type(2)');
    await page.waitForSelector(`${manualSelector} .simulator-baseline-card`);
    assert(await page.$eval(`${manualSelector} .simulator-start-button:first-child`, element => element.disabled));
    assert.equal(await page.$eval(`${manualSelector} .simulator-start-button:nth-child(2)`, element => element.getAttribute('aria-pressed')), 'true');
    await click(`${manualSelector} .main-tabs .main-tab:first-child`);
    await type(`${manualSelector} .ms-input-row .input-group:nth-child(1) input`, '100');
    await page.select(`${manualSelector} .ms-input-row select`, 'Gh');
    await type(`${manualSelector} .ms-input-row .input-group:nth-child(2) input`, '5');
    await type(`${manualSelector} .ms-input-row .input-group:nth-child(3) input`, '10');
    await click(`${manualSelector} .ms-input-row button`);
    await waitText(`${manualSelector} .simulation-results .result-row:first-child .value.primary`, '115');
    await click(`${manualSelector} .simulator-start-button:nth-child(3)`);
    await type(`${manualSelector} .simulator-power-input input`, '1');
    await page.select(`${manualSelector} .simulator-power-input select`, 'Th');
    await type(`${manualSelector} .simulator-baseline-inputs > label:nth-child(2) input`, '10');
    await waitText(`${manualSelector} .simulation-results .result-row:first-child .value.secondary`, '1.1');
    await waitText(`${manualSelector} .simulation-results .result-row:first-child .value.primary`, '1.275');
    await click(`${manualSelector} .simulator-start-button:nth-child(2)`);
    await waitText(`${manualSelector} .simulation-results .result-row:first-child .value.primary`, '115');
    console.log('Zero and entered-power modes produce the expected total including miner and rack bonuses.');

    await click('.main-tabs-4 > .main-tab:nth-of-type(3)');
    await type(`${roomSelector} .user-fetcher-row input`, 'BURAK');
    await click(`${roomSelector} .user-fetcher-row button`);
    await page.waitForSelector(`${roomSelector} [data-rack-id="account_rack"]`);
    await click(`${roomSelector} .simulator-start-button`);
    await page.waitForFunction(selector => document.querySelectorAll(`${selector} [data-rack-id]`).length === 0, {}, roomSelector);
    assert.equal(await page.$$eval(`${roomSelector} .temporary-power-dashboard`, elements => elements.length), 0);
    await waitText(`${roomSelector} .lpd-stat:first-child .value`, '0');
    await click(`${roomSelector} .simulator-start-button:nth-child(2)`);
    await page.waitForSelector(`${roomSelector} [data-rack-id="account_rack"]`);
    await waitText(`${roomSelector} .lpd-stat:first-child .value`, '100');
    console.log('Creating an empty account excludes account power and preserves the fetched room for returning.');

    await page.setViewport({ width: 390, height: 844 });
    await click('.main-tabs-4 > .main-tab:nth-of-type(2)');
    await click(`${manualSelector} .simulator-start-button:nth-child(3)`);
    const fitsInsideCard = await page.$eval(`${manualSelector} .simulator-baseline-card`, card => {
        const bounds = card.getBoundingClientRect();
        return [...card.querySelectorAll('button, input, select')].every(element => {
            const rect = element.getBoundingClientRect();
            return rect.left >= bounds.left && rect.right <= bounds.right;
        });
    });
    assert(fitsInsideCard, 'Starting-power controls overflow the card on mobile');
    await click('.main-tabs-4 > .main-tab:nth-of-type(3)');
    await click(`${roomSelector} .simulator-start-button`);
    await page.waitForSelector(`${roomSelector} .racks-grid`);
    await waitText(`${roomSelector} .lpd-stat:first-child .value`, '0');
    await click(`${roomSelector} .room-stat-help`);
    const tooltipBounds = await page.$eval(`${roomSelector} .room-rack-bonus-tooltip`, element => {
        const rect = element.getBoundingClientRect();
        return { visibility: getComputedStyle(element).visibility, left: rect.left, right: rect.right, viewport: innerWidth };
    });
    assert(tooltipBounds.visibility === 'visible' && tooltipBounds.left >= 0 && tooltipBounds.right <= tooltipBounds.viewport,
        `Rack-bonus explanation is hidden or outside the mobile viewport: ${JSON.stringify(tooltipBounds)}`);
    console.log('New starting controls fit on a 390px mobile viewport.');

    const mobileRackCard = '.mobile-inventory-modal .inv-rack-card';
    const rackSlots = `${roomSelector} .rack-add-slot`;
    assert.equal(await page.$$eval(rackSlots, elements => elements.length), 2);
    await waitText(`${roomSelector} .room-add-rack-button`, 'Add Rack');
    await page.$eval(`${roomSelector} .room-grid-area`, element => element.scrollIntoView({ block: 'start' }));
    const slotBounds = await page.$$eval(rackSlots, elements => elements.map(element => {
        const rect = element.getBoundingClientRect();
        const label = element.querySelector('.rack-add-slot-content');
        return { left: rect.left, right: rect.right, width: rect.width, height: rect.height,
            visible: getComputedStyle(label).opacity !== '0', viewport: innerWidth };
    }));
    assert(slotBounds.every(slot => slot.visible && slot.left >= 0 && slot.right <= slot.viewport && slot.width >= 44 && slot.height >= 44),
        `Mobile rack slots are hidden, too small, or overflow: ${JSON.stringify(slotBounds)}`);
    await click(`${rackSlots}:nth-of-type(2)`);
    await click(mobileRackCard);
    await page.waitForSelector('.mobile-inventory-modal', { hidden: true });
    assert.equal(await page.$$eval(`${roomSelector} [data-rack-id]`, elements => elements.length), 1);
    await page.setViewport({ width: 1440, height: 1000 });
    await page.waitForSelector(`${roomSelector} .room-details-toggle`, { visible: true });
    assert.equal(await page.$eval(`${roomSelector} [data-rack-id]`, element => element.style.gridColumn), '2',
        'Tapping the second mobile slot must place the rack at its chosen room position');
    assert.equal(await page.$$eval(rackSlots, elements => elements.length), 11);
    await page.setViewport({ width: 390, height: 844 });
    await page.waitForSelector(`${roomSelector} .room-details-toggle`, { hidden: true });
    await page.waitForFunction(selector => document.querySelectorAll(selector).length === 2, {}, rackSlots);

    // Cancelling a targeted addition must not affect the general Add Rack action.
    await page.waitForSelector('.notification-toast', { hidden: true });
    await click(`${rackSlots}:nth-of-type(2)`);
    await click('.mobile-inventory-modal .mobile-inv-close');
    await click(`${roomSelector} .room-add-rack-button`);
    await click(mobileRackCard);
    await page.waitForSelector('.mobile-inventory-modal', { hidden: true });
    for (let count = 2; count < 12; count++) {
        await page.waitForSelector('.notification-toast', { hidden: true });
        await click(`${roomSelector} .room-add-rack-button`);
        await click(mobileRackCard);
        await page.waitForSelector('.mobile-inventory-modal', { hidden: true });
        assert.equal(await page.$$eval(`${roomSelector} [data-rack-id]`, elements => elements.length), count + 1);
    }
    assert.equal(await page.$$eval(rackSlots, elements => elements.length), 0, 'A full room must not offer an empty rack slot');
    await page.setViewport({ width: 1440, height: 1000 });
    await page.waitForSelector(`${roomSelector} .room-details-toggle`, { visible: true });
    assert.equal(await page.$$eval(`${roomSelector} [data-rack-id]`, elements => new Set(elements.map(element => `${element.style.gridColumn}:${element.style.gridRow}`)).size), 12,
        'Rack additions must use distinct room positions');
    await page.setViewport({ width: 320, height: 844 });
    await click(`${roomSelector} .simulator-start-button`);
    assert.equal(await page.$$eval(rackSlots, elements => elements.length), 2);
    const rackButtonFits = await page.$eval(`${roomSelector} .room-add-rack-button`, element => {
        const rect = element.getBoundingClientRect();
        return rect.left >= 0 && rect.right <= innerWidth && element.textContent.includes('Add Rack');
    });
    assert(rackButtonFits, 'The labeled Add Rack button overflows a 320px mobile viewport');
    if (process.env.SIMULATOR_SCREENSHOT_PATH) {
        await page.setViewport({ width: 390, height: 844 });
        await page.waitForSelector(rackSlots, { visible: true });
        await (await page.$(`${roomSelector} .room-grid-area`)).screenshot({ path: process.env.SIMULATOR_SCREENSHOT_PATH });
    }
    console.log('Mobile rack slots are visible and tappable, preserve selected positions, fill the room without overlap, and return after reset.');
    assert.deepEqual(errors, [], 'Browser runtime errors');
} finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
}
