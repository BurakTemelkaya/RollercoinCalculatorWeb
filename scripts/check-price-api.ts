import assert from 'node:assert/strict';
import { fetchPrices, fetchPriceSnapshot } from '../src/services/priceApi';

async function main() {
    const originalFetch = globalThis.fetch;
    const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
    const originalWarn = console.warn;
    const originalError = console.error;
    const cache = new Map<string, string>();
    let denyWrites = false;
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
        getItem: (key: string) => cache.get(key) ?? null,
        setItem: (key: string, value: string) => {
            if (denyWrites) throw new Error('Storage unavailable');
            cache.set(key, value);
        },
    } });
    console.warn = () => {};
    console.error = () => {};
    const calls: URL[] = [];
    let binance: unknown = [];
    let coingecko: unknown = {};
    globalThis.fetch = async input => {
        const url = new URL(String(input));
        calls.push(url);
        const body = url.hostname === 'api.binance.com' ? binance : coingecko;
        return new Response(JSON.stringify(body), { status: body === null ? 503 : 200 });
    };
    const near = (actual: number, expected: number) => assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} != ${expected}`);
    try {
        binance = [
            { symbol: 'BTCUSDT', lastPrice: '110', openPrice: '100', prevClosePrice: '999' },
            { symbol: 'ETHUSDT', lastPrice: '90', openPrice: '100' },
            { symbol: 'SOLUSDT', lastPrice: '10', openPrice: '10' },
            { symbol: 'BNBUSDT', lastPrice: '20', openPrice: '0' },
            { symbol: 'DOGEUSDT', lastPrice: '1' },
            { symbol: 'XRPUSDT', lastPrice: 'NaN', openPrice: '1' },
            { symbol: 'POLUSDT', lastPrice: '2', openPrice: '1' },
            { symbol: 'MATICUSDT', lastPrice: '3', openPrice: '1' },
        ];
        const symbols = ['BTC', 'ETH', 'SOL', 'BNB', 'DOGE', 'XRP', 'POL', 'MATIC'];
        const quote = await fetchPriceSnapshot(symbols);
        near(quote.changes.BTC.changePercent, 10);
        near(quote.changes.ETH.changePercent, -10);
        assert.equal(quote.changes.BTC.previousPrice, 100, 'Use opening price, not prevClosePrice');
        assert.equal(quote.changes.SOL.changePercent, 0);
        assert.equal(quote.prices.BNB, 20);
        assert.equal(quote.changes.BNB, undefined, 'Invalid reference stays neutral');
        assert.equal(quote.changes.DOGE, undefined, 'Missing reference stays neutral');
        assert.equal(quote.prices.XRP, undefined, 'Invalid live price is excluded');
        assert.equal(quote.prices.MATIC, 2, 'POL takes priority for both aliases');
        assert.equal(quote.prices.USDT, 1);
        assert.equal(quote.changes.USDT, undefined);
        assert.equal(calls[0].pathname, '/api/v3/ticker/24hr');
        assert.equal(calls[0].searchParams.get('type'), 'MINI');
        assert.deepEqual(await fetchPrices(['BTC']), { BTC: 110, USDT: 1 }, 'Numeric price contract stays intact');

        coingecko = {
            bitcoin: { usd: 110, usd_24h_change: 10 },
            ethereum: { usd: 90, usd_24h_change: -10 },
            solana: { usd: 10, usd_24h_change: 0 },
            binancecoin: { usd: 20, usd_24h_change: null },
            dogecoin: { usd: 1, usd_24h_change: -100 },
        };
        const gecko = await fetchPriceSnapshot(['BTC', 'ETH', 'SOL', 'BNB', 'DOGE'], 'coingecko');
        near(gecko.changes.BTC.previousPrice, 100);
        near(gecko.changes.ETH.previousPrice, 100);
        assert.equal(gecko.changes.SOL.previousPrice, 10);
        assert.equal(gecko.changes.BNB, undefined, 'Null change must not become 0%');
        assert.equal(gecko.changes.DOGE, undefined, 'A -100% change has no finite reference');
        assert.equal(calls.at(-1)?.searchParams.get('include_24hr_change'), 'true');

        binance = null;
        const fallback = await fetchPriceSnapshot(['BTC']);
        assert.equal(fallback.changes.BTC.previousPrice, gecko.changes.BTC.previousPrice);
        coingecko = null;
        binance = [{ symbol: 'BTCUSDT', lastPrice: '120', openPrice: '100' }];
        assert.equal((await fetchPriceSnapshot(['BTC'], 'coingecko')).prices.BTC, 120);
        binance = null;
        const cached = await fetchPriceSnapshot(['BTC']);
        assert.equal(cached.prices.BTC, 120);
        assert.equal(cached.changes.BTC.previousPrice, 100);

        const cacheKey = 'rollercoin_web_prices_cache';
        cache.set(cacheKey, JSON.stringify({ prices: { BTC: 80 }, ts: Date.now() }));
        const legacy = await fetchPriceSnapshot(['BTC']);
        assert.equal(legacy.prices.BTC, 80);
        assert.deepEqual(legacy.changes, {}, 'Legacy cache has no invented change');
        cache.set(cacheKey, JSON.stringify({ prices: { BTC: 80 }, ts: Date.now() - 11 * 60 * 1000 }));
        assert.deepEqual(await fetchPriceSnapshot(['BTC']), { prices: { USDT: 1 }, changes: {} });
        cache.set(cacheKey, 'invalid JSON');
        assert.deepEqual(await fetchPriceSnapshot(['BTC']), { prices: { USDT: 1 }, changes: {} });

        denyWrites = true;
        binance = [{ symbol: 'BTCUSDT', lastPrice: '110', openPrice: '100' }];
        const noStorage = await fetchPriceSnapshot(['BTC']);
        assert.equal(noStorage.prices.BTC, 110, 'Storage failure must retain live quotes');
        near(noStorage.changes.BTC.changePercent, 10);
        console.log('Price API: rolling 24h references, signs, missing data, aliases, both providers, fallback, cache and numeric compatibility passed.');
    } finally {
        globalThis.fetch = originalFetch;
        if (originalStorage) Object.defineProperty(globalThis, 'localStorage', originalStorage);
        else Reflect.deleteProperty(globalThis, 'localStorage');
        console.warn = originalWarn;
        console.error = originalError;
    }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
