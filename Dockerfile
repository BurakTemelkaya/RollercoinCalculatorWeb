# 1. Aşama: Build ve Prerender
# Puppeteer desteği için 'slim' imajına geçtik
FROM node:20-slim AS build

# Puppeteer (Chrome) için gerekli Linux bağımlılıklarını kuruyoruz
RUN apt-get update && apt-get install -y \
    wget gnupg ca-certificates procps libxss1 \
    libatk1.0-0 libnss3 libasound2 libgbm-dev libpangocairo-1.0-0 \
    libgtk-3-0 libx11-xcb1 libxcomposite1 libxcursor1 libxdamage1 \
    libxi6 libxtst6 libnss3 libcups2 libxrandr2 libpango-1.0-0 \
    --no-install-recommends && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# 1. API URL'ini yazıyoruz
RUN echo "VITE_API_URL=https://api.rollercoincalculator.app" > .env.production

# 2. Versiyonu güncelle (App.tsx ve sw.js değişir) - Build'den önce olmalı!
RUN node scripts/bump-version.js

# 3. Projeyi derle
RUN npm run build

# 4. Sayfaları Pre-render et (Puppeteer burada devreye girer)
# Not: Scriptin dist klasörünü kullandığı için build'den sonra çalışmalı.
RUN node scripts/prerender.mjs

# 2. Aşama: Nginx (Burada Alpine kullanmaya devam edebiliriz, hafif olması için)
FROM nginx:stable-alpine

RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/

# Prerender edilmiş dosyaların olduğu dist klasörünü kopyalıyoruz
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]