# Proje Genel Yapısı ve Kurulum

## Proje Açıklaması

Rollercoin.com oyunundaki kripto para kazançlarını hesaplayan bir web uygulaması. Kullanıcının hash gücüne ve bulunduğu lige göre şu hesaplamaları yapar:

1. **Kazanç Hesaplayıcı** — Her kripto para için blok başına, günlük, haftalık, aylık kazançları USD karşılığıyla gösterir
2. **Çekim Süresi Hesaplayıcı** — Mevcut bakiye ve kazanç hızına göre minimum çekim miktarına ne kadar sürede ulaşılacağını hesaplar
3. **Güç Simülatörü** — Yeni madenci/raf eklendiğinde mevcut güç değerlerine göre kazancın nasıl değişeceğini simüle eder
4. **Parça Birleştirme (Forge)** — Başlangıç parçalarından üretilebilecek üst seviye parça sayısını ve net kârı hesaplar.

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
│   ├── ProgressionEvent.tsx/css # Progression Event ödül tablosu + multiplier hesaplayıcı
│   ├── WithdrawTimer.tsx      # Çekim süresi hesaplayıcı
│   ├── SettingsModal.tsx      # Blok süresi ayarları modalı
│   ├── Notification.tsx/css   # Toast bildirimleri
│   └── ComponentForgeCalculator.tsx/css # Parça birleştirme hesaplayıcısı
│
├── services/
│   ├── leagueApi.ts           # Lig API çağrıları + veri dönüşüm fonksiyonları
│   ├── progressionEventApi.ts # Progression Event API çağrıları
│   ├── userApi.ts             # Kullanıcı API çağrıları
│   └── componentApi.ts        # Pazar (Market) parça fiyatları API çağrıları
│
├── data/
│   ├── currencies.ts          # Para birimi yapılandırmaları
│   ├── leagues.ts             # Statik lig verileri + CURRENCY_MAP
│   └── leagueImages.ts        # Lig rozet görselleri
│
├── types/
│   ├── index.ts               # Ana tipler
│   ├── api.ts                 # API response tipleri
│   ├── progressionEvent.ts    # Progression Event tipleri
│   └── user.ts                # Kullanıcı tipleri
│
├── utils/
│   ├── calculator.ts          # Kazanç hesaplama fonksiyonları
│   ├── powerParser.ts         # Güç birimi dönüşümleri
│   ├── leagueHelper.ts        # Lig bazlı blok ödül hesaplama
│   ├── constants.ts           # İkonlar ve renkler
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
    ├── coins/                 # Kripto para SVG ikonları
    └── items/                 # Ödül/parça görselleri
```

## Önemli Notlar

- **Fiyatlar**: Kripto paralar için Binance API'den, oyun içi parçalar için component API'den çekilir. USDT gibi stablecoin'ler için sabit $1 kullanılır.
- **Race condition**: API ve kullanıcı verileri paralel çekilir. `App.tsx`'teki coins generation effect'inde fallback mantığı var (league.id eşleşmezse fetchedUser.league_Id kullanılır).
- **Güç birimleri**: Tüm API değerleri Gh/s cinsindendir, iç hesaplamalarda H/s base unit'e çevrilir.
- **i18n**: Tüm UI metinleri `locales/tr.json` ve `locales/en.json`'da tanımlıdır.
