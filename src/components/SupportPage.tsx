import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import appLogo from '../assets/logo.png';
import trFlag from '../assets/flags/tr.svg';
import gbFlag from '../assets/flags/gb.svg';

// Support platform icons
import iconChainers from '../assets/support/chainers.png';
import iconChainersHeroes from '../assets/support/chainers_heroes.jpg';
import iconRollerTap from '../assets/support/rollertap.jpg';
import iconHoneygain from '../assets/support/honeygain.jpg';
import iconMystNodes from '../assets/support/mystnodes.png';
import iconOnlyFunds from '../assets/support/onlyfunds.jpg';
import iconStellarBot from '../assets/support/stellarbot.png';
import iconBirdsEmpire from '../assets/support/birdsempire.jpg';
import iconGrowTea from '../assets/support/growtea.jpg';
import iconTonBirds from '../assets/support/tonbirds.jpg';

// Coin icons
import iconBtc from '../assets/coins/btc.svg';
import iconEth from '../assets/coins/eth.svg';
import iconBnb from '../assets/coins/bnb.svg';
import iconSol from '../assets/coins/sol.svg';
import iconMatic from '../assets/coins/matic.svg';
import iconTrx from '../assets/coins/trx.svg';

const CopyableAddress = ({ label, address, icon }: { label: string, address: string, icon?: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="crypto-donation-card">
      <div className="crypto-label">
        {icon && <img src={icon} alt="" className="crypto-label-icon" />}
        {label}
      </div>
      <div className="crypto-address-wrapper">
        <code className="crypto-address">{address}</code>
        <button className={`copy-btn ${copied ? 'copied' : ''}`} onClick={handleCopy}>
          {copied ? '✓' : '📋'}
        </button>
      </div>
    </div>
  );
};

