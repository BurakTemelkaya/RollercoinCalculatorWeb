import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import appLogo from '../assets/logo.png';
import RadixSelect, { SelectOption } from './RadixSelect';
import Footer from './Footer';
import { useAuth } from '../contexts/AuthContext';
import { GlobalAds } from './GlobalAds';

export const SUPPORTED_LANGUAGES: SelectOption[] = [
  { value: 'en', label: 'English', icon: 'https://flagcdn.com/w20/gb.png' },
  { value: 'tr', label: 'Türkçe', icon: 'https://flagcdn.com/w20/tr.png' },
  { value: 'zh', label: 'Chinese Simplified', icon: 'https://flagcdn.com/w20/cn.png' },
  { value: 'fr', label: 'Français', icon: 'https://flagcdn.com/w20/fr.png' },
  { value: 'id', label: 'Bahasa Indonesia', icon: 'https://flagcdn.com/w20/id.png' },
  { value: 'pt', label: 'Português', icon: 'https://flagcdn.com/w20/pt.png' },
  { value: 'ru', label: 'Русский', icon: 'https://flagcdn.com/w20/ru.png' },
  { value: 'es', label: 'Español', icon: 'https://flagcdn.com/w20/es.png' },
  { value: 'de', label: 'Deutsch', icon: 'https://flagcdn.com/w20/de.png' },
];

const DailyBonusQuest = React.lazy(() => import('./DailyBonusQuest'));

