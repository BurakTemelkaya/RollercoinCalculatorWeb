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

## LocalStorage Cache

Uygulama tüm verileri localStorage'da cache'ler:
- `rollercoin_web_coins`, `rollercoin_web_userpower`, `rollercoin_web_league_id`
- `rollercoin_web_api_leagues`, `rollercoin_web_raw_api_data`
- `rollercoin_web_fetched_user`, `rollercoin_web_block_durations`
- Cache versiyonu `CACHE_VERSION_KEY` ile takip edilir, versiyon değişince cache temizlenir.
