// Run after npm run build: node scripts/check-miner-import-ui.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
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
const id = '6ac5037623e0c3172662ced4';
const secondId = '6a9aa5dcd8c4c4f046ada3ec';
const miner = { id, name: 'Who Dis', fileName: 'who_dis', imageVersion: 1, level: 2, percent: 1500, power: 100, width: 2, createdDate: '' };
const second = { ...miner, id: secondId, name: 'Pulse Check', power: 25000000, percent: 350, width: 1 };
const rack = { id: 'rack', name: 'Regular Rack 8', capacity: 8, powerBonus: 0, createdDate: '' };
const inventory = quantity => JSON.stringify({ success: true, data: { items: [{ miner_id: id, name: miner.name,
    filename: miner.fileName, quantity, power: miner.power, bonus_percent: miner.percent, level: miner.level, width: miner.width }] } });
const key = 'rollercoin_web_imported_miners';
const manual = '.manual-simulator';
const room = '.room-power-simulator';
let browser;
try {
    browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 1000 });
    await page.setBypassServiceWorker(true);
    await page.setRequestInterception(true);
    const errors = [];
    const catalogQueries = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', req => {
        const url = new URL(req.url());
        let data;
        if (url.pathname === '/api/Miner') {
            catalogQueries.push(url.search);
            const selected = Number(url.searchParams.get('MinMinerPower')) > 1000 ? second : miner;
            data = { items: [selected], pages: 1, hasNext: false };
        } else if (url.pathname === '/api/Rack') data = { items: [rack], pages: 1, hasNext: false };
        else if (url.pathname === '/api/Rack/get-set-rack-list' || url.pathname === '/api/Miner/get-sellable') data = [];
        if (data !== undefined) void req.respond({ status: 200, contentType: 'application/json',
            headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(data) });
        else if (req.resourceType() === 'image' && url.pathname.includes('/miners/')) {
            // A fixed miner-shaped image keeps layout QA independent of the live CDN.
            void req.respond({ status: 200, contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="70" height="30" viewBox="0 0 70 30"><rect x="2" y="3" width="66" height="24" rx="3" fill="#6c7882" stroke="#aab7c1"/><path d="M6 8h9m-9 5h9m-9 5h9" stroke="#c7d2d8"/><g fill="#263543" stroke="#b5c4ca"><circle cx="33" cy="15" r="9"/><circle cx="55" cy="15" r="9"/></g><path d="m28 10 10 10m0-10L28 20m22-10 10 10m0-10L50 20" stroke="#759b9e" stroke-width="2"/></svg>' });
        }
        else if (req.url().startsWith(origin)) void req.continue();
        else void req.abort();
    });
    const click = async selector => {
        await page.waitForSelector(selector, { visible: true });
        await page.$eval(selector, element => element.scrollIntoView({ block: 'center', behavior: 'instant' }));
        await page.waitForFunction(selector => {
            const element = document.querySelector(selector);
            if (!element) return false;
            const rect = element.getBoundingClientRect();
            return element.contains(document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2));
        }, {}, selector);
        await page.locator(selector).click();
    };
    const paste = async (parent, text) => {
        if (!await page.$eval(`${parent} .miner-import-source`, source => source.open)) {
            await click(`${parent} .miner-import-source > summary`);
        }
        await page.$eval(`${parent} textarea`, (input, value) => {
            Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(input, value);
            input.dispatchEvent(new Event('input', { bubbles: true }));
        }, text);
        await click(`${parent} .miner-import-read`);
        await page.waitForFunction(selector => !document.querySelector(selector).disabled, {}, `${parent} textarea`);
    };
    const quantity = async (parent, value, index = 0) => {
        await page.$$eval(`${parent} .miner-import-row input`, (inputs, value, index) => {
            Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(inputs[index], value);
            inputs[index].dispatchEvent(new Event('input', { bubbles: true }));
        }, String(value), index);
    };
    const stored = () => page.evaluate(key => JSON.parse(localStorage.getItem(key)), key);
    const search = async (parent, value) => page.$eval(`${parent} .miner-import-search input`, (input, value) => {
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, value);
        input.dispatchEvent(new Event('input', { bubbles: true }));
    }, value);
    const names = parent => page.$$eval(`${parent} .miner-import-row .inv-miner-card-name`, nodes => nodes.map(node => node.textContent));
    await page.goto(`${origin}/en`, { waitUntil: 'networkidle0' });
    await click('.main-tabs-4 > .main-tab:nth-of-type(2)');
    await click(`${manual} .miner-import > summary`);
    assert.equal(await page.$eval(`${manual} .miner-import-guide a`, link => link.href), 'https://rollercoin.com/api/game/inventory');
    assert(await page.$eval(`${manual} .miner-import-source-content`, element => ['F12', 'Network', 'Miners', 'Response'].every(step => element.textContent.includes(step))));
    await page.$eval(`${manual} .miner-import-guide-image`, image => image.scrollIntoView({ block: 'center' }));
    await page.waitForFunction(selector => {
        const image = document.querySelector(selector);
        return image.complete && image.naturalWidth === 1014 && image.naturalHeight === 781;
    }, {}, `${manual} .miner-import-guide-image`);
    await paste(manual, inventory(2));
    assert.equal((await stored()).items[0].quantity, 2);
    await search(manual, ' who DIS ');
    assert.deepEqual(await names(manual), ['Who Dis']);
    await search(manual, 'unmatched miner');
    assert.deepEqual(await names(manual), []);
    await search(manual, '');
    await click(`${manual} .miner-import-add`);
    await page.waitForFunction(() => JSON.parse(localStorage.getItem('rollercoin_web_added_miners')).length === 2);
    await page.waitForFunction(selector => document.querySelector(selector).textContent.includes('230'), {}, `${manual} .simulation-results`);
    assert.equal((await stored()).items[0].quantity, 0, 'Power bulk add must consume all available stock');
    assert(await page.$eval(`${manual} .miner-import-add`, button => button.disabled));
    assert.equal(await page.$eval(`${manual} .miner-import-add`, button => button.textContent), 'Add all miners to power simulator');
    await page.reload({ waitUntil: 'networkidle0' });
    await click(`${manual} .miner-import > summary`);
    assert.equal(await page.$eval(`${manual} .miner-import-row input`, input => input.value), '0', 'Zero-stock cards survive reload');
    assert.equal(await page.$$eval(`${manual} .miner-import-row`, rows => rows.length), 1);
    await quantity(manual, 2);
    await click(`${manual} .miner-import-increase`);
    assert.equal(await page.$eval(`${manual} .miner-import-row input`, input => input.value), '3', 'Plus must increase the saved quantity');
    assert.equal((await stored()).items[0].quantity, 3, 'Incremented quantity must be persisted');
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('rollercoin_web_added_miners')).length), 2, 'Plus must not add miners to the simulation');
    assert(await page.$(`${manual} .miner-import-decrease`), 'Quantity needs a decrease button');
    await click(`${manual} .miner-import-decrease`);
    assert.equal((await stored()).items[0].quantity, 2, 'Minus must decrease and persist the quantity');
    await click(`${manual} .miner-import-decrease`);
    assert.equal((await stored()).items[0].quantity, 1);
    await click(`${manual} .miner-import-decrease`);
    assert.equal((await stored()).items[0].quantity, 0);
    assert(await page.$eval(`${manual} .miner-import-decrease`, button => button.disabled), 'Minus must stop at zero');
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('rollercoin_web_added_miners')).length), 2, 'Minus must not change the simulation');
    await quantity(manual, 3);
    await quantity(manual, 10000);
    assert(await page.$eval(`${manual} .miner-import-increase`, button => button.disabled), 'Plus must respect the quantity limit');
    await quantity(manual, 3);
    await page.reload({ waitUntil: 'networkidle0' });
    await click(`${manual} .miner-import > summary`);
    assert.equal(await page.$eval(`${manual} .miner-import-row input`, input => input.value), '3', 'Incremented quantity must survive reload');
    await paste(manual, inventory(3));
    assert.equal((await stored()).items.length, 1, 'Repeated import updates rather than duplicates saved miners');
    assert.equal((await stored()).items[0].quantity, 3);
    await click('.main-tabs-4 > .main-tab:nth-of-type(3)');
    await page.waitForSelector(`${room} .inventory-miner-grid .inv-miner-card`);
    const catalogSize = await page.$eval(`${room} .inventory-miner-grid .inv-miner-card`, card => ({
        width: card.getBoundingClientRect().width, height: card.getBoundingClientRect().height,
        panelHeight: card.closest('.desktop-inventory-dock').getBoundingClientRect().height,
    }));
    await click(`${room} .inv-tabs .inv-tab:nth-child(3)`);
    const importSize = await page.$eval(`${room} .miner-import-row`, card => ({
        width: card.getBoundingClientRect().width, height: card.getBoundingClientRect().height,
        panelHeight: card.closest('.desktop-inventory-dock').getBoundingClientRect().height,
        quantityWidth: card.querySelector('input').getBoundingClientRect().width,
    }));
    assert.equal(importSize.panelHeight, catalogSize.panelHeight, 'Import and catalog panels must have the same height');
    assert.equal(importSize.width, catalogSize.width, 'Imported cards must match catalog card width');
    assert(Math.abs(importSize.height - catalogSize.height) <= 2, 'Imported cards must retain compact catalog dimensions');
    assert(importSize.quantityWidth >= 36, 'Quantity input must remain readable');
    await click(`${room} .inventory-size-toggle`);
    assert(await page.$eval(`${room} .desktop-inventory-dock`, (panel, compactHeight) => panel.getBoundingClientRect().height > compactHeight, importSize.panelHeight), 'Expand should increase the panel height');
    assert.equal(await page.$eval(`${room} .inventory-size-toggle`, button => button.getAttribute('aria-expanded')), 'true');
    await click(`${room} .inventory-size-toggle`);
    assert.equal(await page.$eval(`${room} .desktop-inventory-dock`, panel => panel.getBoundingClientRect().height), importSize.panelHeight, 'Shrink should restore the original height');
    await click(`${room} .inventory-size-toggle`);
    await page.keyboard.press('Escape');
    assert.equal(await page.$eval(`${room} .inventory-size-toggle`, button => button.getAttribute('aria-expanded')), 'false', 'Escape should shrink the panel');
    assert(await page.$(`${room} .desktop-inventory-dock .miner-import`), 'Room import belongs inside the miner selection panel');
    assert.equal(await page.$$eval(`${room} .room-simulator-wrapper > .miner-import`, panels => panels.length), 0);
    assert.equal(await page.$eval(`${room} .miner-import-row input`, input => input.value), '3');
    await click(`${room} .miner-import-increase`);
    assert.equal((await stored()).items[0].quantity, 4, 'Room increment must work without starting a drag');
    assert(!await page.$(`${room} .dragging-item`), 'Quantity controls must not initiate dragging');
    await click(`${room} .miner-import-decrease`);
    assert.equal((await stored()).items[0].quantity, 3, 'Room decrement must work without starting a drag');
    assert.equal(await page.$$eval(`${room} .miner-import-row .inv-miner-card-img`, images => images.length), 1);
    assert.equal(await page.$eval(`${room} .miner-import-source`, source => source.open), false, 'Saved miners should show cards before the paste form');
    assert.equal(await page.$eval(`${room} .miner-import-controls label span`, label => label.textContent), 'Qty');
    assert.equal(await page.$eval(`${room} .miner-import-remove`, button => button.textContent.trim()), '', 'Remove should use a trash icon, not another multiplication sign');
    await click(`${room} .miner-import-pick`);
    await page.waitForSelector(`${room} .miner-import [role="alert"]`);
    assert.equal(await page.$$eval(`${room} .racks-grid .miner-img-wrapper`, elements => elements.length), 0);
    await click(`${room} .inv-tab:first-child`);
    await click(`${room} .inv-rack-card`);
    assert(await page.evaluate(() => JSON.parse(localStorage.getItem('rollercoin_web_room_operations_sandbox'))[0].changes.some(c => c.entity === 'rack' && c.kind === 'added')),
        'Adding a rack must appear in operation history');
    await click(`${room} .inv-tabs .inv-tab:nth-child(3)`);
    await page.$eval(`${room} .room-simulator-wrapper`, panel => panel.scrollIntoView({ block: 'center', behavior: 'instant' }));
    const dragSource = await page.$eval(`${room} .miner-import-pick`, card => {
        const rect = card.getBoundingClientRect();
        return { x: rect.left + rect.width / 2, y: rect.top + 15 };
    });
    const dragTarget = await page.$eval(`${room} .racks-grid [data-rack-id]`, rack => {
        const rect = rack.getBoundingClientRect();
        return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 8 };
    });
    await page.mouse.move(dragSource.x, dragSource.y);
    await page.mouse.down();
    await page.mouse.move(dragTarget.x, dragTarget.y, { steps: 15 });
    await page.mouse.up();
    await page.waitForFunction(selector => document.querySelectorAll(selector).length === 1, {}, `${room} .racks-grid .miner-img-wrapper`);
    assert.equal((await stored()).items[0].quantity, 2, 'Dragging consumes exactly one available miner');
    assert(await page.evaluate(() => JSON.parse(localStorage.getItem('rollercoin_web_room_operations_sandbox'))[0].changes.some(c => c.entity === 'miner' && c.kind === 'added')),
        'Dragging a miner into the room must appear in operation history');
    await click(`${room} .inv-tabs .inv-tab:nth-child(2)`);
    await click(`${room} button[title="Undo"]`);
    await page.waitForFunction(selector => document.querySelectorAll(selector).length === 0, {}, `${room} .racks-grid .miner-img-wrapper`);
    await click(`${room} .inv-tabs .inv-tab:nth-child(3)`);
    assert.equal((await stored()).items[0].quantity, 3, 'Undo must return the dragged miner to inventory');
    await click(`${room} .miner-import-pick`);
    await page.waitForFunction(selector => document.querySelectorAll(selector).length === 1, {}, `${room} .racks-grid .miner-img-wrapper`);
    assert.equal((await stored()).items[0].quantity, 2, 'Clicking a card consumes one miner');
    await click(`${room} .inv-tabs .inv-tab:nth-child(2)`);
    await click(`${room} button[title="Undo"]`);
    await click(`${room} .inv-tabs .inv-tab:nth-child(3)`);
    await click(`${room} .miner-import-add`);
    await page.waitForFunction(selector => document.querySelector(selector).textContent.includes('345'), {}, `${room} .lpd-header`);
    assert.equal((await stored()).items[0].quantity, 0, 'Room bulk add consumes the entire stock');
    assert.equal(await page.$$eval(`${room} .miner-import-row`, rows => rows.length), 1, 'Empty stock is retained');
    assert(await page.$eval(`${room} .miner-import-pick`, button => button.disabled));
    await click(`${room} .inv-tabs .inv-tab:nth-child(2)`);
    await click(`${room} button[title="Undo"]`);
    await page.waitForFunction(selector => document.querySelectorAll(selector).length === 0, {}, `${room} .racks-grid .miner-img-wrapper`);
    await click(`${room} .inv-tabs .inv-tab:nth-child(3)`);
    assert.equal((await stored()).items[0].quantity, 3, 'Undo must return all bulk-added miners');
    await quantity(room, 5);
    await click(`${room} .miner-import-add`);
    await page.waitForSelector(`${room} .miner-import [role="alert"]`);
    assert.equal(await page.$$eval(`${room} .racks-grid .miner-img-wrapper`, elements => elements.length), 0, 'Capacity failure is atomic');
    assert.equal((await stored()).items[0].quantity, 5, 'Failed placement must not consume stock');
    await quantity(room, 2);
    const copy = `加成算力 +3.5%\n${secondId}1\nLocalized name\n不可售\n算力：\n25.000 Ph/s\n供应量：\n9408\n矿机详情\nopen`;
    await paste(room, copy);
    assert.equal((await stored()).items.length, 2);
    assert.equal((await stored()).items[1].quantity, 1);
    assert(catalogQueries.some(query => query.includes('MinMinerPower=24999500') && !query.includes('Name=')), 'Localized names must not constrain catalog lookup');
    assert.deepEqual(await names(room), ['Pulse Check', 'Who Dis'], 'Imported miners default to descending power');
    let originalStock = await stored();
    await search(room, '  pULsE  ');
    assert.deepEqual(await names(room), ['Pulse Check']);
    await click(`${room} .miner-import-increase`);
    assert.equal((await stored()).items.find(item => item.miner_id === secondId).quantity, 2, 'Filtered quantity controls must update the miner ID, not its visible index');
    assert.equal((await stored()).items.find(item => item.miner_id === id).quantity, originalStock.items.find(item => item.miner_id === id).quantity);
    await click(`${room} .miner-import-decrease`);
    originalStock = await stored();
    await search(room, 'not found');
    assert.deepEqual(await names(room), []);
    assert(await page.$(`${room} .miner-import-empty`));
    assert.equal(await page.$eval(`${room} .miner-import-count`, output => output.textContent), '0 / 2');
    assert.deepEqual(await stored(), originalStock, 'Filtering must not change the saved inventory');
    await search(room, '');
    for (const [order, expected] of [
        ['power-asc', ['Who Dis', 'Pulse Check']], ['power-desc', ['Pulse Check', 'Who Dis']],
        ['percent-desc', ['Who Dis', 'Pulse Check']], ['percent-asc', ['Pulse Check', 'Who Dis']],
        ['name-asc', ['Pulse Check', 'Who Dis']], ['name-desc', ['Who Dis', 'Pulse Check']],
    ]) {
        await page.select(`${room} .miner-import-sort`, order);
        assert.deepEqual(await names(room), expected);
    }
    assert.deepEqual(await stored(), originalStock, 'Sorting must not reorder or change stored records');
    await search(room, 'pulse');
    await click(`${room} .miner-import-remove`);
    assert.deepEqual((await stored()).items.map(item => item.miner_id), [id], 'Filtered deletion must remove the selected ID only');
    await paste(room, copy);
    await search(room, '');
    await page.select(`${room} .miner-import-sort`, 'power-asc');
    await quantity(room, 0);
    assert.equal((await stored()).items[0].quantity, 0);
    assert(!await page.$eval(`${room} .miner-import-add`, button => button.disabled), 'Zero stock must not prevent adding other available miners');
    await click(`${room} .miner-import-add`);
    assert.deepEqual((await stored()).items.map(item => item.quantity), [0, 0], 'Bulk add skips empty cards and consumes available stock');
    await click(`${room} .inv-tabs .inv-tab:nth-child(2)`);
    await click(`${room} button[title="Undo"]`);
    await click(`${room} .inv-tabs .inv-tab:nth-child(3)`);
    assert.deepEqual((await stored()).items.map(item => item.quantity), [0, 1], 'Undo restores only consumed quantities');
    await quantity(room, -1);
    assert(await page.$eval(`${room} .miner-import-add`, button => button.disabled));
    assert.equal((await stored()).items[0].quantity, 0, 'Invalid edits do not corrupt saved quantities');
    await click(`${room} .miner-import-row:nth-child(2) .miner-import-remove`);
    assert.equal((await stored()).items.length, 2, 'Removing another row cannot persist an invalid quantity');
    await quantity(room, 2);
    const before = await stored();
    await paste(room, '{broken');
    assert.deepEqual(await stored(), before, 'Malformed imports must preserve saved data');
    await page.reload({ waitUntil: 'networkidle0' });
    await click(`${room} .inv-tabs .inv-tab:nth-child(3)`);
    assert.equal(await page.$$eval(`${room} .miner-import-row`, rows => rows.length), 2);
    let importParent = room;
    for (const width of [1440, 1024, 768, 320]) {
        await page.setViewport({ width, height: 1000 });
        await new Promise(resolve => setTimeout(resolve, 150));
        if (width === 768) {
            await click(`${room} .room-simulator-wrapper > button`);
            importParent = '.mobile-inventory-modal';
        }
        await page.$eval(`${importParent} .miner-import-source`, source => { source.open = true; });
        assert(await page.$eval(`${importParent} .miner-import-guide-image`, image => {
            const rect = image.getBoundingClientRect();
            return rect.width > 0 && rect.left >= 0 && rect.right <= innerWidth;
        }), `Collection guide image overflows at ${width}px`);
        await page.$eval(`${importParent} .miner-import-source`, source => { source.open = false; });
        assert(await page.$eval(`${importParent} .miner-import`, panel => [...panel.querySelectorAll('textarea, input, select, button')].every(element => {
            const rect = element.getBoundingClientRect();
            return rect.left >= 0 && rect.right <= innerWidth;
        })), `Import controls overflow at ${width}px`);
        assert(await page.$eval(`${importParent} .miner-import-row`, card => {
            const label = card.querySelector('.miner-import-controls label span');
            const remove = card.querySelector('.miner-import-remove').getBoundingClientRect();
            const controls = card.querySelector('.miner-import-controls').getBoundingClientRect();
            return label.scrollWidth <= label.clientWidth && remove.bottom <= controls.top;
        }), `Quantity label or remove action overlaps at ${width}px`);
    }
    if (process.env.MINER_IMPORT_SCREENSHOT_PATH) await (await page.$(`${importParent} .miner-import`)).screenshot({ path: process.env.MINER_IMPORT_SCREENSHOT_PATH });
    await click(`${importParent} .miner-import-clear`);
    assert.equal(await stored(), null);
    await click('.mobile-inventory-modal .mobile-inv-close');
    await click('.main-tabs-4 > .main-tab:nth-of-type(2)');
    assert.equal(await page.$$eval(`${manual} .miner-import-row`, rows => rows.length), 0);
    assert.deepEqual(errors, [], 'Browser runtime errors');
    console.log('Miner import UI: search, power/bonus/name sorting, filtered quantity/deletion by ID, JSON/text, shared localStorage, reload, drag/drop, bulk add, undo and responsive layout passed.');
} finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
}
