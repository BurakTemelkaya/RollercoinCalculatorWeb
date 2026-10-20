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

## Kullanıcı adı ve profil bağlantıları

- `utils/usernameParser.ts`, düz kullanıcı adını veya RollerCoin `/p/<kullanıcı>` profil bağlantısını ortak olarak ayrıştırır. Tam URL, `rollercoin.com/p/...`, `www` alan adı, `/p/...`, `p/...` ve kopyalanmış Markdown bağlantıları desteklenir. Sonraki yol bölümleri (`/games` vb.), sorgu ve fragment kullanıcı adına dahil edilmez. Kodlanmış kullanıcı adı bir kez çözülür; harflerin büyüklüğü korunur.
- Ana kullanıcı alanı ve iki simülatör yapıştırmada, odaktan çıkışta ve Getir işlemi sırasında bu ayrıştırıcıyı kullanır. Yardım penceresindeki mevcut profil bağlantısı alanı da aynı fonksiyonu kullanır. Kaydedilen ve API'ye gönderilen değer sadece kullanıcı adıdır. `fetchUserFromApi` servisinde de ayrıştırma yapılır; geçersiz giriş backend'e gönderilmeden `InvalidUsernameInputError` ile durdurulur. Başka alan adları, profil yolu eksik bağlantılar ve bozuk kodlama kabul edilmez.
- `App.tsx`, geçersiz giriş ve 400/404 kullanıcı sorgusu hatasını `usernameError` state'inde tutar. Hata, ayrı alan veya bildirim yerine `DataInputForm` içindeki mevcut “?” yardımını otomatik açar; simülatörlerden gelen hatalar da aynı yardımı kullanır. Yardım `document.body` portalında erişilebilir dialog olarak gösterilir; formun kapalı olması veya sekmelerin overflow'u yardımı gizlemez. Hata metni aranan adı, profil bağlantısını ve harf duyarlılığını açıklar. 429/403 ve diğer istek hataları kendi bildirimlerini korur, kullanıcı adı yardımını otomatik açmaz.
- Yardım 760 px genişliğe kadar büyür; mobilde ekran kenarlarında 16 px boşluk bırakır ve kısa ekranlarda kendi içinde kayar. Profil görseli doğal en-boy oranında tamamıyla gösterilir, görüntüye tıklayıp ikinci bir pencere açmaya gerek yoktur. Aynı yardımda “Kullanıcı Gücü” sekmesinden oyundaki toplam gücü girerek hesaplama yapma alternatifi belirtilir. Kapatma düğmesi, Escape veya dışarı tıklama yardımı ve hata state'ini temizler; geçerli bağlantı yapıştırmak veya alanı düzenlemek de hatayı temizler.
- Başarısız sorguda mevcut hesap/oda verileri korunur. Simülatörler parent'ın gösterdiği hatayı yakalar; işlenmemiş Promise reddi oluşmaz. Gerçek profil sorgusundan sonra mevcut 10 saniyelik bekleme uygulanır; istemci tarafında reddedilen hatalı bağlantılar bekleme başlatmaz.
- Kontrol: `npx tsx scripts/check-username-parser.ts`; `npm run build` ardından `node scripts/check-username-inputs.mjs`. Kullanıcının örnekleri, logdaki tam/bağıl bağlantılar, `/games`, sorgu/fragment, harf duyarlılığı, kodlama, üç formun gerçek API istek parametreleri, geçersiz bağlantıda istek yapılmaması, 400/404 yardımının otomatik açılması, 429 bildirimi, büyük ve kırpılmamış görsel, oyun gücü alternatifi, mobil yerleşim, Escape ile kapanma ve simülatör hatalarının yakalanması doğrulanır.

## Kritik Veri Akışı (Kazanç Hesaplama)

