# Achievements (Başarımlar)

Sayfa: `/:lang/achievements` → `src/components/AchievementsPage.tsx`, veri: `src/data/achievements.json` (statik snapshot, backend yok).

## Veri kaynağı ve yenileme

Rollercoin'in `https://rollercoin.com/achievements` sayfası `GET /api/main/achievements/tasks-progress` (oturum gerekir) ile tüm başarımları ve her seviyeyi yükler. Yenilemek için oturum açık tarayıcıda sayfayı açıp React state'inden `allAchievements` (`{ kategori: { type: Level[] } }`) okunur ve şu kompakt formata çevrilir:

```ts
{ cat, type, levels: [{ lv, n /* count_repeats */, d /* description.en */, img /* media.preview_url */, r }] }
// r: money → { t:'money', c:'RST'|'RLT', a: amount / 1e6 }
//    battery → { t:'battery', a }
//    miner → { t:'miner', n: title.en, f: filename, lv: level, p: power (Gh/s), b: percent_bonus (/100 = %), s, mt, sell }
```

- Para ödülleri JSON'da **zaten 1e6'ya bölünmüş** durumda.
- Açıklamalar API'de yalnızca `en`/`cn` olduğundan İngilizce gösterilir; arayüz metinleri `achievements.*` çeviri anahtarlarındadır.
- Başarım ikonları `public/achievements/{id}.png` içinde (sayfada gösterilen son seviye ikonları); dosya yoksa `https://static.rollercoin.com{img}` yedeğe düşer. Veri yenilenince yeni ikonları da bu klasöre indirin.
- Miner ödülleri `CdnImage` ile önce kendi CDN'imizden (`miners/{f}.gif`), yoksa Rollercoin'den yüklenir.
