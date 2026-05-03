const PRICES_CACHE_KEY = 'rollercoin_web_prices_cache';

export type PriceApiProvider = 'binance' | 'coingecko';

// Fetch prices from Binance API or CoinGecko based on preference/fallback
export async function fetchPrices(symbols: string[], preferredApi: PriceApiProvider = 'binance'): Promise<Record<string, number>> {
  const prices: Record<string, number> = {};

  if (typeof navigator !== 'undefined' && navigator.userAgent.includes('ReactSnap')) {
    prices['USDT'] = 1;
    return prices;
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
    const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbols=${encoded}`);
    if (!response.ok) throw new Error("Binance API error");
    const data = await response.json();

    const priceMap = new Map<string, number>();
    if (Array.isArray(data)) {
      data.forEach((item: { symbol: string; price: string }) => {
        priceMap.set(item.symbol, parseFloat(item.price));
      });
    }

    for (const symbol of symbols) {
      const candidates = symbolMap[symbol.toUpperCase()];
      if (candidates) {
        for (const candidate of candidates) {
          if (priceMap.has(candidate)) {
            prices[symbol.toUpperCase()] = priceMap.get(candidate) as number;
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
    const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${idsString}&vs_currencies=usd`);
    if (!response.ok) throw new Error("CoinGecko API error");
    const data = await response.json();
    
    for (const symbol of symbols) {
      const id = coingeckoIdMap[symbol.toUpperCase()];
      if (id && data[id] && data[id].usd) {
        prices[symbol.toUpperCase()] = data[id].usd;
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
    localStorage.setItem(PRICES_CACHE_KEY, JSON.stringify({ prices, ts: Date.now() }));
    return prices;
  } catch (error) {
    console.error('Failed to fetch prices from all sources:', error);
    // Use cached prices as fallback only if they are less than 10 minutes old
    try {
      const cached = localStorage.getItem(PRICES_CACHE_KEY);
      if (cached) {
        const { prices: cachedPrices, ts } = JSON.parse(cached);
        if (Date.now() - ts < 10 * 60 * 1000) {
          return cachedPrices;
        }
      }
    } catch (_) { /* ignore */ }
  }

  // USDT is a stablecoin, hardcode $1 price
  prices['USDT'] = 1;
  return prices;
}
