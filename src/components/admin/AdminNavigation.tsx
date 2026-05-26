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

  const { logout } = useAuth();

  const tabStyle = (active: boolean) => ({
    textDecoration: 'none' as const,
    color: active ? '#f1f5f9' : '#94a3b8',
    fontWeight: active ? 600 : 400,
    borderBottom: active ? '2px solid #8b5cf6' : '2px solid transparent',
    paddingBottom: 4,
    transition: 'all 0.2s ease',
    display: 'flex' as const,
    alignItems: 'center' as const,
    gap: 8,
  });

  const actualBackTo = backTo || `/${lang}`;
  const actualBackLabel = backLabel || t('event.backToCalc', 'Hesaplayıcıya Dön');

  return (
    <div style={{ display: 'flex', gap: 16, marginBottom: 24, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 12, alignItems: 'center', flexWrap: 'wrap' }}>
      <Link 
        to={actualBackTo}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'rgba(255, 255, 255, 0.05)',
          color: '#e2e8f0', border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '6px 14px', borderRadius: 8,
          textDecoration: 'none', fontSize: '0.85rem',
          fontWeight: 500, transition: 'all 0.2s',
          marginRight: 8
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
        }}
      >
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
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
      
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
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
  );
}
