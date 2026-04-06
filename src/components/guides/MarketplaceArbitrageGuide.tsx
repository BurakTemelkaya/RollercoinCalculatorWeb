import { useParams, Link } from 'react-router-dom';

import { Helmet } from 'react-helmet-async';

const MarketplaceArbitrageGuideTR = () => {
  const { lang } = useParams<{ lang: string }>();

  return (
    <div className="static-page-container">
      <Helmet>
        <title>Marketplace Arbitrajı: Parça ve Madenci Ticareti ile RLT Kazanın</title>
        <meta name="description" content="RollerCoin Marketplace içinde yapabileceğiniz arbitraj hesaplamaları, Crafting mi Buying mi sorularının cevapları ve Parça ticareti detayları." />
        <link rel="canonical" href={`https://rollercoincalculator.app/${lang}/guides/marketplace-arbitrage`} />
      </Helmet>

      <div className="static-back-link">
        <Link to={`/${lang}/guides`}>← Rehberlere Dön</Link>
      </div>

      <article className="static-content guides-container">
        <h1>Marketplace Arbitrajı - Parça ve Madenci Ticareti ile RLT Katlama</h1>
        <p>RollerCoin'in kendi içindeki Pazar Yeri (Marketplace), adeta minyatür bir kripto borsasıdır. Oyunu hiç oynamadan, saatlerce sadece Market ekranında kalarak binlerce RLT kazanan "Trader" oyuncular bulunmaktadır. İşin sırrı doğru "Arbitraj" (Arbitrage) fırsatlarını yakalamaktır.</p>

        <h2>1. "Parts" (Parça) Borsası Nasıl Çalışır?</h2>
        <p>Oyunda Common (Wire, Fan, Hashboard) ve Uncommon parçaların değeri, oyun içi etkinliklere göre devasa dalgalanmalar gösterir. Oyun eğer yeni bir "Progression Event" (İlerleme Etkinliği) yayınlarsa ve Parça Düşme (Drop Rate) oranlarını artırırsa, marketteki parça arzı (supply) aniden patlar ve fiyatlar dibi görür (Örneğin 0.001 - 0.0015 RLT bandı).</p>
        <p><strong>Alım Stratejisi:</strong> Etkinliğin en verimli (peak) günlerinde, fiyatların dipte olduğu bu dönemlerde piyasadaki ucuz parçaları binlerce adet olarak "süpürün". Etkinlik bittiğinde arz kesilecek, ancak oyuncular cihazlarını "Craft/Merge" (birleştirme) yapmak için acil parçaya ihtiyaç duymaya devam edecek. İşte bu noktada parçaların fiyatı bir haftada 0.004 RLT seviyelerine geri çıkar. Bu, paranızı sıfır riskle %300 katlamanız demektir.</p>

        <h2>2. "Crafting" (Birleştirme) ile Hazır Cihaz Satın Almak Arasındaki Fark</h2>
        <p>Matematik yalan söylemez. Çoğu kez aceleci satıcılar nedeniyle pazar yerinde mantıksız fiyat boşlukları oluşur.</p>
        <p>Diyelim ki bir cihazı 1 Yıldızlı (Uncommon) yapmak istiyorsunuz. Pazar yerinde iki adet "Common" yıldızsız cihaz satın almak ve bunları birleştirmek için harcayacağınız Parça (Parts) maliyeti 40 RLT tutuyor. Ancak aynı Uncommon cihazın o anki pazardaki direkt satış fiyatı 70 RLT. Neden? Çünkü çoğu oyuncu cihazlarını mergelemekle uğraşmak istemez. Cihazları ve parçaları ayrı ayrı ucuza toplayıp Craft'layarak doğrudan pazara "Uncommon" olarak çok daha pahalıya satıp anında 30 RLT arbitraj karı yapabilirsiniz!</p>

        <h2>3. "Panik Satış" Avcılığı (Snipe Tactic)</h2>
        <p>Yeni bir Season Pass çıktığında veya sınırlı "Flash Sale" başladığında birçok oyuncunun hesaplarında bunu alacak kadar yeterli RLT olmaz. Fırsatı kaçırmamak adına en değerli madencilerini anında paraya çevirmek için piyasa değerinin \%30 altına "Acil Satışa" koyarlar.</p>
        <p>Pazar ekranını sık sık yenileyerek listenin en üstüne düşen bu son dakika fırsatlarını mili-saniyeler içinde alan "Sniper"lara dönüşün. Panikle 140 RLT'ye satılan 200 RLT'lik bir madenciyi alıp, sadece 3 gün sonra piyasa sükunet sağladığında asıl fiyatı olan 200 RLT'ye geri satarak oturduğunuz yerden gücünüzü artırabilirsiniz.</p>

        <h2>4. Uzun Vadeli Düşünce</h2>
        <p>Pazar yerindeki komisyon (Fee) oranlarını (\%5 civarı) mutlaka hesaplarınıza dahil edin. Bir eşyayı 100 RLT'ye alıp 103 RLT'ye satarsanız kar etmiş olmaz, komisyondan zarar edersiniz. Satışlarınızı her zaman \%10 ve üstü kar marjlarıyla hesaplamalısınız.</p>
      </article>
    </div>
  );
};

