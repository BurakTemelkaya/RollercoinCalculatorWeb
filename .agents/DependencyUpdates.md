# npm paket güncellemesi — 7 Ekim 2026

Bu proje npm kullanır. Güncelleme, mevcut ana sürümler içindeki uyumlu sürümlere uygulanmıştır. `package.json` ve `package-lock.json` birlikte güncellenmiş, geçişli bağımlılıklar kendi sürüm aralıkları içinde yenilenmiştir.

## Güncellenen doğrudan paketler

Önce sütunu, işlem öncesindeki kurulu/kilitlenmiş sürümdür; package.json içindeki alt sınırdan farklı olabilir.

| Paket | Önce | Sonra |
| --- | --- | --- |
| @marsidev/react-turnstile | 1.5.1 | 1.6.1 |
| @radix-ui/react-select | 2.2.6 | 2.3.8 |
| i18next | 25.8.4 | 25.10.10 |
| i18next-browser-languagedetector | 8.2.0 | 8.2.1 |
| react | 19.2.4 | 19.3.0 |
| react-dom | 19.2.4 | 19.3.0 |
| react-i18next | 16.5.4 | 16.6.6 |
| react-router-dom | 7.18.1 | 7.18.4 |
| @eslint/js | 9.39.2 | 9.39.5 |
| @types/node | 24.10.12 | 24.19.1 |
| @types/react | 19.2.13 | 19.3.0 |
| @types/react-dom | 19.2.3 | 19.3.0 |
| @vitejs/plugin-react | 5.1.3 | 5.2.0 |
| eslint | 9.39.2 | 9.39.5 |
| puppeteer | 24.42.0 | 24.43.1 |
| tsx | 4.22.0 | 4.23.15 |
| typescript-eslint | 8.54.0 | 8.71.1 |
| vite | 7.3.5 | 7.3.7 |

React ve React DOM aynı sürümde tutulmuştur. react-i18next 16.6.6'nın i18next >=25.10.9 koşulu karşılanmıştır. Turnstile'ın mevcut sabit sürüm politikası korunmuştur.

