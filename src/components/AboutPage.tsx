import React, { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import appLogo from '../assets/logo.png';
import trFlag from '../assets/flags/tr.svg';
import gbFlag from '../assets/flags/gb.svg';

const AboutTR: React.FC = () => (
  <article className="static-content">
    <h1>Hakkımızda</h1>

    <h2>RollerCoin Hesaplayıcı Nedir?</h2>
    <p>
      RollerCoin Hesaplayıcı, <a href="https://rollercoin.com" target="_blank" rel="noopener noreferrer">Rollercoin.com</a>'un
      aktif oyuncuları için geliştirilmiş ücretsiz, topluluk odaklı bir yardım aracıdır. Bu araç sayesinde oyundaki
      hash gücünüzü girerek BTC, ETH, DOGE, SOL ve daha pek çok kripto para için ne kadar kazanabileceğinizi
      kolayca hesaplayabilir; çekim sürelerinizi tahmin edebilir ve farklı madenci kombinasyonlarını simüle edebilirsiniz.
    </p>

    <h2>Neden Geliştirdik?</h2>
    <p>
      Rollercoin oyuncuları olarak, stratejimizi belirlemek ve yatırımlarımızı optimize etmek için sık sık manuel
      hesaplamalar yapmak zorunda kaldık. "Şu madenciyi alırsam ne kadar kazanırım?", "Bu hafta çekim yapabilir
      miyim?" gibi soruların cevaplarını bulmak için harcanan zamanı azaltmak ve oyunculara gerçek anlamda faydalı
      bir araç sunmak amacıyla bu projeyi hayata geçirdik.
    </p>

    <h2>Geliştirici Hakkında</h2>
    <p>
      Bu proje <strong>Burak Temelkaya</strong> tarafından oluşturulmuş ve açık kaynak olarak{' '}
      <a href="https://github.com/BurakTemelkaya/RollercoinCalculatorWeb" target="_blank" rel="noopener noreferrer">
        GitHub üzerinde
      </a>{' '}
      paylaşılmaktadır. Projeye katkıda bulunmak, hata bildirmek veya öneride bulunmak için GitHub sayfasını
      ziyaret edebilirsiniz.
    </p>

    <h2>Neler Yapabilirsiniz?</h2>
    <ul>
      <li><strong>Kazanç Hesaplayıcı</strong> — Günlük, haftalık ve aylık kripto para kazançlarınızı USD karşılığıyla görün.</li>
      <li><strong>Çekim Sayacı</strong> — Minimum çekim miktarına ne kadar sürede ulaşacağınızı hesaplayın.</li>
      <li><strong>Güç Simülatörü</strong> — Yeni bir madenci veya raf eklediğinizde kazancınızın nasıl değişeceğini simüle edin.</li>
    </ul>

    <blockquote>
      <strong>Önemli Uyarı:</strong> Bu site, Rollercoin.com ile herhangi bir resmi bağlantısı olmayan
      bağımsız, topluluk odaklı bir araçtır. Hesaplamalar, oyunun genel mekaniklerine ve kullanıcı tarafından
      girilen verilere dayanmaktadır; gerçek kazançlar oyun içindeki güncel duruma göre farklılık gösterebilir.
      Yatırım kararları vermeden önce her zaman{' '}
      <a href="https://rollercoin.com" target="_blank" rel="noopener noreferrer">rollercoin.com</a>'u kontrol ediniz.
    </blockquote>
  </article>
);

const AboutEN: React.FC = () => (
  <article className="static-content">
    <h1>About Us</h1>

    <h2>What is RollerCoin Calculator?</h2>
    <p>
      RollerCoin Calculator is a free, community-driven tool built for active players of{' '}
      <a href="https://rollercoin.com" target="_blank" rel="noopener noreferrer">Rollercoin.com</a>,
      the crypto mining simulation game. With this tool, you can enter your in-game hash power to calculate
      potential earnings in BTC, ETH, DOGE, SOL, and more — estimate withdrawal timelines, and simulate
      different miner configurations.
    </p>

    <h2>Why We Built It</h2>
    <p>
      As Rollercoin players ourselves, we found that planning optimal strategies and maximizing returns
      required frequent manual calculations. Questions like "How much will I earn if I buy this miner?" or
      "Can I make a withdrawal this week?" inspired us to build a faster, smarter solution and provide the
      community with a genuinely useful tool.
    </p>

    <h2>About the Developer</h2>
    <p>
      This project was created by <strong>Burak Temelkaya</strong>. The project is open source and available on{' '}
      <a href="https://github.com/BurakTemelkaya/RollercoinCalculatorWeb" target="_blank" rel="noopener noreferrer">
        GitHub
      </a>. Feel free to contribute, report issues, or suggest features by visiting the GitHub page.
    </p>

    <h2>What You Can Do</h2>
    <ul>
      <li><strong>Earnings Calculator</strong> — See your daily, weekly and monthly crypto earnings in USD.</li>
      <li><strong>Withdrawal Timer</strong> — Calculate how long until you reach the minimum withdrawal amount.</li>
      <li><strong>Power Simulator</strong> — Simulate how adding a new miner or rack changes your earnings.</li>
    </ul>

    <blockquote>
      <strong>Important Disclaimer:</strong> This site is an independent, community-driven tool with no
      official affiliation with Rollercoin.com. Calculations are based on the game's general mechanics and
      user-provided data; actual earnings may vary depending on the current in-game situation. Always verify
      on{' '}
      <a href="https://rollercoin.com" target="_blank" rel="noopener noreferrer">rollercoin.com</a> before
      making investment decisions.
    </blockquote>
  </article>
);

function AboutPage() {
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
        <title>{isTR ? 'Hakkımızda | RollerCoin Hesaplayıcı' : 'About Us | RollerCoin Calculator'}</title>
        <meta
          name="description"
          content={
            isTR
              ? 'RollerCoin Hesaplayıcı hakkında — Burak Temelkaya tarafından geliştirilen topluluk odaklı ücretsiz araç.'
              : 'About RollerCoin Calculator — a free, community-driven tool developed by Burak Temelkaya.'
          }
        />
        <link rel="canonical" href={`https://rollercoincalculator.app/${lang}/about`} />
      </Helmet>

      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="header-logo">
            <img src={appLogo} alt="Logo" width="80" height="80" className="app-main-logo" />
          </div>
          <div className="header-title">
            <h1>{isTR ? 'RollerCoin Hesaplayıcı' : 'RollerCoin Calculator'}</h1>
          </div>
          <div className="header-right-group">
            <div className="lang-switcher">
              <button
                className={`lang-btn ${isTR ? 'active' : ''}`}
                onClick={() => navigate(`/tr/about`)}
                title="Türkçe"
              >
                <img src={trFlag} alt="TR" className="flag-icon" />
                <span className="lang-text">Türkçe</span>
              </button>
              <button
                className={`lang-btn ${!isTR ? 'active' : ''}`}
                onClick={() => navigate(`/en/about`)}
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
        {isTR ? <AboutTR /> : <AboutEN />}
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

export default AboutPage;
