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

Uygulama tüm verileri localStorage'da cache'ler:
- `rollercoin_web_coins`, `rollercoin_web_userpower`, `rollercoin_web_league_id`
- `rollercoin_web_api_leagues`, `rollercoin_web_raw_api_data`
- `rollercoin_web_fetched_user`, `rollercoin_web_block_durations`
- Cache versiyonu `CACHE_VERSION_KEY` ile takip edilir, versiyon değişince cache temizlenir.
