import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import appLogo from '../assets/logo.png';
import TurnstileProvider from './TurnstileProvider';
import RadixSelect, { SelectOption } from './RadixSelect';
import Footer from './Footer';
import { useAuth } from '../contexts/AuthContext';

export const SUPPORTED_LANGUAGES: SelectOption[] = [
  { value: 'en', label: 'English', icon: 'https://flagcdn.com/w20/gb.png' },
  { value: 'tr', label: 'Türkçe', icon: 'https://flagcdn.com/w20/tr.png' },
  { value: 'zh', label: 'Chinese Simplified', icon: 'https://flagcdn.com/w20/cn.png' },
  { value: 'fr', label: 'Français', icon: 'https://flagcdn.com/w20/fr.png' },
  { value: 'id', label: 'Bahasa Indonesia', icon: 'https://flagcdn.com/w20/id.png' },
  { value: 'pt', label: 'Português', icon: 'https://flagcdn.com/w20/pt.png' },
  { value: 'ru', label: 'Русский', icon: 'https://flagcdn.com/w20/ru.png' },
  { value: 'es', label: 'Español', icon: 'https://flagcdn.com/w20/es.png' },
];

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
  const isValidLang = SUPPORTED_LANGUAGES.some(l => l.value === langFromPath);
  const lang = isValidLang ? langFromPath : i18n.language;

  const { isAuthenticated, isAdmin, logout, user } = useAuth();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Sync language with URL
  useEffect(() => {
    if (lang && SUPPORTED_LANGUAGES.some(l => l.value === lang)) {
      if (i18n.language !== lang) {
        i18n.changeLanguage(lang);
      }
      localStorage.setItem('rollercoin_web_language', lang);
      document.documentElement.lang = lang;
    }
  }, [lang, i18n]);

  // Ad-blocker detection & top banner ad loading
  const [adsBlocked, setAdsBlocked] = useState(false);

  useEffect(() => {
    const checkAdsBlocked = () => {
      if (document.body.classList.contains('ads-blocked')) {
        setAdsBlocked(true);
      }
    };
    const timer = setTimeout(checkAdsBlocked, 2000);
    const observer = new MutationObserver(() => checkAdsBlocked());
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (adsBlocked) return;
    const timer = setTimeout(() => {
      if ((window as any).AdManager) {
        (window as any).AdManager.loadAd('top-ad-container', '2435688', 320, 50);
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [location.pathname, adsBlocked]);

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
      <TurnstileProvider />
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
                    <img src={appLogo} alt="Logo" width="100" height="100" className="app-main-logo" />
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
                    <Link to={`/${i18n.language}/blog`} className="nav-link">{NAV_ICONS.blog} {t('nav.blog')}</Link>
                    <Link to={`/${i18n.language}/faq`} className="nav-link">{NAV_ICONS.faq} {t('nav.faq')}</Link>
                    <Link to={`/${i18n.language}/support`} className="nav-link">{NAV_ICONS.support} {t('nav.support')}</Link>
                  </div>
                </div>

                <div className="header-actions">
                  <div className="lang-switcher">
                    <RadixSelect
                        value={lang}
                        onValueChange={(newLang) => changeLanguage(newLang)}
                        options={SUPPORTED_LANGUAGES}
                        placeholder="Language"
                        showSelectedIcon={true}
                    />
                  </div>

                  {/* Auth Buttons */}
                  <div className="auth-header-btns desktop-only">
                    {isAuthenticated ? (
                      <>
                        {isAdmin && (
                          <Link to={`/${lang}/admin/blogs`} className="header-auth-btn admin-link" title={t('nav.adminPanel')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', width: 32, height: 32, borderRadius: '50%', textDecoration: 'none', padding: 0 }}>
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 15v2m-6 4h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2zm10-10V7a4 4 0 0 0-8 0v4h8z" /></svg>
                          </Link>
                        )}
                        <Link to={`/${lang}/my-blogs`} className="header-auth-btn user-link" title={t('nav.userPanel')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a78bfa', background: 'rgba(124, 58, 237, 0.1)', width: 32, height: 32, borderRadius: '50%', textDecoration: 'none', padding: 0 }}>
                          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                        </Link>
                        <button className="header-auth-btn logout-btn" onClick={logout} title={t('auth.logout')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: '50%', padding: 0 }}>
                          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                        </button>
                      </>
                    ) : (
                      <Link to={`/${lang}/login`} className="header-auth-btn login-link">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" /></svg>
                        {t('auth.login')}
                      </Link>
                    )}
                  </div>

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
                  <div className="mobile-auth-divider" />
                  {isAuthenticated ? (
                    <>
                      {isAdmin && (
                        <Link onClick={() => setIsMobileMenuOpen(false)} to={`/${i18n.language}/admin/blogs`} className="mobile-nav-link">
                          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" className="nav-icon"><path d="M12 15v2m-6 4h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2zm10-10V7a4 4 0 0 0-8 0v4h8z" /></svg>
                          {t('admin.title')}
                        </Link>
                      )}
                      <button onClick={() => { logout(); setIsMobileMenuOpen(false); }} className="mobile-nav-link mobile-logout-btn">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" className="nav-icon"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                        {t('auth.logout')} {user?.email ? `(${user.email.split('@')[0]})` : ''}
                      </button>
                    </>
                  ) : (
                    <Link onClick={() => setIsMobileMenuOpen(false)} to={`/${i18n.language}/login`} className="mobile-nav-link">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" className="nav-icon"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" /></svg>
                      {t('auth.login')}
                    </Link>
                  )}
                </div>
              </div>
            </header>

            {/* Top Banner: Daily Quest + Ad */}
            <div className="top-banner-row">
              <React.Suspense fallback={null}>
                <DailyBonusQuest />
              </React.Suspense>
              {!adsBlocked && (
                <div id="top-ad-container" className="top-ad-wrapper" style={{ width: '320px', height: '50px', maxWidth: '100%', overflow: 'hidden', flexShrink: 0 }}></div>
              )}
              {adsBlocked && (
                <div className="adblocker-notice">
                  <p>{t('ads.blockerNotice')}</p>
                  <Link to={`/${i18n.language}/support`} className="adblocker-support-link">
                    ☕ {t('ads.supportLink')}
                  </Link>
                </div>
              )}
            </div>

            {/* Main Content */}
            <main className="main-content">
              {children}
            </main>

            {/* Footer */}
            <Footer />
          </div>
        </div>
      </div>
    </div>
  );
}
