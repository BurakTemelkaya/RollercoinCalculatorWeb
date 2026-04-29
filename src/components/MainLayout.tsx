import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import trFlag from '../assets/flags/tr.svg';
import gbFlag from '../assets/flags/gb.svg';
import appLogo from '../assets/logo.png';

const DailyBonusQuest = React.lazy(() => import('./DailyBonusQuest'));

export const NAV_ICONS = {
  charts: <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" className="nav-icon"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>,
  events: <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" className="nav-icon"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>,
  merges: <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" className="nav-icon"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>,
  guides: <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" className="nav-icon"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>,
  blog: <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" className="nav-icon"><path d="M20 14.66V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5.34"></path><polygon points="18 2 22 6 12 16 8 16 8 12 18 2"></polygon></svg>,
  faq: <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" className="nav-icon"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>,
  support: <svg className="nav-icon animated-coffee" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4" className="steam-1"></line><line x1="10" y1="1" x2="10" y2="4" className="steam-2"></line><line x1="14" y1="1" x2="14" y2="4" className="steam-3"></line></svg>
};

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

  // Load Top Banner Ad (Always use 320x50 to fit next to quest card)
  useEffect(() => {
    const timer = setTimeout(() => {
      if ((window as any).AdManager) {
        (window as any).AdManager.loadAd('top-ad-container', '2435688', 320, 50, '21bf0654ac3ca0059c5d930d8ff532c8', 320, 50);
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [location.pathname]);

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
                    <Link to={`/${i18n.language}/charts`} className="nav-link">{NAV_ICONS.charts} {t('nav.charts')}</Link>
                    <Link to={`/${i18n.language}/events`} className="nav-link">{NAV_ICONS.events} {t('nav.events')}</Link>
                    <Link to={`/${i18n.language}/merges`} className="nav-link">{NAV_ICONS.merges} {t('nav.merges')}</Link>
                    <Link to={`/${i18n.language}/guides`} className="nav-link">{NAV_ICONS.guides} {t('nav.guides')}</Link>
                    <Link to={`/${i18n.language}/blog`} className="nav-link">{NAV_ICONS.blog} {t('nav.blog')}</Link>
                    <Link to={`/${i18n.language}/faq`} className="nav-link">{NAV_ICONS.faq} {t('nav.faq')}</Link>
                    <Link to={`/${i18n.language}/support`} className="nav-link">{NAV_ICONS.support} {t('nav.support')}</Link>
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
                  <a
                    href="https://t.me/rollercointurkiyetr/1"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="telegram-link"
                    title="Telegram"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
                      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.223-.548.223l.188-2.85 5.18-4.686c.223-.195-.054-.282-.346-.088l-6.4 4.024-2.76-.86c-.6-.185-.615-.595.125-.89l10.81-4.17c.5-.192.936.104.75 1.025z" />
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
                  <Link onClick={() => setIsMobileMenuOpen(false)} to={`/${i18n.language}/charts`} className="mobile-nav-link">{NAV_ICONS.charts} {t('nav.charts')}</Link>
                  <Link onClick={() => setIsMobileMenuOpen(false)} to={`/${i18n.language}/events`} className="mobile-nav-link">{NAV_ICONS.events} {t('nav.events')}</Link>
                  <Link onClick={() => setIsMobileMenuOpen(false)} to={`/${i18n.language}/merges`} className="mobile-nav-link">{NAV_ICONS.merges} {t('nav.merges')}</Link>
                  <Link onClick={() => setIsMobileMenuOpen(false)} to={`/${i18n.language}/guides`} className="mobile-nav-link">{NAV_ICONS.guides} {t('nav.guides')}</Link>
                  <Link onClick={() => setIsMobileMenuOpen(false)} to={`/${i18n.language}/blog`} className="mobile-nav-link">{NAV_ICONS.blog} {t('nav.blog')}</Link>
                  <Link onClick={() => setIsMobileMenuOpen(false)} to={`/${i18n.language}/faq`} className="mobile-nav-link">{NAV_ICONS.faq} {t('nav.faq')}</Link>
                  <Link onClick={() => setIsMobileMenuOpen(false)} to={`/${i18n.language}/support`} className="mobile-nav-link">{NAV_ICONS.support} {t('nav.support')}</Link>
                </div>
              </div>
            </header>

            {/* Top Banner: Daily Quest + Ad */}
            <div className="top-banner-row">
              <React.Suspense fallback={null}>
                <DailyBonusQuest />
              </React.Suspense>
              <div id="top-ad-container" className="top-ad-wrapper" style={{ width: '320px', height: '50px', maxWidth: '100%', overflow: 'hidden', flexShrink: 0 }}></div>
            </div>

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
