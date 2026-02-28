# Rollercoin Calculator Web - Proje Rehberi

## Proje Açıklaması

Rollercoin.com oyunundaki kripto para kazançlarını hesaplayan bir web uygulaması. Kullanıcının hash gücüne ve bulunduğu lige göre şu hesaplamaları yapar:

1. **Kazanç Hesaplayıcı** — Her kripto para için blok başına, günlük, haftalık, aylık kazançları USD karşılığıyla gösterir
2. **Çekim Süresi Hesaplayıcı** — Mevcut bakiye ve kazanç hızına göre minimum çekim miktarına ne kadar sürede ulaşılacağını hesaplar
3. **Güç Simülatörü** — Yeni madenci/raf eklendiğinde mevcut güç değerlerine göre kazancın nasıl değişeceğini simüle eder

## Teknoloji

- **Framework**: React 19 + TypeScript
- **Build**: Vite 7
- **Styling**: Vanilla CSS (Tailwind yok)
- **i18n**: i18next (Türkçe/İngilizce)
- **UI**: Radix UI (Select dropdown)
- **Paket Yöneticisi**: npm

## Çalıştırma

```bash
npm run dev      # Geliştirme sunucusu
npm run build    # Production build (tsc + vite build)
npx tsc --noEmit # Tip kontrolü
```

## Veri Kaynakları

Uygulama iki modda çalışır:

### 1. API Modu (Sunucu Çekimi)
- **Kullanıcı Adı ile**: Backend API'den kullanıcı profili + güç bilgisi + lig verileri çekilir
- **Güç Girişi ile**: Sadece lig verileri API'den çekilir, güç manuel girilir
- API endpoint'leri `.env` dosyalarında tanımlı (`VITE_API_URL`, `VITE_API_LEAGUE_ENDPOINT`, `VITE_API_USER_ENDPOINT`)
- Fiyatlar Binance API'den çekilir

### 2. Manuel Mod
- Kullanıcı, rollercoin.com'dan kopyaladığı güç verilerini yapıştırır
- Statik lig verileri (`data/leagues.ts`) kullanılır

## Proje Yapısı

```
src/
├── App.tsx                    # Ana bileşen, tüm state yönetimi, veri akışı
├── main.tsx                   # React entry point
├── i18n.ts                    # Dil yapılandırması
├── index.css                  # Tüm stiller (tek dosya)
│
├── components/
│   ├── DataInputForm.tsx/css  # Veri giriş formu (API/Manuel mod, güç, lig seçimi)
│   ├── EarningsTable.tsx      # Kazanç tablosu (kripto + game token sekmeleri)
│   ├── PowerSimulator.tsx/css # Güç simülatörü (madenci/raf ekleme simülasyonu)
│   ├── WithdrawTimer.tsx      # Çekim süresi hesaplayıcı
│   ├── SettingsModal.tsx      # Blok süresi ayarları modalı
│   └── Notification.tsx/css   # Toast bildirimleri
│
├── services/
│   ├── leagueApi.ts           # Lig API çağrıları + veri dönüşüm fonksiyonları
│   └── userApi.ts             # Kullanıcı API çağrıları
│
├── data/
│   ├── currencies.ts          # Para birimi yapılandırmaları (to_small, balance_key, vb.)
│   ├── leagues.ts             # Statik lig verileri + CURRENCY_MAP
│   └── leagueImages.ts        # Lig rozet görselleri
│
├── types/
│   ├── index.ts               # Ana tipler (HashPower, CoinData, EarningsResult, vb.)
│   ├── api.ts                 # API response tipleri (ApiLeagueData, ApiCurrency)
│   └── user.ts                # Kullanıcı tipleri (RollercoinUserResponse)
│
├── utils/
│   ├── calculator.ts          # Kazanç hesaplama fonksiyonları
│   ├── powerParser.ts         # Güç birimi dönüşümleri (H/Kh/Mh/Gh/Th/Ph/Eh/Zh/Yh)
│   ├── leagueHelper.ts        # Lig bazlı blok ödül hesaplama, PAYOUT_SCALES_FALLBACK
│   ├── constants.ts           # Coin ikonları (COIN_ICONS) ve renkleri
│   └── dataParser.ts          # Manuel veri ayrıştırma
│
├── config/
│   └── api.ts                 # API URL yapılandırması (env variables)
│
├── hooks/
│   └── useApiCooldown.ts      # API çağrı sıklığı sınırlaması
│
├── locales/
│   ├── tr.json                # Türkçe çeviriler
│   └── en.json                # İngilizce çeviriler
│
└── assets/
    └── coins/                 # Kripto para SVG ikonları
```

