/**
 * Admin Blog List Page
 *
 * Displays all blog posts with edit/delete actions.
 * Requires admin role. Filtered by language.
 */

import { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { fetchBlogList, fetchLanguages, deleteBlog } from '../../services/blogApi';
import Pagination from '../Pagination';
import type { BlogListItem, Language } from '../../types/blog';
import '../BlogPage.css';

const PAGE_SIZE = 20;

export default function AdminBlogList() {
  const { lang } = useParams<{ lang: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, getValidToken } = useAuth();

  const [blogs, setBlogs] = useState<BlogListItem[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [selectedLangId, setSelectedLangId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [hasPrevious, setHasPrevious] = useState(false);
  const [hasNext, setHasNext] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BlogListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch languages
  useEffect(() => {
    fetchLanguages()
      .then((data) => {
        setLanguages(data);
        // Set default language based on current app language
        const match = data.find((l) => l.code.toLowerCase() === (lang || 'en').toLowerCase());
        setSelectedLangId(match?.id ?? data[0]?.id ?? null);
      })
      .catch((err) => {
        console.error('Failed to fetch languages:', err);
        setError(t('blog.loadError'));
      });
  }, [lang, t]);

  // Fetch blogs
  const loadBlogs = useCallback(async () => {
    if (selectedLangId === null) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchBlogList(selectedLangId, currentPage, PAGE_SIZE);
      setBlogs(data.items || []);
      setTotalPages(data.pages || 0);
      setHasPrevious(data.hasPrevious ?? false);
      setHasNext(data.hasNext ?? false);
    } catch (err) {
      console.error('Failed to fetch blogs:', err);
      setError(t('blog.loadError'));
    } finally {
      setIsLoading(false);
    }
  }, [selectedLangId, currentPage, t]);

  useEffect(() => {
    loadBlogs();
  }, [loadBlogs]);

  // Handle delete
  const handleDelete = async () => {
    if (!deleteTarget || !user) return;

    setIsDeleting(true);
    try {
      const token = await getValidToken();
      if (!token) {
        setError(t('auth.sessionExpired'));
        return;
      }

      await deleteBlog(
        { blogId: deleteTarget.id, creatorUserId: user.userId },
        token
      );

      setDeleteTarget(null);
      await loadBlogs(); // Refresh list
    } catch (err) {
      console.error('Failed to delete blog:', err);
      setError(t('admin.deleteError'));
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="admin-blog-page">
      <Helmet>
        <title>{t('admin.blogs')} | Admin</title>
      </Helmet>

      <div className="static-back-link">
        <Link to={`/${lang}`}>← {t('event.backToCalc')}</Link>
      </div>

      <div className="admin-blog-header">
        <h1>{t('admin.blogs')}</h1>
        <div className="admin-blog-actions">
          {languages.length > 0 && (
            <select
              className="admin-filter-select"
              value={selectedLangId ?? ''}
              onChange={(e) => {
                setSelectedLangId(Number(e.target.value));
                setCurrentPage(0);
              }}
            >
              {languages.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.nativeName} ({l.code})
                </option>
              ))}
            </select>
          )}
          <Link
            to={`/${lang}/admin/blogs/new`}
            className="admin-create-btn"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            {t('admin.createBlog')}
          </Link>
        </div>
      </div>

      {error && (
        <div className="blog-error" style={{ marginBottom: 20 }}>
          <p>{error}</p>
        </div>
      )}

      {isLoading ? (
        <div className="blog-loading">
          <span className="spinner" />
          <p>{t('blog.loading')}</p>
        </div>
      ) : blogs.length === 0 ? (
        <div className="blog-empty">
          <p>{t('blog.noBlogs')}</p>
        </div>
      ) : (
        <>
          <table className="admin-blog-table">
            <thead>
              <tr>
                <th style={{ width: 60 }}></th>
                <th>{t('admin.blogTitle')}</th>
                <th style={{ width: 140 }}>{t('blog.publishedAt')}</th>
                <th style={{ width: 160 }}>{t('admin.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {blogs.map((blog) => (
                <tr key={blog.id}>
                  <td>
                    {blog.thumbnailImageUrl ? (
                      <img
                        src={blog.thumbnailImageUrl}
                        alt=""
                        className="admin-blog-thumb"
                      />
                    ) : (
                      <div className="admin-blog-thumb" style={{ background: 'rgba(100,100,140,0.2)' }} />
                    )}
                  </td>
                  <td>
                    <Link
                      to={`/${lang}/blog/${blog.slug}`}
                      style={{ color: '#e2e8f0', textDecoration: 'none' }}
                    >
                      {blog.title}
                    </Link>
                  </td>
                  <td>{formatDate(blog.createdDate)}</td>
                  <td>
                    <div className="admin-blog-actions-cell">
                      <button
                        className="admin-btn-edit"
                        onClick={() => navigate(`/${lang}/admin/blogs/edit/${blog.slug}`)}
                      >
                        {t('admin.editBlog')}
                      </button>
                      <button
                        className="admin-btn-delete"
                        onClick={() => setDeleteTarget(blog)}
                      >
                        {t('admin.deleteBlog')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div style={{ marginTop: 20 }}>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                hasPrevious={hasPrevious}
                hasNext={hasNext}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="delete-modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="delete-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{t('admin.deleteBlog')}</h3>
            <p>{t('admin.deleteConfirm')}</p>
            <p style={{ color: '#e2e8f0', fontWeight: 600 }}>{deleteTarget.title}</p>
            <div className="delete-modal-actions">
              <button
                className="editor-cancel-btn"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
              >
                {t('admin.cancel')}
              </button>
              <button
                className="admin-btn-delete"
                onClick={handleDelete}
                disabled={isDeleting}
                style={{ padding: '10px 24px' }}
              >
                {isDeleting ? (
                  <><span className="spinner" style={{ width: 14, height: 14 }} /> {t('admin.deleting')}</>
                ) : (
                  t('admin.deleteBlog')
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