import { NAV_ICONS } from '../utils/icons';

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
  const [country, setCountry] = useState<string | null>(null);

  useEffect(() => {
    fetch('https://get.geojs.io/v1/ip/country.json')
      .then(res => res.json())
      .then(data => setCountry(data.country))
      .catch(() => setCountry('UNKNOWN')); // If adblocker blocks geojs, default to UNKNOWN
  }, []);

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
    if (adsBlocked || !country) return;

    const timer = setTimeout(() => {
      const isTR = country === 'TR';
      const showCoinzilla = isTR || country === 'UNKNOWN';

      if (showCoinzilla) {
        (window as any).coinzilla_display = (window as any).coinzilla_display || [];
        const c_display_preferences: any = {};
        c_display_preferences.zone = "83069e710174ee88650";
        c_display_preferences.width = "300";
        c_display_preferences.height = "250";
        (window as any).coinzilla_display.push(c_display_preferences);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [adsBlocked, country]);

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

  const MIGRATION_NOTICES: Record<string, string> = {
    tr: '31 Temmuz 00:00 ile 03:00 (Türkiye Saati) arasında sunucu taşıma işlemleri gerçekleştirilecektir. Bu saatlerde site çalışmayabilir.',
    en: 'Server migration will take place on July 30th between 21:00 and 00:00 UTC. The site may be unavailable during these hours.',
    zh: '服务器迁移将于 7 月 30 日 21:00 至 00:00 (UTC) 进行。在此期间网站可能无法访问。',
    fr: 'Une migration de serveur aura lieu le 30 juillet entre 21h00 et 00h00 (UTC). Le site pourrait être indisponible pendant ces heures.',
    id: 'Migrasi server akan dilakukan pada 30 Juli antara pukul 21:00 hingga 00:00 UTC. Situs mungkin tidak dapat diakses selama jam tersebut.',
    pt: 'A migração do servidor ocorrerá em 30 de julho entre 21:00 e 00:00 UTC. O site poderá ficar indisponível durante essas horas.',
    ru: 'Перенос сервера состоится 30 июля с 21:00 до 00:00 (UTC). В это время сайт может быть недоступен.',
    es: 'La migración del servidor se llevará a cabo el 30 de julio entre las 21:00 y las 00:00 UTC. El sitio puede no estar disponible durante estas horas.',
    de: 'Die Servermigration findet am 30. Juli zwischen 21:00 und 00:00 Uhr (UTC) statt. Die Website ist während dieser Zeit möglicherweise nicht erreichbar.'
  };

  return (
    <div className="app-layout">
      {/* Sticky Navigation Bar - outside flex wrappers so sticky works */}
      <nav className="sticky-navbar">
        <div className="sticky-navbar-content">
          <div className="header-logo">
            <Link to={`/${i18n.language}`}>
              <img src={appLogo} alt="Logo" className="app-main-logo" />
            </Link>
          </div>

          <div className="sticky-nav-links desktop-only">
            <Link to={`/${i18n.language}/charts`} className="nav-link">{NAV_ICONS.charts} {t('nav.charts')}</Link>
            <Link to={`/${i18n.language}/events`} className="nav-link">{NAV_ICONS.events} {t('nav.events')}</Link>
            <Link to={`/${i18n.language}/merges`} className="nav-link">{NAV_ICONS.merges} {t('nav.merges')}</Link>
            <Link to={`/${i18n.language}/blog`} className="nav-link">{NAV_ICONS.blog} {t('nav.blog')}</Link>
            <Link to={`/${i18n.language}/faq`} className="nav-link">{NAV_ICONS.faq} {t('nav.faq')}</Link>
            <Link to={`/${i18n.language}/support`} className="nav-link">{NAV_ICONS.support} {t('nav.support')}</Link>
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
          </div>

          <div className="mobile-only" style={{ flex: '1 1 0', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              className="hamburger-btn"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Menu"
            >
              <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
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
      </nav>

      {/* Spacer to compensate for fixed navbar */}
      <div className="navbar-spacer" />

      <GlobalAds adsBlocked={adsBlocked} country={country} />
      <div style={{ flex: 1, minWidth: 0, display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: '100%' }}>
          <div className="calculator-container">
            {/* SEO Tags (defaults — child pages override these via their own Helmet) */}
            <>
              <title>{t('seo.title')}</title>
              <meta name="description" content={t('seo.description')} />
              <link rel="canonical" href={currentUrl} />
              <meta property="og:type" content="website" />
              <meta property="og:title" content={t('seo.title')} />
              <meta property="og:description" content={t('seo.description')} />
              <meta property="og:url" content={currentUrl} />
              <meta property="og:image" content="https://rollercoincalculator.app/icon.png" />
              <meta name="twitter:card" content="summary" />
              <meta name="twitter:title" content={t('seo.title')} />
              <meta name="twitter:description" content={t('seo.description')} />
              <meta name="twitter:image" content="https://rollercoincalculator.app/icon.png" />
            </>

            {/* Page Title - scrolls away, not in sticky bar */}
            <div className="page-title-banner">
              <h1>{t('app.title')}</h1>
            </div>

            {/* Migration Notice Banner */}
            <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', padding: '12px 20px', textAlign: 'center', fontWeight: '500', fontSize: '14px', lineHeight: '1.5', margin: '0 16px 16px 16px' }}>
              {MIGRATION_NOTICES[i18n.language] || MIGRATION_NOTICES['en']}
            </div>

            {/* Top Banner: Daily Quest + Ad */}
            <div className="top-banner-row">
              <div className="top-banner-left">
                <React.Suspense fallback={null}>
                  <DailyBonusQuest />
                </React.Suspense>
                <div className="quick-actions-row">
                  <Link to={`/${i18n.language}/event`} className="quick-action-btn btn-events">{NAV_ICONS.events} {t('tabs.event')}</Link>
                  <Link to={`/${i18n.language}/merges`} className="quick-action-btn btn-merges">{NAV_ICONS.merges} {t('nav.merges')}</Link>
                  <Link to={`/${i18n.language}/support`} className="quick-action-btn btn-support">{NAV_ICONS.support} {t('nav.support')}</Link>
                </div>
              </div>

              {!adsBlocked && country && (
                <div id="top-ad-container" className="top-ad-wrapper" style={{ width: '300px', height: '250px', maxWidth: '100%', overflow: 'hidden', flexShrink: 0 }}>
                  {country === 'TR' || country === 'UNKNOWN' ? (
                    <div className="coinzilla" data-zone="C-83069e710174ee88650"></div>
                  ) : (
                    <div id="frame" style={{ width: '300px', margin: 'auto', zIndex: 99998, height: 'auto' }}>
                      <iframe data-aa='2449310' src='//ad.a-ads.com/2449310/?size=300x250&background_color=1e2433&title_color=fffffe'
                        style={{ border: 0, padding: 0, width: '300px', height: '250px', overflow: 'hidden', display: 'block', margin: 'auto' }}></iframe>
                    </div>
                  )}
                </div>
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
