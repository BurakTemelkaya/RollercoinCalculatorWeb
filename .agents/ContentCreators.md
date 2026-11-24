# İçerik Üreticileri (Sponsor Yayıncılar)

İçerik üreticileri aylık ücretle sitede sponsor olarak gösterilir. Ödeme kriptoyla, elle kontrol edilerek alınır (TX hash).

## Akış

1. Kullanıcı `/:lang/my-creator` (Kullanıcı Paneli → Yayıncı Paneli) sayfasından başvurur: ad, açıklama, logo linki, kanal linkleri, içerik dilleri.
2. Tüm adminlere bildirim gider (`NotificationType.CreatorApplication`, e-posta + web push, varsayılan açık; admin Bildirim Ayarları'ndan kapatabilir).
3. Admin `/:lang/admin/creators` sayfasından onaylar. İlk onayda **ücretsiz deneme** başlar (gün sayısı admin sayfasındaki "Program ayarları"ndan, varsayılan 7).
4. Yayıncı cüzdanlardan birine öder, panelden coin/ağ/tutar/TX bildirir. Admin ödemeyi kontrol edip "N ay" ile onaylar → bitiş tarihi `30 × N` gün uzar (mevcut bitiş ileride ise ondan itibaren).
5. Admin bir yayıncıyı "Ücretsiz kullansın (süresiz)" yapabilir ya da elle gün ekleyebilir.

Yayında olma: `Status == Approved && (IsComplimentary || ActiveUntil > now)`.

## Tekrar ücretsiz deneme engeli

Kanal linkleri normalize edilir (host'tan `www.`/`m.` atılır, `twitter.com → x.com`, yolun ilk parçası; YouTube `/channel|c|user/X` için iki parça). Yeni başvurunun kanallarından biri **başka bir hesabın** kaydıyla eşleşirse başvuru `Blocked` + `DuplicateOfCreatorId` ile kaydedilir, deneme verilmez, kullanıcıya uyarı gösterilir ve adminlere bildirim gider. Böyle bir kayıt ödeme bildirebilir; admin ödemeyi onaylarsa yalnızca ödenen süre kadar yayına girer. Kendisi mükerrer olan kayıtlar karşılaştırmaya katılmaz (yoksa asıl sahibin düzenlemesini kilitler). Onaylı bir profilin kanalını başka hesabın kanalıyla değiştirme denemesi reddedilir ve adminlere bildirilir.

## Gösterim

- Hesaplayıcının altı: `CreatorSponsors` (en fazla 6 kart).
- `/:lang/creators`: üst menüdeki "Yayıncılar" sekmesi (tüm yayıncılar, dil filtresi, fiyat ve başvuru).
- Progression Event: "Videolar" sekmesi. Puzzle Event: sayfanın en altı. Videoları yayıncı kendi panelinden ekler (etkinlik başına en fazla 3). YouTube linklerinde kapak görseli gösterilir.
- Sıralama: içerik dili site diliyle eşleşenler önce, her grup kendi içinde rastgele (`orderCreatorsForLanguage`).

## Profil sayfası ve canlı yayın

- `/:lang/creators/:slug` (`CreatorProfilePage.tsx`): link yayıncı adından üretilir (`creatorSlug`, "Angaralı" → `angarali`) ve yayındaki yayıncı listesinden kimliğe çözülür (`resolveCreatorId`). Eski kimlikli linkler açılır ve adres isimli hale getirilir. Aynı isimli iki yayıncıda ilki açılır.
- Profil: hesap kartları (logo + kullanıcı adı), canlıysa sayfada gömülü yayın, YouTube kanalının son 12 videosu (`GET /{id}/youtube`, 1 saat önbellek) ve yayıncının etkinlik videoları (etkinlik sayfasına linkli). Videolar önce herkese açık RSS'ten (tarihli), RSS boş/erişilemezse kanalın `/videos` sayfasındaki `lockupViewModel` kartlarından (tarihsiz) okunur; ikisi de boşsa log'a uyarı düşer. İstekler AB izin sayfasına düşmemek için `SOCS=CAI` çerezi taşır.
- Canlı durumu `GET /live-status` (2 dk önbellek, en fazla 6 eşzamanlı istek), API anahtarı gerektirmeyen herkese açık sayfalardan: YouTube `/{kanal}/live` (`isLiveNow` + canonical watch), Twitch kanal sayfası (`isLiveBroadcast`), Kick `api/v2/channels/{slug}` (`livestream`), TikTok `/@kullanici/live` (`liveRoom.status == 2`). TikTok zaman zaman bot doğrulama sayfası döndürür; o zaman canlı görünmez. Instagram ve X canlı bilgisi giriş istemeden alınamaz. Twitch'in iç (web istemcisi) GQL kimliği kullanılmaz.
- Kartlarda canlı yayıncılar öne alınır ve "CANLI" rozeti platform logolarıyla gösterilir; rozete tıklayınca gömülebilen yayın (YouTube, Twitch, Kick kanal oynatıcısı) site içinde açılır.
- Platform logoları `PlatformIcon.tsx` (Simple Icons, CC0).

## İstatistikler (yayıncı paneli)

- `CreatorStatEvent` tablosu: profil görüntülenmesi (`View`) ve link tıklaması (`Click`); hedef (`youTubeUrl`... / `profile` / `video` / `live`), sayfa (dil öneki olmadan; görüntülenmede kaynak: `site`, `direct` ya da dış host), ülke (Cloudflare `CF-IPCountry`), mobil/masaüstü ve `Visitor` (gün + IP + yayıncı HMAC özeti; IP saklanmaz).
- `POST /{id}/track` (anonim). Botlar, bilinmeyen hedefler ve onaysız yayıncılar yazılmaz; aynı ziyaretçinin aynı hedefi 30 dk içinde bir kez sayılır.
- Web: `data-track` işaretli linkler `trackClicksIn` ile (orta tık dahil) yazılır; profil açılışı `trackCreatorView`.
- `GET /me/stats?days=7|28|90|365`: toplamlar + önceki dönem, günlük seri, ülke / tıklanan link / sayfa / profil kaynağı / cihaz kırılımı. Panelde `CreatorStatsPanel` (yalnızca onaylı yayıncı).
- Veri silinmez (saklama süresi yok).
- Admin: `GET /admin/stats?days=&creatorId=` (creatorId yoksa tüm yayıncılar + yayıncı kırılımı; tekil ziyaretçi yayıncı başına sayılıp toplanır). Admin yayıncı sayfası sekmeli: `?tab=` yok → Onay işlemleri, `stats` → İstatistikler, `settings` → Ödeme ayarları (deneme günü, aylık ücret, cüzdanlar).

## Etkinlik videoları

- Yayıncı panelinde etkinlikler en yeniden eskiye sıralı (son 50 progression + 50 puzzle) ve adla aranabilir.
- Başlık, yayıncının içerik dillerinin her biri için ayrı girilir (ilk dil zorunlu); ziyaretçi sitenin dilindeki başlığı, yoksa varsayılanı görür (`videoTitle`). `TitlesJson` saklar.
- "Başlığı getir" (`POST /video-meta`): YouTube (shorts dahil) sayfası `hl` ile her dilde denenir, olmazsa oEmbed; TikTok oEmbed; diğerleri og:title. Platform çeviri vermezse aynı başlık tüm dillere yazılır, yayıncı düzenler. Boş olmayan alanlar ezilmez.
- Kapak: YouTube'da `i.ytimg.com`, diğerlerinde kayıtta og:image (`ThumbnailUrl`, dış adres).
- X (Twitter) postları da eklenebilir: başlık `publish.twitter.com/oembed` post metninden (medya linkleri atılır, metin yoksa "yazar (X)"), kapak `jf.x.com/images/post/{id}.png`. Site içinde `platform.twitter.com/embed/Tweet.html` iframe'iyle açılır; yükseklik X'in `twttr.private.resize` mesajından alınır.
- Site içi oynatma (`VideoPlayer.tsx`, `videoEmbed`): YouTube/Shorts (youtube-nocookie), TikTok, Twitch (klip, kayıtlı video, kanal; `parent` site host'u), Instagram gönderi/reels. Dikey videolar 9:16 açılır. Kick kayıtlı videoları gömülemediği için yeni sekmede açılır. Ctrl/orta tık her zaman yeni sekme.

## Logo

Logo her zaman kendi CDN'imizde durur (`creators/{creatorId}-{ticks}.{ext}`; her kayıt yeni dosya, böylece onay bekleyen logo yayındakinin üzerine yazmaz). Yayıncı logoyu başvuru formunda seçer, kayıtla birlikte gider:

- **Dosya:** PNG/JPG/WEBP/GIF, en fazla 1 MB; tür dosyanın ilk baytlarından anlaşılır. Yeni başvuruda önce kayıt oluşur, logo ardından `POST /me/logo` ile yüklenir.
- **Sosyal medyadan al:** `POST /logo-preview` kanal sayfalarının `og:image` görselini sırayla dener (YouTube, Twitch, Kick, TikTok, Telegram, X, Instagram) ve **kaydetmeden** data URL olarak döndürür; yayıncı görüp onaylarsa kayıtta (`useSocialAvatar`) aynı sırayla alınıp kaydedilir.
- Hiçbiri seçilmezse kayıtta ve kanal linkleri değiştiğinde sosyal medyadan otomatik alınır; elle yüklenen logo (`AvatarUploaded`) otomatik değiştirilmez.
- Formun altında kartın sitedeki hali canlı önizlenir.
- og:image adresi yalnızca https ve IP/localhost olmayan host olabilir. Eski logo dosyaları silinmez.

## Onaylı profilde değişiklik

Onaylı yayıncının isim, açıklama, dil, logo ve link değişiklikleri doğrudan yayına girmez: `PendingChangesJson` içinde tutulur, sitede eski hali görünmeye devam eder (yayından düşmez). Yayıncı beklerken düzenlemeye devam edebilir; değişiklik yayındakiyle aynı hale gelirse bekleyen kayıt kendiliğinden silinir. Adminlere bildirim gider; admin sayfasında yalnızca değişen alanlar eski/yeni yan yana gösterilir, `PUT /admin/{id}/changes` ile onaylanır ya da notla reddedilir (not yayıncı panelinde görünür). Onaylanmamış (bekleyen/reddedilmiş) başvurudaki düzenlemeler doğrudan uygulanır.

## Süre

Deneme ve ödemeler süreyi uzatır: bitiş tarihi ileride ise o tarihten, değilse şimdiden itibaren. Deneme sürerken onaylanan 1 aylık ödeme kalan denemenin üstüne 30 gün ekler.

Hatırlatma: `CreatorExpiryReminderJob` (her saat :45, yalnızca Production) bitişten 2 gün önce "süren bitiyor", bitince (en geç 3 gün içinde) "süren bitti" maili + push gönderir; ücretsiz (complimentary) kayıtlara gitmez. Her bildirim `ExpiryReminderSentFor` / `ExpiredNoticeSentFor` ile bir ActiveUntil için bir kez gider; ödeme onaylanıp süre uzayınca yeniden gönderilir. Metinler `notifications.*.yaml` içindeki `Creator*` anahtarları; mail `EnergyAlertMail.html` şablonunu kullanır.

Admin kararları (`CreatorNotifier`): başvuru onay/red/engel, not ya da süre değişikliği, ödeme onay/red ve profil değişikliği onay/red yayıncıya kendi dilinde mail + push olarak gider; admin notu mailde "Yönetici notu" olarak yer alır. Aynı ayarları değişiklik olmadan kaydetmek mail atmaz. Adminlere giden uyarılar (`AdminAlertService`) da aynı HTML şablonla gönderilir.

## Kapak görseli ve kart tasarımı

- Yayıncı isteğe bağlı bir kapak (arka plan) görseli yükler: `POST /me/cover`, en fazla 2 MB, aynı imza kontrolü; `CoverUrl`. Kaldırmak için kayıtta `removeCover`. Onaylı profilde kapak değişikliği de admin onayına gider (bekleyen değişiklikte eski/yeni yan yana gösterilir).
- Kart (`CreatorCard`): üstte kapak (yoksa site renklerinde degrade, canlıysa kapakta CANLI rozeti), üzerine binen 80 px logo, isim, diller, açıklama, logolu platform butonları ve "Profili gör" satırı. Profil sayfasında kapak 200 px üst alan olur.
- Yayıncılar sayfası: başlık + "Yayıncı ol", arama (ad/açıklama), platform filtresi (yalnızca kullanılan platformlar, canlı varsa "CANLI") ve dil filtresi.
- Migration: `Added_ContentCreator_Cover` (yalnızca `CoverUrl` sütunu).

## Ödeme formu

Coin/ağ, admin'in tanımladığı cüzdanlardan seçilir (yayıncı panelinde) ya da hazır listeden (`COIN_PRESETS`, admin cüzdan ayarı); listede yoksa "Diğer" ile elle girilir. TX hash'leri ağa göre blok gezginine bağlanır (`txExplorerUrl`: Tronscan, BscScan, Etherscan, Polygonscan, Solscan, Tonviewer, mempool.space, Blockchair...); tanınmayan ağda Blockchair araması açılır.

## Backend (RollerCoinScraperApi)

- Tablolar: `ContentCreators`, `CreatorPayments`, `CreatorVideos`, `ContentCreatorSettings` (tek satır, Id = 1; deneme günü, aylık ücret, cüzdanlar JSON). Migration: `Added_ContentCreator_Tables`.
- Kod: `Application/Features/ContentCreators` (`ContentCreatorRules`, `ContentCreatorQueries`, `ContentCreatorCommands`, `CreatorAvatarService`), `WebApi/Controllers/ContentCreatorsController.cs` (`/api/ContentCreators`).
- Herkese açık liste ve event videoları 15 dk mutlak önbellekli (`GetContentCreatorGroup`); her yazma işlemi grubu temizler, süre dolanlar en geç 15 dk içinde düşer.
- Linkler yalnızca http(s) ve ilgili platformun host'u olabilir (`javascript:` vb. reddedilir).