const SupportTR: React.FC = () => (
  <article className="static-content support-container">
    <h1>Destek &amp; Referanslar</h1>

    <div className="disclaimer-box warning">
      <strong>Yasal Uyarı:</strong> Burada paylaşılan hiçbir bağlantı, site, oyun veya Telegram botu doğrudan sponsorumuz değildir. Bu projelerle hiçbir geliştirici bağımız bulunmamaktadır. Hiçbiri yatırım tavsiyesi (YTD) değildir. Sadece kendi kullandığımız ve faydalı bulduğumuz araçlardır. Sitemize destek olmak isterseniz, aşağıdaki referans bağlantılarımızı kullanarak bu servislere kayıt olabilirsiniz.
    </div>

    <section className="support-section">
      <h2>🔗 Önerilen Platformlar ve Botlar</h2>
      <div className="referral-grid">

        <a href="https://chainers.io/?r=mhnobucr" target="_blank" rel="noopener noreferrer" className="referral-card">
          <div className="referral-card-header">
            <img src={iconChainers} alt="Chainers" className="referral-icon" />
            <h3>Chainers (Web)</h3>
          </div>
          <p>Her gün bedava NFT veya token kazanabileceğiniz eğlenceli ve gelişmekte olan bir kripto Web3 oyunu. Bedava kartları toplayarak ilerleyebilirsiniz.</p>
        </a>

        <a href="https://t.me/chainers_heroes_bot?start=1276468423" target="_blank" rel="noopener noreferrer" className="referral-card">
          <div className="referral-card-header">
            <img src={iconChainersHeroes} alt="Chainers Heroes" className="referral-icon" />
            <h3>Chainers Heroes Bot (Telegram)</h3>
          </div>
          <p>Chainers ekosisteminin Telegram üzerinden oynanan versiyonu. Tıklayarak (Tap) veya görev yaparak oyun içi ödüller biriktirin.</p>
        </a>

        <a href="https://t.me/rollertap_bot?start=1276468423" target="_blank" rel="noopener noreferrer" className="referral-card">
          <div className="referral-card-header">
            <img src={iconRollerTap} alt="RollerTap" className="referral-icon" />
            <h3>RollerTap Bot (Telegram)</h3>
          </div>
          <p>RollerCoin ile benzer bir "Tap to Earn" mantığında çalışan, giderek popülerleşen ödül odaklı yeni bir proje.</p>
        </a>

        <a href="https://join.honeygain.com/TEMELEB8F7" target="_blank" rel="noopener noreferrer" className="referral-card">
          <div className="referral-card-header">
            <img src={iconHoneygain} alt="Honeygain" className="referral-icon" />
            <h3>Honeygain</h3>
          </div>
          <p>Cihazınızın kullanmadığı internet bant genişliğini (bandwith) arka planda paylaşarak tamamen pasif gelir (Dolar/Kripto) elde etmenizi sağlayan uygulama.</p>
        </a>

        <a href="https://mystnodes.co/?referral_code=K9ugNp7ocqpm5zQQTydIWVrm5tQSZdAJQn73l3k4" target="_blank" rel="noopener noreferrer" className="referral-card">
          <div className="referral-card-header">
            <img src={iconMystNodes} alt="MystNodes" className="referral-icon" />
            <h3>MystNodes</h3>
          </div>
          <p>Kendi cihazınızda küçük bir düğüm (node) çalıştırarak kripto (MYST) geliri elde etmenize olanak tanıyan altyapı paylaşım projesi.</p>
        </a>

        <a href="https://t.me/TheOnlyFunds_Bot?start=241516" target="_blank" rel="noopener noreferrer" className="referral-card">
          <div className="referral-card-header">
            <img src={iconOnlyFunds} alt="TheOnlyFunds" className="referral-icon" />
            <h3>TheOnlyFunds Bot (Telegram)</h3>
          </div>
          <p>Telegram üzerinde görev ve oyun mantığı ile potansiyel airdrop ödülleri dağıtan kullanışlı bir mini uygulama.</p>
        </a>

        <a href="https://t.me/cointbot_bit_bot?start=ref_136770_te7" target="_blank" rel="noopener noreferrer" className="referral-card">
          <div className="referral-card-header">
            <img src={iconStellarBot} alt="CoinTBot" className="referral-icon" />
            <h3>StellarBot (Telegram)</h3>
          </div>
          <p>Kripto para kazanç ve görev dünyasına odaklanan, Telegram üzerinden kolayca etkileşime geçilebilecek yeni nesil bir bot.</p>
        </a>

        <a href="https://t.me/BirdsEmpireBot?start=445772" target="_blank" rel="noopener noreferrer" className="referral-card">
          <div className="referral-card-header">
            <img src={iconBirdsEmpire} alt="Birds Empire" className="referral-icon" />
            <h3>Birds Empire Bot (Telegram)</h3>
          </div>
          <p>Token/Coin toplama ekonomisine sahip popüler eğlencelik bir kuş imparatorluğu oyunu.</p>
        </a>

        <a href="https://t.me/GrowTeaBot/app?startapp=1276468423" target="_blank" rel="noopener noreferrer" className="referral-card">
          <div className="referral-card-header">
            <img src={iconGrowTea} alt="GrowTeaBot" className="referral-icon" />
            <h3>GrowTeaBot (Telegram)</h3>
          </div>
          <p>Hem eğlenip hem de puan (token) kazanabileceğiniz ve zamanla airdrop ihtimali taşıyan mini bir Telegram uygulaması.</p>
        </a>

        <a href="https://t.me/Ton_Birds_Bot?start=266710" target="_blank" rel="noopener noreferrer" className="referral-card">
          <div className="referral-card-header">
            <img src={iconTonBirds} alt="TON Birds" className="referral-icon" />
            <h3>TON Birds Bot (Telegram)</h3>
          </div>
          <p>TON Blockchain üzerinde geliştirilmiş ve The Open Network airdropları ile entegre uçan kuşlar tabanlı oyun.</p>
        </a>

      </div>
    </section>

    <section className="support-section">
      <h2>☕ Kripto Bağışları</h2>
      <p>Bu hesaplayıcıyı geliştirmek ve sunucu maliyetlerini (alan adı vb.) karşılamak için projemi kahve ısmarlayarak destekleyebilirsiniz. Tüm destekleriniz için çok teşekkür ederim!</p>

      <div className="donation-grid">
        <CopyableAddress icon={iconBtc} label="Bitcoin (BTC)" address="bc1qynmu7c78r9mf9u3w4u90d6rq2qhdt95ajqrsum" />
        <CopyableAddress icon={iconEth} label="Ethereum (ETH) - ERC20" address="0x702aE8866AAa6832Bd5134df61a9a9e44634019f" />
        <CopyableAddress icon={iconBnb} label="Binance Coin (BNB)" address="0x702aE8866AAa6832Bd5134df61a9a9e44634019f" />
        <CopyableAddress icon={iconSol} label="Solana (SOL)" address="Fh2kJhbCsj4vUbq9162qiL73h2UHbaBNtWc5qrmvif7q" />
        <CopyableAddress icon={iconMatic} label="Polygon (MATIC/POL)" address="0x702aE8866AAa6832Bd5134df61a9a9e44634019f" />
        <CopyableAddress icon={iconTrx} label="TRON (TRX)" address="TGDiPJXsAHncA1FBsd4ihXMk6euRPHsvHt" />
      </div>
    </section>
  </article>
);