const MarketplaceArbitrageGuideEN = () => {
  const { lang } = useParams<{ lang: string }>();

  return (
    <div className="static-page-container">
      <Helmet>
        <title>Marketplace Arbitrage: Multiplying RLT in RollerCoin</title>
        <meta name="description" content="Learn how to exploit the RollerCoin Marketplace to generate massive profits through Parts trading and Crafting vs. Buying strategies." />
        <link rel="canonical" href={`https://rollercoincalculator.app/${lang}/guides/marketplace-arbitrage`} />
      </Helmet>

      <div className="static-back-link">
        <Link to={`/${lang}/guides`}>← Back to Guides</Link>
      </div>

      <article className="static-content guides-container">
        <h1>Marketplace Arbitrage - Multiplying RLT with Parts Trading</h1>
        <p>The in-game Marketplace of RollerCoin acts as a miniature crypto exchange. There are heavily active "Trader" players who earn thousands of RLTs without ever playing a game, simply by staring at the Market screen looking for discrepancies. The secret is caching the correct "Arbitrage" opportunities.</p>

        <h2>1. How Does the "Parts" Market Work?</h2>
        <p>The values of Common (Wire, Fan, Hashboard) and Uncommon parts in the game show massive fluctuations depending on in-game events. If the game releases a new "Progression Event" and boosts the Drop Rates, the market's part supply skyrockets, and the values hit rock bottom.</p>
        <p><strong>Buying Strategy:</strong> During the peak days of the event, when prices are at their lowest, "sweep" the cheap parts gathering them by the thousands. When the event ends, the free supply will be cut, but players will still desperately need parts to "Craft/Merge" their devices. Price bounces back quickly, granting you a completely risk-free 300% profit.</p>

        <h2>2. Crafting vs. Buying Ready Devices</h2>
        <p>The math never lies. Often, due to hasty sellers, irrational price gaps occur in the marketplace.</p>
        <p>Suppose you want a 1-Star (Uncommon) device. You calculate that buying two base "Common" devices and the necessary Parts to merge them totals 40 RLT. However, the exact Uncommon ready-built device is selling for 70 RLT. Why? Because lazy players don't want to bother crafting. You can gather parts and common devices cheaply, craft them yourself, and immediately list the Uncommon miner back on the market for 70 RLT, locking in a pure 30 RLT profit!</p>

        <h2>3. Panic Sale "Sniper" Tactics</h2>
        <p>When a new Season Pass is launched or a limited "Flash Sale" starts, many players simply do not have sufficient RLT in their balances to afford it. To avoid missing the sale, they liquidate their most valuable miners at a drastic 30% discount for an instant sale.</p>
        <p>Refresh the market tracking screen constantly to become a "Sniper", grabbing these panic-drop miners within milliseconds. Buy a 200 RLT miner for 140 RLT out of their hands, and flip it back for its real 200 RLT value just 3 days later when the market stabilizes.</p>

        <h2>4. Keep the Fees in Mind</h2>
        <p>Always factor in the Marketplace commission fee (usually around 5%) into your calculations. If you buy an item for 100 RLT and sell it for 103 RLT, you are actually losing money after the fee. Target a minimum of 10-15% margin on any flip.</p>
      </article>
    </div>
  );
};

export default function MarketplaceArbitrageGuide() {
  const { lang } = useParams<{ lang: string }>();
  return lang === 'tr' ? <MarketplaceArbitrageGuideTR /> : <MarketplaceArbitrageGuideEN />;
}