İncelenen resmi sürüm notları: [React 19.3](https://react.dev/blog/2026/09/09/react-19-3), [Radix sürümleri](https://www.radix-ui.com/primitives/docs/overview/releases), [Vite 7.3.7 değişiklikleri](https://github.com/vitejs/vite/blob/v7.3.7/packages/vite/CHANGELOG.md). Kurulumdaki gerçek sürümler, Node engine ve peer dependency koşulları npm registry üzerinden de kontrol edilmiştir.

## Korunan sürümler ve gerekçeleri

- **eslint-plugin-react-hooks 7.0.1:** 7.1.1 denemesi mevcut kodda lint sonucunu 132 problemden 175 probleme çıkardı. Kapsamlı ve ilgisiz React kod değişikliklerine yol açmamak için 7.0.1 sabitlendi. Bu sabitleme ileride lint borcu giderilirken yeniden değerlendirilmeli.
- **Puppeteer 25:** Node >=22.12 istiyor; Dockerfile `node:20-slim` kullanıyor. 24.43.1 Node >=18 destekliyor. Node/Docker geçişiyle birlikte ele alınmalı.
- **TypeScript 7:** Yeni typescript-eslint 8.71.1'in peer aralığı `>=4.8.4 <6.1.0`; TypeScript 5.9.3 korundu.
- **Vite 8, React plugin 6, PWA plugin 2, ESLint 10, i18next 26/react-i18next 17, Dropzone 20:** Ayrı ana sürüm geçişleri. Mevcut derleyici, lint yapılandırması, servis çalışanı ve editör/yükleme entegrasyonları bu işlemde korunmuştur.
- **globals 17 ve react-refresh lint eklentisi 0.5:** Mevcut lint araç zinciriyle birlikte ayrıca değerlendirilmeli.
- **Quill/react-quill-new:** Registry'deki son sürümler zaten kurulu. npm audit'in önerdiği react-quill-new 3.7.0'a geri dönüş, bir güncelleme olmadığı için uygulanmadı.

## Doğrulama

| Kontrol | Sonuç / kapsanan risk |
| --- | --- |
| `npm ls --depth=0` | Geçti; eksik/geçersiz doğrudan bağımlılık yok |
| `npm ci --dry-run --ignore-scripts` | Geçti; manifest ve kilit dosyası uyumlu |
| `npm run build` | Geçti; TypeScript ve Vite/PWA üretim derlemesi, yeni chunk uyarısı yok |
| Node 20.20.2 ile Vite üretim derlemesi | Geçti; yerel Node 22.22.2 dışında Docker'ın Node ana sürümü de kontrol edildi |
| `node --import tsx scripts/check-simulator-baselines.ts` | Geçti; simülatör hesaplama başlangıçları |
| `node --import tsx scripts/check-league-analysis.ts` | Geçti; lig tespiti, güç sınırları, kazanç ve süre hesapları |
| `node --import tsx scripts/check-price-api.ts` | Geçti; fiyat sağlayıcıları, dönüşüm, fallback ve cache |
| `node --import tsx scripts/check-compact-crypto.ts` | Geçti; küçük değer, yuvarlama, işaret ve gösterim |
| `node scripts/check-simulator-starts.mjs` | Geçti; hesap/sıfırdan/girilen güç, 390px mobil kontroller, raf yerleştirme ve sıfırlama |
| `node scripts/check-filter-sorting.mjs` | Geçti; masaüstü/mobil madenci ve raf, güç simülatörü, merge sıralama, eski API yanıtları, sayfalama ve birim değişimi |
| `node scripts/check-earnings-table.mjs` | Geçti; masaüstü/mobil tablo, sabit başlık, sütunlar, ayarlar ve fiyatlar |
| `node scripts/check-pwa-cache.mjs` | Geçti; ilk yükleme, ihtiyaçta indirilen sayfalar, servis çalışanı güncellemesi ve çevrimdışı JS |
| `node scripts/check-dependency-ui.mjs` | Geçti; grafik çizimi, Radix tıklama/klavye, Türkçe rota/çeviri, Turnstile render/success/unmount, Quill biçimlendirme, dil taslakları ve Dropzone multipart yükleme |
| Node 20.20.2 ile `check-dependency-ui.mjs` | Geçti; Puppeteer ve UI entegrasyonları Node 20'de de çalıştı |
| `npm run lint` | Önce ve sonra aynı: 114 hata, 18 uyarı. Çıktılar boşluklar normalize edilerek karşılaştırıldı; yeni lint problemi yok |

Filtre testinde, önceki etkileşimden kalan 400ms gecikmeli aramanın bir sonraki seçimin isteği sanılmasını önlemek için gözlemden önce ağın sakinleşmesi bekleniyor. İlk yeni isteğin parametreleri ve ekrandaki sonuç yine doğrulanıyor.

Yeni UI entegrasyon testi gerçek API çağrılarını engeller, giriş kimliği ve dosya yüklemesini test verileriyle karşılar. Turnstile sağlayıcısı taklit edilmiştir; canlı Cloudflare doğrulaması ve gerçek sunucuya yazma test edilmemiştir. Tam Linux Docker derlemesi/prerender çalıştırılamadı: yerel Docker Linux motoru kapalıydı. Windows üzerinde Node 20 derlemesi ve tarayıcı testleri bu kontrolün yerine geçen tam bir Linux testi değildir.

## Kalan npm audit bildirimleri

| Denetim | Önce | Sonra |
| --- | --- | --- |
| Tüm bağımlılıklar | 22: 18 high, 2 moderate, 2 low | 10: 8 high, 2 low |
| Üretim bağımlılıkları (`--omit=dev`) | Bu kapsam için başlangıç ölçümü alınmadı | 2 low; high/critical yok |

Kalan 8 high paket bildirimi Puppeteer'ın geliştirme/derleme bağımlılık zincirinde (`extract-zip`, `basic-ftp` ve bunları kullanan paketler). npm'in önerdiği çözüm Puppeteer 25.12.0 ana sürüm geçişidir. Kalan 2 low bildirim Quill ve onu kullanan react-quill-new üzerindedir. Bunlar paket denetimi sonuçlarıdır; uygulamadaki her bildirim için ulaşılabilir bir saldırı yolu doğrulanmış değildir. `npm audit fix --force` uygulanmadı.
