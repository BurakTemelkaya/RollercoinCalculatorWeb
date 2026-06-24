import { Link, useLocation, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import RadixSelect from '../RadixSelect';
import { useLanguageSwitcher } from '../../hooks/useLanguageSwitcher';
import '../BlogPage.css';

interface AdminNavigationProps {
  backTo?: string;
  backLabel?: string;
}

export default function AdminNavigation({ backTo, backLabel }: AdminNavigationProps) {
  const { lang } = useParams<{ lang: string }>();
  const { t } = useTranslation();
  const { currentLang, changeLanguage, SUPPORTED_LANGUAGES } = useLanguageSwitcher();
  const location = useLocation();

  const isBlogs = location.pathname.includes('/admin/blogs');
  const isComments = location.pathname.includes('/admin/comments');
  const isReviews = location.pathname.includes('/admin/reviews');
  const isRollercoin = location.pathname.includes('/admin/rollercoin-account');
  const isUsers = location.pathname.includes('/admin/users');

  const { logout } = useAuth();

  const tabStyle = (active: boolean) => ({
    textDecoration: 'none' as const,
    color: active ? '#f8fafc' : '#94a3b8',
    background: active ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
    fontWeight: active ? 600 : 500,
    borderLeft: active ? '3px solid #8b5cf6' : '3px solid transparent',
    padding: '10px 16px',
    borderRadius: '0 8px 8px 0',
    transition: 'all 0.2s ease',
    display: 'flex' as const,
    alignItems: 'center' as const,
    gap: 12,
    fontSize: '0.95rem'
  });

  const actualBackTo = backTo || `/${lang}`;
  const actualBackLabel = backLabel || t('event.backToCalc', 'Hesaplayıcıya Dön');

  return (
    <>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, margin: '0 -16px' }}>
        <Link
          to={actualBackTo}
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            color: '#e2e8f0',
            padding: '10px 16px',
            textDecoration: 'none', fontSize: '0.95rem',
            fontWeight: 500, transition: 'all 0.2s',
            borderLeft: '3px solid transparent'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          {actualBackLabel}
        </Link>

        <Link to={`/${lang}/admin/blogs`} style={tabStyle(isBlogs)}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 15v2m-6 4h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2zm10-10V7a4 4 0 0 0-8 0v4h8z" /></svg>
          {t('admin.manageBlogs')}
        </Link>
        <Link to={`/${lang}/admin/reviews`} style={tabStyle(isReviews)}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
          {t('admin.manageReviews', 'Manage Reviews')}
        </Link>
        <Link to={`/${lang}/admin/comments`} style={tabStyle(isComments)}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
          {t('admin.manageComments')}
        </Link>
        <Link to={`/${lang}/admin/rollercoin-account`} style={tabStyle(isRollercoin)}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
          {t('admin.rollercoinAccount', 'Rollercoin Account')}
        </Link>
        <Link to={`/${lang}/admin/users`} style={tabStyle(isUsers)}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
          {t('admin.manageUsers', 'Kullanıcılar')}
        </Link>

      </nav>

      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
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
  );
}
