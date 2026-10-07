// Run after npm run build: node scripts/check-set-miners.mjs
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
const alpha = { id: 'alpha', name: 'Alpha / Miner & Friends', fileName: 'alpha', imageVersion: 1, level: 0, percent: 500, power: 100, width: 2, createdDate: '2026-01-01', isCanBeSoldOnMp: true };
const beta = { ...alpha, id: 'beta', name: 'Beta Miner', fileName: 'beta', width: 1, power: 200, percent: 1000 };
const rack = { id: 'new_set_rack', name: 'New Set Rack 8', capacity: 8, powerBonus: 0, createdDate: '2026-01-01' };
const set = {
    id: 'new_set', name: 'New Set', requiredRackId: rack.id, requiredRack: rack,
    rackSetLevels: [{ id: 'level', minerSetId: 'new_set', level: 1, requiredUniqueMiners: 2, bonusPercent: 1000, conditionAmount: 2, conditionType: 'unique_miner' }],
    rackSetItems: [alpha, beta].map(miner => ({ minerSetId: 'new_set', minerId: miner.id, minerFilename: miner.fileName, miner })),
};
const room = {
    is_user_from_session: false, miners: [],
    rooms: [
        { _id: 'room', room_info: { room_id: 'type', level: 0, cols: 8, rows: 3 } },
        { _id: 'second-room', room_info: { room_id: 'type', level: 1, cols: 8, rows: 3 } },
    ],
    racks: [{ _id: 'rack', rack_id: rack.id, placement: { user_room_id: 'room', x: 0, y: 0 }, name: rack.name, bonus_percent: 0, cells: 8, type: 'rack' }],
};
const outsider = { ...alpha, id: 'outsider', name: 'Unrelated Miner', fileName: 'outsider' };
const bulkRoom = {
    ...room,
    racks: [...room.racks, { ...room.racks[0], _id: 'other-rack', rack_id: 'plain-rack', name: 'Plain Rack', placement: { user_room_id: 'room', x: 1, y: 0 } }],
    miners: ['rack', 'other-rack'].map(rackId => ({
        _id: `original-${rackId}`, miner_id: outsider.id, name: outsider.name, filename: outsider.fileName,
        power: outsider.power, bonus_percent: outsider.percent, width: outsider.width, level: 0, type: 'miner',
        is_in_set: false, updated: '2026-01-01', placement: { user_rack_id: rackId, x: 0, y: 0 },
    })),
};
const oversizedSet = {
    ...set,
    rackSetItems: Array.from({ length: 5 }, (_, index) => {
        const miner = { ...alpha, id: `wide-${index}`, fileName: `wide-${index}` };
        return { minerId: miner.id, minerFilename: miner.fileName, minerSetId: set.id, miner };
    }),
};
const unavailableSet = { ...set, rackSetItems: [set.rackSetItems[0], { minerId: 'missing', minerFilename: 'missing', minerSetId: set.id }] };
const account = {
    userProfileResponseDto: { avatar_Id: 'account', gender: 'male', name: 'BURAK', registration: '2020-01-01', league_Id: '1' },
    userPowerResponseDto: { miners: 0, bonus: 0, bonus_percent: 0, racks: 0, games: 0, temp: 0, freon: 0, current_Power: 0, max_Power: 0, decrease: 0 },
};
const paginated = items => ({ items, index: 0, size: 20, count: items.length, pages: 1, hasPrevious: false, hasNext: false });
const event = {
    id: 'event', name: 'Test Event', endDate: '2099-01-01T00:00:00Z', createdDate: '2026-01-01T00:00:00Z', totalPoint: 100,
    levels: [{ id: 'one', level: 1, levelXp: 100, requiredXp: 100 }], multipliers: [], tasks: [],
    rewards: [{ id: 'reward', progressionEventId: 'event', requiredLevel: 1, rewardType: 'miner', amount: 1, currency: '', itemId: alpha.id, minerId: alpha.id, ttlTime: 0, miner: alpha }],
};
const merges = [1, 2, 3, 4, 5].map(level => ({
    id: `merge_${level}`, resultItemId: `alpha_${level}`, resultItemName: alpha.name, resultItemFileName: alpha.fileName,
    resultItemLevel: level, resultItemPower: 100 * (level + 1), resultItemPercent: 500 * (level + 1), resultItemWidth: 2,
    amount: 1000000, requiredItems: [],
}));
const localSetsSource = fs.readFileSync(fileURLToPath(new URL('../src/data/sets.ts', import.meta.url)), 'utf8');
const localSet = JSON.parse(localSetsSource.split('export const SETS_DATA: RollercoinSet[] = ')[1].trim().slice(0, -1))[0];
const legacyMiner = { ...beta, id: localSet.miners[0].item_id, name: localSet.miners[0].title.en, fileName: localSet.miners[0].filename };
const legacySet = {
    ...set, requiredRackId: localSet.rack.id, name: localSet.title.en,
    rackSetItems: [{ minerId: legacyMiner.id, minerFilename: legacyMiner.fileName, minerSetId: set.id }],
};
const legacyRoom = { ...room, racks: [{ ...room.racks[0], rack_id: localSet.rack.id, name: localSet.rack.title.en }] };
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
let browser;
try {
    browser = await puppeteer.launch({ headless: true, timeout: 15000 });
    for (const mobile of [false, true]) {
        const page = await browser.newPage();
        const errors = [];
        let minerRequests = 0;
        let useLegacySet = false;
        let useUnnamedLegacySet = false;
        let unnamedLegacyRequests = 0;
        let legacySearchRequests = 0;
        let bulkCase = null;
        await page.setViewport(mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 });
        await page.setBypassServiceWorker(true);
        await page.setRequestInterception(true);
        page.on('pageerror', error => errors.push(error.message));
        page.on('request', req => {
            const url = new URL(req.url());
            let data;
            if (url.pathname === '/api/Miner') {
                minerRequests++;
                if (useUnnamedLegacySet && !url.searchParams.has('Name')) {
                    unnamedLegacyRequests++;
                    data = url.searchParams.get('PageRequest.PageIndex') === '0'
                        ? { ...paginated([{ ...alpha, id: 'wrong-level' }]), hasNext: true, pages: 2 }
                        : { ...paginated([alpha]), index: 1, pages: 2 };
                } else if (useUnnamedLegacySet && url.searchParams.get('Name') === alpha.fileName) data = paginated([]);
                else if (bulkCase === 'unavailable') data = paginated([]);
                else if (useLegacySet && url.searchParams.get('Name') === legacyMiner.name) {
                    legacySearchRequests++;
                    data = url.searchParams.get('PageRequest.PageIndex') === '0'
                        ? { ...paginated([{ ...legacyMiner, id: 'distractor', fileName: 'different_miner' }]), hasNext: true, pages: 2 }
                        : { ...paginated([legacyMiner]), index: 1, pages: 2 };
                } else data = paginated([alpha, beta]);
            }
            else if (url.pathname === '/api/Rack') data = paginated([rack]);
            else if (url.pathname === '/api/Rack/get-set-rack-list') data = [bulkCase === 'overfull' ? oversizedSet : bulkCase === 'unavailable' ? unavailableSet : bulkCase === 'fits' ? { ...set, rackSetItems: [...set.rackSetItems].reverse() } : useUnnamedLegacySet ? { ...set, rackSetItems: [{ minerId: alpha.id, minerFilename: alpha.fileName, minerSetId: set.id }] } : useLegacySet ? legacySet : set];
            else if (url.pathname === '/api/Miner/get-sellable') data = [];
            else if (url.pathname === '/api/RollercoinUser') data = account;
            else if (url.pathname === '/api/RollercoinUser/room') data = bulkCase ? bulkRoom : useUnnamedLegacySet ? room : useLegacySet ? legacyRoom : room;
            else if (url.pathname === '/api/ProgressionEvents') data = event;
            else if (url.pathname === '/api/Merges/get-by-miner-name') {
                assert.equal(url.searchParams.get('minerName'), alpha.name);
                data = merges;
            }
            if (data !== undefined) void req.respond({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(data) });
            else if (req.url().startsWith(origin)) void req.continue();
            else void req.abort();
        });
        const click = async selector => {
            if (selector === '.rack-edit-close' || selector.startsWith('[data-rack-id=') || selector === '.rack-set-remove') {
                await page.waitForFunction(() => document.querySelectorAll('.notification-toast').length === 0);
            }
            await page.waitForSelector(selector, { visible: true });
            await page.$eval(selector, element => element.scrollIntoView({ block: 'center', behavior: 'instant' }));
            if (selector.startsWith('[data-rack-id=')) {
                // Click the rack border, away from miner hover controls.
                const offset = await page.$eval(selector, element => {
                    const rect = element.getBoundingClientRect();
                    return { x: rect.width - 2, y: rect.height - 2 };
                });
                await page.locator(selector).click({ offset });
            } else await page.locator(selector).click();
            if (selector === '.rack-edit-close') await page.waitForSelector('.rack-edit-modal', { hidden: true });
            if (selector.startsWith('[data-rack-id=')) await page.waitForSelector('.rack-edit-modal', { visible: true });
        };
        await page.goto(`${origin}/en`, { waitUntil: 'networkidle0' });
        await click('.main-tabs-4 > .main-tab:nth-of-type(3)');
        await page.type('.room-power-simulator .user-fetcher-row input', 'BURAK');
        await click('.room-power-simulator .user-fetcher-row button');
        await page.waitForSelector('[data-rack-id="rack"]');
        if (!mobile) await click('.room-details-toggle');
        await click('[data-rack-id="rack"]');
        await page.waitForSelector('.rack-set-miner');
        assert.equal(await page.$$eval('.rack-set-miner', elements => elements.length), 2);
        const initialRequests = minerRequests;
        await click('.rack-set-miner:first-child button:last-child');
        await page.waitForFunction(() => document.querySelectorAll('.rack-edit-miner-name').length === 1);
        assert.equal(await page.$$eval('.room-stat-item .rs-label', elements => elements.some(element => element.textContent === 'Set Bonus')), false, 'One unique miner must not activate a set requiring two');
        await page.type('.rack-set-picker input', 'bEtA');
        assert.equal(await page.$$eval('.rack-set-miner', elements => elements.length), 1);
        await click('.rack-set-miner button:last-child');
        await page.waitForFunction(() => document.querySelectorAll('.rack-edit-miner-name').length === 2);
        assert.equal(await page.$$eval('.rack-set-remove', elements => elements.length), 1);
        assert.equal(await page.$('.rack-set-placed'), null);
        await click('.rack-set-miner button:last-child');
        await page.waitForFunction(() => document.querySelectorAll('.rack-edit-miner-name').length === 3);
        await page.$eval('.rack-set-picker input', element => { element.focus(); element.select(); });
        await page.keyboard.type('no matching miner');
        assert.equal(await page.$$eval('.rack-set-miner', elements => elements.length), 0);
        await page.$eval('.rack-set-picker input', element => { element.focus(); element.select(); });
        await page.keyboard.type('alpha');
        await click('.rack-set-miner button:last-child');
        await page.waitForFunction(() => document.querySelectorAll('.rack-edit-miner-name').length === 4);
        await click('.rack-set-miner button:last-child');
        await page.waitForFunction(() => document.querySelectorAll('.rack-edit-miner-name').length === 5);
        await click('.rack-set-miner button:last-child');
        assert.equal(await page.$$eval('.rack-edit-miner-name', elements => elements.length), 5, 'Full rack must reject addition');
        assert.equal(minerRequests, initialRequests, 'Hydrated set miners must not trigger miner searches');
        const bounds = await page.$eval('.rack-set-picker', element => {
            const rect = element.getBoundingClientRect();
            return { left: rect.left, right: rect.right, width: window.innerWidth };
        });
        assert(bounds.left >= 0 && bounds.right <= bounds.width, 'Set picker overflows viewport');
        await click('.rack-edit-close');
        const bonuses = await page.$$eval('.room-stat-item', elements => elements.map(element => element.textContent));
        assert(bonuses.some(text => text.includes('Set Bonus') && text.includes('10.00%')), `New sets must activate their bonus: ${JSON.stringify(bonuses)}`);
        const stats = await page.$$eval('.room-stat-item', elements => Object.fromEntries(elements.map(element => [
            element.querySelector('.rs-label')?.textContent,
            { value: element.querySelector('.rs-value')?.textContent.trim(), power: element.querySelector('.rs-subvalue')?.textContent.trim() },
        ])));
        // Three Alpha (100 GH/s) and two Beta (200 GH/s): 700 base,
        // 15% unique miner bonus = 105, 10% set bonus = 70, total = 875.
        assert.equal(stats['Room Base Power'].value, '700 Gh/s');
        assert.equal(stats['Miner Bonuses'].value, '+15.00%', 'Duplicate miners must not multiply their collection bonus');
        assert.equal(stats['Miner Bonuses'].power, '+105 Gh/s');
        assert.equal(stats['Set Bonus'].value, '+10.00%', 'Duplicate miners must not multiply their set bonus');
        assert.equal(stats['Set Bonus'].power, '+70 Gh/s', 'Set bonus must contribute actual power');
        assert.equal(stats['Room Total Power'].value, '875 Gh/s', 'Total power must include the set bonus');
        await page.waitForFunction(() => document.querySelectorAll('.notification-toast').length === 0);
        const roomBounds = () => page.$eval('.room-grid-area', element => {
            const rect = element.getBoundingClientRect();
            return { width: rect.width, height: rect.height };
        });
        const firstRoomBounds = await roomBounds();
        await click('.room-numbers button:nth-of-type(2)');
        await page.waitForFunction(() => document.querySelector('.room-numbers button:nth-of-type(2)')?.style.background === 'rgb(255, 255, 255)');
        const secondRoomBounds = await roomBounds();
        assert(Math.abs(firstRoomBounds.width - secondRoomBounds.width) < 1, `Room switching must preserve width: ${JSON.stringify({ firstRoomBounds, secondRoomBounds })}`);
        if (!mobile) assert(Math.abs(firstRoomBounds.height - secondRoomBounds.height) < 1, `Desktop room switching must preserve the reserved area: ${JSON.stringify({ firstRoomBounds, secondRoomBounds })}`);
        await click('.room-numbers button:first-of-type');
        await page.waitForFunction(() => document.querySelector('.room-numbers button:first-of-type')?.style.background === 'rgb(255, 255, 255)');
        await click('[data-rack-id="rack"]');
        await page.waitForSelector('.rack-set-picker input');
        await page.$eval('.rack-set-picker input', element => { element.focus(); element.select(); });
        await page.keyboard.type('bEtA');
        await click('.rack-set-replace-all');
        await page.waitForFunction(() => document.querySelectorAll('.rack-edit-miner-name').length === 2);
        assert.deepEqual(await page.$$eval('.rack-edit-miner-name', elements => elements.map(element => element.textContent)), [alpha.name, beta.name], 'Replace all must include the complete set despite the name filter');
        await page.waitForFunction(() => document.querySelectorAll('.notification-toast').length === 0);
        await click('.rack-set-remove');
        await page.waitForFunction(() => document.querySelectorAll('.rack-edit-miner-name').length === 1);
        assert.equal(await page.$$eval('.room-stat-item .rs-label', elements => elements.some(element => element.textContent === 'Set Bonus')), false, 'Removing a required miner must deactivate the set bonus');
        await click('.rack-set-replace-all');
        await page.waitForFunction(() => document.querySelectorAll('.rack-edit-miner-name').length === 2);
        await click('.rack-edit-close');
        const replacedStats = await page.$$eval('.room-stat-item', elements => elements.map(element => element.textContent));
        assert(replacedStats.some(text => text.includes('Set Bonus') && text.includes('+30 Gh/s')));
        assert(replacedStats.some(text => text.includes('Room Total Power') && text.includes('375 Gh/s')));
        await page.goto(`${origin}/en/event`, { waitUntil: 'networkidle0' });
        await page.waitForSelector('.pe-reward-item-container.pe-miner-levels-link');
        const links = await page.$$eval('.pe-miner-levels-link', elements => elements.map(element => ({ href: element.getAttribute('href'), target: element.target, rel: element.rel })));
        assert.equal(links.length, 2, 'Both final reward and table reward should link to merge levels');
        for (const link of links) {
            assert.equal(link.href, `/en/merges/miner/${encodeURIComponent(alpha.name)}`);
            assert.equal(link.target, '_blank');
            assert(link.rel.includes('noopener'));
        }
        await page.goto(`${origin}${links[0].href}`, { waitUntil: 'networkidle0' });
        await page.waitForSelector('.merge-title');
        assert((await page.$eval('.merge-title', element => element.textContent)).includes(alpha.name));
        await page.waitForSelector('.miner-level-card');
        assert.equal(await page.$$eval('.miner-level-card', elements => elements.length), 5, 'All merge levels must be shown by default');
        // Older set responses must use the actual catalog width, including
        // paginated name matches, and must reuse the resolved entry afterwards.
        useLegacySet = true;
        await page.evaluate(() => localStorage.clear());
        await page.goto(`${origin}/en`, { waitUntil: 'networkidle0' });
        await click('.main-tabs-4 > .main-tab:nth-of-type(3)');
        await page.type('.room-power-simulator .user-fetcher-row input', 'BURAK');
        await click('.room-power-simulator .user-fetcher-row button');
        await click('[data-rack-id="rack"]');
        await click('.rack-set-miner button:last-child');
        await page.waitForFunction(() => document.querySelectorAll('.rack-edit-miner-name').length === 1);
        assert.equal(legacySearchRequests, 2);
        assert.equal(await page.$eval('.rack-edit-miner-name', element => element.textContent), legacyMiner.name);
        assert.equal(await page.$$eval('.rack-edit-slot-row:first-child .rack-edit-miner-card.empty', elements => elements.length), 1, 'One-cell miner must leave the adjacent cell free');
        await click('.rack-set-miner button:last-child');
        await page.waitForFunction(() => document.querySelectorAll('.rack-edit-miner-name').length === 2);
        assert.equal(legacySearchRequests, 2, 'Resolved legacy miner must be cached');
        useUnnamedLegacySet = true;
        await page.evaluate(() => localStorage.clear());
        await page.goto(`${origin}/en`, { waitUntil: 'networkidle0' });
        await click('.main-tabs-4 > .main-tab:nth-of-type(3)');
        await page.type('.room-power-simulator .user-fetcher-row input', 'BURAK');
        await click('.room-power-simulator .user-fetcher-row button');
        await click('[data-rack-id="rack"]');
        const requestsBeforeAdd = unnamedLegacyRequests;
        await click('.rack-set-miner button:last-child');
        await page.waitForFunction(() => document.querySelectorAll('.rack-edit-miner-name').length === 1);
        assert.equal(unnamedLegacyRequests - requestsBeforeAdd, 2, 'Filename-only sets must search the paginated catalog');
        assert.equal(await page.$eval('.rack-edit-miner-name', element => element.textContent), alpha.name);
        assert.equal(await page.$$eval('.rack-set-remove', elements => elements.length), 1, 'A matching filename from a different miner ID must not be placed');
        useUnnamedLegacySet = false;
        for (const scenario of ['fits', 'overfull', 'unavailable']) {
            bulkCase = scenario;
            await page.evaluate(() => localStorage.clear());
            await page.goto(`${origin}/en`, { waitUntil: 'networkidle0' });
            await click('.main-tabs-4 > .main-tab:nth-of-type(3)');
            await page.type('.room-power-simulator .user-fetcher-row input', 'BURAK');
            await click('.room-power-simulator .user-fetcher-row button');
            await click('[data-rack-id="rack"]');
            await click('.rack-set-replace-all');
            if (scenario === 'fits') {
                await page.waitForFunction(() => document.querySelectorAll('.rack-edit-miner-name').length === 2);
                assert.deepEqual(await page.$$eval('.rack-edit-miner-name', elements => elements.map(element => element.textContent)), [alpha.name, beta.name], 'Bulk replacement must remove unrelated miners and pack wide miners first');
            } else {
                const message = scenario === 'overfull'
                    ? 'The set miners do not fit in this rack. Existing miners were kept.'
                    : 'Could not load miner details. Please try again.';
                await page.waitForFunction(message => document.body.textContent.includes(message), {}, message);
                assert.deepEqual(await page.$$eval('.rack-edit-miner-name', elements => elements.map(element => element.textContent)), [outsider.name], 'Failed bulk replacement must keep the original rack intact');
            }
            await page.waitForFunction(() => document.querySelectorAll('.notification-toast').length === 0);
            await click('.rack-edit-close');
            await click('[data-rack-id="other-rack"]');
            assert.deepEqual(await page.$$eval('.rack-edit-miner-name', elements => elements.map(element => element.textContent)), [outsider.name], 'Other racks must remain unchanged');
            await click('.rack-edit-close');
        }
        assert.equal(errors.length, 0, errors.join('\n'));
        console.log(`${mobile ? 'Mobile' : 'Desktop'}: set search, placement, duplicates, full rack, set bonus power, removal, bulk replacement, failure preservation, other racks, event merge links and legacy catalog fallback passed.`);
        await page.close();
    }
} finally {
    await browser?.close();
    await new Promise(resolve => server.close(resolve));
}
