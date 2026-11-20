# Progression Event Görsel Çözümleme

Progression Event ödüllerinin görselleri şu öncelik sırasına göre çözümlenir:

| Ödül Tipi | Görsel Kaynağı | Açıklama |
|---|---|---|
| **Miner** | `static.rollercoin.com` CDN | `filename` alanından dinamik URL oluşturulur |
| **Rack** | `static.rollercoin.com` CDN | `_id` alanından dinamik URL oluşturulur |
| **Mystery Box** | `static.rollercoin.com` CDN → Lokal fallback | API'deki `media.box_image_url` önce denenir, yoksa `title` eşleşmesiyle lokal resim |
| **Utility Item** | `static.rollercoin.com` CDN → Lokal fallback | API'deki `media.preview_url` önce denenir, yoksa `speedupImg` fallback |
| **Mutation Component** | Lokal (`assets/items/`) | İsim + rarity eşleşmesi ile lokal resim (API'de görsel URL yok) |
| **Yeni/tanınmayan tipler (ör. `gym_equipment`)** | Kendi CDN'imiz (`rewards/`) → `static.rollercoin.com` | Backend `DownloadProgressionEventImageJob` görseli puzzle ile aynı kuralla (`PuzzleRewardImage`, yol dosya adına çevrilir) indirir; API `cdnImagePath` verir |
| **Power/Battery/XP/Money** | Lokal (`assets/items/` ve `assets/coins/`) | Sabit ikon dosyaları |

**Önemli Notlar:**
- Mystery box ve utility item görselleri API'den dinamik gelir.
- Yeni kutu veya booster eklendiğinde **manuel güncelleme gerekmez**.
- Eğer kullanıcının Ad-blocker eklentisi `static.rollercoin.com` domain'ini engelliyorsa lokal fallback'ler devreye girer.

## Madenci merge bağlantıları

Progression event ödül tablosundaki madencinin görseli ve adı, ayrıca başlıktaki son madenci ödülü, `RewardLink` aracılığıyla `/:lang/merges/miner/:minerSlug` sayfasını yeni sekmede açar (`target="_blank"`, `rel="noopener noreferrer"`). Slug yoksa isim `encodeURIComponent` ile kullanılır. `MergeMinerLevelsPage` `/api/Merges/get-by-miner-slug` ile tüm seviyeleri çeker; eski isimli linkler slug'lı adrese yönlenir. Diğer ödül tipleri bağlantıya çevrilmez. Hem güncel hem geçmiş event detayları aynı bileşeni kullanır.

## Link önizlemesi (Discord, X vb.)

`/:lang/event` ve `/:lang/puzzle` (slug'sız) nginx'te backend'e (`/api/Seo/latest/{lang}/{event|puzzle}`) sorulur ve son event/puzzle'ın slug'lı adresine gerçek bir 302 ile yönlenir. SPA kabuğu ana sayfanın başlığını taşıdığı için bu adresler aksi halde aramada ana sayfanın kopyası gibi görünüyordu. Backend 404 dönerse veya erişilemezse SPA eskisi gibi açılır.

Önizleme botları JS çalıştırmaz. `nginx.conf`, `/:lang/event/:slug` isteklerinde blog ile aynı SSI kuralıyla `<head>` etiketlerini backend'den (`/api/Seo/head/{lang}/event/{slug}`) gömer. `og:image`, `/api/Seo/event-image/{lang}/{slug}.png` adresidir: backend (`ProgressionEventShareImageRenderer`, SkiaSharp) son 6 ödülü sitedeki tablo düzeninde, dile göre başlıklarla 1200×630 PNG olarak çizer. Saklama `ProgressionEventShareImageService`'tedir: görsel ilk istekte çizilip `cdn/pe/{id}/share-{lang}.png` olarak kaydedilir, sonraki istekler diskten verilir; PE'nin ödülleri değişince `CreateProgressionEventCommandHandler` servisin `Delete` metoduyla bu dosyaları siler. Görseldeki etiketler frontend locale'lerinden (`event.headers.*`, `event.rewardTypes.*`) kopyalanmıştır; bu anahtarlar değişirse renderer'daki sözlük de güncellenmelidir. Önizleme açıklaması da öyle: `event.seoDescription` değişirse backend'deki `SeoController.EventDescriptions` da aynı metinle güncellenmelidir (`{{name}}` → `{0}`).
