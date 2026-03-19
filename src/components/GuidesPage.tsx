import React, { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import appLogo from '../assets/logo.png';
import trFlag from '../assets/flags/tr.svg';
import gbFlag from '../assets/flags/gb.svg';

const GuidesTR: React.FC = () => (
  <article className="static-content guides-container">
    <h1>RollerCoin Strateji Rehberleri</h1>
    
    <section className="guide-card">
      <h2>1. Yeni Başlayanlar İçin İlk Hedefler</h2>
      <p>
        RollerCoin dünyasına yeni katıldıysanız, önceliğiniz ücretsiz mini-oyunları düzenli bir şekilde oynayarak kalıcı gücünüzü (PC seviyesi) en yüksekte tutmak olmalıdır.
        <strong> Oyun Stratejisi: </strong> Günde 40-50 oyun oynayarak PC'nizi Level 4 (Maximum PC) seviyesine çıkarın. Bu sayede oyunlardan kazandığınız hash gücü 7 tam gün boyunca geçerli olur. Oynaması en kısa süren ama en yüksek ödülü veren Cryptonoid ve Token Blaster gibi oyunlara odaklanın. Kazançlarınızı başlangıçta tamamen RLT (RollerToken) kazımına ayarlayarak ileride ucuz madenciler almak için kaynak yaratın.
      </p>
    </section>

    <section className="guide-card">
      <h2>2. "Event Pass" ve Etkinlikleri Yönetme</h2>
      <p>
        Büyük kazançlar günlük madencilikten değil, çok iyi planlanmış etkinlik (Progression Event) yatırımlarından gelir. Oyunda sürekli olarak 14 günlük minik etkinlikler veya aylar süren sezon etkinlikleri (Season Pass) düzenlenir. 
        <strong> Taktik: </strong> Hesabınızda her zaman bir miktar RLT tutun fakat bunları mağazadan sıradan madenciler almak için harcamayın. Bir <i>Progression Event</i> başladığında etkinlik puanı toplamak için eşya (parts) alıp satmak veya pazar yeri komisyonlarını göze alarak takaslar yapmak size o etkinlikteki özel madencileri çok daha ucuza kazandırır.
      </p>
    </section>

    <section className="guide-card">
      <h2>3. The Power of "Bonus Power" (Bonus Gücün Önemi)</h2>
      <p>
        Oyuncuların yaptığı en büyük hata, sadece yüksek Terahash (Th/s) üreten madencileri alıp, Bonus gücünü ihmal etmektir. Koleksiyonunuzdaki her <i>farklı</i> madenci, sahip olduğu bonus yüzdesini (Örn: %0.50) tüm odanızın ham gücüne uygular. 
        <br/><br/>
        <strong> Örnek: </strong> Eğer odanızda 100 Ph/s gücünüz varsa ve %10 bonus gücüne sahipseniz, ekstra 10 Ph/s bedavadan eklenecek demektir. Bu nedenle envanterinize sürekli olarak ucuz ve düşük güç veren ancak "Collect" bonus yüzdesi olan %0.5, %1, %2 bonuslu küçük madencilerden doldurun. Unutmayın, aynı model madenciden 2 tane olması bonusu artırmaz, bonuslar sadece eşsiz koleksiyon için geçerlidir.
      </p>
    </section>
  </article>
);

const GuidesEN: React.FC = () => (
  <article className="static-content guides-container">
    <h1>RollerCoin Strategy Guides</h1>
    
    <section className="guide-card">
      <h2>1. First Goals for Beginners</h2>
      <p>
        If you are new to the RollerCoin world, your priority should be playing free mini-games regularly to keep your persistent power (PC level) at the maximum possible level.
        <strong> Game Strategy: </strong> Play around 40-50 games a day to upgrade your PC to Level 4 (Mac roller). This ensures the hash power you gain from games lasts for a full 7 days. Focus on games that are quick to finish but offer high rewards, such as Cryptonoid and Token Blaster. In the beginning, allocate 100% of your power to mining RLT (RollerToken) so you can create a budget to buy cheap miners later.
      </p>
    </section>

    <section className="guide-card">
      <h2>2. Managing "Event Passes" and Events</h2>
      <p>
        Big profits do not usually come from daily raw mining, but rather from well-planned investments during Progression Events. The game constantly hosts 14-day mini-events or multi-month Season Passes. 
        <strong> Tactic: </strong> Always keep a reserve of RLT in your account, but don't spend it on ordinary miners from the regular store. When a <i>Progression Event</i> starts, flipping items (parts) on the marketplace or trading to gather event points will yield exclusive high-powered event miners for a fraction of their normal cost.
      </p>
    </section>

    <section className="guide-card">
      <h2>3. The Importance of "Bonus Power"</h2>
      <p>
        The biggest mistake players make is buying miners with high Terahash (Th/s) output while ignoring Bonus Power. Every <i>unique</i> miner in your collection applies its bonus percentage (e.g., 0.50%) to the raw power of your entire room. 
        <br/><br/>
        <strong> Example: </strong> If your room has 100 Ph/s of raw power and you have 10% bonus power, an extra 10 Ph/s is added for free permanently. Therefore, you should continuously fill your inventory with cheap, low-power miners that have a "collection" bonus percentage of 0.5%, 1%, or 2%. Remember, having two of the exact same miner does <i>not</i> stack the bonus; bonuses only apply to unique miners in your collection.
      </p>
    </section>
  </article>
);

function GuidesPage() {
  const { lang } = useParams<{ lang: string }>();
  const navigate = useNavigate();
  const { i18n } = useTranslation();

  useEffect(() => {
    if (lang === 'tr' || lang === 'en') {
      if (i18n.language !== lang) i18n.changeLanguage(lang);
      localStorage.setItem('rollercoin_web_language', lang);
    } else {
      navigate('/', { replace: true });
    }
  }, [lang, i18n, navigate]);

  const isTR = lang === 'tr';

  return (
    <div className="app-wrapper">
      <Helmet>
        <title>{isTR ? 'RollerCoin Strateji Rehberleri | RollerCoin Hesaplayıcı' : 'Strategy Guides | RollerCoin Calculator'}</title>
        <meta
          name="description"
          content={
            isTR
              ? 'RollerCoin hakkında güncel taktikler, bonus güç artırma yolları ve etkinlik rehberleri.'
              : 'Up-to-date RollerCoin tactics, ways to increase bonus power, and event strategy guides.'
          }
        />
        <link rel="canonical" href={`https://rollercoincalculator.app/${lang}/guides`} />
      </Helmet>

      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="header-logo">
            <Link to={`/${lang}`}><img src={appLogo} alt="Logo" width="80" height="80" className="app-main-logo" /></Link>
          </div>
          <div className="header-title">
            <Link to={`/${lang}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <h1>{isTR ? 'RollerCoin Hesaplayıcı' : 'RollerCoin Calculator'}</h1>
            </Link>
          </div>
          <div className="header-right-group">
            <div className="main-nav-links">
               <Link to={`/${lang}/guides`} className="nav-link active">{isTR ? 'Rehberler' : 'Guides'}</Link>
               <Link to={`/${lang}/faq`} className="nav-link">{isTR ? 'SSS' : 'FAQ'}</Link>
               <Link to={`/${lang}/support`} className="nav-link">{isTR ? 'Destek' : 'Support'}</Link>
            </div>
            <div className="lang-switcher">
              <button
                className={`lang-btn ${isTR ? 'active' : ''}`}
                onClick={() => navigate(`/tr/guides`)}
                title="Türkçe"
              >
                <img src={trFlag} alt="TR" className="flag-icon" />
                <span className="lang-text">Türkçe</span>
              </button>
              <button
                className={`lang-btn ${!isTR ? 'active' : ''}`}
                onClick={() => navigate(`/en/guides`)}
                title="English"
              >
                <img src={gbFlag} alt="EN" className="flag-icon" />
                <span className="lang-text">English</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content static-page">
        <div className="static-back-link">
          <Link to={`/${lang}`}>← {isTR ? 'Hesaplayıcıya Dön' : 'Back to Calculator'}</Link>
        </div>
        {isTR ? <GuidesTR /> : <GuidesEN />}
      </main>

      {/* Footer */}
      <footer className="footer">
        <p>RollerCoin {isTR ? 'Hesaplayıcı' : 'Calculator'}</p>
        <p className="footer-note">
          <Link to={`/${lang}/about`}>{isTR ? 'Hakkımızda' : 'About Us'}</Link>
          {' · '}
          <Link to={`/${lang}/privacy`}>{isTR ? 'Gizlilik Politikası' : 'Privacy Policy'}</Link>
          {' · '}
          <a href="https://rollercoin.com/game" target="_blank" rel="noopener noreferrer">
            rollercoin.com
          </a>
        </p>
      </footer>
    </div>
  );
}

export default GuidesPage;
