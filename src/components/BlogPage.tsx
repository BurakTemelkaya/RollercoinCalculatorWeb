import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

const BlogPageTR = () => {
  const { lang } = useParams<{ lang: string }>();
  return (
    <div className="static-page-container">
      <Helmet>
        <title>RollerCoin Blog: Rehberler, İncelemeler ve Stratejiler | RollerCoin Hesaplayıcı</title>
        <meta name="description" content="RollerCoin hakkında detaylı blog yazıları. Oyun incelemeleri, lig sistemi rehberi, marketplace ipuçları, karlılık analizi ve yeni başlayanlar için rehber." />
        <link rel="canonical" href={`https://rollercoincalculator.app/${lang}/blog`} />
      </Helmet>
      <div className="static-back-link">
        <Link to={`/${lang}`}>← Hesaplayıcıya Dön</Link>
      </div>
      <article className="static-content guides-container">
        <h1>RollerCoin Blog</h1>
        <p>RollerCoin hakkında derinlemesine analizler, strateji önerileri ve güncel bilgiler. Oyunu daha iyi anlamak ve kazancınızı artırmak için blog yazılarımızı okuyun.</p>

        <section className="guide-card" style={{ marginTop: '40px' }}>
          <h2>🎮 RollerCoin Nedir? Kapsamlı İnceleme (2026)</h2>
          <p>RollerCoin'in ne olduğu, nasıl çalıştığı, tarihi, güç kaynakları, desteklenen kripto paralar, F2P vs yatırımcı karşılaştırması, avantajlar/dezavantajlar ve gerçekçi kazanç beklentileri hakkında her şeyi öğrenin.</p>
          <Link to={`/${lang}/blog/what-is-rollercoin`} className="btn-primary" style={{ display: 'inline-block', marginTop: '10px' }}>Devamını Oku →</Link>
        </section>

        <section className="guide-card" style={{ marginTop: '30px' }}>
          <h2>🏆 Lig Sistemi Nasıl Çalışır? Detaylı Rehber</h2>
          <p>15 lig kademesi, güç eşikleri, Lig Gücü vs Mevcut Güç farkı, bağımsız ödül havuzları, blok ödülü dağıtım formülü ve lig atlama stratejileri hakkında kapsamlı bilgi.</p>
          <Link to={`/${lang}/blog/league-system-explained`} className="btn-primary" style={{ display: 'inline-block', marginTop: '10px' }}>Devamını Oku →</Link>
        </section>

        <section className="guide-card" style={{ marginTop: '30px' }}>
          <h2>🛒 Marketplace Rehberi: Akıllı Alım-Satım İpuçları</h2>
          <p>Güç/maliyet oranı hesaplama, bonus yüzdesi değerlendirme, parça birleştirme stratejisi, ROI hesabı ve sık yapılan hatalardan kaçınma ipuçları.</p>
          <Link to={`/${lang}/blog/marketplace-trading-guide`} className="btn-primary" style={{ display: 'inline-block', marginTop: '10px' }}>Devamını Oku →</Link>
        </section>

        <section className="guide-card" style={{ marginTop: '30px' }}>
          <h2>💰 Hangi Coini Kazmalıyım? Karlılık Analizi</h2>
          <p>BTC, ETH, DOGE, SOL ve diğer coinlerin karşılaştırması. Blok ödülü, ağ gücü, piyasa fiyatı faktörleri ve hesaplayıcıyla karlılık analizi yapma rehberi.</p>
          <Link to={`/${lang}/blog/most-profitable-coin`} className="btn-primary" style={{ display: 'inline-block', marginTop: '10px' }}>Devamını Oku →</Link>
        </section>

        <section className="guide-card" style={{ marginTop: '30px' }}>
          <h2>🚀 Yeni Başlayanlar İçin Adım Adım Rehber</h2>
          <p>Hesap oluşturma, arayüz tanıma, mini-oyunlar, PC seviyesi, görevler, ilk madenci alımı, kazanç takibi ve 30 günlük aksiyon planı. RollerCoin'e yeni başlayanların okuması gereken tek rehber.</p>
          <Link to={`/${lang}/blog/beginners-complete-guide`} className="btn-primary" style={{ display: 'inline-block', marginTop: '10px' }}>Devamını Oku →</Link>
        </section>
      </article>
    </div>
  );
};

