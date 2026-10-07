// Run after npm run build: node scripts/check-dependency-ui.mjs
// Exercise dependency integrations using local fixtures; no live API writes.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const tr = JSON.parse(fs.readFileSync(new URL('../src/locales/tr.json', import.meta.url), 'utf8'));
const mime = { '.js': 'application/javascript', '.css': 'text/css', '.html': 'text/html', '.svg': 'image/svg+xml', '.png': 'image/png' };
const image = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64');
const server = http.createServer((req, res) => {
    if (req.url === '/fixture.png') {
        res.setHeader('Content-Type', 'image/png');
        res.end(image);
        return;
    }
    let file = path.join(dist, new URL(req.url, 'http://localhost').pathname);
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(dist, 'index.html');
    res.setHeader('Content-Type', mime[path.extname(file)] ?? 'application/octet-stream');
    res.end(fs.readFileSync(file));
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const languages = [
    { id: 1, code: 'en', name: 'English', nativeName: 'English' },
    { id: 2, code: 'tr', name: 'Turkish', nativeName: 'Türkçe' }
];
const currencies = [
    { id: 1, name: 'SAT', totalPower: 1000000, userCount: 5, payoutAmount: 10000, duration: 600 },
    { id: 2, name: 'RLT', totalPower: 1000000, userCount: 5, payoutAmount: 10000, duration: 600 }
];
const raw = ['first', 'second'].map((id, index) => ({ id, title: `Test League ${index + 1}`, level: index, minPower: index * 100, currencies }));
const leagues = raw.map(l => ({ id: l.id, name: l.title, minPower: l.minPower, currencies: [] }));
const chart = [
    { date: '2026-10-01', averagePower: 1000000, averagePayout: 100 },
    { date: '2026-10-02', averagePower: 2000000, averagePayout: 150 }
];
const payload = {
    exp: Math.floor(Date.now() / 1000) + 3600,
    'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier': 'fixture-user',
    'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress': 'fixture@example.invalid',
    'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': 'Admin'
};
const token = `fixture.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.fixture`;
const errors = [];
const uploads = [];
const chartRequests = [];
const imagePath = fileURLToPath(new URL('../.dependency-test-image.png', import.meta.url));
let browser;
let page;
let step = 'chart load';
try {
    browser = await puppeteer.launch({ headless: true, timeout: 15000 });
    page = await browser.newPage();
    page.setDefaultTimeout(10000);
    await page.setViewport({ width: 1440, height: 1000 });
    await page.setBypassServiceWorker(true);
    page.on('pageerror', error => errors.push(error.message));
    await page.setRequestInterception(true);
    page.on('request', async req => {
        const url = new URL(req.url());
        const json = data => req.respond({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(data) });
        if (url.hostname === 'challenges.cloudflare.com' && url.pathname.endsWith('/api.js')) {
            // Verify the React wrapper's render, success and remove integration.
            await req.respond({ status: 200, contentType: 'application/javascript', body: `
                window.fixtureWidgets = 0;
                window.turnstile = {
                    render(element, options) {
                        window.fixtureWidgets++;
                        window.fixtureSuccess = () => options.callback('fixture-turnstile');
                        element.dataset.fixtureWidget = 'true';
                        return 'fixture-widget';
                    },
                    remove() { window.fixtureWidgets--; },
                    getResponse() { return 'fixture-turnstile'; },
                    reset() {}, isExpired() { return false; }
                };
                window[${JSON.stringify(url.searchParams.get('onload'))}]();
            ` });
        } else if (req.method() === 'OPTIONS' && url.pathname.startsWith('/api/')) {
            await req.respond({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET, POST, OPTIONS', 'access-control-allow-headers': '*' } });
        } else if (url.pathname === '/api/Language') await json(languages);
        else if (url.pathname.endsWith('/GetLeagueChartData')) {
            chartRequests.push(Object.fromEntries(url.searchParams));
            await json(chart);
        }
        else if (url.pathname === '/api/Blog/upload-image') {
            uploads.push({ method: req.method(), authorization: req.headers().authorization, contentType: req.headers()['content-type'] });
            await json({ isSuccess: true, url: `${origin}/fixture.png` });
        } else if (url.origin === origin) await req.continue();
        else await req.abort();
    });
    await page.evaluateOnNewDocument((raw, leagues) => {
        localStorage.setItem('rollercoin_web_chart_raw_api', JSON.stringify(raw));
        localStorage.setItem('rollercoin_web_chart_leagues', JSON.stringify(leagues));
        localStorage.setItem('rollercoin_web_chart_leagues_ts', String(Date.now()));
    }, raw, leagues);

    await page.goto(`${origin}/en/charts`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('.lc-chart-canvas-container canvas');
    assert.ok(await page.$eval('canvas', canvas => canvas.width > 0 && canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data.some((v, i) => i % 4 === 3 && v > 0)), 'Chart must draw data');
    step = 'Radix currency pointer selection';
    const currencyRequest = page.waitForRequest(req => new URL(req.url()).pathname.endsWith('/GetLeagueChartData') && new URL(req.url()).searchParams.get('currencyId') === '2');
    await page.locator('.currency-select [role="combobox"]').click();
    await page.waitForSelector('[role="option"]');
    await (await page.$$('[role="option"]'))[1].click();
    await currencyRequest;
    await page.waitForFunction(() => document.querySelector('.currency-select [role="combobox"]').textContent.includes('RLT'));
    step = 'Radix league keyboard selection';
    const leagueRequest = page.waitForRequest(req => new URL(req.url()).pathname.endsWith('/GetLeagueChartData') && new URL(req.url()).searchParams.get('leagueId') === 'second');
    await page.focus('.league-select [role="combobox"]');
    await page.keyboard.press('ArrowDown');
    await page.waitForSelector('[role="option"]');
    await page.keyboard.press('End');
    await page.waitForFunction(() => document.activeElement?.textContent.includes('Test League 2'));
    await page.keyboard.press('Enter');
    await leagueRequest;
    await page.waitForFunction(() => document.querySelector('.league-select [role="combobox"]').textContent.includes('Test League 2'));
    step = 'Turkish chart route';
    await page.goto(`${origin}/tr/charts`, { waitUntil: 'networkidle0' });
    assert.ok((await page.$eval('body', el => el.textContent)).includes(tr.charts.title), 'Turkish translations must load after route change');
    console.log('Chart rendering, Radix pointer/keyboard selection, routing and Turkish translations passed.');

    step = 'Turnstile login';
    await page.goto(`${origin}/en/login`, { waitUntil: 'networkidle0' });
    const widget = await page.$('#cf-turnstile');
    if (widget) {
        await page.waitForFunction(() => window.fixtureWidgets === 1);
        assert.equal(await page.$eval('.auth-submit-btn', el => el.disabled), true);
        await page.evaluate(() => window.fixtureSuccess());
        await page.waitForFunction(() => !document.querySelector('.auth-submit-btn').disabled);
        await page.locator('.auth-forgot-link a').click();
        await page.waitForFunction(() => location.pathname === '/en/forgot-password' && window.fixtureWidgets === 1);
        console.log('Turnstile wrapper render/success/unmount and auth route navigation passed (mock provider).');
    } else {
        console.log('Turnstile check skipped: build has no VITE_TURNSTILE_SITE_KEY.');
    }

    step = 'Quill editor';
    await page.evaluate(token => localStorage.setItem('rollercoin_web_access_token', token), token);
    await page.goto(`${origin}/en/admin/blogs/new`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('.ql-editor');
    await page.locator('.ql-bold').click();
    await page.locator('.ql-editor').click();
    await page.keyboard.type('Dependency editor check');
    await page.waitForFunction(() => document.querySelector('.ql-editor strong')?.textContent === 'Dependency editor check');
    await page.locator('.editor-lang-tab:nth-child(2)').click();
    assert.equal(await page.$eval('.ql-editor', el => el.textContent.trim()), '');
    await page.locator('.ql-editor').click();
    await page.keyboard.type('Turkish draft');
    await page.locator('.editor-lang-tab:first-child').click();
    await page.waitForFunction(() => document.querySelector('.ql-editor').textContent.includes('Dependency editor check'));
    fs.writeFileSync(imagePath, image);
    await (await page.$('.editor-thumbnail-section input[type="file"]')).uploadFile(imagePath);
    await page.waitForSelector('.editor-thumbnail-preview img[src$="/fixture.png"]');
    assert.equal(uploads.length, 1);
    assert.equal(uploads[0].method, 'POST');
    assert.equal(uploads[0].authorization, `Bearer ${token}`);
    assert.ok(uploads[0].contentType.startsWith('multipart/form-data; boundary='));
    console.log('ReactQuill formatting, language draft persistence, protected route and Dropzone upload passed (mock API).');
    assert.deepEqual(errors, [], 'Browser runtime errors');
} catch (error) {
    console.error({ step, chartRequests, errors, state: await page?.evaluate(() => ({ path: location.pathname, selects: [...document.querySelectorAll('[role="combobox"]')].map(el => el.textContent), focused: document.activeElement?.textContent?.slice(0, 150) })) });
    throw error;
} finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
    if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
}