1. Lig verileri alınır (API veya statik) → `rawApiData`, `apiLeagues`
2. Kullanıcının ligi belirlenir → `league` (API'den league_Id veya güce göre otomatik)
3. Lig parasının güç verileri → `CoinData[]` (`convertApiLeagueToCoinData`)
4. Blok ödülleri hesaplanır → `blockRewards` (`getBlockRewardsForLeague`)
5. Kullanıcı payı = `userPower / leaguePower`
6. Kazanç = `pay × blokÖdülü × blokSayısı(periyoda göre)`

## Lig Bazlı Kazanç Analizi

- `LeagueAnalysisModal.tsx` varsayılan hesaplama gücünü `utils/leagueAnalysis.ts` ile belirler. Sonraki lig eşiğinden Eh için 0,1 birim, Zh için 0,001 birim, Ph için 1 birim çıkarılır (650 Eh → 649,9 Eh; 1,15 Zh → 1,149 Zh; 25 Zh → 24,999 Zh; 150 Ph → 149 Ph). 1 Yh eşiği 999,999 Zh olarak hesaplanır. Güç gösterimi ve özel güç düzenleme üç ondalık basamağı korur. Son ligde üst sınır olmadığından giriş gücü kullanılır.
- Düzenlenen özel güçler korunur; kazanç ve ana hesaplayıcıya uygulama aynı güç değerini kullanır.
- Her coin kartı, aynı coin kazancını sonraki ligde korumak için gereken minimum gücü gösterir: `günlük kazanç / sonraki ligin günlük toplam ödülü × sonraki ligin coin toplam gücü`. Sonuç en az sonraki ligin giriş gücüdür ve ekranda yukarı yuvarlanır.
- Blok ödülü dönüşümü ve lig bazlı blok süresi kazanç hesabıyla ortaktır. Veri yoksa veya coin sonraki ligde yoksa açıklama gösterilir; gereken güç sonraki lig sınırını aşıyorsa ya da tüm blok ödülü hedef kazanca yetmiyorsa belirtilir. Son ligde sonraki lig karşılaştırması gösterilmez.
- Hesaplama kontrolü: `npx tsx scripts/check-league-analysis.ts`.

## LocalStorage Cache

- Sekme geçişindeki 400 ms kapanma zamanlayıcısı `activeTab` effect’iyle yönetilir; yeni geçişte önceki zamanlayıcı iptal edilir. Geçiş bitince yalnızca aktif panel yükseklik kaplar. Kayıtlı sekme açılışta diğer panelleri kapalı yükler. Boş durum açıklaması 24 px dikey padding ve 32 px ikonla gösterilir; sayfaya gereksiz yükseklik eklemez. `check-account-power-ui.mjs` ilk açılış yüksekliğini, hızlı sekme değişimini, kayıtlı sekmeyi ve masaüstünde yedi güç kartının aynı satırda olmasını doğrular.
- Kazanç hesaplayıcı ve çekim sayacı, kazanç verisi yokken `calculator-empty-state` içinde önce kullanıcı adıyla Getir düğmesinin kullanılmasını veya kullanıcı gücünün girilmesini açıklar. Veri geldiğinde uyarı yerine sonuç gösterilir. Güç/oda simülatörleri boş hesapla kullanılabilir kalır; yeni açıklamalar on dilde `calculatorEmpty` altında tutulur.

- Kaldırılacak/eklenecek güç dağılımları `usePowerAllocations` ile `CalculatorArea` seviyesinde tutulur; `rollercoin_web_power_allocations` anahtarında birlikte saklanır. Açılışta geçerli coin/yüzde değerleri okunur; her dağılımın toplamı %100 ile sınırlıdır. Ekleme, yüzde değiştirme ve silme yenileme sonrası korunur; API verisinin 5 dakikalık süresine bağlı değildir. Panelin açık/kapalı tercihi `EarningsTable.tsx` içinde `rollercoin_web_power_allocations_open` anahtarıyla saklanır. Tablo yenileme veya yeniden veri yükleme sonrası tekrar oluşturulunca son tercih okunur; kapalı tercih de korunur.
- `utils/powerAllocation.ts` içindeki `calculateAllocatedEarnings`, kazanç tablosu ve çekim sayacının ortak hesabıdır: önce mevcut coin havuzundan kaldırılacak güç çıkarılır; hedef coinde ayrılan güç havuza eklenir ve yeni pay hesaplanır. Hedeflenmeyen satırların mevcut varsayımsal kazanç davranışı korunur.
- Çekim kartında hedeflenen coin için %100 güçteki standart süreye ek olarak seçilen yüzdeyle süre/tarih gösterilir. Kalan miktar mevcut bakiye ve özel minimum çekim tutarına dayanır. %0 güçte kazanç olmadığı belirtilir; bakiye yeterliyse çekim hazırdır. Yeni etiketler desteklenen 10 dilde bulunur.
- Kontrol: `npx tsx scripts/check-power-allocation.ts`; `npm run build` ardından `node scripts/check-simulation-persistence.mjs`. Tarayıcı testi kayıtlı hesabın yüklenmesini, dağılım ekleme/değiştirme/silmeyi, yenilemeyi, %30 çekim hesabını, sıfır gücü, yeterli bakiyeyi, tarih gösterimini, mobil kartı, miner kayıtlarını, başlangıç ayarlarını, API cache süresini ve hesap değişimini doğrular.

- Oda ve güç simülatörlerindeki sıralama seçimleri yeni alan/yön değerlerini doğrudan katalog isteğine aktarır. Madenci ve raf aramalarında yalnızca son başlatılan isteğin sonucu ve yükleme durumu uygulanır. Merge listesi değişen filtre için önceki effect yanıtlarını yok sayar; güç birimleri de yenileme bağımlılıklarına dahildir. Sıralama değişiklikleri ilk sayfaya döner. Kontrol: `npm run build` ardından `node scripts/check-filter-sorting.mjs` (masaüstü/mobil ilk seçim, geç yanıtlar ve birim değişiklikleri).

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
- Vite `manualChunks` kuralları paket dizinlerini eşleştirir; React/React DOM (client, JSX ve CJS alt yolları dahil) ile scheduler aynı `vendor-react` paketine ayrılır. Router, i18n, Radix, Chart.js ve html2canvas ayrı vendor paketlerinde kalır. Statik ortak bağımlılıkları Rollup yönetir; boş React paketi oluşmaz ve ana dosya mevcut 1000 KB uyarı sınırının altında kalır.
- `src/sw.ts`, aynı origin üzerindeki hash içeren `/assets/*.js` ve `/assets/*.css` isteklerini `CacheFirst` ile `rollercoin-lazy-assets-v1` cache'ine kaydeder. İlk istekte indirilir, sonraki isteklerde cache'ten gelir. Cache sürümler arasında korunur; 256 giriş / 30 gün sınırı ve kota temizliği uygulanır. HTML fallback yanıtları JS/CSS olarak kaydedilmez. API ve üçüncü taraf istekleri bu cache'e girmez.
- Oda ve manuel güç simülatörleri (RoomPowerSimulator, RoomSimulator ve ManualSimulator) statik import edilir; açılış paketine ve precache kapsamına dahildir. html2canvas yalnızca ekran görüntüsü özelliği kullanıldığında indirilir.
- Görseller tarayıcının normal HTTP önbelleğini kullanır. Offline kullanılabilirlik, uygulama kabuğu ve daha önce istenerek cache'e alınan sayfa kodlarıyla sınırlıdır; ziyaret edilmeyen sayfanın ilk açılışı bağlantı gerektirir.
- Güncellemeler Workbox'un mevcut revizyon/hash takibiyle sadece değişen kabuk dosyalarını indirir. ServiceWorkerUpdater içindeki sayfa geçişinde güncellemeyi etkinleştirme davranışı korunur.
- Kontrol: `npm run build` ardından `node scripts/check-pwa-cache.mjs`. Tarayıcı testi ilk ziyaret, lazy sayfa açılışı, değişmemiş dosyalarla worker güncellemesi, cache'in güncelleme sonrasında korunması, HTML fallback'in cache'e alınmaması ve offline JS erişimini doğrular.
