import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';

// Support platform icons
import iconChainers from '../assets/support/chainers.png';
import iconChainersHeroes from '../assets/support/chainers_heroes.jpg';
import iconRollerTap from '../assets/support/rollertap.jpg';
import iconMystNodes from '../assets/support/mystnodes.png';
import grass from "../assets/support/grass.jpg";
import solSiege from "../assets/support/solsiege.png";
import honeygain from "../assets/support/honeygain.jpg";
import immutable from "../assets/support/immutable.png";
import freecash from "../assets/support/freecash.png";

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
    { id: 'mystNodes', name: 'MystNodes', url: 'https://mystnodes.co/?referral_code=K9ugNp7ocqpm5zQQTydIWVrm5tQSZdAJQn73l3k4', icon: iconMystNodes },
    { id: 'grass', name: 'Grass', url: 'https://app.grass.io/register?referralCode=bnXnt4EYb8xnTVw', icon: grass },
    { id: 'solsiege', name: 'SolSiege', url: 'https://solsiege.com?ref=2KPP58WL', icon: solSiege },
    { id: 'immutable', name: 'Immutable', url: 'https://play.immutable.com/referral/share/2wsMMY?utm_source=referral', icon: immutable },
    { id: 'honeygain', name: 'Honeygain', url: 'https://join.honeygain.com/123KED5C', icon: honeygain },
    { id: 'freecash', name: 'Freecash', url: 'https://freecash.com/r/keinyx03', icon: freecash },
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
