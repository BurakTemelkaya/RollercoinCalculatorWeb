// Run after npm run build: node scripts/check-auto-placement-ui.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const mime = { '.js': 'application/javascript', '.css': 'text/css', '.html': 'text/html', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp' };
const server = http.createServer((req, res) => {
    let file = path.join(dist, new URL(req.url, 'http://localhost').pathname);
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(dist, 'index.html');
    res.setHeader('Content-Type', mime[path.extname(file)] ?? 'application/octet-stream');
    res.end(fs.readFileSync(file));
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const id = n => n.toString(16).padStart(24, '0');
const model = (n, power) => ({ id: id(n), name: `Miner ${n}`, fileName: n === 2 ? '青火龙_(azure_dragon)' : `miner_${n}`, imageVersion: 1,
    level: 0, percent: 0, power, width: n === 3 ? 1 : 2, type: 'basic', createdDate: '' });
const incoming = model(3, 500);
const stockKey = 'rollercoin_web_imported_miners';
const operationKey = 'rollercoin_web_room_operations_account:auto-account';
const stock = JSON.stringify({ items: [{ miner_id: incoming.id, name: incoming.name, filename: incoming.fileName,
    power: incoming.power, quantity: 1, bonus_percent: 0, level: 0, type: 'basic', width: incoming.width }] });
const account = {
    userProfileResponseDto: { avatar_Id: 'auto-account', gender: 'male', name: 'AUTO', registration: '2020-01-01', league_Id: '1' },
    userPowerResponseDto: { miners: 110, bonus: 1, bonus_percent: 0, racks: 1, games: 9000, temp: 1000, freon: 0, current_Power: 10111, max_Power: 10111, decrease: 0 },
};
const initial = {
    is_user_from_session: false,
    rooms: [0, 1].map(n => ({ _id: `room-${n}`, room_info: { room_id: 'type', level: n, cols: 8, rows: 3 } })),
    racks: [0, 1].map(n => ({ _id: `rack-${n}`, rack_id: id(100 + n), name: `Rack ${n}`, rack_info: { width: 2, height: 1 },
        bonus: n * 1000, placement: { user_room_id: `room-${n}`, x: 0, y: 0 } })),
    miners: [model(1, 100), model(2, 10)].map((m, n) => ({ _id: `original-${m.id}`, miner_id: m.id, name: m.name,
        power: m.power, bonus_percent: m.percent, width: m.width, level: m.level, type: m.type, filename: m.fileName,
        is_in_set: false, updated: '', placement: { user_rack_id: `rack-${n}`, x: 0, y: 0 } })),
};
const room = '.room-power-simulator';
const button = '.inventory-auto-placement .room-auto-placement-button';
const report = `${room} .room-auto-placement-report`;
let browser;
try {
    browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 1000 });
    await page.setBypassServiceWorker(true);
    await page.setRequestInterception(true);
    const errors = [];
    let workers = 0;
    page.on('workercreated', () => workers++);
    page.on('pageerror', err => errors.push(err.message));
    page.on('request', req => {
        const url = new URL(req.url());
        let data;
        if (url.pathname === '/api/RollercoinUser') data = account;
        else if (url.pathname === '/api/RollercoinUser/room') data = initial;
        else if (url.pathname === '/api/Miner') data = { items: [incoming], pages: 1, hasNext: false };
        else if (url.pathname === '/api/Rack') data = { items: [], pages: 1, hasNext: false };
        else if (url.pathname === '/api/Rack/get-set-rack-list' || url.pathname === '/api/Miner/get-sellable') data = [];
        if (data !== undefined) void req.respond({ status: 200, contentType: 'application/json',
            headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(data) });
        else if (req.url().startsWith(origin)) void req.continue();
        else void req.abort();
    });
    const click = async selector => {
        await page.waitForSelector(selector, { visible: true });
        // Wait for the parent tab slide before scrolling a nested control into view.
        await page.waitForFunction(() => document.querySelectorAll('.tab-panel:not(.collapsed)').length === 1);
        await page.$eval(selector, element => element.scrollIntoView({ block: 'center', behavior: 'instant' }));
        try { await page.waitForFunction(selector => {
            const element = document.querySelector(selector);
            if (!element) return false;
            const rect = element.getBoundingClientRect();
            return element.contains(document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2));
        }, { timeout: 10000 }, selector); } catch (error) {
            console.error(await page.evaluate(selector => {
                const element = document.querySelector(selector), track = document.querySelector('.tab-slider-track'), viewport = document.querySelector('.tab-slider-viewport');
                const rect = element.getBoundingClientRect();
                return { selector, rect: rect.toJSON(), active: document.querySelector('.main-tabs-4 .active')?.textContent,
                    transform: track.style.transform, computed: getComputedStyle(track).transform, track: track.getBoundingClientRect().toJSON(),
                    scroll: viewport.scrollLeft, windowScroll: window.scrollX, viewport: viewport.getBoundingClientRect().toJSON() };
            }, selector));
            throw error;
        }
        await page.locator(selector).click();
    };
    const saved = () => page.evaluate(key => JSON.parse(localStorage.getItem(key)), stockKey);
    const count = async minerId => (await saved()).items.find(m => m.miner_id === minerId)?.quantity;
    const operations = () => page.evaluate(key => JSON.parse(localStorage.getItem(key) ?? '[]'), operationKey);
    const waitResult = () => page.waitForSelector(report, { visible: true });
    const waitStopped = () => page.waitForFunction(selector => document.querySelector(selector)?.closest('.room-auto-placement-toolbar').getAttribute('aria-busy') === 'false', {}, button);
    await page.evaluateOnNewDocument(() => {
        localStorage.setItem('rollercoin_web_userpower_timestamp', String(Date.now()));
        localStorage.setItem('rollercoin_web_api_leagues', JSON.stringify([
            { id: '0', name: 'Diamond III', minPower: 0, currencies: [] },
            { id: '1', name: 'Titan I', minPower: 100, currencies: [] },
            { id: '2', name: 'Titan II', minPower: 615, currencies: [] },
            { id: '3', name: 'Titan III', minPower: 1000, currencies: [] },
        ]));
    });
    await page.goto(`${origin}/en`, { waitUntil: 'networkidle0' });
    await page.evaluate((key, value) => localStorage.setItem(key, value), stockKey, stock);
    await click('.main-tabs-4 > .main-tab:nth-of-type(3)');
    assert.equal(await page.$$eval('.room-auto-placement-button', nodes => nodes.length), 0, 'Auto placement must not appear above the room or in the miner catalog');
    await click(`${room} .desktop-inventory-dock .inv-tab:nth-child(3)`);
    assert(await page.$eval(button, button => Boolean(button.closest('.inventory-import-panel'))), 'Auto placement belongs in the import panel');
    assert(await page.$eval(button, button => button.disabled), 'No placed racks means no optimization');
    await page.type(`${room} .user-fetcher-row input`, 'AUTO');
    await click(`${room} .user-fetcher-row button`);
    await page.waitForSelector(`${room} [data-rack-id="rack-0"]`);
    await click(`${room} .desktop-inventory-dock .inv-tab:nth-child(3)`);
    assert(await page.$eval('.auto-placement-allow-move', label => label.textContent.includes('Allow moving placed miners')),
        'The checkbox must positively enable movement rather than disable it');
    assert(!await page.$eval('.auto-placement-allow-move input', input => input.checked), 'Movement must be disabled by default');
    await click('.auto-placement-allow-move input');
    await click(button);
    await waitResult();
    assert(workers > 0, 'Optimization must execute in an actual Web Worker');
    assert.equal(await count(incoming.id), 0, 'Incoming miner must be consumed');
    assert.equal(await count(id(2)), 1, 'Displaced miner must be returned');
    const totals = await page.$$eval(`${report} .room-auto-placement-totals strong`, elements => elements.map(e => e.textContent));
    assert.deepEqual(totals, ['111 Gh/s', '650 Gh/s']);
    assert.equal(await page.$$eval(`${report} li`, items => items.length), 2);
    assert.deepEqual(await page.$$eval(`${report} .auto-placement-action`, nodes => nodes.map(n => n.textContent).sort()),
        ['Added from inventory', 'Removed to inventory'], 'Each added or removed miner must state its action alongside the locations');
    assert.equal((await operations())[0].kind, 'autoPlacement');
    const firstAutoOperationId = (await operations())[0].id;
    assert.equal((await operations())[0].beforePowerGh, 111);
    assert.equal((await operations())[0].afterPowerGh, 650);
    await click(`${room} .room-operation-history > details > summary`);
    assert.equal(await page.$$eval(`${room} .room-operation-history li[data-operation-kind]`, nodes => nodes.length), 1);
    await click(`${room} .room-operation-history li[data-operation-kind] > details > summary`);
    const historyMiner = `${room} .room-operation-miners button:not(:disabled)`;
    assert.equal(await page.$$eval(`${room} .room-operation-miners button:disabled`, nodes => nodes.length), 1,
        'A removed miner must not focus an unrelated instance');
    await click(historyMiner);
    await page.waitForSelector(`${room} [data-rack-id="rack-1"] .room-miner-focus`);
    await page.waitForFunction(selector => document.querySelector(selector)?.getAnimations().length > 0, {}, `${room} .room-miner-focus .miner-hover-target`);
    const blink = await page.$eval(`${room} .room-miner-focus`, target => {
        const frame = target.querySelector('.miner-hover-target'), animation = frame.getAnimations()[0];
        window.testMinerBlink = animation;
        animation.pause();
        animation.currentTime = 0; const on = getComputedStyle(frame).opacity;
        animation.currentTime = 450; const off = getComputedStyle(frame).opacity;
        animation.currentTime = 850; const onAgain = getComputedStyle(frame).opacity;
        return { on, off, onAgain, iterations: animation.effect.getTiming().iterations,
            focused: document.activeElement === target };
    });
    assert.deepEqual(blink, { on: '1', off: '0', onAgain: '1', iterations: 4, focused: true },
        'History focus must move to the current room and blink the existing frame on and off');
    await click(historyMiner);
    await page.waitForFunction(() => window.testMinerBlink.playState === 'idle');
    await page.waitForFunction(selector => document.querySelector(selector)?.getAnimations().length > 0, {}, `${room} .room-miner-focus .miner-hover-target`);
    await page.$eval(`${room} .room-miner-focus .miner-hover-target`, frame => frame.getAnimations()[0].finish());
    await page.waitForSelector(`${room} .room-miner-focus`, { hidden: true });
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    await click(historyMiner);
    await page.waitForSelector(`${room} .room-miner-focus`);
    await page.waitForFunction(selector => document.querySelector(selector)?.getAnimations().length > 0, {}, `${room} .room-miner-focus .miner-hover-target`);
    assert(await page.$eval(`${room} .room-miner-focus .miner-hover-target`, frame => {
        const animation = frame.getAnimations()[0];
        return animation.effect.getTiming().duration === 3200 && animation.effect.getTiming().iterations === 1
            && animation.effect.getKeyframes().every(keyframe => keyframe.opacity === '1');
    }), 'Reduced motion must use a temporary steady frame');
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }]);
    await click(`${report} li button:not(:disabled)`);
    await page.waitForSelector(`${room} [data-rack-id="rack-1"] .auto-placement-selected`);
    assert(await page.$eval(`${room} .auto-placement-selected`, m => {
        const frame = m.querySelector('.miner-hover-target');
        const css = getComputedStyle(frame), rect = frame.getBoundingClientRect();
        return getComputedStyle(m).outlineStyle === 'none' && css.borderStyle === 'solid'
            && css.borderColor === 'rgb(255, 235, 0)' && css.borderWidth === '4px' && css.boxShadow !== 'none'
            && parseFloat(css.width) === 38 && rect.height <= 36;
    }), 'Auto highlight must reuse the centered, narrow miner frame instead of outlining the large wrapper');
    await click(`${room} button[title="Undo"]`);
    await page.waitForSelector(report, { hidden: true });
    assert.equal(await count(incoming.id), 1);
    assert.equal(await count(id(2)), 0, 'Returned model stays as a zero card after undo');
    assert.equal(await page.$$eval(`${room} .auto-placed`, nodes => nodes.length), 0);
    assert.equal((await operations())[0].kind, 'undo');
    assert.equal((await operations())[1].kind, 'autoPlacement', 'Undo must keep the original operation visible in the audit history');
    await click(button); await waitResult();
    const beforeNoOpHistory = (await operations()).length;
    await click(button); await waitStopped();
    assert.equal((await operations()).length, beforeNoOpHistory, 'No-op searches must not create operation entries');
    assert.equal(await count(incoming.id), 0, 'Repeated optimization must not consume stock again');
    assert.equal(await count(id(2)), 1);
    await page.waitForFunction(selector => document.querySelector(selector)?.textContent.includes('No better layout'), {}, `${room} [role="status"]`);
    await click(`${room} button[title="Undo"]`);
    assert.equal(await count(incoming.id), 1);

    const limitMode = '.auto-placement-limit-mode select';
    const valueInput = '.auto-placement-limit-value';
    const setLimit = async (value, unit = 'Gh') => {
        await page.select(limitMode, 'custom');
        await page.select('.auto-placement-limit-unit', unit);
        await page.$eval(valueInput, (input, value) => {
            Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, value);
            input.dispatchEvent(new Event('input', { bubbles: true }));
        }, value);
    };
    const afterPower = () => page.$eval(`${report} .room-auto-placement-totals span:nth-child(2) strong`, node => node.textContent);
    await page.select(limitMode, 'league');
    assert(await page.$eval('.auto-placement-limit-note', n => n.textContent.startsWith('Titan II:') && n.textContent.includes('1 Th/s')),
        'The target must be the next league after the room league (Titan I), ignoring the higher total power');
    await click(button); await waitResult();
    assert.equal(await afterPower(), '650 Gh/s', 'Automatic placement must use the next league ceiling');
    assert(await page.$eval('.auto-placement-limit-note', n => n.textContent.startsWith('Titan II:') && n.textContent.includes('1 Th/s')),
        'Applying a layout must preserve the selected boundary');
    await click(`${room} button[title="Undo"]`);
    await page.select(limitMode, 'selectLeague');
    await page.select('.auto-placement-league-choice select', '1');
    await click(button); await waitResult();
    assert.equal(await afterPower(), '610 Gh/s', 'Selecting the first league must use its ceiling below 615 Gh/s');
    await click(`${room} button[title="Undo"]`);
    await page.select('.auto-placement-league-choice select', '2');
    await click(button); await waitResult();
    assert.equal(await afterPower(), '650 Gh/s');
    await page.select('.auto-placement-league-choice select', '3');
    assert(await page.$eval('.auto-placement-limit-note', n => n.textContent.includes('No upper limit')),
        'The highest league must show an unbounded ceiling');
    assert(!await page.$eval(button, b => b.disabled));
    await click(`${room} button[title="Undo"]`);
    await page.select(limitMode, 'custom');
    assert(await page.$eval(button, b => b.disabled), 'A blank custom limit must disable placement');
    await setLimit('-1');
    assert(await page.$eval(button, b => b.disabled), 'Negative limits must not start a worker');
    await setLimit('300');
    await click(button); await waitResult();
    assert.equal(await afterPower(), '120 Gh/s');
    assert.deepEqual(await page.$$eval(`${report} .auto-placement-action`, nodes => nodes.map(n => n.textContent)), ['Moved', 'Moved'],
        'Relocating placed miners must say Moved, not Added from inventory');
    const restoredMiner = `${room} .room-operation-history li[data-operation-id="${firstAutoOperationId}"] button[data-history-miner-id="original-${id(2)}"]`;
    assert(await page.$$eval(restoredMiner, buttons => buttons.length > 0 && buttons.every(button => !button.disabled)),
        'A miner restored to the room must become locatable in earlier history too');
    await click(restoredMiner);
    await page.waitForSelector(`${room} [data-rack-id="rack-0"] [data-miner-instance-id="original-${id(2)}"].room-miner-focus`);
    await click(`${room} button[title="Undo"]`);
    await page.waitForSelector(`${room} .room-miner-focus`, { hidden: true });
    await setLimit('0,1', 'Th');
    await click(button); await waitResult();
    assert.equal(await afterPower(), '100 Gh/s', 'Comma decimals and unit conversion must cap the total league power');
    assert.equal(await page.$eval(`${report} .room-auto-placement-gain`, n => n.textContent.trim()), '−11 Gh/s');
    assert.equal(await count(id(2)), 1, 'Lowering the power cap must return removed miners to stock');
    await click(`${room} button[title="Undo"]`);
    await setLimit('0');
    await click(button); await waitResult();
    assert.equal(await afterPower(), '0 H/s', 'A zero cap must allow returning all room miners');
    assert.equal(await count(incoming.id), 1);
    await click(`${room} button[title="Undo"]`);
    await page.select(limitMode, 'none');

    // Delay only the worker message to exercise cancellation and stale-input races deterministically.
    await page.evaluate(() => {
        window.testNativeWorker = window.Worker;
        window.Worker = class extends window.testNativeWorker {
            stopped = false;
            postMessage(data) { setTimeout(() => { if (!this.stopped) super.postMessage(data); }, 300); }
            terminate() { this.stopped = true; super.terminate(); }
        };
    });
    await click(button);
    await page.select(limitMode, 'custom');
    await page.select(limitMode, 'none');
    assert(await page.$eval(button, b => b.textContent.includes('Auto place miners')),
        'Returning to a previous target after cancellation must not resurrect a stopped job');
    await new Promise(resolve => setTimeout(resolve, 400));
    assert.equal(await count(incoming.id), 1);
    await click(button);
    await page.waitForFunction(selector => document.querySelector(selector)?.textContent.includes('Stop search'), {}, button);
    await click(button);
    await new Promise(resolve => setTimeout(resolve, 400));
    assert.equal(await count(incoming.id), 1, 'Cancellation must not touch inventory');
    assert.equal(await page.$$eval(report, nodes => nodes.length), 0);
    await click(button);
    await page.evaluate(key => {
        const inventory = JSON.parse(localStorage.getItem(key)); inventory.items[0].quantity = 2;
        localStorage.setItem(key, JSON.stringify(inventory));
        dispatchEvent(new Event('miner-import-changed'));
    }, stockKey);
    await new Promise(resolve => setTimeout(resolve, 400));
    assert.equal(await count(incoming.id), 2, 'Stale worker results must not overwrite new stock');
    await page.waitForSelector(`${room} .room-auto-placement [role="alert"]`);
    await page.evaluate((key, value) => localStorage.setItem(key, value), stockKey, stock);
    await click(button);
    await click(`${room} .simulator-start-controls .simulator-start-button`);
    await new Promise(resolve => setTimeout(resolve, 400));
    assert.equal(await page.$$eval(`${room} [data-rack-id]`, racks => racks.length), 0, 'A stale room must never be overwritten');
    assert.equal(await count(incoming.id), 1);
    await click(`${room} .simulator-start-controls .simulator-start-button:nth-child(2)`);
    await page.waitForSelector(`${room} [data-rack-id="rack-0"]`);
    await click(`${room} .desktop-inventory-dock .inv-tab:nth-child(3)`);
    await page.evaluate(() => { window.Worker = window.testNativeWorker; });

    const malformedStock = '{broken';
    await page.evaluate((key, value) => localStorage.setItem(key, value), stockKey, malformedStock);
    await click(button); await waitStopped();
    assert.equal(await page.evaluate(key => localStorage.getItem(key), stockKey), malformedStock,
        'Unreadable saved stock must be preserved instead of treated as an empty inventory');
    await page.waitForSelector(`${room} .room-auto-placement [role="alert"]`);
    await page.evaluate((key, value) => localStorage.setItem(key, value), stockKey, stock);

    // A storage failure during apply must leave the room and stock untouched.
    await page.evaluate(key => {
        window.testNativeSetItem = Storage.prototype.setItem;
        Storage.prototype.setItem = function(name, value) {
            if (name === key) throw new DOMException('Test quota failure', 'QuotaExceededError');
            return window.testNativeSetItem.call(this, name, value);
        };
    }, stockKey);
    await click(button); await waitStopped();
    await page.waitForSelector(`${room} .room-auto-placement [role="alert"]`);
    assert.equal(await count(incoming.id), 1);
    assert.equal(await page.$$eval(report, nodes => nodes.length), 0);
    await page.evaluate(() => { Storage.prototype.setItem = window.testNativeSetItem; });
    await click(button); await waitResult();

    // Undo must be atomic if another simulator spent a miner that was returned by the optimizer.
    await page.evaluate((key, weakId) => {
        const inventory = JSON.parse(localStorage.getItem(key));
        inventory.items.find(m => m.miner_id === weakId).quantity = 0;
        localStorage.setItem(key, JSON.stringify(inventory));
    }, stockKey, id(2));
    const beforeFailedUndo = (await operations()).length;
    await click(`${room} button[title="Undo"]`);
    assert.equal((await operations()).length, beforeFailedUndo, 'Failed undo must not be logged as successful');
    assert.equal(await count(incoming.id), 0, 'Failed undo must not restore consumed stock partially');
    assert.equal(await page.$$eval(report, nodes => nodes.length), 1, 'Failed undo must keep the optimized room');
    await page.evaluate((key, weakId) => {
        const inventory = JSON.parse(localStorage.getItem(key)); inventory.items.find(m => m.miner_id === weakId).quantity = 1;
        localStorage.setItem(key, JSON.stringify(inventory));
    }, stockKey, id(2));

    page.once('dialog', dialog => void dialog.accept());
    await click(`${room} button[title="Reset"]`);
    await page.waitForSelector(report, { hidden: true });
    assert.equal(await count(incoming.id), 1, 'Reset must return the consumed inventory');
    assert.equal(await count(id(2)), 0, 'Reset must take displaced originals back out of stock');
    assert.equal((await operations())[0].kind, 'reset');
    await click(button); await waitResult();
    await click(`${room} .desktop-inventory-dock .inv-tab:nth-child(2)`);
    assert.equal(await page.$$eval(button, nodes => nodes.length), 0, 'Button must be hidden on the catalog tab');
    assert.equal(await page.$$eval(report, nodes => nodes.length), 1, 'Switching tabs must preserve the placement report');
    await click(`${room} .desktop-inventory-dock .inv-tab:nth-child(3)`);

    for (const width of [1440, 1024, 768, 390, 320]) {
        await page.setViewport({ width, height: 1000 });
        await new Promise(resolve => setTimeout(resolve, 120));
        if (width === 768) await click(`${room} .room-simulator-wrapper > button`);
        await page.select(limitMode, 'selectLeague');
        assert(await page.$eval('.auto-placement-league-choice select', select => {
            const rect = select.getBoundingClientRect(); return rect.left >= 0 && rect.right <= innerWidth;
        }), `League selector overflows at ${width}px`);
        await setLimit('100');
        assert(await page.$eval('.room-auto-placement-toolbar', toolbar => [...toolbar.querySelectorAll('input, select, button')].every(control => {
            const rect = control.getBoundingClientRect(); return rect.left >= 0 && rect.right <= innerWidth;
        })), `Power limit controls overflow at ${width}px`);
        assert(await page.$eval(button, button => {
            const rect = button.getBoundingClientRect();
            return Boolean(button.closest('.inventory-import-panel')) && rect.left >= 0 && rect.right <= innerWidth;
        }), `Import-panel button placement failed at ${width}px`);
        assert(await page.$eval(`${room} .room-auto-placement`, section => [...section.querySelectorAll('button')].every(button => {
            const rect = button.getBoundingClientRect(); return rect.left >= 0 && rect.right <= innerWidth;
        })), `Auto placement controls overflow at ${width}px`);
    }
    await click('.mobile-inventory-modal .mobile-inv-close');
    await page.waitForSelector(button, { hidden: true });
    assert.equal(await page.$$eval(button, nodes => nodes.length), 0, 'Button must disappear when the mobile import panel closes');
    assert.equal(await page.$$eval(report, nodes => nodes.length), 1, 'Closing the mobile panel must preserve the placement report');
    if (!await page.$eval(`${room} .room-operation-history > details`, details => details.open))
        await click(`${room} .room-operation-history > details > summary`);
    await click(`${room} .room-operation-history ol > li:first-child > details > summary`);
    await click(`${room} .room-operation-history ol > li:first-child .room-operation-miners button:not(:disabled)`);
    await page.waitForSelector(`${room} .room-miner-focus`);
    assert(await page.$eval(`${room} .room-miner-focus`, target => {
        const frame = target.querySelector('.miner-hover-target'), rect = target.getBoundingClientRect();
        const css = getComputedStyle(frame);
        return css.borderColor === 'rgb(255, 235, 0)' && css.borderWidth === '4px' && css.boxShadow !== 'none'
            && rect.top >= 0 && rect.bottom <= innerHeight && document.activeElement === target;
    }), 'History focus must reveal and highlight the miner on a narrow mobile viewport');
    if (process.env.AUTO_PLACEMENT_SCREENSHOT_PATH) await (await page.$(`${room} .room-auto-placement`)).screenshot({ path: process.env.AUTO_PLACEMENT_SCREENSHOT_PATH });
    await page.setViewport({ width: 1440, height: 1000 });
    await click(`${room} button[title="Save"]`);
    assert.equal((await operations())[0].kind, 'save');
    page.once('dialog', dialog => void dialog.accept());
    await click(`${room} button[title="Load"]`);
    assert.equal((await operations())[0].kind, 'load');
    const persistedOperations = await operations();
    await page.evaluate(key => {
        window.testHistorySetItem = Storage.prototype.setItem;
        Storage.prototype.setItem = function(name, value) {
            if (name === key) throw new DOMException('Test history quota failure', 'QuotaExceededError');
            return window.testHistorySetItem.call(this, name, value);
        };
    }, operationKey);
    await click(`${room} button[title="Undo"]`);
    await page.waitForSelector(`${room} .room-operation-history > [role="alert"]`);
    assert(await page.$eval(`${room} .room-operation-history li:first-child`, li => li.dataset.operationKind === 'undo'),
        'A history storage failure must retain the new entry in memory');
    assert.deepEqual(await operations(), persistedOperations, 'A history storage failure must preserve the saved ledger');
    await page.evaluate(() => { Storage.prototype.setItem = window.testHistorySetItem; });
    await page.reload({ waitUntil: 'networkidle0' });
    await page.waitForSelector(`${room} .room-operation-count`);
    assert.equal(await page.$eval(`${room} .room-operation-count`, n => Number(n.textContent)), persistedOperations.length,
        'Operation history must survive a page reload');
    await click(`${room} .simulator-start-controls .simulator-start-button`);
    await page.waitForFunction(selector => document.querySelector(selector)?.textContent === '0', {}, `${room} .room-operation-count`);
    const leagueSnapshot = { ...account, userPowerResponseDto: { ...account.userPowerResponseDto,
        max_Power: 1149004754213, current_Power: 1277947452824,
        games: 1332165, temp: 522600336, freon: 128377456193.52551 } };
    const leagueRoom = structuredClone(initial);
    leagueRoom.miners = [{ ...leagueRoom.miners[0], power: leagueSnapshot.userPowerResponseDto.max_Power }];
    await page.evaluateOnNewDocument((snapshot, snapshotRoom) => {
        localStorage.clear();
        localStorage.setItem('rollercoin_web_userpower_timestamp', String(Date.now()));
        localStorage.setItem('rollercoin_web_fetched_user', JSON.stringify(snapshot));
        localStorage.setItem('rollercoin_web_fetched_room', JSON.stringify(snapshotRoom));
        localStorage.setItem('rollercoin_web_api_leagues', JSON.stringify([
            { id: '1', name: 'Diamond III', minPower: 650000000000, currencies: [] },
            { id: '2', name: 'Titan I', minPower: 1150000000000, currencies: [] },
            { id: '3', name: 'Titan II', minPower: 2160000000000, currencies: [] },
            { id: '4', name: 'Titan III', minPower: 4000000000000, currencies: [] },
        ]));
    }, leagueSnapshot, leagueRoom);
    await page.reload({ waitUntil: 'networkidle0' });
    await click('.main-tabs-4 > .main-tab:nth-of-type(3)');
    await page.waitForSelector(`${room} [data-rack-id="rack-0"]`);
    assert.equal(await page.$eval(`${room} .lpd-league-name`, n => n.textContent), 'Diamond III League');
    await click(`${room} .desktop-inventory-dock .inv-tab:nth-child(3)`);
    await page.select(limitMode, 'league');
    assert.equal(await page.$eval('.auto-placement-limit-note', n => n.textContent), 'Titan I: < 2.16 Zh/s',
        'Diamond III league power (1.149004754213 Zh/s) must target Titan I, even when total power (1.277947452824 Zh/s) is already in Titan I');
    const modeStock = [model(610, 900), { ...model(611, 100), percent: 30000 }, { ...model(612, 800), percent: 20000 }];
    const seedModes = async (keepExisting, anchored = false) => {
        const modeRoom = structuredClone(initial);
        modeRoom.racks = anchored ? modeRoom.racks : [modeRoom.racks[0]];
        modeRoom.racks[0].rack_info.height = keepExisting ? 2 : 1;
        modeRoom.miners = keepExisting ? [{ ...modeRoom.miners[0], placement: { user_rack_id: 'rack-0', x: 0, y: 1 } }] : [];
        if (anchored) modeRoom.miners.push(initial.miners[1]);
        await page.evaluateOnNewDocument((account, modeRoom, items) => {
            localStorage.clear();
            localStorage.setItem('rollercoin_web_userpower_timestamp', String(Date.now()));
            localStorage.setItem('rollercoin_web_fetched_user', JSON.stringify(account));
            localStorage.setItem('rollercoin_web_fetched_room', JSON.stringify(modeRoom));
            localStorage.setItem('rollercoin_web_imported_miners', JSON.stringify({ items: items.map(m => ({
                miner_id: m.id, name: m.name, filename: m.fileName, quantity: 1, power: m.power,
                bonus_percent: m.percent, width: m.width, level: 0, type: 'basic' })) }));
        }, { ...account, userPowerResponseDto: { ...account.userPowerResponseDto, max_Power: keepExisting ? 100 : 0, current_Power: keepExisting ? 100 : 0 } }, modeRoom, anchored ? [incoming] : modeStock);
        await page.reload({ waitUntil: 'networkidle0' });
        await click('.main-tabs-4 > .main-tab:nth-of-type(3)');
        await click(`${room} .desktop-inventory-dock .inv-tab:nth-child(3)`);
    };
    await seedModes(false);
    assert.equal(await page.$eval('[data-placement-mode="optimal"]', b => b.getAttribute('aria-pressed')), 'true');
    for (const [mode, expected, metric] of [['bonus', '400 Gh/s', '0% → 300%'], ['power', '900 Gh/s', '0 H/s → 900 Gh/s']]) {
        await click(`[data-placement-mode="${mode}"]`);
        await click(button); await waitResult();
        assert.equal(await afterPower(), expected);
        assert(await page.$eval('.auto-placement-objective', (p, metric) => p.textContent.includes(metric), metric));
        await click(`${room} button[title="Undo"]`);
    }
    await click('[data-placement-mode="optimal"]');
    await click(button); await waitResult();
    assert.equal(await afterPower(), '2.4 Th/s');
    await click('.auto-placement-keep input');
    const fullRoomStock = await saved();
    await click(button); await waitStopped();
    assert.deepEqual(await saved(), fullRoomStock, 'Fill-only must preserve a full room and stock');
    await click('.auto-placement-keep input');
    await click('[data-placement-mode="power"]');
    await click(button); await waitResult();
    assert.equal(await afterPower(), '900 Gh/s', 'Power priority may lower league power while increasing raw power');
    assert(await page.$eval('.auto-placement-objective', p => p.textContent.includes('800 Gh/s → 900 Gh/s')));
    await seedModes(true);
    await click('[data-placement-mode="power"]');
    await click('.auto-placement-keep input');
    await click(button); await waitResult();
    assert.equal(await afterPower(), '1 Th/s');
    assert(await page.$(`${room} [data-rack-id="rack-0"] [data-miner-instance-id="original-${id(1)}"]`));
    assert.deepEqual(await page.$$eval(`${report} .auto-placement-action`, nodes => nodes.map(n => n.textContent)), ['Added from inventory']);
    assert.equal((await operations())[0].changes.filter(change => change.entity === 'miner' && change.kind === 'moved').length, 0);
    await click(`${room} button[title="Undo"]`);
    assert.equal(await count(id(610)), 1, 'Undo must restore the miner used by fill-only mode');
    await seedModes(true, true);
    assert(!await page.$eval('.auto-placement-allow-move input', input => input.checked), 'A new room starts without movement enabled');
    await click(button); await waitResult();
    assert.equal(await afterPower(), '650 Gh/s', 'No-move mode must replace the weak miner without relocating it or the survivor');
    assert.deepEqual((await page.$$eval(`${report} .auto-placement-action`, nodes => nodes.map(n => n.textContent))).sort(), ['Added from inventory', 'Removed to inventory']);
    assert.equal(await count(id(2)), 1);
    assert.equal(await count(incoming.id), 0);
    assert.equal((await operations())[0].changes.filter(change => change.kind === 'moved').length, 0);
    await click(`${room} button[title="Undo"]`);
    assert.equal(await count(incoming.id), 1);
    assert.equal(await count(id(2)), 0);
    await click('.auto-placement-keep:not(.auto-placement-allow-move) input');
    assert(!await page.$eval('.auto-placement-allow-move input', input => input.checked), 'Fill-only and remove-without-moving are separate placement choices');
    await click('.auto-placement-allow-move input');
    assert(!await page.$eval('.auto-placement-keep:not(.auto-placement-allow-move) input', input => input.checked));
    await click('.auto-placement-allow-move input');
    await setLimit('0');
    await click(button); await waitResult();
    assert.equal(await afterPower(), '0 H/s', 'No-move mode must still permit removal under a lower league cap');
    assert(await page.$$eval(`${report} .auto-placement-action`, nodes => nodes.every(n => n.textContent === 'Removed to inventory')));
    await click(`${room} button[title="Undo"]`);
    assert.equal(await count(incoming.id), 1);
    assert.deepEqual(errors, [], 'Browser runtime errors');
    console.log('Auto placement UI: power/bonus/optimal modes, fill-only and full rooms, stock/undo, league limits, history focus/blink/reduced motion, saved history, cancellation and five viewports passed.');
} finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
}
