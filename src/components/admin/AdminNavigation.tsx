import { Link, useLocation, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import '../BlogPage.css';

export default function AdminNavigation() {
  const { lang } = useParams<{ lang: string }>();
  const { t } = useTranslation();
  const location = useLocation();

  const isBlogs = location.pathname.includes('/admin/blogs');
  const isComments = location.pathname.includes('/admin/comments');

  return (
    <div style={{ display: 'flex', gap: 16, marginBottom: 24, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 12 }}>
      <Link
        to={`/${lang}/admin/blogs`}
        style={{
          textDecoration: 'none',
          color: isBlogs ? '#f1f5f9' : '#94a3b8',
          fontWeight: isBlogs ? 600 : 400,
          borderBottom: isBlogs ? '2px solid #8b5cf6' : '2px solid transparent',
          paddingBottom: 4,
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 15v2m-6 4h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2zm10-10V7a4 4 0 0 0-8 0v4h8z" /></svg>
        {t('admin.manageBlogs')}
      </Link>
      <Link
        to={`/${lang}/admin/comments`}
        style={{
          textDecoration: 'none',
          color: isComments ? '#f1f5f9' : '#94a3b8',
          fontWeight: isComments ? 600 : 400,
          borderBottom: isComments ? '2px solid #8b5cf6' : '2px solid transparent',
          paddingBottom: 4,
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
        {t('admin.manageComments')}
      </Link>
    </div>
  );
}
