import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import trFlag from '../assets/flags/tr.svg';
import gbFlag from '../assets/flags/gb.svg';
import appLogo from '../assets/logo.png';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  
  // Extract lang from path part 1, fallback to i18n
  const langFromPath = location.pathname.split('/')[1];
  const lang = (langFromPath === 'tr' || langFromPath === 'en') ? langFromPath : i18n.language;

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Sync language with URL
  useEffect(() => {
    if (lang && (lang === 'tr' || lang === 'en')) {
      if (i18n.language !== lang) {
        i18n.changeLanguage(lang);
      }
      localStorage.setItem('rollercoin_web_language', lang);
      document.documentElement.lang = lang;
    }
  }, [lang, i18n]);

  let normalizedPath = location.pathname;
  if (normalizedPath.endsWith('/') && normalizedPath.length > 1) {
    normalizedPath = normalizedPath.slice(0, -1);
  }
  const currentUrl = `https://rollercoincalculator.app${normalizedPath}`;

  const changeLanguage = (newLang: string) => {
    // Replace current lang in path
    const pathParts = location.pathname.split('/');
    pathParts[1] = newLang;
    navigate(pathParts.join('/'));
  };

  return (
    <div className="app-layout">
      <div style={{ flex: 1, minWidth: 0, display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: '100%' }}>
          <div className="calculator-container">
            {/* SEO Tags */}
            <Helmet>
              <title>{t('seo.title')}</title>
              <meta name="description" content={t('seo.description')} />
              <link rel="canonical" href={currentUrl} />
              <meta property="og:title" content={t('seo.title')} />
              <meta property="og:description" content={t('seo.description')} />
              <meta property="og:url" content={currentUrl} />
              <meta name="twitter:title" content={t('seo.title')} />
              <meta name="twitter:description" content={t('seo.description')} />
            </Helmet>

            {/* Header */}
            <header className="header">
              <div className="header-content">
                <div className="header-logo">
                  <Link to={`/${i18n.language}`}>
                    <img src={appLogo} alt="Logo" width="80" height="80" className="app-main-logo" />
                  </Link>
                </div>
                <div className="header-center">
                  <div className="header-title">
                    <h1>{t('app.title')}</h1>
                  </div>
                  <div className="main-nav-links desktop-only">
                    <Link to={`/${i18n.language}/charts`} className="nav-link">📈 {t('nav.charts')}</Link>
                    <Link to={`/${i18n.language}/events`} className="nav-link">📋 {t('nav.events')}</Link>
                    <Link to={`/${i18n.language}/guides`} className="nav-link">{t('nav.guides')}</Link>
                    <Link to={`/${i18n.language}/blog`} className="nav-link">{t('nav.blog')}</Link>
                    <Link to={`/${i18n.language}/faq`} className="nav-link">{t('nav.faq')}</Link>
                    <Link to={`/${i18n.language}/support`} className="nav-link">{t('nav.support')} ☕</Link>
                  </div>
                </div>
                
                <div className="header-actions">
                  <div className="lang-switcher">
                    <button
                      className={`lang-btn ${i18n.language === 'tr' ? 'active' : ''}`}
                      onClick={() => changeLanguage('tr')}
                      title="Türkçe"
                    >
                      <img src={trFlag} alt="TR" className="flag-icon" />
                      <span className="lang-text">Türkçe</span>
                    </button>
                    <button
                      className={`lang-btn ${i18n.language === 'en' ? 'active' : ''}`}
                      onClick={() => changeLanguage('en')}
                      title="English"
                    >
                      <img src={gbFlag} alt="EN" className="flag-icon" />
                      <span className="lang-text">English</span>
                    </button>
                  </div>
                  <a
                    href="https://github.com/BurakTemelkaya/RollercoinCalculatorWeb"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="github-link"
                    title="GitHub"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                    </svg>
                  </a>
                  <button 
                    className="hamburger-btn mobile-only" 
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    aria-label="Menu"
                  >
                    <svg viewBox="0 0 24 24" width="28" height="28" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="3" y1="12" x2="21" y2="12"></line>
                      <line x1="3" y1="6" x2="21" y2="6"></line>
                      <line x1="3" y1="18" x2="21" y2="18"></line>
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className={`mobile-menu-dropdown ${isMobileMenuOpen ? 'open' : ''}`}>
                 <div className="mobile-nav-content">
                    <Link onClick={() => setIsMobileMenuOpen(false)} to={`/${i18n.language}/charts`} className="mobile-nav-link">📈 {t('nav.charts')}</Link>
                    <Link onClick={() => setIsMobileMenuOpen(false)} to={`/${i18n.language}/events`} className="mobile-nav-link">📋 {t('nav.events')}</Link>
                    <Link onClick={() => setIsMobileMenuOpen(false)} to={`/${i18n.language}/guides`} className="mobile-nav-link">{t('nav.guides')}</Link>
                    <Link onClick={() => setIsMobileMenuOpen(false)} to={`/${i18n.language}/blog`} className="mobile-nav-link">{t('nav.blog')}</Link>
                    <Link onClick={() => setIsMobileMenuOpen(false)} to={`/${i18n.language}/faq`} className="mobile-nav-link">{t('nav.faq')}</Link>
                    <Link onClick={() => setIsMobileMenuOpen(false)} to={`/${i18n.language}/support`} className="mobile-nav-link">{t('nav.support')} ☕</Link>
                 </div>
              </div>
            </header>

            {/* Main Content */}
            <main className="main-content">
              {children}
            </main>

            {/* Footer */}
            <footer className="footer">
              <p>{t('app.footerLink')}</p>
              <p className="footer-note">
                {t('app.footerText')}{' '}
                <a href="https://rollercoin.com/game" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline' }}>
                  rollercoin.com
                </a>
              </p>
              <p className="footer-note">
                <Link to={`/${lang}/about`}>{t('pages.about.title')}</Link>
                {' · '}
                <Link to={`/${lang}/privacy`}>{t('pages.privacy.title')}</Link>
              </p>
            </footer>
          </div>
        </div>
      </div>


    </div>
  );
}
