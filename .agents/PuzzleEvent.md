# Puzzle Event

Rollercoin'in "puzzle" (API'de `spin_event`) etkinliği: görevler çevirme hakkı verir, her çevirme tahtadan rastgele bir ödül açar, toplanan parçalar seviye ödüllerini açar.

## Frontend

- Sayfa: `/:lang/puzzle/:puzzleSlug` → `components/PuzzleEvent.tsx` (+ `.css`). `/:lang/puzzle` en son event'i yükler ve onun kalıcı slug adresine yönlendirir (progression event'teki `/event` → `/event/{slug}` ile aynı). Geçmiş puzzle event'ler ayrı bir sayfada değil, Etkinlikler sayfasındaki (`/:lang/events`) "Puzzle Event" sekmesinde listelenir (`?type=puzzle`); `ProgressionEventHistory.tsx` iki listeyi de aynı kartlarla gösterir, veri `GET /api/PuzzleEvents/GetList` ucundan gelir (satır alanları progression listesiyle aynı, ek olarak `headerImg`).
- Veri: `services/puzzleEventApi.ts` → `GET /api/PuzzleEvents` (en son; event yoksa `id: null`) ve `GET /api/PuzzleEvents/GetBySlug?slug=` (slug ya da id; bulunamazsa hata).
- Ödül görselleri ve etiketleri progression event ile ortaktır: `PuzzleEvent.tsx` ödülü `ProgressionReward` şekline çevirir ve `ProgressionEvent.tsx` içinden dışa aktarılan `RewardTile` bileşenini kullanır. Yeni ödül tipi eklenecekse `getRewardDisplay` güncellenir, iki sayfa da etkilenir.
- Banner, tahta arka planı ve parça ikonu doğrudan `static.rollercoin.com` adresinden yüklenir (backend URL'leri saklar, kopyalamaz).
- Görevler tipe göre gruplanır (`buy_rlt`, `games`, `open_particular_lootbox`; başlıklar `puzzle.taskGroups.*`). Rollercoin yeni bir görev tipi eklerse "Diğer" grubuna düşer; kendi grubu olsun istenirse `TASK_ICONS` ve çeviri anahtarı eklenir.
- Tahta sütun sayısı API'deki `cols` değerinden, geniş kutular ödülün `cells` değerinden gelir.
- Üst menüdeki Puzzle linki puzzle listesini açar (`/:lang/events?type=puzzle`, en yeni event en başta); "Etkinlikler" linkinin progression listesini açmasıyla aynı. Listedeki üst buton `useLatestPuzzlePath` ile doğrudan son event'in slug adresine gider.
- Sayfa `.app` ile aynı 1200 px sınırını kullanır; daha geniş olursa sabit yan reklamların altında kalır. 860 px altında tek sütuna düşer ve ödül tahtası görev listesinin üstüne geçer; 480 px altında kutucuklar küçülür.
- "Bildirim al" linki, giriş yapmış ve Puzzle bildirimini (e-posta ya da push) zaten açmış kullanıcıya gösterilmez.
- Çeviriler: `puzzle.*` ve `settings.puzzleEvent*` anahtarları (10 dil).

## Backend (RollerCoinScraperApi)

- Puzzle, progression event'ten bağımsızdır (biri yokken diğeri olabilir). Kendi job'ı `RollercoinPuzzleEventJob` her saat 2 geçe `CreatePuzzleEventCommand` çalıştırır. Rollercoin uçları:
  - `events/spin-event/config` — id, başlık, tarihler, görseller, `cols`
  - `events/spin-event/progress` — ödül tahtası
  - `events/spin-event/tasks-list` — görevler (`data.tasks`)
  - `progression-event/progression-event?type=spin_event` — seviye ödülleri (base64; Rollercoin puzzle'ın seviye şeridini bu uçtan verir, bizim progression event kaydımızla ilgisi yoktur)
- Tablolar (progression event ile aynı düzen):
  - `PuzzleEvents` — `Id` = spin event id, `Slug` (addan bir kez üretilir, tekrar eden adlara `-2`, `-3` eklenir, sonradan değişmez), ad, tarihler, `Cols`, görsel URL'leri
  - `PuzzleEventReward` — tahta ve seviye ödülleri tek tabloda; `RequiredLevel` null ise tahta ödülüdür (`Sort`, `Cells`). Madenci ödülleri `MinerId` ile `Miners` tablosuna bağlıdır; eksik madenciler kayıttan önce eklenir.
  - `PuzzleEventLevel` — seviye ve gereken parça sayısı
  - `PuzzleEventTask` — görev başlığı, tipi, hedefi (`Amount`) ve verdiği çevirme (`Spins`)
- Hesaba özel alanlar (`is_claimed`, `progress`) saklanmaz.
- İçerik değiştiyse alt satırlar tümden silinip yeniden yazılır; değişiklik `Signature` karşılaştırmasıyla anlaşılır.
- `GET /api/PuzzleEvents` cache'lidir (`GetPuzzleEventGroup`); saatlik komut cache'i temizler.
- Yeni event ilk kez kaydedildiğinde `PuzzleEventNotificationJob` tetiklenir (Development ortamında tetiklenmez).

## Bildirim

- Tip: `NotificationType.Puzzle`. **Varsayılan kapalıdır**; yalnızca Bildirim Ayarları'ndan e-posta veya web push'u açan kullanıcılara gider.
- Mail şablonu: `Features/PuzzleEvents/MailTemplates/NewPuzzleEventMail.html`; metinler `notifications.*.yaml` içindeki `Puzzle*` anahtarları, dil kullanıcının tercih ettiği dildir.
- Mailde öne çıkan ödül, tahta ve seviye ödülleri içindeki en güçlü madencidir.
- Mail iki parçadır: `NewPuzzleEventMail.html` (kabuk) ve `PuzzleEventMailSection.html` (gövde). Gövdeyi `PuzzleMailSection` doldurur.

### Progression event ile tek mail

İki event'in kayıt zamanları arasındaki fark en fazla 10 dakikaysa (`EventNotificationPairing.Window`) ve kullanıcı ikisinin de e-postasını alıyorsa tek mail gider:

- Birleşik maili **progression** bildirimi gönderir: kendi şablonundaki `{{ExtraSection}}` yerine puzzle gövdesi eklenir, konu `EventsSubject` olur.
- Puzzle job'ı o kullanıcıya ayrıca mail atmaz. Yalnızca puzzle'ı açmış (progression e-postasını kapatmış) kullanıcı tek başına puzzle maili alır.
- Web push birleştirilmez; iki ayrı bildirim gider.
- Kuralın iki tarafta da aynı sonucu vermesi için her iki bildirim job'ı event kaydedildikten 11 dakika sonra çalışır (`EventNotificationPairing.Delay`); böylece karar anında diğer event mutlaka kaydedilmiş olur. Yani progression bildirimi de artık 11 dakika gecikmeli gider.
- Zamanlama Quartz'ın bellek içi deposundadır: bu 11 dakika içinde uygulama yeniden başlarsa o bildirim gönderilmez.

## Yerelde test

Development ortamında zamanlanmış job'lar kayıtlı değildir. `Program.cs` içindeki `else` bloğunda yorum satırı halinde iki blok vardır:

1. `dotnet ef database update --project RollercoinScraper.Persistence --startup-project RollercoinScraper.WebApi` ile tabloları oluştur.
2. "PUZZLE EVENT (local test)" bloğunun yorumunu kaldır ve API'yi `https` profiliyle çalıştır; açılışta puzzle bir kez çekilir. `https://localhost:7080/api/PuzzleEvents` ve `npm run dev` sonrası `/tr/puzzle` ile kontrol et.
3. Maili denemek için yerel hesapta Puzzle bildirimini aç, "PUZZLE NOTIFICATION (local test)" bloğunun da yorumunu kaldır ve yeniden başlat (açılıştan 30 sn sonra gönderir).

Development'ta Rollercoin istekleri `appsettings.Development.json` içindeki proxy üzerinden gider ve geçerli bir Rollercoin oturumu gerekir. Bu blokları commit etmeden önce tekrar yoruma al.

## Ödül görselleri

Madenci, para, güç ve parça dışındaki ödüllerin (utility item, spor aleti, ileride gelecek yeni tipler) görselini backend otomatik olarak kendi CDN'imize kopyalar; yeni bir ödül tipi için kod değişikliği gerekmez.

- Kural tek yerde durur: backend'deki `PuzzleRewardImage`. Kaynak yol ödülün `MediaUrl`'idir; tahta verisinde yolu gelmeyen utility item'lar için `static/img/market/utility_items/{itemId}.gif` kullanılır.
- Kopyanın yeri: utility item'lar `utility_items/{dosya}` (progression event ile ortak klasör), diğer her şey `rewards/{yolun tamamı alt çizgiyle}` (ör. `rewards/gym_equipment_treadmill_preview.gif`; dosya adı tek başına ayırt edici değildir).
- Kopyalama `CreatePuzzleEventCommand` içinde, event aktifken her saatlik turda çağrılır; dosya zaten varsa indirme yapılmaz. Görsel inemezse event yine kaydedilir.
- API ödülde iki alan döner: `imagePath` (bizim CDN'deki yol) ve `mediaUrl` (Rollercoin'deki yol). `RewardTile` önce kendi kopyamızı dener, yüklenemezse Rollercoin'deki asıl görsele düşer. Madenci görselleri `CdnImage` ile aynı şekilde önce kendi CDN'imizden gelir.

### Event'in kendi görselleri

Banner (`HeaderImg`), tahta arka planı (`BackgroundImg`) ve parça ikonu (`RewardIcon`) da aynı adımda kopyalanır: `puzzle/{eventId}/{dosya adı}`.

- Kayıtlı **tüm** puzzle event'ler için her saatlik turda denenir (aktif event olmasa da), böylece biten event'lerin görselleri Rollercoin silmeden bizde kalır.
- API, Rollercoin adreslerinin yanında kopyaların yolunu da döner: `headerImgPath`, `backgroundImgPath`, `rewardIconPath` (liste ucunda `headerImgPath`).
- Sayfa ve Etkinlikler listesindeki kart önce kendi kopyamızı kullanır, yüklenemezse Rollercoin adresine düşer. Tahta arka planı CSS olduğu için iki adres üst üste katman olarak verilir.
- Bildirim maili banner için Rollercoin adresini kullanmaya devam eder.
