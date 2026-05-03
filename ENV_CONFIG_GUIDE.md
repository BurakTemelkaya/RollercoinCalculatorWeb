# Environment Variables Nasıl Kullanılır

## 📝 Hızlı Başlangıç

### API URL'ini Değiştirmek

#### Development (npm run dev):
1. `.env.development` dosyasını açın
2. `VITE_API_URL` değerini değiştirin:
   ```env
   VITE_API_URL=https://localhost:7080
   ```
3. Kaydedin
4. Dev server'ı yeniden başlatın: `npm run dev`

#### Production (npm run build):
1. `.env.production` dosyasını açın
2. `VITE_API_URL` değerini değiştirin:
   ```env
   VITE_API_URL=https://your-production-api.com
   ```
3. Kaydedin
4. Build edin: `npm run build`

### Local Override (Opsiyonel)

Kendi local ayarlarınız için `.env.local` oluşturabilirsiniz:

1. `.env.example` dosyasını kopyalayın
2. `.env.local` olarak kaydedin
3. Kendi URL'inizi yazın

> **Not:** `.env.local` dosyası git'e eklenmez (gitignored)

## 📁 Dosya Öncelikleri

Vite environment dosyalarını şu sırayla yükler:

1. `.env` (her zaman)
2. `.env.local` (git'e eklenmez)
3. `.env.[mode]` (.env.development veya .env.production)
4. `.env.[mode].local` (git'e eklenmez)

## 🔧 Environment Variables

### VITE_API_URL
API sunucunuzun base URL'i

**Örnekler:**
- Development: `https://localhost:7080`
- Production: `https://api.rollercoin.com`
- Custom: `https://192.168.1.100:5000`

### VITE_API_LEAGUE_ENDPOINT
League API endpoint'i (genelde değiştirmenize gerek yok)

**Default:** `/api/League`

### VITE_TURNSTILE_SITE_KEY
Cloudflare Turnstile site key

**Örnekler:**
- Development (test key): `1x00000000000000000000AA`
- Production (site key): `0x4AAAAAADHTNGZVRlejEB_A`

## ⚠️ Önemli Notlar

1. **VITE_ prefix zorunludur!** Vite sadece `VITE_` ile başlayan değişkenleri okur
2. **.env dosyası değiştiğinde dev server'ı yeniden başlatın**
3. **.env.local dosyası git'e eklenmez** - local ayarlarınız için güvenlidir

## 🎯 Örnek Senaryolar

### Senaryo 1: Farklı Backend Port
```env
# .env.development
VITE_API_URL=https://localhost:5001
```

### Senaryo 2: Uzak Sunucu
```env
# .env.development
VITE_API_URL=https://192.168.1.100:7080
```

### Senaryo 3: Production Domain
```env
# .env.production
VITE_API_URL=https://api.yourdomain.com
```

## 🚀 Deployment

1. `.env.production` dosyasını production URL ile güncelleyin
2. `npm run build` çalıştırın
3. `dist` klasörünü sunucunuza deploy edin

Environment variables build sırasında kodun içine gömülür, bu yüzden `.env` dosyalarını deploy etmenize gerek yok!
