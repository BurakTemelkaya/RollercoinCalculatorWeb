# V2 Sponsor Vitrini — Durum ve doğrulama

## Mimari ve kapsam
React 19 + TypeScript + Vite 7, mevcut vanilla CSS altyapısı kullanıldı. Sponsor bileşenleri V2 sayfasına eklendi. CalculatorArea yalnızca sonuçlardan sonra bir React render alanı kabul eder; mevcut hesaplama ve API işlevleri sponsor sistemine bağımlı değildir.

## Dosyalar
- src/types/sponsor.ts: sponsor ve ölçüm modeli, seviyeler.
- src/utils/sponsorRotation.ts: doğrulama, yayın tarihleri ve ağırlıklı rotasyon.
- src/services/sponsorStore.ts: yerel taslak deposu ve gerçek yerel etkileşim kayıtları.
- src/components/SponsorCarousel.tsx/.css: erişilebilir vitrin, tek aktif slayt, kontroller, görünürlük ve hareket tercihleri.
- src/components/SponsorAdmin.tsx/.css: mevcut yönetici oturumuyla korunan yerel taslak düzenleme.
- src/components/SponsorShowcase.tsx/.css: sponsor merkezi, boş yayıncı kartları ve kategori bağlantıları.
- src/HomeV2.tsx/.css: V2 yerleşimi, kategori menüsü ve V2 ile sınırlı görünüm.
- src/App.tsx: V2 yolları, ProtectedRoute ve sonuç sonrası render alanı.
- scripts/check-sponsors.ts: model, rotasyon ve ölçüm testleri.

## Çalışan özellikler
8 saniyelik otomatik rotasyon; önceki/sonraki, noktalar ve ilerleme; hover, odak, görünürlük ve duraklatma kontrolleri; yatay pointer kaydırma; ok/Home/End klavye erişimi; azaltılmış hareket CSS kuralları; boş/hatalı logo yedekleri; aktif/pasif ve tarih filtreleri; Tüm Sponsorlar listesi. Tek sponsorda kontroller gizlenir. Sadece ANGARALI KRAL gerçek sponsor olarak gelir; bilinmeyen sosyal bağlantılar eklenmedi.

Gold/Premium/Standard varsayılan ağırlıkları 3/2/1. Arka arkaya aynı sponsor seçilmez. İki sponsor varsa bu kural nedeniyle dönüşümlü gösterim ağırlık oranına baskın gelir; çok yüksek tek ağırlık da aynı kuralla sınırlanır.

## Yerel analitik kuralları
En az %50 görünürlük ve görünür sekmede kesintisiz 1 saniye: geçerli gösterim. Sponsor başına aynı sekme oturumunda 30 dakika mükerrer gösterim engeli. Tıklamalar sponsor başına 1 saniye yinelenme filtresinden geçer. Görünür süre gerçekten görünür kaldığı aralıklardan hesaplanır. CTR, yerel tıklama/gösterim oranıdır; sahte istatistik yoktur.

## Testler
- Otomatik testler geçti: boş/tek/pasif/süresi dolmuş/gelecek sponsor, tarih sınırları, URL ve kimlik doğrulama, taslak kaydı, 100 sponsorla 10.000 rotasyon, ardışık tekrar engeli, 3:2:1 sıralaması, yerel metrik mükerrer sayım kuralları.
- Tarayıcıda geçti: tek sponsorda kontrol yok; çoklu sponsorda tek slayt DOM; 100 sponsorda tek slayt + 100 nokta; manuel ve otomatik geçiş; duraklat/devam; klavye okları; boş durum; bozuk logo fallback; tarih/pasif filtresi; Tüm Sponsorlar bağlantısı; logo en başta; yönetici oturumu yokken giriş sayfasına yönlendirme.
- Sponsor test ekranı 390px mobil genişlikte kontrol edildi; yatay taşma yok. Gerçek telefon dokunmatik hareketi ve yetkili yöneticiyle uçtan uca form testi yapılmadı.
- TypeScript ve sponsor dosyalarında ESLint geçti.

## Henüz sunucuya bağlı olmayanlar
Yönetim değişiklikleri yalnızca bu tarayıcıdaki localStorage taslaklarıdır. Diğer ziyaretçilere yayınlanmaz. Analitik yalnızca bu tarayıcıda toplanır; sunucuya gönderilmez. Ortak yayın için mevcut yetkilendirmeyle korunan sponsor CRUD API ve veritabanı, sunucuda doğrulanan roller ve analitik alım/raporlama servisi gerekir. Yeni şifreli giriş, ödeme veya sahte global rapor oluşturulmadı.

## Görsel varlıklar
V2 arka planı src/assets/v2/mining-room-background.png; panel arka planı src/assets/v2/panel-burgundy-gold.png. Bunlar V2 kapsamındadır. Mining-room görseli image_gen ile üretildi; üretim istemi çalışma alanındaki outputs/v2-room-image-prompt.txt dosyasındadır.
