/**
 * Blog Page (API-powered)
 *
 * Fetches blog list from the backend API filtered by language.
 * Language IDs are resolved from the /api/Language endpoint.
 * Replaces the old static blog listing.
 */

import { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { fetchBlogList, fetchLanguages } from '../services/blogApi';
import Pagination from './Pagination';
import type { BlogListItem, Language } from '../types/blog';
import './BlogPage.css';

const PAGE_SIZE = 9;

export default function BlogPage() {
  const { lang } = useParams<{ lang: string }>();
  const { t } = useTranslation();

  const [blogs, setBlogs] = useState<BlogListItem[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
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
      .catch((err) => {
        console.error('Failed to fetch languages:', err);
        if (!cancelled) setError(t('blog.loadError'));
      });
    return () => { cancelled = true; };
  }, [t]);

  // Fetch blog list when language or page changes
  useEffect(() => {
    const languageId = getLanguageId();
    if (languageId === null) return;

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    fetchBlogList(languageId, currentPage, PAGE_SIZE)
      .then((data) => {
        if (!cancelled) {
          setBlogs(data.items || []);
          setTotalPages(data.pages || 0);
          setHasPrevious(data.hasPrevious ?? false);
          setHasNext(data.hasNext ?? false);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch blogs:', err);
        if (!cancelled) setError(t('blog.loadError'));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [getLanguageId, currentPage, t]);

  // Reset page when language changes
  useEffect(() => {
    setCurrentPage(0);
  }, [lang]);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="blog-page">
      <Helmet>
        <title>{t('blog.title')} | Rollercoin Calculator</title>
        <meta
          name="description"
          content={t('blog.seoDescription')}
        />
        <link rel="canonical" href={`https://rollercoincalculator.app/${lang}/blog`} />
      </Helmet>

      <div className="blog-header">
        <div className="static-back-link">
          <Link to={`/${lang}`}>← {t('event.backToCalc')}</Link>
        </div>
        <h1>{t('blog.title')}</h1>
        <p className="blog-description">{t('blog.description')}</p>
      </div>

      {isLoading && (
        <div className="blog-loading">
          <span className="spinner" />
          <p>{t('blog.loading')}</p>
        </div>
      )}

      {error && (
        <div className="blog-error">
          <p>{error}</p>
        </div>
      )}

      {!isLoading && !error && blogs.length === 0 && (
        <div className="blog-empty">
          <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <p>{t('blog.noBlogs')}</p>
        </div>
      )}

      {!isLoading && !error && blogs.length > 0 && (
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
                  <div className="blog-card-meta">
                    <div className="blog-card-author" style={{ margin: 0 }}>
                      {blog.creatorUserName || blog.creatorUser?.name || 'Author'}
                    </div>
                    <span style={{ color: '#64748b', fontSize: '0.8rem' }}>•</span>
                    <time className="blog-card-date" dateTime={blog.createdDate} style={{ margin: 0 }}>
                      {formatDate(blog.createdDate)}
                    </time>
                  </div>
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