const BlogPageEN = () => {
  const { lang } = useParams<{ lang: string }>();
  const { t } = useTranslation();
  return (
    <div className="static-page-container">
      <Helmet>
        <title>RollerCoin Blog: Guides, Reviews & Strategies | RollerCoin Calculator</title>
        <meta name="description" content="In-depth blog posts about RollerCoin. Game reviews, league system guide, marketplace tips, profitability analysis, and beginner's guide." />
        <link rel="canonical" href={`https://rollercoincalculator.app/${lang}/blog`} />
      </Helmet>
      <div className="static-back-link">
        <Link to={`/${lang}`}>← {t('event.backToCalc')}</Link>
      </div>
      <article className="static-content guides-container">
        <h1>RollerCoin Blog</h1>
        <p>In-depth analyses, strategy recommendations, and up-to-date information about RollerCoin. Read our blog posts to better understand the game and maximize your earnings.</p>

        <section className="guide-card" style={{ marginTop: '40px' }}>
          <h2>🎮 What is RollerCoin? Comprehensive Review (2026)</h2>
          <p>Learn everything about what RollerCoin is, how it works, its history, power sources, supported cryptocurrencies, F2P vs investor comparison, pros/cons, and realistic earning expectations.</p>
          <Link to={`/${lang}/blog/what-is-rollercoin`} className="btn-primary" style={{ display: 'inline-block', marginTop: '10px' }}>Read More →</Link>
        </section>

        <section className="guide-card" style={{ marginTop: '30px' }}>
          <h2>🏆 How Does the League System Work? Detailed Guide</h2>
          <p>Comprehensive coverage of 15 league tiers, power thresholds, League Power vs Current Power, independent reward pools, block reward distribution formula, and league advancement strategies.</p>
          <Link to={`/${lang}/blog/league-system-explained`} className="btn-primary" style={{ display: 'inline-block', marginTop: '10px' }}>Read More →</Link>
        </section>

        <section className="guide-card" style={{ marginTop: '30px' }}>
          <h2>🛒 Marketplace Guide: Smart Trading Tips</h2>
          <p>Power-to-cost ratio calculations, bonus percentage evaluation, part merging strategy, ROI calculations, and tips for avoiding common mistakes.</p>
          <Link to={`/${lang}/blog/marketplace-trading-guide`} className="btn-primary" style={{ display: 'inline-block', marginTop: '10px' }}>Read More →</Link>
        </section>

        <section className="guide-card" style={{ marginTop: '30px' }}>
          <h2>💰 Which Coin Should You Mine? Profitability Analysis</h2>
          <p>Comparison of BTC, ETH, DOGE, SOL, and other coins. Block rewards, network power, market price factors, and using our calculator for profitability analysis.</p>
          <Link to={`/${lang}/blog/most-profitable-coin`} className="btn-primary" style={{ display: 'inline-block', marginTop: '10px' }}>Read More →</Link>
        </section>

        <section className="guide-card" style={{ marginTop: '30px' }}>
          <h2>🚀 Beginner's Complete Step-by-Step Guide</h2>
          <p>Account creation, interface overview, mini-games, PC levels, quests, first miner purchase, earnings tracking, and a 30-day action plan. The one guide every RollerCoin newbie needs to read.</p>
          <Link to={`/${lang}/blog/beginners-complete-guide`} className="btn-primary" style={{ display: 'inline-block', marginTop: '10px' }}>Read More →</Link>
        </section>
      </article>
    </div>
  );
};

export default function BlogPage() {
  const { lang } = useParams<{ lang: string }>();
  return lang === 'tr' ? <BlogPageTR /> : <BlogPageEN />;
}
