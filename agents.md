# Rollercoin Calculator Web - Proje Rehberi (Index)

## Zorunlu kural: commit öncesi build

GitHub'a commit/push etmeden önce **her zaman `npm run build` çalıştırın** ve başarıyla bittiğini görün. Build başarısızsa commit etmeyin; önce hatayı düzeltin. `tsc --noEmit -p .` yeterli değildir: build'in kullandığı `tsc -b` uygulama kodunu daha sıkı denetler ve Docker/GitHub Actions build'i aynı komutla çalışır.

Projenin genel yapısı ve rehber dokümanları daha kolay yönetim ve yapay zeka entegrasyonu için parçalara ayrılmıştır. Aşağıdaki dosyalara giderek ilgili detayları bulabilirsiniz:

1. **[Proje Genel Yapısı ve Kurulum](file:///.agents/ProjectOverview.md)**
   - Proje Açıklaması
   - Teknoloji Stack'i
   - Çalıştırma Komutları
   - Dizin/Proje Yapısı
   
2. **[Veri Akışı ve Cache Yönetimi](file:///.agents/DataFlow.md)**
   - API ve Manuel Veri Kaynakları
   - Kritik Veri Akışı (Kazanç Hesaplama Adımları)
   - LocalStorage Cache Mekanizması

3. **[Para Birimleri ve Yönetimi](file:///.agents/CurrencyManagement.md)**
   - Desteklenen Kripto Paralar ve Oyun Tokenleri
   - Para Birimi Dönüşümleri (to_small vs.)
   - Blok Süreleri
   - Yeni Para Birimi Ekleme Kontrol Listesi

4. **[Progression Event](file:///.agents/ProgressionEvent.md)**
   - Progression Event ödüllerinin görsel çözümleme mantığı ve fallback mekanizmaları

5. **[Component Forge Hesaplayıcısı](file:///.agents/ComponentForge.md)**
   - Parça birleştirme simülatörünün hesaplama ve kâr mantığı
   - Forge indirimleri ve reçete hesaplamaları

6. **[Hamster Kataloğu](file:///.agents/Hamsters.md)**
   - Hamster verisi, sprite animasyonu ve sefer haritaları
   - Yeni hamster ve harita ekleme adımları
   - **Yeni hamster görsellerini bulma prosedürü (zorunlu):** önce Minaryganar, sonra `scripts/findHamsterSkinFolders.cjs` ile tüm görünüm klasörleri

7. **[Merge Miner Bilgileri](file:///.agents/Merges.md)**
   - Satılabilirlik ve set miner ikonları
   - Ortak backend eşlemeleri ve kontroller

8. **[Puzzle Event](file:///.agents/PuzzleEvent.md)**
   - Puzzle (spin) event sayfası, backend veri akışı ve varsayılanı kapalı bildirim

Yapay zeka asistanları bu index dosyasını kullanarak projenin ilgili bölümleri hakkında daha hızlı ve spesifik bilgi edinebilir.
