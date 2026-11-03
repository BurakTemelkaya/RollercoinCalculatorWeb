# Component Forge (Parça Birleştirme) Mantığı

Bu belge `ComponentForgeCalculator.tsx` içindeki parça birleştirme simülasyonunun nasıl çalıştığını açıklar.

## Temel Mantık
Başlangıç parçalarının maliyeti seçilen yönteme göre hesaplanır: pazardan alırken liste fiyatı, eldeki parçalar ücretsiz sayılır, özel maliyette girilen toplam tutar kullanılır. Net kâr satış gelirinden %5 pazar komisyonu, forge ücretleri ve başlangıç maliyeti çıkarılarak bulunur.

## Hesaplama Adımları

### 1. Reçeteler ve Temel Ücretler (`FORGE_RECIPES`)
Oyunun sabit kurallarıdır.
Örnek (Fan):
- 0'dan 1'e (Common -> Uncommon): 50 parça gerekir, ücret 0.002 RLT.
- 1'den 2'ye (Uncommon -> Rare): 20 parça gerekir, ücret 0.05 RLT.

### 2. Forge Seviyesi İndirimleri (`FORGE_DISCOUNTS`)
Kullanıcının seviyesine göre **hem gereken parça sayısına hem de ücretine** indirim uygulanır:
- Seviye 1: %0
- Seviye 2: %5
- Seviye 3: %10
- Seviye 4: %15
- Seviye 5: %25

### 3. İleri Doğru Simülasyon (`calculateForgeForward`)
Girdiğimiz başlangıç parça sayısı hedefe kadar zincirleme olarak çevrilir:
1. O anki indirimli parça ihtiyacı bulunur.
2. Eldeki parça ihtiyaca bölünerek alta yuvarlanır (`Math.floor`). Artan parçalar kenara ayrılır.
3. Çıkan sayı (yeni parçalar) ile indirimli ücret çarpılarak RLT maliyetine eklenir.
4. Çıkan yeni parçalar bir sonraki seviyenin başlangıç parçası olarak kabul edilir ve işlem hedefe ulaşana kadar tekrar eder.

### 4. Pazar Karşılaştırması
Satış geliri, parçanın pazar liste fiyatından %5 marketplace komisyonu düşülerek hesaplanır (`totalMarketValue`). Bu tutardan toplam RLT forge ücreti (`totalForgeFees`) ve seçiliyse başlangıç maliyeti çıkarılarak Net Kâr/Zarar bulunur. Başlangıç parçalarını pazardan alma maliyeti brüt liste fiyatıdır.

Kâr eşiği, mevcut parça sayısından başlayarak hedef üretim miktarının tam kaynak parça katlarında aranır. Komisyon sonrası birim satış geliri forge ücreti ve kaynak parça maliyetini karşılıyorsa en yakın kârlı kat gösterilir; kâr mümkün değilse ek mesaj gösterilmez. Özel maliyet, mevcut kaynak parçaların birim ortalama maliyeti olarak değerlendirilir.

Hedeflenen Parça seçicisi, seçilen çıktı nadirliğine ulaşmak için gereken kaynak parça sayısını Forge seviyesi ve başlangıç nadirliğine göre gösterir.

Hedeflenen parça adedi girildiğinde başlangıç parça sayısı, seçili hedefe gereken kaynak parça adedine otomatik ayarlanır. Bu kaynak adedi ve toplam üretim maliyeti hedeflenen miktarla ölçeklenir.
