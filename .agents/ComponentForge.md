# Component Forge (Parça Birleştirme) Mantığı

Bu belge `ComponentForgeCalculator.tsx` içindeki parça birleştirme simülasyonunun nasıl çalıştığını açıklar.

## Temel Mantık
Sistem, kullanıcının elindeki başlangıç parçalarını (raw materials) **bedava/zaten elde edilmiş** olarak kabul eder. Bu yüzden kâr hesaplaması şu formülle yapılır:
**Net Kâr = Üretilen Yeni Parçaların Pazar Değeri - Toplam Forge (İşçilik) Ücreti**
*(Başlangıç parçalarının maliyeti hesaplamaya dahil edilmez).*

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
Sistem son aşamada elde edilen parçaların pazar fiyatını (`totalMarketValue`) hesaplar ve bundan yukarıda ödenen toplam RLT ücretini (`totalForgeFees`) çıkararak Net Kâr/Zarar sonucunu bulur.
