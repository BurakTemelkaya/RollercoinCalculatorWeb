const PRICES_CACHE_KEY = 'rollercoin_web_prices_cache';

export type PriceApiProvider = 'binance' | 'coingecko';

export interface PriceChange24h {
  previousPrice: number;
  changePercent: number;
}

export interface PriceSnapshot {
  prices: Record<string, number>;
  changes: Record<string, PriceChange24h>;
}

// Fetch prices from Binance API or CoinGecko based on preference/fallback
export async function fetchPriceSnapshot(symbols: string[], preferredApi: PriceApiProvider = 'binance'): Promise<PriceSnapshot> {
  const prices: Record<string, number> = {};
  const changes: Record<string, PriceChange24h> = {};

  if (typeof navigator !== 'undefined' && navigator.userAgent.includes('ReactSnap')) {
    prices['USDT'] = 1;
    return { prices, changes };
  }

  const fetchFromBinance = async () => {
    // Map to Binance symbols with correct priority
    const symbolMap: Record<string, string[]> = {
      'BTC': ['BTCUSDT'],
      'ETH': ['ETHUSDT'],
      'SOL': ['SOLUSDT'],
      'DOGE': ['DOGEUSDT'],
      'BNB': ['BNBUSDT'],
      'LTC': ['LTCUSDT'],
      'XRP': ['XRPUSDT'],
      'TRX': ['TRXUSDT'],
      'POL': ['POLUSDT', 'MATICUSDT'],
      'MATIC': ['POLUSDT', 'MATICUSDT'],
      'ALGO': ['ALGOUSDT'],
    };

    const neededPairs = new Set<string>();
    for (const symbol of symbols) {
      const candidates = symbolMap[symbol.toUpperCase()];
      if (candidates) candidates.forEach(c => neededPairs.add(c));
    }

    const encoded = encodeURIComponent(JSON.stringify([...neededPairs]));
    const response = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbols=${encoded}&type=MINI`);
    if (!response.ok) throw new Error("Binance API error");
    const data = await response.json();

    const priceMap = new Map<string, { price: number; previousPrice: number }>();
    if (Array.isArray(data)) {
      data.forEach((item: { symbol: string; lastPrice: string; openPrice: string }) => {
        const price = Number(item.lastPrice);
        if (Number.isFinite(price) && price > 0) {
          priceMap.set(item.symbol, { price, previousPrice: Number(item.openPrice) });
        }
      });
    }

    for (const symbol of symbols) {
      const candidates = symbolMap[symbol.toUpperCase()];
      if (candidates) {
        for (const candidate of candidates) {
          if (priceMap.has(candidate)) {
            const { price, previousPrice } = priceMap.get(candidate)!;
            const key = symbol.toUpperCase();
            prices[key] = price;
            const changePercent = (price / previousPrice - 1) * 100;
            if (Number.isFinite(previousPrice) && previousPrice > 0 && Number.isFinite(changePercent)) {
              changes[key] = { previousPrice, changePercent };
            }
            break;
          }
        }
      }
    }
  };

  const fetchFromCoinGecko = async () => {
    const coingeckoIdMap: Record<string, string> = {
      'BTC': 'bitcoin',
      'ETH': 'ethereum',
      'SOL': 'solana',
      'DOGE': 'dogecoin',
      'BNB': 'binancecoin',
      'LTC': 'litecoin',
      'XRP': 'ripple',
      'TRX': 'tron',
      'POL': 'polygon-ecosystem-token',
      'MATIC': 'matic-network',
      'ALGO': 'algorand',
    };

    const neededIds = new Set<string>();
    for (const symbol of symbols) {
      const id = coingeckoIdMap[symbol.toUpperCase()];
      if (id) neededIds.add(id);
    }
    
    const idsString = Array.from(neededIds).join(',');
    const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${idsString}&vs_currencies=usd&include_24hr_change=true`);
    if (!response.ok) throw new Error("CoinGecko API error");
    const data = await response.json();
    
    for (const symbol of symbols) {
      const id = coingeckoIdMap[symbol.toUpperCase()];
      const price = id ? data[id]?.usd : undefined;
      if (typeof price === 'number' && Number.isFinite(price) && price > 0) {
        const key = symbol.toUpperCase();
        prices[key] = price;
        const changePercent = data[id].usd_24h_change;
        const previousPrice = price / (1 + changePercent / 100);
        if (typeof changePercent === 'number' && Number.isFinite(changePercent) && changePercent > -100 &&
            Number.isFinite(previousPrice) && previousPrice > 0) {
          changes[key] = { previousPrice, changePercent };
        }
      }
    }
  };

  try {
    if (preferredApi === 'binance') {
      try {
        await fetchFromBinance();
      } catch (e) {
        console.warn("Binance fetch failed, falling back to CoinGecko", e);
        await fetchFromCoinGecko();
      }
    } else {
      try {
        await fetchFromCoinGecko();
      } catch (e) {
        console.warn("CoinGecko fetch failed, falling back to Binance", e);
        await fetchFromBinance();
      }
    }

    // Cache successful result in localStorage
    prices['USDT'] = 1;
    // Storage may be unavailable even when fetching succeeded.
    try {
      localStorage.setItem(PRICES_CACHE_KEY, JSON.stringify({ prices, changes, ts: Date.now() }));
    } catch { /* keep the live result */ }
    return { prices, changes };
  } catch (error) {
    console.error('Failed to fetch prices from all sources:', error);
    // Use cached prices as fallback only if they are less than 10 minutes old
    try {
      const cached = localStorage.getItem(PRICES_CACHE_KEY);
      if (cached) {
        const { prices: cachedPrices, changes: cachedChanges, ts } = JSON.parse(cached);
        if (Number.isFinite(ts) && Date.now() - ts >= 0 && Date.now() - ts < 10 * 60 * 1000 &&
            cachedPrices && typeof cachedPrices === 'object') {
          const validPrices: Record<string, number> = { USDT: 1 };
          const validChanges: Record<string, PriceChange24h> = {};
          for (const symbol of symbols) {
            const key = symbol.toUpperCase();
            const price = cachedPrices[key];
            if (typeof price !== 'number' || !Number.isFinite(price) || price <= 0) continue;
            validPrices[key] = price;
            const change = cachedChanges?.[key];
            if (change && Number.isFinite(change.previousPrice) && change.previousPrice > 0 &&
                Number.isFinite(change.changePercent) && change.changePercent > -100) {
              validChanges[key] = change;
            }
          }
          return { prices: validPrices, changes: validChanges };
        }
      }
    } catch (_) { /* ignore */ }
  }

  // USDT is a stablecoin, hardcode $1 price
  prices['USDT'] = 1;
  return { prices, changes };
}

// Preserve the numeric-only contract for calculation consumers.
export async function fetchPrices(symbols: string[], preferredApi: PriceApiProvider = 'binance'): Promise<Record<string, number>> {
  return (await fetchPriceSnapshot(symbols, preferredApi)).prices;
}
