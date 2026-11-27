
## Club Aşama 1 — 2026-11-04

V2 yolu: /tr/v2/club. ANGARALI TOOLS marka metni ROLLERCOIN TOPLULUĞU olarak değiştirildi. Mevcut tek AuthContext ve giriş/kayıt sayfaları kullanılır. Club linkleri güvenli allow-list dönüş adresi taşır; diğer girişlerin ana sayfaya dönüş davranışı korunur.

Dosyalar:
- src/features/club/model.ts: profil tipi, sadece düzenlenebilir alanlar, beş modül tanımı, doğrulama ve güvenli dönüş adresi.
- src/features/club/api.ts: mevcut API istemcisi ve bearer oturumuyla /api/Club/me için hazırlanan bağlantı katmanı; varsayılan kapalı feature flag.
- src/features/club/ClubPage.tsx / ClubPage.css: tanıtım, mevcut giriş/kayıt bağlantıları, oturumlu üye alanı, profil formu, görünürlük, rozet/XP gösterimi ve profil silme onayı.
- src/HomeV2.tsx: Sponsor Merkezi yanında Club, mobil menüde Club; logo yine ilk sırada.
- src/App.tsx: sadece yeni Club route eklendi.
- src/components/auth/LoginPage.tsx / RegisterPage.tsx: güvenli Club dönüş bağlantısı; yeni giriş sistemi kurulmadı.
- .env.example: backend bağlanana kadar false olan VITE_CLUB_API_ENABLED.
- scripts/check-club.ts: doğrulama, ayrıcalıklı alanları gönderimden çıkarma ve redirect kontrolleri.

Backend kaynağı bulunmadı: .NET projesi, DbContext, migration geçmişi veya veritabanı sağlayıcısı bu çalışma alanında yok. Migration uygulanmadı. ClubBackendContract.md gerekli migration yapısını, ortak kullanıcı kimliğini, DB benzersizlik kuralını, server-side yetkilendirme/rate limit/CSRF gereksinimlerini ve silme sözleşmesini tarif eder. Bu belge çalışan backend yerine geçmez.

Doğrulama:
- TypeScript ve değişen Club/auth/V2 dosyalarında ESLint geçti.
- Model, kullanıcı adı/avatar doğrulaması, XP/rol/kimlik alanlarının API gövdesinden çıkarılması, açık yönlendirme engeli ve beş modül testleri geçti.
- Tarayıcı: Club route, giriş bağlantısı, kayıt bağlantısı ve dönüş parametrelerinin korunması geçti. Kayıt sayfası başlığı Hesap Oluştur olarak doğrulandı.
- Mobil 390px: Club menüde görünür, Escape ile kapanır, yatay taşma yok, beş kart mevcut.
- Gerçek kayıt/giriş/çıkış, profili sunucuya kaydetme/silme, DB benzersizlik ve iki kullanıcı arası yetki testleri yapılmadı: backend kaynağı ve yetkili test hesabı yok. Test için sahte oturum veya kullanıcı üretilmedi.
- Aşama 2–6 işlevleri eklenmedi; yalnızca modül kartları bulunur.

V2 ön yüz ayrımı tamamlandı: ana hizmetler ana sayfada, yayıncı kartları Sponsor Merkezi'nde. Club siyah-altın görünüme ve açık etiketli veri içermeyen profil kartı tasarım önizlemesine sahip. Backend işini arkadaşın tamamlayacağı onaylandı; sözleşme ve migration planı korunur. Güncel teslim bilgisi: V2Delivery.md.
