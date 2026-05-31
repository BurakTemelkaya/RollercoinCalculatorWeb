import { ReactNode, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useLanguageSwitcher } from '../hooks/useLanguageSwitcher';
import RadixSelect from './RadixSelect';
import AdminNavigation from './admin/AdminNavigation';
import './BlogPage.css';

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  isAdmin?: boolean;
  adminBackTo?: string;
  adminBackLabel?: string;
}

export default function DashboardLayout({ children, title, isAdmin, adminBackTo, adminBackLabel }: DashboardLayoutProps) {
  const { lang } = useParams<{ lang: string }>();
  const { t } = useTranslation();
  const { currentLang, changeLanguage, SUPPORTED_LANGUAGES } = useLanguageSwitcher();
  const { logout } = useAuth();

  useEffect(() => {
    document.body.classList.add('hide-global-ads');
    return () => {
      document.body.classList.remove('hide-global-ads');
    };
  }, []);

  const sidebarLinkStyle = (active: boolean) => ({
    display: 'flex', alignItems: 'center', gap: 12,
    color: active ? '#f8fafc' : '#e2e8f0',
    background: active ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
    padding: '10px 16px',
    textDecoration: 'none', fontSize: '0.95rem',
    fontWeight: active ? 600 : 500, transition: 'all 0.2s',
    borderLeft: active ? '3px solid #8b5cf6' : '3px solid transparent',
    borderRadius: '0 8px 8px 0'
  });

  const isMyBlogs = !isAdmin; // For now user panel is mostly "My Blogs"

  return (
    <div className="dashboard-layout" style={{ display: 'flex', minHeight: '100vh', background: '#0f0f1e', color: '#fff' }} data-color-mode="dark">
      <Helmet>
        <title>{title} | Rollercoin Calculator</title>
      </Helmet>

      {/* Sidebar */}
      <aside style={{
        width: '260px',
        background: 'rgba(15, 15, 30, 0.8)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 16px',
        boxSizing: 'border-box',
        flexShrink: 0
      }}>
        <div style={{ marginBottom: '32px', paddingLeft: '8px' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#f8fafc' }}>
            {isAdmin ? 'Admin Panel' : 'Kullanıcı Paneli'}
          </h2>
        </div>

        {isAdmin ? (
          <AdminNavigation backTo={adminBackTo} backLabel={adminBackLabel} />
        ) : (
          <>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, margin: '0 -16px' }}>
              <Link
                to={`/${lang}`}
                style={sidebarLinkStyle(false)}
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                {t('nav.home', 'Ana Sayfa')}
              </Link>
              <Link
                to={`/${lang}/my-blogs`}
                style={sidebarLinkStyle(isMyBlogs)}
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 15v2m-6 4h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2zm10-10V7a4 4 0 0 0-8 0v4h8z" /></svg>
                {t('nav.myBlogs', 'Bloglarım')}
              </Link>
            </nav>

            <div style={{ marginTop: 'auto', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <RadixSelect
                value={currentLang}
                onValueChange={changeLanguage}
                options={SUPPORTED_LANGUAGES}
                placeholder="Language"
                showSelectedIcon={true}
              />
              <Link
                to={`/${lang}/change-password`}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: 'rgba(59, 130, 246, 0.1)',
                  color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.2)',
                  padding: '10px 14px', borderRadius: 8,
                  textDecoration: 'none', fontSize: '0.9rem',
                  fontWeight: 500, fontFamily: 'inherit',
                  transition: 'all 0.2s',
                  justifyContent: 'center'
                }}
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" /></svg>
                {t('auth.changePassword', 'Şifre Değiştir')}
              </Link>
              <button
                onClick={logout}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.2)',
                  padding: '10px 14px', borderRadius: 8,
                  cursor: 'pointer', fontSize: '0.9rem',
                  fontWeight: 500, fontFamily: 'inherit',
                  transition: 'all 0.2s',
                  justifyContent: 'center'
                }}
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                {t('auth.logout', 'Çıkış Yap')}
              </button>
            </div>
          </>
        )}
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '32px', boxSizing: 'border-box', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  );
}
