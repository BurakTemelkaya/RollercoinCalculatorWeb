# Simülatör başlangıçları

Oda ve güç simülatörü sekmeleri kullanıcı adı veya kazanç sonucu olmadan da açılabilir.

## Oda simülatörü

- `RoomPowerSimulator.tsx`, hesap verileri ile boş hesap için ayrı oda state'leri tutar. Kullanıcı verisi yoksa boş hesap açılır.
- **Sıfır oda oluştur** düğmesi, raf ve madencisi olmayan tek bir ilk oda oluşturur. Önceki boş hesap düzenini ve geri alma geçmişini sıfırlar; getirilen hesap odasını değiştirmez.
- **Hesap verileri** düğmesi, yüklenmiş hesabın oda düzenine döner.
- Boş hesapta geçici güç, oyun gücü ve hesap bonusları kullanılmaz. Toplam güç `calculateExactRoomPower` sonucudur.
- Oda rafları, minerlar ve yerleştirme hedefleri aynı grid dönüşümüyle %10 küçültülür (`ROOM_RACK_SCALE = 0.9`). Masaüstünde ekrana sığdırma ölçeği bu katsayıyla çarpılır; mobilde gridin gerçek yüksekliği ve genişliği %90 ölçeğine göre ayrılır. Üst boşluk masaüstünde 24 px, mobilde 20 px olur. Seviye 0 odasının iki raf satırı, ortak oda alanında dikey ortalanır; yatay merkezleme tüm odalarda korunur. Masaüstünde tüm odalar için aynı sekiz sütun ve üç satırlık alan ayrılır; ilk odadan diğerlerine geçişte genişlik/yükseklik değişmez. İlk odanın gerçek raf kapasitesi iki satır olarak korunur. Kontroller ve katalog kartları aynı boyutta kalır.
- Raf/madenci kataloğu herkese açıktır; kullanıcı ID'si gerekmez. Katalog ilk kez oda sekmesi açılınca yüklenir.
- Mobilde mevcut rafların ardından sıradaki en fazla iki boş raf konumu, dokunulabilir `Raf Ekle` alanları olarak gösterilir. Dolu odada bu alanlar gizlenir. Ana `Raf Ekle` düğmesi metinlidir; mobilde aksiyonların başında tam genişlikte görünür.
- Masaüstünde açılan istatistik bölümünde sütunlar eşit genişliktedir; başlık, yüzde ve güç değerleri kendi sütunlarının ortasına hizalanır.
- İstatistikte `simulator.minerBonus` etiketi kullanılır. Değer, yerleştirilmiş benzersiz madenci modellerinin bonus toplamıdır; hesaplama değişmemiştir.
- Oda raf bonusu yüzdesinin yanındaki `?`, fare veya klavye odağıyla `simulator.rackBonusExplanation` açıklamasını gösterir. Yüzde = odanın toplam raf bonus gücü / toplam ham madenci gücü × 100; boş raflar sonucu etkilemez. Açıklama desteklenen 10 dilde çevrilmiştir.

## Güç simülatörü

`ManualSimulator.tsx` üç başlangıç sunar: hesap verileri, sıfır güç veya girilen madenci gücü. Kullanıcı verisi yoksa sıfır güç seçilir; hesap seçimi devre dışıdır.

Girilen güç bonuslar hariç madenci gücüdür. Birim seçimi ile Gh/s değerine çevrilir; madenci bonusu ayrı yüzde alanından alınır. Hesap dışındaki başlangıçlarda geçici/oyun/raf gücü sıfırdır.

`src/utils/simulatorBaseline.ts` bağımsız başlangıçları ve manuel eklemelerin hesaplamasını sağlar. Mevcut API bonusları yüzde puanı olarak tutulur (`1000 = %10`), kullanıcı girişleri normal yüzde değeridir (`10 = %10`). Yeni raf bonusu, eklenen madenci gücüne uygulanarak toplam ve lig gücüne dahil edilir.

## Kontroller

```bash
npx tsx scripts/check-simulator-baselines.ts
npm run build
node scripts/check-simulator-starts.mjs
```

Tarayıcı kontrolü derlenmiş uygulamada sahte katalog/hesap verisi kullanır; gerçek hesaba yazmaz. Boş oda, raf/madenci ekleme, sıfırlama, hesap verisine dönüş ve güç başlangıçları kontrol edilir. Yeni metinler desteklenen 10 dilde bulunmalıdır.

## Set raflarına madenci ekleme