const SupportEN: React.FC = () => (
  <article className="static-content support-container">
    <h1>Support &amp; Referrals</h1>

    <div className="disclaimer-box warning">
      <strong>Disclaimer:</strong> None of the links, games, or Telegram bots shared here are our official sponsors. We have no developer affiliation with any of these projects. None of this is Financial Advice (NFA). These are just tools we personally use and find interesting. If you wish to support our site, you can register for these services using our referral links below.
    </div>

    <section className="support-section">
      <h2>🔗 Recommended Platforms &amp; Bots</h2>
      <div className="referral-grid">

        <a href="https://chainers.io/?r=mhnobucr" target="_blank" rel="noopener noreferrer" className="referral-card">
          <div className="referral-card-header">
            <img src={iconChainers} alt="Chainers" className="referral-icon" />
            <h3>Chainers (Web)</h3>
          </div>
          <p>A fun and growing Web3 crypto game where you can get free NFTs or tokens daily. Gather free cards to progress.</p>
        </a>

        <a href="https://t.me/chainers_heroes_bot?start=1276468423" target="_blank" rel="noopener noreferrer" className="referral-card">
          <div className="referral-card-header">
            <img src={iconChainersHeroes} alt="Chainers Heroes" className="referral-icon" />
            <h3>Chainers Heroes Bot (Telegram)</h3>
          </div>
          <p>The Telegram integration of the Chainers ecosystem. Earn in-game rewards by tapping and completing quests.</p>
        </a>

        <a href="https://t.me/rollertap_bot?start=1276468423" target="_blank" rel="noopener noreferrer" className="referral-card">
          <div className="referral-card-header">
            <img src={iconRollerTap} alt="RollerTap" className="referral-icon" />
            <h3>RollerTap Bot (Telegram)</h3>
          </div>
          <p>A "Tap to Earn" project similar in theme to RollerCoin, gaining popularity with reward-oriented mechanics.</p>
        </a>

        <a href="https://join.honeygain.com/TEMELEB8F7" target="_blank" rel="noopener noreferrer" className="referral-card">
          <div className="referral-card-header">
            <img src={iconHoneygain} alt="Honeygain" className="referral-icon" />
            <h3>Honeygain</h3>
          </div>
          <p>Earn passive income (USD/Crypto) in the background simply by sharing your device's unused internet bandwidth.</p>
        </a>

        <a href="https://mystnodes.co/?referral_code=K9ugNp7ocqpm5zQQTydIWVrm5tQSZdAJQn73l3k4" target="_blank" rel="noopener noreferrer" className="referral-card">
          <div className="referral-card-header">
            <img src={iconMystNodes} alt="MystNodes" className="referral-icon" />
            <h3>MystNodes</h3>
          </div>
          <p>An infrastructure-sharing project that allows you to earn crypto (MYST) by running a lightweight node on your device.</p>
        </a>

        <a href="https://t.me/TheOnlyFunds_Bot?start=241516" target="_blank" rel="noopener noreferrer" className="referral-card">
          <div className="referral-card-header">
            <img src={iconOnlyFunds} alt="TheOnlyFunds" className="referral-icon" />
            <h3>TheOnlyFunds Bot (Telegram)</h3>
          </div>
          <p>A handy Telegram mini-app distributing potential airdrop rewards via tasks and game logic.</p>
        </a>

        <a href="https://t.me/cointbot_bit_bot?start=ref_136770_te7" target="_blank" rel="noopener noreferrer" className="referral-card">
          <div className="referral-card-header">
            <img src={iconStellarBot} alt="CoinTBot" className="referral-icon" />
            <h3>StellarBot (Telegram)</h3>
          </div>
          <p>A next-generation Telegram bot focused on crypto mining tasks and interactions.</p>
        </a>

        <a href="https://t.me/BirdsEmpireBot?start=445772" target="_blank" rel="noopener noreferrer" className="referral-card">
          <div className="referral-card-header">
            <img src={iconBirdsEmpire} alt="Birds Empire" className="referral-icon" />
            <h3>Birds Empire Bot (Telegram)</h3>
          </div>
          <p>A popular bird empire game with a token/coin collecting economy inside Telegram.</p>
        </a>

        <a href="https://t.me/GrowTeaBot/app?startapp=1276468423" target="_blank" rel="noopener noreferrer" className="referral-card">
          <div className="referral-card-header">
            <img src={iconGrowTea} alt="GrowTeaBot" className="referral-icon" />
            <h3>GrowTeaBot (Telegram)</h3>
          </div>
          <p>A mini Telegram game where you earn points by playing, carrying potential future airdrop opportunities.</p>
        </a>

        <a href="https://t.me/Ton_Birds_Bot?start=266710" target="_blank" rel="noopener noreferrer" className="referral-card">
          <div className="referral-card-header">
            <img src={iconTonBirds} alt="TON Birds" className="referral-icon" />
            <h3>TON Birds Bot (Telegram)</h3>
          </div>
          <p>A flying birds game built on the TON Blockchain and integrated with The Open Network airdrop ecosystem.</p>
        </a>

      </div>
    </section>

    <section className="support-section">
      <h2>☕ Crypto Donations</h2>
      <p>If you enjoy using this calculator and want to help cover server and domain costs, consider buying me a coffee. All support is highly appreciated!</p>

      <div className="donation-grid">
        <CopyableAddress icon={iconBtc} label="Bitcoin (BTC)" address="bc1qynmu7c78r9mf9u3w4u90d6rq2qhdt95ajqrsum" />
        <CopyableAddress icon={iconEth} label="Ethereum (ETH) - ERC20" address="0x702aE8866AAa6832Bd5134df61a9a9e44634019f" />
        <CopyableAddress icon={iconBnb} label="Binance Coin (BNB)" address="0x702aE8866AAa6832Bd5134df61a9a9e44634019f" />
        <CopyableAddress icon={iconSol} label="Solana (SOL)" address="Fh2kJhbCsj4vUbq9162qiL73h2UHbaBNtWc5qrmvif7q" />
        <CopyableAddress icon={iconMatic} label="Polygon (MATIC/POL)" address="0x702aE8866AAa6832Bd5134df61a9a9e44634019f" />
        <CopyableAddress icon={iconTrx} label="TRON (TRX)" address="TGDiPJXsAHncA1FBsd4ihXMk6euRPHsvHt" />
      </div>
    </section>
  </article>
);

