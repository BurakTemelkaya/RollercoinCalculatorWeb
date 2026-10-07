# Veri Akışı ve Cache Yönetimi

## Veri Kaynakları

Uygulama iki modda çalışır:

### 1. API Modu (Sunucu Çekimi)
- **Kullanıcı Adı ile**: Backend API'den kullanıcı profili + güç bilgisi + lig verileri çekilir.
- **Güç Girişi ile**: Sadece lig verileri API'den çekilir, güç manuel girilir.
- API endpoint'leri `.env` dosyalarında tanımlı (`VITE_API_URL`, `VITE_API_LEAGUE_ENDPOINT`, `VITE_API_USER_ENDPOINT`).
- Fiyatlar Binance API'den çekilir.

### 2. Manuel Mod
- Kullanıcı, rollercoin.com'dan kopyaladığı güç verilerini yapıştırır.
- Statik lig verileri (`data/leagues.ts`) kullanılır.

## Kritik Veri Akışı (Kazanç Hesaplama)

1. Lig verileri alınır (API veya statik) → `rawApiData`, `apiLeagues`
2. Kullanıcının ligi belirlenir → `league` (API'den league_Id veya güce göre otomatik)
3. Lig parasının güç verileri → `CoinData[]` (`convertApiLeagueToCoinData`)
4. Blok ödülleri hesaplanır → `blockRewards` (`getBlockRewardsForLeague`)
5. Kullanıcı payı = `userPower / leaguePower`
6. Kazanç = `pay × blokÖdülü × blokSayısı(periyoda göre)`

## Lig Bazlı Kazanç Analizi

- `LeagueAnalysisModal.tsx` varsayılan hesaplama gücünü `utils/leagueAnalysis.ts` ile belirler. Sonraki lig eşiğinden Eh/Zh için 0,1 birim, Ph için 1 birim çıkarılır (650 Eh → 649,9 Eh; 25 Zh → 24,9 Zh; 150 Ph → 149 Ph). 1 Yh eşiği 999,9 Zh olarak hesaplanır. Son ligde üst sınır olmadığından giriş gücü kullanılır.
- Düzenlenen özel güçler korunur; kazanç ve ana hesaplayıcıya uygulama aynı güç değerini kullanır.
- Her coin kartı, aynı coin kazancını sonraki ligde korumak için gereken minimum gücü gösterir: `günlük kazanç / sonraki ligin günlük toplam ödülü × sonraki ligin coin toplam gücü`. Sonuç en az sonraki ligin giriş gücüdür ve ekranda yukarı yuvarlanır.
- Blok ödülü dönüşümü ve lig bazlı blok süresi kazanç hesabıyla ortaktır. Veri yoksa veya coin sonraki ligde yoksa açıklama gösterilir; gereken güç sonraki lig sınırını aşıyorsa ya da tüm blok ödülü hedef kazanca yetmiyorsa belirtilir. Son ligde sonraki lig karşılaştırması gösterilmez.
- Hesaplama kontrolü: `npx tsx scripts/check-league-analysis.ts`.

## LocalStorage Cache

- Kazanç tablosunda coin adlarının yanında 1 coin'in USD fiyatı gösterilebilir. `SettingsModal` içindeki `showCoinPrices` seçeneği `App.tsx` üzerinden yönetilir ve `rollercoin_web_show_coin_prices` anahtarıyla saklanır. Kayıtlı tercih yoksa 768px ve altında kapalı, masaüstünde açıktır; kaydedilen tercih tüm ekran genişliklerinde korunur. Fiyat mevcut `prices` verisinden alınır; fiyatı olmayan coinler ve oyun tokenleri için gösterilmez.
- `priceApi.ts` içindeki `fetchPriceSnapshot` fiyatlarla 24 saatlik değişimi birlikte döndürür. Binance `/ticker/24hr?type=MINI` yanıtındaki `lastPrice` ve `openPrice` karşılaştırılır; CoinGecko `include_24hr_change=true` verisinde önceki fiyat `usd / (1 + usd_24h_change / 100)` ile hesaplanır. Bu karşılaştırma kayan son 24 saati baz alır. Artan coin fiyatı yeşil, azalan kırmızı; sıfır değişim veya eksik karşılaştırma verisi nötr gösterilir. USDT uygulamada sabit $1 kabul edilir. `CoinMarketPrice` üzerine gelince veya odaklanınca normal ondalık fiyatlar ve değişim yüzdesi portal tooltip'te gösterilir.
- Fiyat ve değişim aynı snapshot ile `App.tsx`'e uygulanır; yeni fiyat isteği daha eski isteklerin UI sonucunu geçersiz kılar. Veriler açılışta, fiyat sağlayıcısı değişince ve mevcut manuel fiyat yenilemesinde çekilir. Snapshot `rollercoin_web_prices_cache` içinde birlikte saklanır; iki API de başarısızsa 10 dakikadan yeni cache kullanılır. Eski cache'te değişim yoksa fiyat nötrdür. `fetchPrices` yalnızca sayısal fiyat döndüren uyumluluk fonksiyonudur. Servis kontrolü: `npx tsx scripts/check-price-api.ts`.
- Kazanç tablosunun sabit başlığı, gerçek `.sticky-navbar` alt kenarına ulaştığı anda görünür. Tablo genişliği, yatay kaydırma ve sütun ölçüleri takip edilir; tablo bittiğinde veya hesaplama sekmesi gizlendiğinde başlık kaldırılır.
- Tarayıcı kontrolü: `npm run build` ardından `node scripts/check-earnings-table.mjs`. Masaüstü/mobil sabitleme eşiğini, sütun hizasını, yatay kaydırmayı, ekran boyutu ve sekme değişimini, fiyat gösterimini ve ayarın kaydetme/iptal davranışını doğrular.

Uygulama tüm verileri localStorage'da cache'ler:
- `rollercoin_web_coins`, `rollercoin_web_userpower`, `rollercoin_web_league_id`
- `rollercoin_web_api_leagues`, `rollercoin_web_raw_api_data`
- `rollercoin_web_fetched_user`, `rollercoin_web_block_durations`
- Cache versiyonu `CACHE_VERSION_KEY` ile takip edilir, versiyon değişince cache temizlenir.

## PWA: İhtiyaç Anında Dosya İndirme

- `vite.config.ts` artık Vite build manifestindeki giriş dosyasının yalnızca statik `imports` bağımlılıklarını ve CSS dosyalarını precache listesine alır. `dynamicImports` takip edilmez. Liste `index.html`, `icon.png` ve açılış paketlerinden oluşur; diğer sayfaların JS/CSS dosyaları ve görselleri topluca indirilmez.
- `src/sw.ts`, aynı origin üzerindeki hash içeren `/assets/*.js` ve `/assets/*.css` isteklerini `CacheFirst` ile `rollercoin-lazy-assets-v1` cache'ine kaydeder. İlk istekte indirilir, sonraki isteklerde cache'ten gelir. Cache sürümler arasında korunur; 256 giriş / 30 gün sınırı ve kota temizliği uygulanır. HTML fallback yanıtları JS/CSS olarak kaydedilmez. API ve üçüncü taraf istekleri bu cache'e girmez.
- Oda ve manuel güç simülatörleri (RoomPowerSimulator, RoomSimulator ve ManualSimulator) statik import edilir; açılış paketine ve precache kapsamına dahildir. html2canvas yalnızca ekran görüntüsü özelliği kullanıldığında indirilir.
- Görseller tarayıcının normal HTTP önbelleğini kullanır. Offline kullanılabilirlik, uygulama kabuğu ve daha önce istenerek cache'e alınan sayfa kodlarıyla sınırlıdır; ziyaret edilmeyen sayfanın ilk açılışı bağlantı gerektirir.
- Güncellemeler Workbox'un mevcut revizyon/hash takibiyle sadece değişen kabuk dosyalarını indirir. ServiceWorkerUpdater içindeki sayfa geçişinde güncellemeyi etkinleştirme davranışı korunur.
- Kontrol: `npm run build` ardından `node scripts/check-pwa-cache.mjs`. Tarayıcı testi ilk ziyaret, lazy sayfa açılışı, değişmemiş dosyalarla worker güncellemesi, cache'in güncelleme sonrasında korunması, HTML fallback'in cache'e alınmaması ve offline JS erişimini doğrular.
