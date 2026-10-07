# Simülatör başlangıçları

Oda ve güç simülatörü sekmeleri kullanıcı adı veya kazanç sonucu olmadan da açılabilir.

## Oda simülatörü

- `RoomPowerSimulator.tsx`, hesap verileri ile boş hesap için ayrı oda state'leri tutar. Kullanıcı verisi yoksa boş hesap açılır.
- **Sıfır oda oluştur** düğmesi, raf ve madencisi olmayan tek bir ilk oda oluşturur. Önceki boş hesap düzenini ve geri alma geçmişini sıfırlar; getirilen hesap odasını değiştirmez.
- **Hesap verileri** düğmesi, yüklenmiş hesabın oda düzenine döner.
- Boş hesapta geçici güç, oyun gücü ve hesap bonusları kullanılmaz. Toplam güç `calculateExactRoomPower` sonucudur.
- Raf/madenci kataloğu herkese açıktır; kullanıcı ID'si gerekmez. Katalog ilk kez oda sekmesi açılınca yüklenir.
- Mobilde mevcut rafların ardından sıradaki en fazla iki boş raf konumu, dokunulabilir `Raf Ekle` alanları olarak gösterilir. Dolu odada bu alanlar gizlenir. Ana `Raf Ekle` düğmesi metinlidir; mobilde aksiyonların başında tam genişlikte görünür.
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
