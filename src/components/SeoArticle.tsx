import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const SeoArticleTR: React.FC<{ lang: string }> = ({ lang }) => (
  <article className="seo-article-container static-content" style={{ padding: '30px', backgroundColor: 'var(--surface-50)', borderRadius: '12px', marginTop: '40px' }}>
    <h2 style={{ borderBottom: 'none', marginBottom: '15px', color: 'var(--primary-400)' }}>RollerCoin Kazanç Hesaplayıcı Nedir?</h2>
    <p style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>
      RollerCoin ekosisteminde elde edeceğiniz kazancın miktarını anlık olarak belirleyen temel unsur, oyunun karmaşık kriptografik matematik altyapısıdır. Hesaplayıcımız, bireysel hash gücünüz, seçtiğiniz kripto paranın toplam ağ gücü ve havuzun o anki blok ödülü arasındaki matematiksel ilişkiyi kullanarak size <strong>Binance API üzerinden saniyelik kur bilgileriyle</strong> en doğru net kazancı sunar.
    </p>

    <h3 style={{ marginTop: '25px', fontSize: '18px', color: 'var(--text-primary)' }}>Neden Bu Aracı Kullanmalısınız?</h3>
    <ul style={{ fontSize: '15px', color: 'var(--text-secondary)', marginTop: '10px', paddingLeft: '20px' }}>
      <li><strong>Canlı Piyasa Fiyatları:</strong> Statik ve eski veriler yerine, Binance borsasından canlı çekilen Bitcoin (BTC), Ethereum (ETH), Doge (DOGE) ve diğer kripto fiyatlarıyla milisaniyelik USD karşılığınızı görürsünüz.</li>
      <li><strong>Lig (League) Sistemi Entegrasyonu:</strong> Kazancınıza eklenen Lig bonus çarpanlarını ağ üzerinden analiz ederek gizli blok havuzu yüzdelerini hesaba katar.</li>
      <li><strong>Kapsamlı Çekim Simülasyonu:</strong> Mevcut bakiyenizi (Current Balance) girdiğinizde, minimum çekim (Withdrawal) eşiğine tam olarak kaç gün ve saat içerisinde ulaşacağınızı sizin için hesaplar.</li>
    </ul>

    <h3 style={{ marginTop: '25px', fontSize: '18px', color: 'var(--text-primary)' }}>Stratejinizi Geliştirin</h3>
    <p style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>
      Zirveye oynamak sadece matematik yapmakla olmaz. RollerCoin pazar yerindeki arbitraj fırsatlarından (Marketplace), Koleksiyon Bonusu mantığına (Collection Bonus) kadar tüm detayları anlattığımız ansiklopedik kütüphanemizi okuyarak bir adım öne geçin.
    </p>

    <div style={{ display: 'flex', gap: '15px', marginTop: '25px', flexWrap: 'wrap' }}>
      <Link to={`/${lang}/guides/calculation-logic`} className="btn-primary" style={{ padding: '10px 18px' }}>Hesaplama Mantığını Öğren →</Link>
      <Link to={`/${lang}/guides/mining-power`} className="btn-secondary" style={{ padding: '10px 18px' }}>Hash Gücü Taktiklerini Oku →</Link>
    </div>
  </article>
);

const SeoArticleEN: React.FC<{ lang: string }> = ({ lang }) => (
  <article className="seo-article-container static-content" style={{ padding: '30px', backgroundColor: 'var(--surface-50)', borderRadius: '12px', marginTop: '40px' }}>
    <h2 style={{ borderBottom: 'none', marginBottom: '15px', color: 'var(--primary-400)' }}>What is the RollerCoin Profit Calculator?</h2>
    <p style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>
      The core factor that instantly dictates your earnings within the RollerCoin ecosystem is the game's complex cryptographic math infrastructure. Our calculator determines this by looking at your power, total network power, and the live block reward using <strong>Live Market Prices down to the second via the Binance API</strong>.
    </p>

    <h3 style={{ marginTop: '25px', fontSize: '18px', color: 'var(--text-primary)' }}>Why Choose Our Calculator?</h3>
    <ul style={{ fontSize: '15px', color: 'var(--text-secondary)', marginTop: '10px', paddingLeft: '20px' }}>
      <li><strong>Live Market Prices:</strong> Instead of outdated static data, we pull live exchange rates from Binance for Bitcoin (BTC), Ethereum (ETH), Doge, and more to show your true USD profits instantly.</li>
      <li><strong>League System Integration:</strong> Fully simulates the hidden multiplier percentages added to your block pool distributions based on your active gaming league tier.</li>
      <li><strong>Precision Withdrawal Timers:</strong> Enter your current coin balance, and our engine automatically structures exactly how many days and hours are left until you reach the minimum withdrawal threshold.</li>
    </ul>

    <h3 style={{ marginTop: '25px', fontSize: '18px', color: 'var(--text-primary)' }}>Master Your Strategy</h3>
    <p style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>
      Conquering the leaderboards requires more than just basic math. Stay ahead by reading our encyclopedic deep-dives into Marketplace arbitrage opportunities, exact Collection Bonus configurations, and Free-to-Play persistence.
    </p>

    <div style={{ display: 'flex', gap: '15px', marginTop: '25px', flexWrap: 'wrap' }}>
      <Link to={`/${lang}/guides/calculation-logic`} className="btn-primary" style={{ padding: '10px 18px' }}>Learn The Technical Logic →</Link>
      <Link to={`/${lang}/guides/mining-power`} className="btn-secondary" style={{ padding: '10px 18px' }}>Read Power Building Tactics →</Link>
    </div>
  </article>
);

const SeoArticle: React.FC = () => {
  const { i18n } = useTranslation();
  const lang = i18n.language || 'en';
  return lang === 'tr' ? <SeoArticleTR lang={lang} /> : <SeoArticleEN lang={lang} />;
};

export default SeoArticle;
