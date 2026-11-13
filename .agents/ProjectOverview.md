# Proje Genel Yapısı ve Kurulum

## Proje Açıklaması

Rollercoin.com oyunundaki kripto para kazançlarını hesaplayan bir web uygulaması. Kullanıcının hash gücüne ve bulunduğu lige göre şu hesaplamaları yapar:

1. **Kazanç Hesaplayıcı** — Her kripto para için blok başına, günlük, haftalık, aylık kazançları USD karşılığıyla gösterir
2. **Çekim Süresi Hesaplayıcı** — Mevcut bakiye ve kazanç hızına göre minimum çekim miktarına ne kadar sürede ulaşılacağını hesaplar
3. **Güç ve Oda Simülatörleri** — Hesap verileriyle, sıfırdan veya girilen madenci gücünden simülasyon yapar. [Başlangıç modları ve içe aktarma](SimulatorBaselines.md), [otomatik yerleştirme](AutoPlacement.md)
4. **Parça Birleştirme (Forge)** — Başlangıç parçalarından üretilebilecek üst seviye parça sayısını ve net kârı hesaplar.

## Teknoloji

- **Framework**: React 19 + TypeScript
- **Build**: Vite 7
- **Styling**: Vanilla CSS (Tailwind yok)
- **i18n**: i18next (Türkçe/İngilizce)
- **UI**: Radix UI (Select dropdown)
- **Paket Yöneticisi**: npm

Paket güncellemeleri, korunan sürümler ve regresyon testleri için [npm paket güncelleme kaydı](DependencyUpdates.md) dosyasına bakın.

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
- **Reklamlar**: Üst 300×250 reklam ülke bilgisi gelmeden yüklenmez. Brezilya AdSense kullanır; diğer ülkeler CleverCore ile başlar ve no-fill callback'i veya 10 saniyelik timeout sonrası AdSense'e geçer (GA4'e `ad_no_fill` gönderilir). CleverCore yükleyicisi `index.html`'de bulunur ve SPA'da yeniden oluşturulan slota bağlanır. Reklam slotunun en az yarısı görünürken kreatif yüklenmişse GA4'e `ad_slot_view` gönderilir. Sayfa görüntülemeleri GA4 Web stream ayarları tarafından yönetilir; uygulama manuel SPA `page_view` göndermez. Yan ve mobil reklamlar `GlobalAds.tsx` içindeki ülke kurallarını kullanır (sağ alan her zaman, sol alan TR/UNKNOWN için AdSense; diğer ülkelerde A-Ads). Mobilde kendi alt banner'ımız yok; alttaki reklam AdSense Auto Ads'in yalnızca Anchor biçimiyle (geniş ekranlarda kapalı) gelir. AdSense birimleri `AdSenseSlot.tsx` ile basılır; Auto Ads kapalı tutulur, AB/UK çerez onayı AdSense panelindeki Gizlilik ve mesajlaşma üzerinden gelir. Eski RollerCoin görseline yapılan istek reklam engelleyici kontrolü olarak kullanılmaz.

  Reklam yönlendirme kontrolü: `npx tsx scripts/check-top-ad-network.ts`.

Her işlem yapıldıktan veya kodlar güncellendikten sonra eğer projenin genel yapısında bir değişiklik yapılıyorsa .agent klasöründe yeni dosya oluştur yada güncelle.
