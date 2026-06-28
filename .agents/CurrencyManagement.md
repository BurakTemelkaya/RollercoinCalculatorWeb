# Para Birimleri ve Yönetimi

## Desteklenen Para Birimleri

### Kripto Paralar (Kazanılabilir + Çekilebilir)
BTC, ETH, SOL, DOGE, BNB, LTC, XRP, TRX, POL(MATIC)

### Kripto Paralar (Kazanılabilir, Çekim Yok)
USDT — Stablecoin, fiyatı sabit $1 olarak hardcode'lanmıştır, çekim tablosunda gösterilmez.

### Oyun Tokenleri
RLT, RST, HMT — Bunların piyasa fiyatı yoktur, ayrı sekmede gösterilir.

### Çekim Tablosundan Hariç
ALGO, USDT — `WithdrawTimer.tsx`'de filtrelenir.

## Para Birimi Dönüşümü
API'de para birimleri `_SMALL` suffix'li gelir (ör: `USDT_SMALL`, `BNB_SMALL`, `SAT`). `CURRENCY_MAP` (`leagues.ts`) bu isimleri display isimlerine çevirir. `to_small` (`currencies.ts`) değeri, ham payout değerini gerçek birime çevirmek için kullanılır.
**BTC özel durum:** `to_small` config'de 1e8 ama hesaplamada 1e10 kullanılır (`leagueHelper.ts`).

## Blok Süreleri
Her para biriminin farklı blok süresi olabilir. Varsayılan değerler `App.tsx`'de `blockDurations` state'inde tanımlıdır. Kullanıcı ayarlar modalından değiştirebilir. Değerler saniye cinsindendir.

## Yeni Para Birimi Ekleme Kontrol Listesi
1. `data/currencies.ts` → `CURRENCY_CONFIG`'e ekle (name, code, display_name, balance_key, to_small, min_withdraw, color, precision).
2. `data/leagues.ts` → Her lig için `currencies` dizisine payout verisi ekle + `CURRENCY_MAP`'e `'X_SMALL': 'X'` ekle.
3. `utils/leagueHelper.ts` → `PAYOUT_SCALES_FALLBACK`'e ekle (gerekirse).
4. `utils/constants.ts` → `COIN_ICONS`'a ikon ekle (SVG dosyası `assets/coins/` altına).
5. `App.tsx` → `blockDurations` state'ine blok süresini ekle.
6. `types/index.ts` → Gerekirse `DEFAULT_MIN_WITHDRAW`'a ekle (çekim varsa).
7. Çekim yoksa → `WithdrawTimer.tsx`'de filtrele.
8. Stablecoin ise → `App.tsx`'te `fetchPrices` sonrasında sabit fiyat ekle (ör: `prices['USDT'] = 1`).
9. Fiyat çekilecekse → `App.tsx`'te `fetchPrices` çağrısındaki `allCryptos` dizisine ekle.
