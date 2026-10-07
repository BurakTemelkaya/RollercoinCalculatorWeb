# Merge miner bilgileri

- Merge listesi, detay penceresi ve miner seviye sayfası `MinerStatusBadges` bileşenini kullanır. Sonuç minerında `resultItemIsCanBeSoldOnMp` / `resultItemIsInSet`, gerekli minerlarda `isCanBeSoldOnMp` / `isInSet` okunur.
- Satılabilir miner mevcut `sellable.svg` ile yeşil; satılamayan miner progression event ile aynı renk filtresiyle kırmızı gösterilir. Set minerında oda simülatöründeki `items/set-rack.png` kullanılır. Set dışı minerda set ikonu bulunmaz; null/eksik veri olumsuz durum sayılmaz.
- Satılabilirlik ikonu görselin sol üst köşesinde, set ikonu sağ alt köşesinde durur. Seviye ikonu ve metin modu sağ üst köşededir. `alt` ve tooltip metinleri desteklenen 10 dile çevrilmiştir. Seviye sayfasının toplam gerekli miner kartları da durumları korur; parçalara miner ikonu eklenmez.
- Backend merge mapping profili `ResultItem` önekini tanır ve `Miner` alanlarını `IncludeMembers` ile düzleştirir. Gerekli miner ve parçalar mevcut DTO üzerine eşlenir; reçetenin `ItemId`, `Type` ve `Count` değerleri korunur. Liste, ID ve miner adına göre sorgular aynı eşlemeyi kullanır.
- Kontrol: `npm run build` ve `node scripts/check-merge-miner-status.mjs`. Backend için `MergeMappingTests` sonuç alanlarını, true/false/null durumlarını ve reçete bilgilerini doğrular.
