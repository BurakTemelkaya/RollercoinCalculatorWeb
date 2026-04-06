import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';

const GuidesPageTR = () => {
  const { lang } = useParams<{ lang: string }>();
  const { t } = useTranslation();
  return (
    <div className="static-page-container">
      <Helmet>
        <title>RollerCoin Rehberi: Stratejiler ve Taktikler - RollerCoin Hesaplayıcı</title>
        <meta name="description" content="Yeni Başlayanlar İçin RollerCoin Rehberi. Yatırımsız kazanç yolları, bonus güç hesaplamaları ve pazar yeri arbitraj taktikleriyle 2026 sezonunu domine edin." />
        <link rel="canonical" href={`https://rollercoincalculator.app/${lang}/guides`} />
      </Helmet>

      <div className="static-back-link">
        <Link to={`/${lang}`}>← {t('event.backToCalc')}</Link>
      </div>

      <article className="static-content guides-container">
        <h1>Kapsamlı RollerCoin Rehberleri ve İleri Düzey Stratejiler</h1>
        <p>Hesaplayıcımızı sadece anlık matematik yapmak için değil, uzun vadede madencilik gelirinizi (mining income) üst düzeye çıkaracak doğru adımları atmanız için tasarladık. Aşağıdaki derinlemesine rehberleri okuyarak hesabınızı rakiplerinizin ötesine taşıyabilirsiniz.</p>

        <section className="guide-card" style={{ marginTop: '40px' }}>
          <h2>Makale 1: Yeni Başlayanlar İçin RollerCoin - Sıfırdan Yatırımsız Kazanç Yolu</h2>
          <p>Oyunun başlarında yatırım yapmadan ilerlemek zor gibi görünebilir ancak disiplinli bir günlük oyun rutiniyle harika sonuçlar alabilirsiniz. En verimli mini-oyunları, PC seviyesini koruma taktiklerini ve "Task Wall" üzerinden ücretsiz RLT kazanarak ilk pasif gelirinizi nasıl kuracağınızı anlattığımız devasa rehberi okumaya başlayın.</p>
          <Link to={`/${lang}/guides/f2p-strategy`} className="btn-primary" style={{ display: 'inline-block', marginTop: '10px' }}>Devamını Oku →</Link>
        </section>

        <section className="guide-card" style={{ marginTop: '40px' }}>
          <h2>Makale 2: Bonus Power Rehberi - Neden Sadece Güç Yetmez?</h2>
          <p>Odanızı sadece yüksek "Th/s" veya "Ph/s" veren madencilerle doldurmak büyük bir hatadır. Birçok tecrübeli oyuncu, sadece 1-2 RLT'ye mal ettikleri çöp gibi görünen madencilerin onlara nasıl devasa kazançlar sağladığını çok iyi bilir. Koleksiyon Bonusunun (Collection Bonus) sırlarını ve bedava güç kazanımını öğrenin.</p>
          <Link to={`/${lang}/guides/bonus-power`} className="btn-primary" style={{ display: 'inline-block', marginTop: '10px' }}>Devamını Oku →</Link>
        </section>

        <section className="guide-card" style={{ marginTop: '40px' }}>
          <h2>Makale 3: Marketplace Arbitrajı - Parça (Parts) ile RLT Katlama</h2>
          <p>Yüzlerce RLT kazanmak için saatlerce oyun oynamak zorunda değilsiniz. "Trader" zihniyetine geçerek RollerCoin borsa marketinin açıklarından nasıl yararlanacağınızı, düşen parça fiyatlarını toplayıp, Crafting boşluklarından nasıl yararlanıp panik satış ihalelerini nasıl avlayabileceğinizi öğrettiğimiz dev rehber.</p>
          <Link to={`/${lang}/guides/marketplace-arbitrage`} className="btn-primary" style={{ display: 'inline-block', marginTop: '10px' }}>Devamını Oku →</Link>
        </section>

        <section className="guide-card" style={{ marginTop: '40px' }}>
          <h2>Makale 4: Hash Gücü Nasıl Artırılır? (2026 Sezonu En İyi Stratejileri)</h2>
          <p>Yalnızca bütçeyle değil pazar dinamiklerini okuyarak, etkinlik geçişlerinde (Event Pass) çarpan manipülasyonu yaratarak ve doğru raf optimizasyonuyla pasif gelirinizi nasıl 2 katına çıkaracağınızı öğrenin.</p>
          <Link to={`/${lang}/guides/mining-power`} className="btn-primary" style={{ display: 'inline-block', marginTop: '10px' }}>Devamını Oku →</Link>
        </section>

        <section className="guide-card" style={{ marginTop: '40px' }}>
          <h2>Makale 5: RollerCoin Kazanç Mantığı ve Teknik Formül Alt Yapısı</h2>
          <p>Ağ paylaşımı, havuz blok ödülü değişkenleri, Lig çarpanları ve anlık Binance Market API fiyatlandırması üzerine derinlemesine teknik bir doküman. Sistemi anlayan, oyunu kazanır.</p>
          <Link to={`/${lang}/guides/calculation-logic`} className="btn-primary" style={{ display: 'inline-block', marginTop: '10px' }}>Devamını Oku →</Link>
        </section>
      </article>
    </div>
  );
};

