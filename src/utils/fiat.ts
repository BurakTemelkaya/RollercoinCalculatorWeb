import { useSyncExternalStore } from 'react';
import type { SelectOption } from '../components/RadixSelect';

// Currencies of the site languages plus the most used ones. Prices stay in USD; only the display is converted.
export const FIAT_OPTIONS: SelectOption[] = [
  ['USD', '$'], ['EUR', '€'], ['TRY', '₺'], ['GBP', '£'], ['CNY', 'CN¥'], ['RUB', '₽'],
  ['BRL', 'R$'], ['IDR', 'Rp'], ['CZK', 'Kč'], ['JPY', '¥'], ['INR', '₹'], ['KRW', '₩'],
].map(([value, symbol]) => ({ value, label: `${symbol} ${value}` }));

const CODE_KEY = 'rollercoin_web_fiat';
// v2: rates from Coinbase/Frankfurter; the old cache's day-long wait would delay the switch
const RATES_KEY = 'rollercoin_web_fiat_rates_v2';
try { localStorage.removeItem('rollercoin_web_fiat_rates'); } catch { /* private mode */ }
const MINUTE = 60 * 1000;

const read = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
const write = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* private mode */ } };

let code = read(CODE_KEY) || 'USD';
let rates: Record<string, number> = { USD: 1 };
// Earliest time (ms) we call the rate APIs again.
let nextFetch = 0;
let loading = false;
let timer: ReturnType<typeof setInterval> | undefined;
try {
  const cached = JSON.parse(read(RATES_KEY) || 'null');
  if (cached?.rates) { rates = { ...cached.rates, USD: 1 }; nextFetch = cached.next || 0; }
} catch { /* bad cache */ }

const listeners = new Set<() => void>();
const emit = () => listeners.forEach(l => l());

/** Selected currency and its USD rate; falls back to USD until a rate is known. */
export function getFiat() {
  const rate = rates[code];
  return rate > 0 ? { code, rate } : { code: 'USD', rate: 1 };
}

export function setFiatCurrency(next: string) {
  code = next;
  write(CODE_KEY, next);
  emit();
}

const CODES = FIAT_OPTIONS.map(o => o.value);

/** Keeps only our currencies with a positive rate; throws when the payload has none. */
function pickRates(all: Record<string, unknown>) {
  const out: Record<string, number> = {};
  for (const c of CODES) { const v = Number(all[c]); if (v > 0) out[c] = v; }
  if (Object.keys(out).length < 2) throw new Error('No usable rates');
  return out;
}

// Market rates, updated about every minute; no key needed.
async function fromCoinbase() {
  const res = await fetch('https://api.coinbase.com/v2/exchange-rates?currency=USD');
  if (!res.ok) throw new Error(`Coinbase ${res.status}`);
  return pickRates((await res.json())?.data?.rates ?? {});
}

// Fallback: central bank reference rates (daily), no quota.
async function fromFrankfurter() {
  const res = await fetch(`https://api.frankfurter.dev/v2/rates?base=USD&quotes=${CODES.join(',')}`);
  if (!res.ok) throw new Error(`Frankfurter ${res.status}`);
  const list: { quote: string; rate: number }[] = await res.json();
  return pickRates(Object.fromEntries((Array.isArray(list) ? list : []).map(r => [r.quote, r.rate])));
}

// Checked every minute. Coinbase is asked each time; after a fallback we wait longer since Frankfurter is daily.
async function loadRates() {
  if (loading || Date.now() < nextFetch || typeof fetch === 'undefined') return;
  loading = true;
  try {
    let fresh: Record<string, number>;
    try {
      fresh = await fromCoinbase();
      nextFetch = Date.now() + MINUTE - 5000; // margin so the next minute tick isn't skipped
    } catch {
      fresh = await fromFrankfurter();
      nextFetch = Date.now() + 10 * MINUTE;
    }
    // A currency missing from one response keeps its last known rate
    rates = { ...rates, ...fresh, USD: 1 };
    write(RATES_KEY, JSON.stringify({ rates, next: nextFetch }));
    emit();
  } catch {
    nextFetch = Date.now() + 5 * MINUTE; // both down/offline: keep cached rates or USD, retry later
  } finally {
    loading = false;
  }
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  loadRates();
  timer ??= setInterval(loadRates, MINUTE);
  return () => {
    listeners.delete(l);
    if (!listeners.size) { clearInterval(timer); timer = undefined; }
  };
};

/** Re-renders the caller when the currency or rates change. Returns the selected code. */
export function useFiatCurrency() {
  return useSyncExternalStore(subscribe, () => `${code}:${rates[code] ?? ''}`, () => 'USD:1').split(':')[0];
}
