import React, { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import appLogo from '../assets/logo.png';
import trFlag from '../assets/flags/tr.svg';
import gbFlag from '../assets/flags/gb.svg';

const FaqTR: React.FC = () => (
  <article className="static-content faq-container">
    <h1>Sıkça Sorulan Sorular (SSS)</h1>

    <div className="faq-item">
      <h2>1. Neden kazancım sürekli değişiyor?</h2>
      <p>
        RollerCoin'deki gelirler statik değildir. Seçtiğiniz coinin "Ağ Gücü" (Network Power) saniyeden saniyeye değişmektedir. Diğer oyuncular güçlerini o coine yönlendirdiğinde veya yeni madenciler aldıklarında ağın toplam gücü artar. Sizin gücünüz sabit kalsa bile ağın toplam gücü arttığı için sizin payınıza düşen ödül miktarı azalacaktır. Ayrıca, kripto para piyasasındaki dalgalanmalar nedeniyle USD karşılığınız da canlı olarak değişir.
      </p>
    </div>

    <div className="faq-item">
      <h2>2. Hangi ligde olduğumu nasıl bilebilirim?</h2>
      <p>
        Oyunda sahip olduğunuz ve aktif olan toplam "League Power" miktarınıza göre bir lige atanıyorsunuz. Hesaplayıcımız, isminizi (Username) girip API üzerinden verinizi çektiğinizde, oyunun size atadığı ligi otomatik olarak algılar. Eğer manuel olarak güç veri girişi yapıyorsanız, hesaplayıcı "Auto" modunda hash gücü toplamınıza göre sizi yaklaşık olarak doğru lige yerleştirir. Yanlışsa açılır menüden liginizi manuel değiştirebilirsiniz.
      </p>
    </div>

    <div className="faq-item">
      <h2>3. Hangi platformda hangi coini kazmalıyım? (En karlı coin hangisi?)</h2>
      <p>
        Bunun tek ve kesin bir cevabı yoktur çünkü ödül oranları her an değişebildiği gibi coinlerin piyasa fiyatı da (Örn; BTC, SOL, DOGE vs.) anlık değişir. "Kazançlar" (Earnings) tablosumuzdaki USD sütununa bakarak, şu anki ağ koşullarında hangi coinin fiat (dolar) bazında en yüksek getiriyi sunduğunu saniyeler içinde görebilirsiniz. Unutmayın, en yüksek USD getirisine sahip coin genelde en mantıklı olanıdır, ancak o coinin gelecekteki fiyatlanma potansiyelini de kendi risk iştahınıza göre değerlendirmelisiniz.
      </p>
    </div>

    <div className="faq-item">
      <h2>4. Çekim süresi sayacı (Withdraw Timer) nasıl çalışır?</h2>
      <p>
        Bu araç, oyundaki mevcut bakiyenizi (balance) ve anlık üretim (kazanç) hızınızı baz alarak, o coin için belirlenmiş minimum çekim limitine tam olarak kaç gün ve saat içinde ulaşacağınızı hesaplar. Bu hesaplama o anki ağ gücüne göre yapıldığı için ağ gücü artarsa çekim süresi uzayabilir.
      </p>
    </div>

    <div className="faq-item">
      <h2>5. Power Simulator (Simülatör) ne işe yarar?</h2>
      <p>
        Eğer elinizdeki RLT veya kripto paralarla yeni bir Miner (Madenci) veya Rack (Raf) almak istiyorsanız, bu sekme size simülasyon yapma imkanı tanır. Yeni cihazın Raw Power (Sade Güç) ve Bonus Yüzdesini girdiğinizde, mevcut gücünüze eklenerek toplam gücünüzün ne olacağını ve yeni kazancınızın ne kadar artacağını anında gösterir. Böylece yanlış bir madenci satın almaktan kurtulursunuz.
      </p>
    </div>
  </article>
);

const FaqEN: React.FC = () => (
  <article className="static-content faq-container">
    <h1>Frequently Asked Questions (FAQ)</h1>

    <div className="faq-item">
      <h2>1. Why are my earnings constantly changing?</h2>
      <p>
        Earnings in RollerCoin are not static. The "Network Power" of your chosen coin changes second by second. When other players allocate their power to that coin or buy new miners, the total network power increases. Even if your personal power remains constant, your share of the pie decreases because the total pool got larger. Additionally, due to crypto market volatility, the USD equivalent of your earnings changes live.
      </p>
    </div>

    <div className="faq-item">
      <h2>2. How do I know which league I am in?</h2>
      <p>
        You are assigned a league based on your total active "League Power" in the game. When you enter your Username in our calculator to fetch data via the API, the tool automatically detects the exact league assigned to you by the game. If you are entering your power data manually, the calculator in "Auto" mode places you in the approximately correct league based on your hash power sum. If it's incorrect, you can change your league manually from the dropdown menu.
      </p>
    </div>

    <div className="faq-item">
      <h2>3. Which coin is the most profitable to mine?</h2>
      <p>
        There is no single correct answer for this because reward rates and the market price of coins (e.g., BTC, SOL, DOGE, etc.) change constantly. By looking at the USD column in our "Earnings" table, you can see in seconds which coin offers the highest fiat return under the current network conditions. Remember, the highest USD yielding coin is generally the most logical choice, but you should also factor in the future potential price appreciation of that coin.
      </p>
    </div>

    <div className="faq-item">
      <h2>4. How does the Withdraw Timer work?</h2>
      <p>
        This tool takes your current balance in the game and your real-time production (earning) rate to calculate exactly how many days and hours it will take for you to reach the minimum withdrawal limit for that specific coin. Since this calculation is based on current network power, an increase in network power might extend the withdrawal timeline.
      </p>
    </div>

    <div className="faq-item">
      <h2>5. What is the Power Simulator used for?</h2>
      <p>
        If you are planning to spend your RLT or crypto to buy a new Miner or Rack, this tab allows you to simulate the purchase. When you enter the new hardware's Raw Power and Bonus Percentage, it adds it to your existing power and instantly shows what your new total power and new earnings will be. This helps you avoid making unprofitable miner purchases.
      </p>
    </div>
  </article>
);

function FaqPage() {
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
        <title>{isTR ? 'Sıkça Sorulan Sorular | RollerCoin Hesaplayıcı' : 'FAQ | RollerCoin Calculator'}</title>
        <meta
          name="description"
          content={
            isTR
              ? 'RollerCoin Kazanç Hesaplayıcı hakkında merak edilenler, sıkça sorulan sorular, kazanç değişim sebepleri ve lig rehberi.'
              : 'Frequently asked questions about the RollerCoin Calculator, earning changes, and league guides.'
          }
        />
        <link rel="canonical" href={`https://rollercoincalculator.app/${lang}/faq`} />
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
               <Link to={`/${lang}/guides`} className="nav-link">{isTR ? 'Rehberler' : 'Guides'}</Link>
               <Link to={`/${lang}/faq`} className="nav-link active">{isTR ? 'SSS' : 'FAQ'}</Link>
               <Link to={`/${lang}/support`} className="nav-link">{isTR ? 'Destek' : 'Support'}</Link>
            </div>
            <div className="lang-switcher">
              <button
                className={`lang-btn ${isTR ? 'active' : ''}`}
                onClick={() => navigate(`/tr/faq`)}
                title="Türkçe"
              >
                <img src={trFlag} alt="TR" className="flag-icon" />
                <span className="lang-text">Türkçe</span>
              </button>
              <button
                className={`lang-btn ${!isTR ? 'active' : ''}`}
                onClick={() => navigate(`/en/faq`)}
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
        {isTR ? <FaqTR /> : <FaqEN />}
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

export default FaqPage;