- Set rafının düzenleme penceresi, `RackSetMinerPicker.tsx` ile set madencilerini hazır listeler. İsim filtresi istemci tarafında çalışır; `+` seçilen rafın ilk uygun hücresine ekler. Raf doluysa mevcut yerleştirme kontrolü eklemeyi reddeder. Ekli modellerde raftan bir kopya kaldıran × düğmesi gösterilir; kopya eklemeye izin verilir. “Bütün minerları set minerlarıyla değiştir” düğmesi isim filtresinden bağımsız olarak tüm setin gerçek katalog bilgilerini çözer ve seçilen raftaki minerları her set modelinden birer adetle tek state değişikliğinde değiştirir. İki hücreli minerlar önce yerleştirilir. Set rafa sığmazsa veya katalog çözümlemesi başarısızsa mevcut düzen korunur. Diğer raflar değişmez; işlem mevcut geri alma geçmişine eklenir ve bonuslar yeniden hesaplanır.
- `src/utils/rackSetCatalog.ts`, raf kimliğiyle dinamik seti bulur; API seti yoksa yerel `SETS_DATA` kullanılır. Yeni setlerin `is_in_set` bayrağı da bu eşleştirmeyle belirlenir.
- Backend `GET /api/Rack/get-set-rack-list` yanıtındaki `rackSetItems[].miner`, nullable `MinerDto` içerir. Set, raf, seviye ve madenci detayları `ProjectTo` ve `AsSingleQuery` ile tek SQL sorgusunda alınır. `RackSetItem.Miner` ve `Miner.RackSetItems` navigation ilişkisi `MinerId` üzerinden kurulur. MinerId `varchar(24)` olarak yapılandırılır; foreign key silme davranışı `Restrict`tir. Soft-delete filtresi nedeniyle silinmiş minerlara ait set öğeleri yanıtta gösterilmez. `AddRackSetItemMinerRelation` migrationı kolon tipini, indeksi ve foreign keyi ekler; mevcut kimlikler kullanılır. Set taraması madenci taramasından önce çalıştığı için yeni setlerin tüm MinerId kayıtları bulunmadan raf kaydı eklenmez; sonraki taramada tekrar denenir. Soft-delete edilmiş madenciler foreign key kontrolünü karşılar. Import sırası `CreateRackSetScheduledCommandHandlerTests` ile doğrulanır. Migration canlı veritabanında ayrıca uygulanmalıdır; mevcut RackSetItems kayıtlarının Miners tablosunda karşılığı bulunmalıdır. Endpointin mevcut `SetRackListLimit` rate limit politikası korunur; yeni endpoint yoktur.
- Eski API yanıtı veya yerel katalog boyut bilgisini içermiyorsa, ekleme sırasında mevcut `/api/Miner` isim aramasıyla gerçek katalog kaydı çözülür. Yeni setlerde yalnızca dosya adı varsa isim filtresi kullanılmadan katalog sayfaları taranır; eşleştirme madenci ID'siyle yapılır, aynı dosya adındaki başka seviyeye geçilmez. Genişlik tahmin edilmez; bulunamazsa kullanıcıya hata gösterilir. Çözülen kayıt pencere boyunca saklanır.
- Yeni arayüz metinleri desteklenen 10 dilde bulunur.
- Doğrulama: `npm run build` ardından `node scripts/check-set-miners.mjs`. Sahte API verisiyle masaüstü/mobil isim filtresi, ekleme, kopyalar, dolu raf, set bonus yüzdesi/gücü ve toplam güç, set minerı kaldırma, filtre açıkken toplu değiştirme, kapasite/katalog hatasında mevcut düzeni koruma, diğer rafları koruma, oda geçişlerinde sabit genişlik (masaüstünde sabit yükseklik de) ve event merge bağlantıları kontrol edilir.
- Backend doğrulaması: `dotnet test tests/RollercoinScraper.Persistence.Tests/RollercoinScraper.Persistence.Tests.csproj`. SQL Server çevirisi ve tek komut kontrolü veritabanı bağlantısı açmadan interceptor ile doğrulanır; EF InMemory testi DTO alanlarını, boş setleri, navigation eşleştirmesini ve soft-delete filtrelerini kontrol eder; model testi foreign key özelliklerini doğrular. Migration SQL üretimi ve snapshot/model uyumu da veritabanı bağlantısı olmadan kontrol edilir.
- Set rafı simgesi: Kullanıcının sağladığı PNG `src/assets/items/set-rack.png` olarak aynen saklanır. `getRackSetName`, dinamik set verisindeki raf kimliğiyle eşleştirir; gerektiğinde yerel katalogdan raf kimliği/ismiyle çözümler. Masaüstü ve mobil raf seçim kartlarında isim yanında, odadaki set raflarının sağ üst dışına (top: -20px, right: -20px) yerleştirilir. Oda simgesi 24×18 px, seçim simgesi 20×15 px boyutundadır; oda simgesi yerleştirme ve tıklama hedeflerini engellemez. Seti olmayan raflarda simge gösterilmez; açıklama desteklenen 10 dilde çevrilmiştir.