function SupportPage() {
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
        <title>{isTR ? 'Destek & Referanslar | RollerCoin Hesaplayıcı' : 'Support & Referrals | RollerCoin Calculator'}</title>
        <meta
          name="description"
          content={
            isTR
              ? 'Projeye kripto olarak destek olabilir veya referans bağlantılarımızı kullanarak bize katkıda bulunabilirsiniz.'
              : 'You can support the project via crypto donations or by using our referral links.'
          }
        />
        <link rel="canonical" href={`https://rollercoincalculator.app/${lang}/support`} />
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
              <Link to={`/${lang}/faq`} className="nav-link">{isTR ? 'SSS' : 'FAQ'}</Link>
              <Link to={`/${lang}/support`} className="nav-link active">{isTR ? 'Destek' : 'Support'} ☕</Link>
            </div>
            <div className="lang-switcher">
              <button
                className={`lang-btn ${isTR ? 'active' : ''}`}
                onClick={() => navigate(`/tr/support`)}
                title="Türkçe"
              >
                <img src={trFlag} alt="TR" className="flag-icon" />
                <span className="lang-text">Türkçe</span>
              </button>
              <button
                className={`lang-btn ${!isTR ? 'active' : ''}`}
                onClick={() => navigate(`/en/support`)}
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
        {isTR ? <SupportTR /> : <SupportEN />}
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

export default SupportPage;
