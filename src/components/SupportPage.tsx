import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';

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

export default function SupportPage() {
  const { lang } = useParams<{ lang: string }>();
  const { t } = useTranslation();

  const referrals = [
    { id: 'chainers', name: 'Chainers (Web)', url: 'https://chainers.io/?r=mhnobucr', icon: iconChainers },
    { id: 'chainersHeroes', name: 'Chainers Heroes Bot (Telegram)', url: 'https://t.me/chainers_heroes_bot?start=1276468423', icon: iconChainersHeroes },
    { id: 'rollerTap', name: 'RollerTap Bot (Telegram)', url: 'https://t.me/rollertap_bot?start=1276468423', icon: iconRollerTap },
    { id: 'honeygain', name: 'Honeygain', url: 'https://join.honeygain.com/TEMELEB8F7', icon: iconHoneygain },
    { id: 'mystNodes', name: 'MystNodes', url: 'https://mystnodes.co/?referral_code=K9ugNp7ocqpm5zQQTydIWVrm5tQSZdAJQn73l3k4', icon: iconMystNodes },
    { id: 'onlyFunds', name: 'TheOnlyFunds Bot (Telegram)', url: 'https://t.me/TheOnlyFunds_Bot?start=241516', icon: iconOnlyFunds },
    { id: 'stellarBot', name: 'StellarBot (Telegram)', url: 'https://t.me/cointbot_bit_bot?start=ref_136770_te7', icon: iconStellarBot },
    { id: 'birdsEmpire', name: 'Birds Empire Bot (Telegram)', url: 'https://t.me/BirdsEmpireBot?start=445772', icon: iconBirdsEmpire },
    { id: 'growTea', name: 'GrowTeaBot (Telegram)', url: 'https://t.me/GrowTeaBot/app?startapp=1276468423', icon: iconGrowTea },
    { id: 'tonBirds', name: 'TON Birds Bot (Telegram)', url: 'https://t.me/Ton_Birds_Bot?start=266710', icon: iconTonBirds },
  ];

  return (
    <div className="static-page-container">
      <Helmet>
        <title>{t('pages.support.title')} | {t('app.title')}</title>
        <meta name="description" content={t('seo.description')} />
        <link rel="canonical" href={`https://rollercoincalculator.app/${lang}/support`} />
      </Helmet>

      <div className="static-back-link">
        <Link to={`/${lang}`}>← {t('event.backToCalc')}</Link>
      </div>

      <article className="static-content support-container">
        <h1>{t('pages.support.title')}</h1>

        <div className="disclaimer-box warning">
          <strong>{t('event.multiplier')} Disclaimer:</strong> {t('pages.support.disclaimer')}
        </div>

        <section className="support-section">
          <h2>{t('pages.support.referrals')}</h2>
          <div className="referral-grid">
            {referrals.map((ref) => (
              <a key={ref.id} href={ref.url} target="_blank" rel="noopener noreferrer" className="referral-card">
                <div className="referral-card-header">
                  <img src={ref.icon} alt={ref.name} className="referral-icon" />
                  <h3>{ref.name}</h3>
                </div>
                <p>{t(`pages.support.desc.${ref.id}`)}</p>
              </a>
            ))}
          </div>
        </section>

        <section className="support-section">
          <h2>{t('pages.support.donations')}</h2>
          <p>{t('pages.support.p1')}</p>

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
    </div>
  );
}
