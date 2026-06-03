/**
 * Blog Detail Page
 *
 * Displays a single blog post using the active language.
 * Uses dangerouslySetInnerHTML for HTML support.
 * Shows language switcher pills when the post is available in multiple languages.
 */

import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import BlogComments from './BlogComments';
import { fetchBlogBySlug, fetchLanguages } from '../services/blogApi';
import type { BlogDetail, Language } from '../types/blog';
import './BlogPage.css';
import '@enzedonline/quill-blot-formatter2/dist/css/quill-blot-formatter2.css';

export default function BlogDetailPage() {
  const { lang, slug } = useParams<{ lang: string; slug: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [blog, setBlog] = useState<BlogDetail | null>(null);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch languages once
  useEffect(() => {
    fetchLanguages()
      .then(setLanguages)
      .catch((err) => console.error('Failed to fetch languages:', err));
  }, []);

  // Fetch blog by slug
  useEffect(() => {
    if (!slug) return;

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    fetchBlogBySlug(slug)
      .then((data) => {
        if (!cancelled) setBlog(data);
      })
      .catch((err) => {
        console.error('Failed to fetch blog:', err);
        if (!cancelled) setError(t('blog.loadError'));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [slug, t]);

  // Content is now a single object from the API (matched to the slug's language)
  const content = blog?.blogContent ?? null;

  // Resolve language name from ID
  const getLangInfo = (languageId: number): Language | undefined => {
    return languages.find((l) => l.id === languageId);
  };

  // Get the language code for a given languageId (for URL construction)
  const getLangCode = (languageId: number): string => {
    const l = getLangInfo(languageId);
    return l?.code?.toLowerCase() || lang || 'en';
  };

  // Current content's language ID
  const currentLangId = content?.languageId ?? null;

  // Handle language switch
  const handleLangSwitch = (targetSlug: string, targetLangId: number) => {
    const targetLangCode = getLangCode(targetLangId);
    navigate(`/${targetLangCode}/blog/${targetSlug}`);
  };

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

  if (isLoading) {
    return (
      <div className="blog-detail-page">
        <div className="blog-loading">
          <span className="spinner" />
          <p>{t('blog.loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !blog || !content) {
    return (
      <div className="blog-detail-page">
        <div className="static-back-link">
          <Link to={`/${lang}/blog`}>← {t('blog.backToBlog')}</Link>
        </div>
        <div className="blog-error">
          <p>{error || t('blog.notFound')}</p>
        </div>
      </div>
    );
  }

  const availableLangs = blog.availableLanguages || [];
  const showLangSwitcher = availableLangs.length > 1;

  return (
    <div className="blog-detail-page">
      <>
        <title>{`${content.title} | Rollercoin Calculator`}</title>
        <meta name="description" content={content.content.substring(0, 160).replace(/[#*_\[\]]/g, '')} />
        <link rel="canonical" href={`https://rollercoincalculator.app/${lang}/blog/${slug}`} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={`${content.title} | Rollercoin Calculator`} />
        <meta property="og:description" content={content.content.substring(0, 160).replace(/[#*_\[\]<>/]/g, '')} />
        <meta property="og:url" content={`https://rollercoincalculator.app/${lang}/blog/${slug}`} />
        <meta property="og:image" content={blog.thumbnailImageUrl || 'https://rollercoincalculator.app/icon.png'} />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={`${content.title} | Rollercoin Calculator`} />
        <meta name="twitter:description" content={content.content.substring(0, 160).replace(/[#*_\[\]<>/]/g, '')} />
        <meta name="twitter:image" content={blog.thumbnailImageUrl || 'https://rollercoincalculator.app/icon.png'} />
      </>

      <div className="blog-detail-topbar">
        <div className="static-back-link">
          <Link to={`/${lang}/blog`}>← {t('blog.backToBlog')}</Link>
        </div>

        {showLangSwitcher && (
          <div className="blog-lang-switcher">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" className="blog-lang-icon">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            {availableLangs.map((al) => {
              const langInfo = getLangInfo(al.languageId);
              const isActive = al.languageId === currentLangId;
              return (
                <button
                  key={al.languageId}
                  className={`blog-lang-pill ${isActive ? 'active' : ''}`}
                  onClick={() => !isActive && handleLangSwitch(al.slug, al.languageId)}
                  disabled={isActive}
                  title={langInfo?.name || ''}
                >
                  {langInfo?.nativeName || langInfo?.code || `Lang ${al.languageId}`}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="blog-detail-header">
        {blog.thumbnailImageUrl && (
          <div className="blog-detail-thumbnail">
            <img src={blog.thumbnailImageUrl} alt={content.title} />
          </div>
        )}

        <h1 className="blog-detail-title">{content.title}</h1>

        <div className="blog-detail-meta">
          <time dateTime={blog.createdDate}>
            📅 {t('blog.publishedAt')}: {formatDate(blog.createdDate)}
          </time>
          {blog.updatedDate && (
            <time dateTime={blog.updatedDate}>
              ✏️ {t('blog.updatedAt')}: {formatDate(blog.updatedDate)}
            </time>
          )}
        </div>

        {(blog.creatorUser || blog.creatorUserName) && (
          <div className="blog-author-info" style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(124, 58, 237, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a78bfa', fontWeight: 'bold' }}>
              {(blog.creatorUserName || blog.creatorUser?.name || 'A')?.[0]?.toUpperCase()}
            </div>
            <div>
              <div style={{ color: '#e2e8f0', fontWeight: 600 }}>{blog.creatorUserName || blog.creatorUser?.name || 'Unknown Author'}</div>
              <Link to={`/${lang}/author/${blog.creatorUserId}`} style={{ fontSize: '0.85rem', color: '#a78bfa', textDecoration: 'none' }}>
                {t('blog.viewAuthorPosts')} →
              </Link>
            </div>
          </div>
        )}
      </div>

      <div className="blog-content">
        <div dangerouslySetInnerHTML={{ __html: content.content }} />
      </div>

      <BlogComments blogId={blog.id} languageId={content.languageId} lang={lang || 'en'} />
    </div>
  );
}
