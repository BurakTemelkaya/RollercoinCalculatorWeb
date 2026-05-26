import { ReactNode } from 'react';
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

  return (
    <div className="blog-page" style={{ paddingTop: 32, minHeight: '100vh', boxSizing: 'border-box' }} data-color-mode="dark">
      <Helmet>
        <title>{title} | Rollercoin Calculator</title>
      </Helmet>

      {isAdmin ? (
        <AdminNavigation backTo={adminBackTo} backLabel={adminBackLabel} />
      ) : (
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 16, paddingBottom: 16,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          flexWrap: 'wrap', gap: 16
        }}>
          <Link
            to={`/${lang}`}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              color: '#a78bfa', textDecoration: 'none',
              fontSize: '0.9rem', fontWeight: 500,
            }}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
            {t('nav.home', 'Ana Sayfa')}
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 140 }}>
              <RadixSelect
                value={currentLang}
                onValueChange={changeLanguage}
                options={SUPPORTED_LANGUAGES}
                placeholder="Language"
                showSelectedIcon={true}
              />
            </div>
            <button
              onClick={logout}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.2)',
                padding: '6px 14px', borderRadius: 8,
                cursor: 'pointer', fontSize: '0.85rem',
                fontWeight: 500, fontFamily: 'inherit',
                transition: 'all 0.2s',
              }}
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
              {t('auth.logout', 'Çıkış Yap')}
            </button>
          </div>
        </div>
      )}

      {children}
    </div>
  );
}
