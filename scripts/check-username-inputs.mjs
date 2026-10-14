// Run after npm run build: node scripts/check-username-inputs.mjs
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

const account = {
    userProfileResponseDto: { avatar_Id: 'test_user', gender: 'male', name: 'Test User', registration: '2020-01-01', league_Id: '1' },
    userPowerResponseDto: { miners: 100, bonus: 5, bonus_percent: 500, racks: 10, games: 25, temp: 20, freon: 0, current_Power: 160, max_Power: 115, decrease: 0 },
};
const league = [{ id: '1', title: 'Bronze I', level: 1, minPower: 0, currencies: [{ id: 1, name: 'SAT', totalPower: 1000, userCount: 1, payoutAmount: 1e10, duration: 600 }] }];
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
let browser;
try {
    browser = await puppeteer.launch({ headless: true, timeout: 15000 });
    const cases = [
        { tab: 1, input: 'https://rollercoin.com/p/BURAK', name: 'BURAK', paste: true },
        { tab: 2, input: 'https://rollercoin.com/p/kb550ilu/games?ref=1#stats', name: 'kb550ilu', paste: true },
        { tab: 3, input: 'p/l83slilx/games', name: 'l83slilx', paste: true },
        { tab: 1, input: 'https://rollercoin.com/p/BuRaK/games?ref=1#stats', name: 'BuRaK' },
        { tab: 2, input: 'https://rollercoin.com/p/AbsentUser/games', name: 'AbsentUser', status: 400 },
        { tab: 3, input: 'https://rollercoin.com/p/AbsentUser?ref=1', name: 'AbsentUser', status: 404 },
        { tab: 1, input: 'AbsentUser', name: 'AbsentUser', status: 400, mobile: true },
        { tab: 1, input: 'https://example.com/p/BURAK', invalid: true },
        { tab: 2, input: 'https://rollercoin.com/p/', invalid: true },
        { tab: 3, input: 'https://rollercoin.com/profile/personal-profile', invalid: true },
        { tab: 3, input: 'BURAK', name: 'BURAK', status: 429 },
    ];
    for (const test of cases) {
        const context = await browser.createBrowserContext();
        const page = await context.newPage();
        page.setDefaultTimeout(10000);
        await page.setViewport({ width: test.mobile ? 390 : 1440, height: 1000 });
        await page.setBypassServiceWorker(true);
        await page.setRequestInterception(true);
        const requests = [];
        const errors = [];
        let leagueRequests = 0;
        page.on('pageerror', err => errors.push(err.message));
        page.on('request', req => {
            const url = new URL(req.url());
            let data;
            let status = 200;
            if (url.pathname === '/api/RollercoinUser') {
                requests.push(url.searchParams.get('userName'));
                status = test.status || 200;
                data = status === 200 ? account : { detail: status === 429 ? 'Too many requests' : 'User not found.' };
            } else if (url.pathname === '/api/League') { data = league; leagueRequests++; }
            else if (url.pathname === '/api/RollercoinUser/room') data = { is_user_from_session: false, rooms: [], racks: [], miners: [] };
            else if (url.pathname === '/api/Rack/get-set-rack-list') data = [];
            else if (url.pathname === '/api/Miner' || url.pathname === '/api/Rack') data = { items: [], index: 0, pages: 0 };
            if (data !== undefined) void req.respond({ status, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(data) });
            else if (req.url().startsWith(origin)) void req.continue();
            else void req.abort();
        });
        await page.goto(`${origin}/tr`, { waitUntil: 'networkidle0' });
        const click = async selector => {
            await page.waitForSelector(selector, { visible: true });
            await page.$eval(selector, e => e.scrollIntoView({ block: 'center', behavior: 'instant' }));
            await page.locator(selector).click();
        };
        if (test.tab !== 1) {
            await click(`.main-tabs-4 > .main-tab:nth-of-type(${test.tab})`);
            await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 450)));
        }
        const scope = test.tab === 1 ? '.data-input-section' : test.tab === 2 ? '.manual-simulator' : '.room-power-simulator';
        const input = test.tab === 1 ? `${scope} .username-input-with-help > input` : `${scope} .user-fetcher-row input`;
        const button = test.tab === 1 ? `${scope} .api-fetch-row > .fetch-btn` : `${scope} .user-fetcher-row .fetch-btn`;
        await click(input);
        if (test.paste) {
            await page.$eval(input, (element, value) => {
                const data = new DataTransfer();
                data.setData('text/plain', value);
                element.dispatchEvent(new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData: data }));
            }, test.input);
            await page.waitForFunction((selector, name) => document.querySelector(selector).value === name, {}, input, test.name);
        } else {
            await page.keyboard.type(test.input);
        }
        await click(button);
        if (test.status || test.invalid) {
            const warning = test.status === 429 ? '.notification-toast.error' : '.username-help-tooltip.open';
            await page.waitForSelector(warning, { visible: true });
            const text = await page.$eval(warning, e => e.textContent);
            if (test.invalid) {
                assert(text.includes('Geçerli bir RollerCoin profil bağlantısı'), text);
                assert.deepEqual(requests, []);
                assert.equal(leagueRequests, 0);
            } else if (test.status === 429) {
                assert(text.includes('çok fazla istek'), text);
                assert(!text.includes('hesabı bulunamadı'));
                assert.deepEqual(requests, [test.name]);
            } else {
                assert(text.includes('AbsentUser'), text);
                assert(text.includes('profil bağlantınızı yapıştırın'), text);
                assert(text.includes('/games'), text);
                assert.deepEqual(requests, [test.name]);
                await page.waitForSelector(`${button}:disabled`);
            }
            if (test.status !== 429) {
                assert.equal(await page.$eval(`${warning} a.help-link`, e => e.href), 'https://rollercoin.com/profile/personal-profile');
                assert.equal(await page.$('.username-error-notice'), null);
                await page.waitForFunction(() => {
                    const image = document.querySelector('.username-help-preview-image');
                    return image?.complete && image.naturalWidth > 0;
                });
                assert(await page.$eval('.username-help-preview-image', image => {
                    const rect = image.getBoundingClientRect();
                    return Math.abs(rect.height - rect.width * image.naturalHeight / image.naturalWidth) < 2;
                }), 'Profile screenshot must retain its complete natural aspect ratio');
                assert((await page.$eval('.username-power-alternative', e => e.textContent)).includes('oyunda gördüğünüz toplam gücü'));
                assert(await page.$eval(`${warning} .username-help-preview-image`, image =>
                    getComputedStyle(image).objectFit === 'contain' && !image.closest('.image-viewer-container')));
                if (!test.mobile) {
                    assert(await page.$eval(warning, e => e.getBoundingClientRect().width >= 700));
                }
            }
            if (test.mobile) {
                assert(await page.$eval(warning, e => e.scrollWidth <= e.clientWidth));
                await (await page.$(warning)).screenshot({ path: path.join(os.tmpdir(), 'rollercoin-username-help.png') });
            }
            if (test.status !== 429) {
                await page.keyboard.press('Escape');
                await page.waitForSelector('.username-help-tooltip', { hidden: true });
            }
            await click(input);
            await page.keyboard.press('Backspace');
            assert.equal(await page.$('.username-help-error'), null);
        } else {
            await page.waitForFunction(() => localStorage.getItem('rollercoin_web_fetched_user') !== null);
            assert.deepEqual(requests, [test.name]);
            assert.equal(await page.$eval(input, e => e.value), test.name);
            assert.equal(await page.evaluate(() => localStorage.getItem('rollercoin_web_username')), test.name);
            assert.equal(await page.$('.username-help-error'), null);
        }
        assert.deepEqual(errors, [], `Unhandled error for tab ${test.tab}, ${test.input}`);
        await context.close();
    }
    // The existing profile-link field in the help panel uses the same parser.
    const context = await browser.createBrowserContext();
    const page = await context.newPage();
    await page.setBypassServiceWorker(true);
    await page.setRequestInterception(true);
    page.on('request', req => req.url().startsWith(origin) ? void req.continue() : void req.abort());
    await page.goto(`${origin}/tr`, { waitUntil: 'networkidle0' });
    await page.locator('.username-help-btn').click();
    await page.locator('.username-link-input').fill('https://rollercoin.com/p/kb550ilu/games?x=1#top');
    await page.waitForFunction(() => document.querySelector('.username-input-with-help > input').value === 'kb550ilu');
    await context.close();
    console.log('Passed: all three fields normalize pasted/typed profile links, trailing paths/query/hash and relative links; only usernames reach the API; invalid links send no requests; 400/404 help, 429 handling, automatic enlarged help, full screenshot, game-power alternative, mobile fit, Escape-to-close, stored names and handled simulator failures.');
} finally {
    await browser?.close();
    await new Promise(resolve => server.close(resolve));
}
