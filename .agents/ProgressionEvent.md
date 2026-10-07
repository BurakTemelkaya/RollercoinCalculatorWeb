# Progression Event Görsel Çözümleme

Progression Event ödüllerinin görselleri şu öncelik sırasına göre çözümlenir:

| Ödül Tipi | Görsel Kaynağı | Açıklama |
|---|---|---|
| **Miner** | `static.rollercoin.com` CDN | `filename` alanından dinamik URL oluşturulur |
| **Rack** | `static.rollercoin.com` CDN | `_id` alanından dinamik URL oluşturulur |
| **Mystery Box** | `static.rollercoin.com` CDN → Lokal fallback | API'deki `media.box_image_url` önce denenir, yoksa `title` eşleşmesiyle lokal resim |
| **Utility Item** | `static.rollercoin.com` CDN → Lokal fallback | API'deki `media.preview_url` önce denenir, yoksa `speedupImg` fallback |
| **Mutation Component** | Lokal (`assets/items/`) | İsim + rarity eşleşmesi ile lokal resim (API'de görsel URL yok) |
| **Power/Battery/XP/Money** | Lokal (`assets/items/` ve `assets/coins/`) | Sabit ikon dosyaları |

**Önemli Notlar:**
- Mystery box ve utility item görselleri API'den dinamik gelir.
- Yeni kutu veya booster eklendiğinde **manuel güncelleme gerekmez**.
- Eğer kullanıcının Ad-blocker eklentisi `static.rollercoin.com` domain'ini engelliyorsa lokal fallback'ler devreye girer.

## Madenci merge bağlantıları

Progression event ödül tablosundaki madencinin görseli ve adı, ayrıca başlıktaki son madenci ödülü, `RewardLink` aracılığıyla `/:lang/merges/miner/:minerName` sayfasını yeni sekmede açar (`target="_blank"`, `rel="noopener noreferrer"`). İsim `encodeURIComponent` ile kodlanır. Mevcut `MergeMinerLevelsPage` ve `/api/Merges/get-by-miner-name` kullanılır; tüm seviyeler varsayılan olarak gösterilir. Diğer ödül tipleri bağlantıya çevrilmez. Hem güncel hem geçmiş event detayları aynı bileşeni kullanır.