## Kritik Veri Akışı

### Kazanç Hesaplama

```
1. Lig verileri alınır (API veya statik) → rawApiData, apiLeagues
2. Kullanıcının ligi belirlenir → league (API'den league_Id veya güce göre otomatik)
3. Lig parasının güç verileri → CoinData[] (convertApiLeagueToCoinData)
4. Blok ödülleri hesaplanır → blockRewards (getBlockRewardsForLeague)
5. Kullanıcı payı = userPower / leaguePower
6. Kazanç = pay × blokÖdülü × blokSayısı(periyoda göre)
```

### Para Birimi Dönüşümü

API'de para birimleri `_SMALL` suffix'li gelir (ör: `USDT_SMALL`, `BNB_SMALL`, `SAT`). `CURRENCY_MAP` (leagues.ts) bu isimleri display isimlerine çevirir. `to_small` (currencies.ts) değeri, ham payout değerini gerçek birime çevirmek için kullanılır.

**BTC özel durum:** `to_small` config'de 1e8 ama hesaplamada 1e10 kullanılır (`leagueHelper.ts`).

## Desteklenen Para Birimleri

### Kripto Paralar (Kazanılabilir + Çekilebilir)
BTC, ETH, SOL, DOGE, BNB, LTC, XRP, TRX, POL(MATIC)

### Kripto Paralar (Kazanılabilir, Çekim Yok)
USDT — Stablecoin, fiyatı sabit $1 olarak hardcode'lanmıştır, çekim tablosunda gösterilmez

### Oyun Tokenleri
RLT, RST, HMT — Bunların piyasa fiyatı yoktur, ayrı sekmede gösterilir

### Çekim Tablosundan Hariç
ALGO, USDT — `WithdrawTimer.tsx`'de filtrelenir

## Blok Süreleri

Her para biriminin farklı blok süresi olabilir. Varsayılan değerler `App.tsx`'de `blockDurations` state'inde tanımlıdır. Kullanıcı ayarlar modalından değiştirebilir. Değerler saniye cinsindendir.

## LocalStorage Cache

Uygulama tüm verileri localStorage'da cache'ler:
- `rollercoin_web_coins`, `rollercoin_web_userpower`, `rollercoin_web_league_id`
- `rollercoin_web_api_leagues`, `rollercoin_web_raw_api_data`
- `rollercoin_web_fetched_user`, `rollercoin_web_block_durations`
- Cache versiyonu `CACHE_VERSION_KEY` ile takip edilir, versiyon değişince cache temizlenir

## Yeni Para Birimi Ekleme Kontrol Listesi

1. `data/currencies.ts` → `CURRENCY_CONFIG`'e ekle (name, code, display_name, balance_key, to_small, min_withdraw, color, precision)
2. `data/leagues.ts` → Her lig için `currencies` dizisine payout verisi ekle + `CURRENCY_MAP`'e `'X_SMALL': 'X'` ekle
3. `utils/leagueHelper.ts` → `PAYOUT_SCALES_FALLBACK`'e ekle (gerekirse)
4. `utils/constants.ts` → `COIN_ICONS`'a ikon ekle (SVG dosyası `assets/coins/` altına)
5. `App.tsx` → `blockDurations` state'ine blok süresini ekle
6. `types/index.ts` → Gerekirse `DEFAULT_MIN_WITHDRAW`'a ekle (çekim varsa)
7. Çekim yoksa → `WithdrawTimer.tsx`'de filtrele
8. Stablecoin ise → `App.tsx`'te `fetchPrices` sonrasında sabit fiyat ekle (ör: `prices['USDT'] = 1`)
9. Fiyat çekilecekse → `App.tsx`'te `fetchPrices` çağrısındaki `allCryptos` dizisine ekle

## Önemli Notlar

- **Fiyatlar**: Binance API'den çekilir. USDT gibi stablecoin'ler için sabit $1 kullanılır
- **Race condition**: API ve kullanıcı verileri paralel çekilir. `App.tsx`'teki coins generation effect'inde fallback mantığı var (league.id eşleşmezse fetchedUser.league_Id kullanılır)
- **Güç birimleri**: Tüm API değerleri Gh/s cinsindendir, iç hesaplamalarda H/s base unit'e çevrilir
- **i18n**: Tüm UI metinleri `locales/tr.json` ve `locales/en.json`'da tanımlıdır