const GuidesPageEN = () => {
  const { lang } = useParams<{ lang: string }>();
  const { t } = useTranslation();

  return (
    <div className="static-page-container">
      <Helmet>
        <title>{t('pages.guides.title')} | {t('app.title')}</title>
        <meta name="description" content={t('seo.description')} />
        <link rel="canonical" href={`https://rollercoincalculator.app/${lang}/guides`} />
      </Helmet>

      <div className="static-back-link">
        <Link to={`/${lang}`}>← {t('event.backToCalc')}</Link>
      </div>

      <article className="static-content guides-container">
        <h1>{t('pages.guides.title')}</h1>

        <section className="guide-card" style={{ marginTop: '40px' }}>
          <h2>Article 1: For Beginners - Free-to-Play (F2P) Earning Path</h2>
          <p>Progressing without making a real money investment might seem difficult at the beginning, but you can achieve great results with a disciplined daily gaming routine. Read our massive guide covering the most efficient mini-games, maintaining your PC level, and scoring your first passive miners using "Task Wall" strategies.</p>
          <Link to={`/${lang}/guides/f2p-strategy`} className="btn-primary" style={{ display: 'inline-block', marginTop: '10px' }}>Read More →</Link>
        </section>

        <section className="guide-card" style={{ marginTop: '40px' }}>
          <h2>Article 2: Bonus Power Guide - Why Raw Power Isn't Enough?</h2>
          <p>Filling your room only with miners that provide high raw power is a massive mistake. Learn how experienced players turn seemingly garbage 1 RLT miners into gigafactories of passive income using the mysterious mechanics behind the Collection Bonus.</p>
          <Link to={`/${lang}/guides/bonus-power`} className="btn-primary" style={{ display: 'inline-block', marginTop: '10px' }}>Read More →</Link>
        </section>

        <section className="guide-card" style={{ marginTop: '40px' }}>
          <h2>Article 3: Marketplace Arbitrage - Multiplying RLT with Parts</h2>
          <p>You don't have to play games for hours to earn hundreds of RLT. Adopt the "Trader" mindset and exploit the gaps of the RollerCoin marketplace. Our deep-dive guide teaches you how to collect plummeting Parts and flip Panic-sale miners with sniper precision.</p>
          <Link to={`/${lang}/guides/marketplace-arbitrage`} className="btn-primary" style={{ display: 'inline-block', marginTop: '10px' }}>Read More →</Link>
        </section>

        <section className="guide-card" style={{ marginTop: '40px' }}>
          <h2>Article 4: How to Increase Hash Power? (Best Strategies for 2026)</h2>
          <p>Learn how to double your passive income not merely by making brute-force investments, but by reading instant market opportunities, manipulating Event Pass multipliers, and applying correct rack optimizations.</p>
          <Link to={`/${lang}/guides/mining-power`} className="btn-primary" style={{ display: 'inline-block', marginTop: '10px' }}>Read More →</Link>
        </section>

        <section className="guide-card" style={{ marginTop: '40px' }}>
          <h2>Article 5: RollerCoin Profit Calculation Logic & Formulas</h2>
          <p>A deep-dive technical document looking into network sharing logic, pool block reward variables, League multipliers, and our live Binance Market API pricing. Understand the system to conquer the game.</p>
          <Link to={`/${lang}/guides/calculation-logic`} className="btn-primary" style={{ display: 'inline-block', marginTop: '10px' }}>Read More →</Link>
        </section>
      </article>
    </div>
  );
};

export default function GuidesPage() {
  const { lang } = useParams<{ lang: string }>();
  return lang === 'tr' ? <GuidesPageTR /> : <GuidesPageEN />;
}
