import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { fetchBlogsByUserId, fetchLanguages } from '../services/blogApi';
import type { BlogListItem, Language } from '../types/blog';
import Pagination from './Pagination';
import './BlogPage.css';

const PAGE_SIZE = 9;

export default function UserBlogList() {
  const { lang } = useParams<{ lang: string }>();
  const { t } = useTranslation();
  const { user } = useAuth();

  const [languages, setLanguages] = useState<Language[]>([]);
  const [blogs, setBlogs] = useState<BlogListItem[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [hasPrevious, setHasPrevious] = useState(false);
  const [hasNext, setHasNext] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // Fetch blog list when language or page changes
  useEffect(() => {
    const languageId = getLanguageId();
    if (languageId === null || !user?.userId) return;

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    fetchBlogsByUserId(user.userId, languageId, currentPage, PAGE_SIZE)
      .then((data) => {
        if (!cancelled) {
          setBlogs(data.items || []);
          setTotalPages(data.pages || 0);
          setHasPrevious(data.hasPrevious ?? false);
          setHasNext(data.hasNext ?? false);
        }
      })
      .catch((err: unknown) => {
        console.error('Failed to load user blogs:', err);
        if (!cancelled) setError(t('blog.loadError', 'Blog yazıları yüklenirken bir hata oluştu.'));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [getLanguageId, currentPage, user?.userId, t]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="blog-page" data-color-mode="dark">
      <Helmet>
        <title>My Blogs | Rollercoin Calculator</title>
      </Helmet>

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
            {blogs.map((blog) => (
              <div
                key={blog.id}
                className="blog-card"
              >
                {blog.thumbnailImageUrl && (
                  <Link to={`/${lang}/blog/${blog.slug}`} className="blog-card-thumbnail" style={{ display: 'block' }}>
                    <img
                      src={blog.thumbnailImageUrl}
                      alt={blog.title}
                      loading="lazy"
                    />
                  </Link>
                )}
                <div className="blog-card-body">
                  <h2 className="blog-card-title">
                    <Link to={`/${lang}/blog/${blog.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                      {blog.title}
                    </Link>
                  </h2>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                    <time className="blog-card-date" dateTime={blog.createdDate} style={{ margin: 0 }}>
                      {formatDate(blog.createdDate)}
                    </time>
                    <Link
                      to={`/${lang}/my-blogs/edit/${blog.slug}`}
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
                  </div>
                </div>
              </div>
            ))}
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
    </div>
  );
}
