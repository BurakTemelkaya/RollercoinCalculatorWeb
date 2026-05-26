import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { fetchBlogsByUserId, fetchLanguages } from '../services/blogApi';
import type { BlogListItem, Language } from '../types/blog';
import Pagination from './Pagination';
import './BlogPage.css';

const PAGE_SIZE = 9;

export default function AuthorBlogList() {
  const { lang, userId } = useParams<{ lang: string; userId: string }>();
  const { t } = useTranslation();

  const [languages, setLanguages] = useState<Language[]>([]);
  const [blogs, setBlogs] = useState<BlogListItem[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [hasPrevious, setHasPrevious] = useState(false);
  const [hasNext, setHasNext] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    if (languageId === null || !userId) return;

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    fetchBlogsByUserId(userId, languageId, currentPage, PAGE_SIZE)
      .then((data) => {
        if (!cancelled) {
          setBlogs(data.items || []);
          setTotalPages(data.pages || 0);
          setHasPrevious(data.hasPrevious ?? false);
          setHasNext(data.hasNext ?? false);
        }
      })
      .catch((err: unknown) => {
        console.error('Failed to load author blogs:', err);
        if (!cancelled) setError(t('blog.loadError', 'Blog yazıları yüklenirken bir hata oluştu.'));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [getLanguageId, currentPage, userId, t]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const authorName = blogs.length > 0 && blogs[0].creatorUser 
    ? (blogs[0].creatorUser.name || blogs[0].creatorUser.email?.split('@')[0] || 'Author')
    : 'Author';

  return (
    <div className="blog-page" data-color-mode="dark">
      <Helmet>
        <title>{authorName}'s Blogs | Rollercoin Calculator</title>
      </Helmet>

      <div className="blog-header">
        <h1>{t('blog.authorPosts', { author: authorName })}</h1>
        <p className="blog-description">{t('blog.allAuthorPosts')}</p>
        <div style={{ marginTop: 16 }}>
          <Link to={`/${lang}/blog`} style={{ color: '#a78bfa', textDecoration: 'none' }}>
            ← {t('blog.backToBlog')}
          </Link>
        </div>
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
              <Link
                key={blog.id}
                to={`/${lang}/blog/${blog.slug}`}
                className="blog-card"
              >
                {blog.thumbnailImageUrl && (
                  <div className="blog-card-thumbnail">
                    <img
                      src={blog.thumbnailImageUrl}
                      alt={blog.title}
                      loading="lazy"
                    />
                  </div>
                )}
                <div className="blog-card-body">
                  <h2 className="blog-card-title">{blog.title}</h2>
                  <time className="blog-card-date" dateTime={blog.createdDate}>
                    {formatDate(blog.createdDate)}
                  </time>
                </div>
              </Link>
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
