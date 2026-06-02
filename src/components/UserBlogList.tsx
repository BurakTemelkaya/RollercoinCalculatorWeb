import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { fetchBlogsByCreator, fetchLanguages } from '../services/blogApi';
import type { BlogListItem, Language } from '../types/blog';
import { ReviewStatus } from '../types/blog';
import DashboardLayout from './DashboardLayout';
import Pagination from './Pagination';
import './BlogPage.css';

const PAGE_SIZE = 9;

/** Map ReviewStatus to label + color */
function getStatusInfo(status?: number): { label: string; color: string; bg: string } {
  switch (status) {
    case ReviewStatus.Approved:
      return { label: 'Approved', color: '#34d399', bg: 'rgba(52, 211, 153, 0.15)' };
    case ReviewStatus.Rejected:
      return { label: 'Rejected', color: '#f87171', bg: 'rgba(248, 113, 113, 0.15)' };
    case ReviewStatus.RevisionRequested:
      return { label: 'Revision', color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.15)' };
    case ReviewStatus.Pending:
    default:
      return { label: 'Pending', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.15)' };
  }
}

export default function UserBlogList() {
  const { lang } = useParams<{ lang: string }>();
  const { t } = useTranslation();
  const { user, getValidToken } = useAuth();

  const [languages, setLanguages] = useState<Language[]>([]);
  const [blogs, setBlogs] = useState<BlogListItem[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [hasPrevious, setHasPrevious] = useState(false);
  const [hasNext, setHasNext] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'' | ReviewStatus>('');

  // Hide global ads for dashboard panels
  useEffect(() => {
    document.body.classList.add('hide-global-ads');
    return () => document.body.classList.remove('hide-global-ads');
  }, []);

  // Resolve language ID from the current app language
  const getLanguageId = useCallback((): number | null => {
    if (languages.length === 0) return null;
    const match = languages.find(
      (l) => l.code.toLowerCase() === (lang || 'en').toLowerCase()
    );
    return match?.id ?? languages[0]?.id ?? null;
  }, [languages, lang]);

  // Fetch languages first
  useEffect(() => {
    let cancelled = false;
    fetchLanguages()
      .then((data) => {
        if (!cancelled) setLanguages(data);
      })
      .catch((err: unknown) => {
        console.error('Failed to fetch languages:', err);
        if (!cancelled) setError(t('blog.loadError'));
      });
    return () => { cancelled = true; };
  }, [t]);

  // Fetch blog list when page or status filter changes
  const loadBlogs = useCallback(async () => {
    if (!user?.userId) return;

    const token = await getValidToken();
    if (!token) {
      setError(t('auth.sessionExpired'));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchBlogsByCreator(
        user.userId,
        token,
        currentPage,
        PAGE_SIZE,
        statusFilter === '' ? undefined : statusFilter
      );
      setBlogs(data.items || []);
      setTotalPages(data.pages || 0);
      setHasPrevious(data.hasPrevious ?? false);
      setHasNext(data.hasNext ?? false);
    } catch (err: unknown) {
      console.error('Failed to load user blogs:', err);
      setError(t('blog.loadError', 'Blog yazıları yüklenirken bir hata oluştu.'));
    } finally {
      setIsLoading(false);
    }
  }, [user?.userId, getValidToken, currentPage, statusFilter, t]);

  useEffect(() => {
    loadBlogs();
  }, [loadBlogs]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  /** Resolve slug from blogContents based on current language */
  const getSlug = (blog: BlogListItem): string | null => {
    const langId = getLanguageId();
    if (!blog.blogContents || blog.blogContents.length === 0) return blog.slug || null;
    const match = blog.blogContents.find((c) => c.languageId === langId);
    return match?.slug ?? blog.blogContents[0]?.slug ?? blog.slug ?? null;
  };

  /** Resolve title from blogContents based on current language */
  const getTitle = (blog: BlogListItem): string => {
    const langId = getLanguageId();
    if (!blog.blogContents || blog.blogContents.length === 0) return blog.title || 'Untitled';
    const match = blog.blogContents.find((c) => c.languageId === langId);
    return match?.title ?? blog.blogContents[0]?.title ?? blog.title ?? 'Untitled';
  };

  return (
    <DashboardLayout title="My Blogs" isAdmin={false}>
      <div className="blog-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>{t('nav.myBlogs')}</h1>
          <p className="blog-description">{t('blog.myBlogsDesc')}</p>
        </div>
        <Link 
          to={`/${lang}/my-blogs/new`}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'var(--primary-color)', color: '#fff',
            padding: '8px 16px', borderRadius: '8px',
            textDecoration: 'none', fontWeight: 600,
            fontSize: '0.9rem', transition: 'all 0.2s',
            boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
          {t('admin.createNewBlog')}
        </Link>
      </div>

      {/* Status Filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { value: '' as const, label: t('admin.all') },
          { value: ReviewStatus.Pending, label: t('admin.pending') },
          { value: ReviewStatus.Approved, label: t('admin.approved') },
          { value: ReviewStatus.Rejected, label: t('admin.rejected') },
        ].map((opt) => (
          <button
            key={String(opt.value)}
            onClick={() => { setStatusFilter(opt.value); setCurrentPage(0); }}
            style={{
              padding: '6px 16px',
              borderRadius: 20,
              border: statusFilter === opt.value
                ? '1px solid rgba(124, 58, 237, 0.5)'
                : '1px solid rgba(255,255,255,0.1)',
              background: statusFilter === opt.value
                ? 'rgba(124, 58, 237, 0.15)'
                : 'rgba(15, 15, 30, 0.4)',
              color: statusFilter === opt.value ? '#c4b5fd' : '#94a3b8',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: statusFilter === opt.value ? 600 : 500,
              fontFamily: 'inherit',
              transition: 'all 0.2s',
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="blog-loading">
          <span className="spinner" />
          <p>{t('blog.loading', 'Yükleniyor...')}</p>
        </div>
      ) : error ? (
        <div className="blog-error">
          <p>{error}</p>
        </div>
      ) : blogs.length === 0 ? (
        <div className="blog-empty">
          <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
          <p>{t('blog.noBlogs', 'Henüz yazı bulunmuyor.')}</p>
        </div>
      ) : (
        <>
          <div className="blog-grid">
            {blogs.map((blog) => {
              const slug = getSlug(blog);
              const title = getTitle(blog);
              const statusInfo = getStatusInfo(blog.status);

              return (
                <div key={blog.id} className="blog-card">
                  {blog.thumbnailImageUrl && slug && (
                    <Link to={`/${lang}/blog/${slug}`} className="blog-card-thumbnail" style={{ display: 'block' }}>
                      <img
                        src={blog.thumbnailImageUrl}
                        alt={title}
                        loading="lazy"
                      />
                    </Link>
                  )}
                  <div className="blog-card-body">
                    <h2 className="blog-card-title">
                      {slug ? (
                        <Link to={`/${lang}/blog/${slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                          {title}
                        </Link>
                      ) : title}
                    </h2>


                    {/* Status badge */}
                    <span style={{
                      display: 'inline-block',
                      padding: '3px 10px',
                      borderRadius: 12,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: statusInfo.color,
                      background: statusInfo.bg,
                      marginTop: 4,
                    }}>
                      {statusInfo.label}
                    </span>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '12px' }}>
                      <time className="blog-card-date" dateTime={blog.createdDate} style={{ margin: 0 }}>
                        {formatDate(blog.createdDate)}
                      </time>
                      {slug && (
                        <Link
                          to={`/${lang}/my-blogs/edit/${slug}`}
                          style={{
                            padding: '4px 10px',
                            background: 'rgba(59, 130, 246, 0.15)',
                            color: '#60a5fa',
                            borderRadius: 6,
                            fontSize: '0.8rem',
                            textDecoration: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4
                          }}
                        >
                          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                          {t('admin.edit', 'Düzenle')}
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              hasPrevious={hasPrevious}
              hasNext={hasNext}
              onPageChange={setCurrentPage}
            />
          )}
        </>
      )}
    </DashboardLayout>
  );
}
