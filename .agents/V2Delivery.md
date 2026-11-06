# V2 — Ön yüz teslim notları

## Tamamlanan ayrım
- /tr/v2: mevcut Veri Girişi & Ayarlar ve hesaplama sonuçları korunur. Sonuçlardan sonra altı hizmet kartı ve mevcut araçlara bağlantılar vardır. Sponsor/yayıncı profilleri burada listelenmez; Sponsor Merkezi ve Club ayrı yönlendirme kartlarıdır.
- /tr/v2/sponsor-merkezi: sponsor carousel, resmî sponsor listesi, platform filtresi (YouTube/Telegram/TikTok), boş yayıncı alanları, üç tanıtım kategorisi ve mevcut iletişim adresiyle başvuru alanı. Ücret veya hayalî yayıncı eklenmedi.
- /tr/v2/club: siyah-altın tema, SVG altın taç, mevcut site hesabına giriş/kayıt, beş planlanan modül ve gerçek veri içermeyen açık etiketli profil kartı tasarım önizlemesi.

## Kapsam
Aşama 1 arayüzü hazırdır. Club XP/rozet/kimlik kartı koleksiyon motoru, yarışma, PASS görev/ödül sistemi veya lonca işlevi eklenmedi. Normal hesaplama/craft/market API matematiği bu çalışmada değiştirilmedi. Mevcut logo üstte ilk öğe olarak korundu.

## Mevcut hizmetler ve planlananlar
Günlük/haftalık/aylık kazanç ve güç simülatörü mevcut hesaplayıcıya yönlenir. Yıllık projeksiyon mevcut özel dönem alanının 365 gün kullanımına dayanır. Bağımsız miner karşılaştırma ve ilk 10 oyuncu sıralaması Planlandı olarak açıkça etiketlidir; çalışan veri veya sonuç uydurulmadı.

## Arkadaşa/backend geliştiricisine kalanlar
Kullanıcı backend işini arkadaşına PR sonrası bırakmayı onayladı. ClubBackendContract.md ve Club.md izlenecek. Mevcut kimlik sağlayıcıyla /api/Club/me, ORM migration, benzersiz username indeksi, sahiplik/yetki/XP kuralları, rate limit, CSRF ve gerçek veri silme politikaları uygulanıp test edilmeden VITE_CLUB_API_ENABLED açılmamalı. Varsayılan false.

Sponsor yönetimi tarayıcıya özel yerel taslaktır; ortak yayın ve global analitik backend gerektirir. Sponsors.md ölçüm ve görünürlük kurallarını içerir. Ödeme ve admin için yeni giriş sistemi oluşturulmadı.

## Dosyalar
src/HomeV2.tsx; src/components/V2HomeServices.tsx/.css; src/components/SponsorShowcase.tsx/.css; src/features/club/ClubPage.tsx/.css. Backend sözleşmeleri .agents altında.

## Doğrulama
TypeScript, hedef ESLint, check-club.ts ve check-sponsors.ts geçti. Üretim derlemesi ve PWA üretimi geçti. Tarayıcıda: bir adet mevcut giriş paneli, altı hizmet kartı, ana sayfada yayıncı kartı olmaması, logo sırası; Sponsor Merkezi geçişi ve Telegram filtresi; Club yolu, beş modül, açılır önizleme; dar 319px ekranda yatay taşma olmaması doğrulandı. Gerçek hesapla giriş/kayıt/Club kayıt testleri yapılmadı; backend ve test hesabı yok. Bu eksiklerin tamamlandığı iddia edilmez.

Düzeltme: Ana sayfaya sonuçlar altındaki resmî sponsor carousel geri eklendi; yayıncı rehberi/başvurular Sponsor Merkezi'nde kalır. Üst sağa MemberMenu eklendi: mevcut oturumla Club, giriş/kayıt veya üye bağlantıları ve çıkış; admin sponsor linki yalnızca mevcut admin rolünde. Profil API kapalıyken hayalî ad/avatar/XP gösterilmez. Profil servisi açıldığında kimlik eşleştirilmiş görünen ad/avatar kullanılır. Mobilde menü görünür; Escape ve dış tıklama ile kapanır. TypeScript/ESLint geçti; ziyaretçi menüsü ve sponsor görünürlüğü tarayıcıda doğrulandı.

Son görsel düzenleme: V2 veri giriş paneli okunurluk için bordo cam yüzeyler ve mat altın kenarlarla güncellendi, işlevler korunur. Ana sayfa sponsor carousel'i compact varyantla tek şerit görünümüne küçültüldü; Sponsor Merkezi tam görünümü korur. MemberMenu yalnız geliştirme ortamında ANGARALI adlı açıkça Önizleme etiketli tasarım moduyla başlar; AuthContext, JWT ve roller değiştirilmez. Gerçek oturum varsa gerçek kullanıcı önceliklidir. Önizlemeden çık ve Şifremi unuttum bağlantıları vardır. Bu önizleme üretim build'inde varsayılan çalışmaz. Tarayıcıda misafir yetkileri korunuyor (admin linki yok), mevcut form tek, compact sponsor mevcut, dar ekranda yatay taşma yok. TypeScript/ESLint, sponsor ve Club testleri geçti.

Ana sayfa Gold sponsor şeridinin hemen altına Sponsorluk ve Reklam İş Birliği çağrısı eklendi. Üst masaüstü ve mobil menüde Sponsorluk mevcut /:lang/v2/sponsor-merkezi#sponsor-packages-title hedefine bağlandı. Paket butonu aynı başlığa, yayıncı katılım butonu mevcut #basvuru alanına gider. Yeni route/sayfa oluşturulmadı. Admin/auth/veri giriş mantığı değiştirilmedi. TypeScript/ESLint geçti; iki buton tarayıcıda doğru mevcut hedeflere yönlendi.
