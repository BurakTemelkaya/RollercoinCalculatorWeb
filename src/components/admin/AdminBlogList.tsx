/**
 * Admin Blog List Page
 *
 * Displays all blog posts with edit/delete/review actions.
 * Requires admin role. Filtered by status.
 */

import { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { fetchAdminBlogList, fetchLanguages, deleteBlog } from '../../services/blogApi';
import Pagination from '../Pagination';
import { type BlogListItem, type Language, ReviewStatus } from '../../types/blog';
import DashboardLayout from '../DashboardLayout';
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
  const [statusFilter, setStatusFilter] = useState<'' | ReviewStatus>('');

  // Hide global ads for dashboard panels
  useEffect(() => {
    document.body.classList.add('hide-global-ads');
    return () => document.body.classList.remove('hide-global-ads');
  }, []);

  // Fetch languages
  useEffect(() => {
    fetchLanguages()
      .then((data) => {
        setLanguages(data);
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
    setIsLoading(true);
    setError(null);
    try {
      const token = await getValidToken();
      if (!token) {
        setError(t('auth.sessionExpired'));
        setIsLoading(false);
        return;
      }
      
      const data = await fetchAdminBlogList(token, currentPage, PAGE_SIZE);
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
  }, [getValidToken, currentPage, t]);

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

      await deleteBlog(deleteTarget.id, token);

      setDeleteTarget(null);
      await loadBlogs();
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

  // Filter blogs by status client-side (the API may not support status filtering yet)
  const filteredBlogs = statusFilter === ''
    ? blogs
    : blogs.filter((b) => b.status === statusFilter);

  return (
    <DashboardLayout title={t('admin.manageBlogs')} isAdmin={true}>

      <div className="admin-blog-header">
        <h1>{t('admin.manageBlogs')}</h1>
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
      ) : filteredBlogs.length === 0 ? (
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
                <th>{t('admin.author', 'Author')}</th>
                <th style={{ width: 120 }}>{t('admin.status')}</th>
                <th style={{ width: 140 }}>{t('blog.publishedAt')}</th>
                <th style={{ width: 280 }}>{t('admin.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredBlogs.map((blog) => {
                let content = blog.blogContents?.find(c => c.languageId === selectedLangId);
                if (!content && blog.blogContents && blog.blogContents.length > 0) {
                  content = blog.blogContents[0];
                }
                const title = content?.title || blog.title || 'Untitled';
                const slug = content?.slug || blog.slug || blog.id;
                
                return (
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
                      to={`/${lang}/blog/${slug}`}
                      style={{ color: '#e2e8f0', textDecoration: 'none' }}
                    >
                      {title}
                    </Link>
                  </td>
                  <td>{blog.creatorUserName || blog.creatorUser?.name || 'Unknown'}</td>
                  <td>
                    {blog.status === ReviewStatus.Approved && <span style={{ color: '#22c55e', fontSize: '0.8rem', padding: '2px 8px', background: 'rgba(34,197,94,0.1)', borderRadius: 12 }}>{t('admin.approved')}</span>}
                    {blog.status === ReviewStatus.Pending && <span style={{ color: '#eab308', fontSize: '0.8rem', padding: '2px 8px', background: 'rgba(234,179,8,0.1)', borderRadius: 12 }}>{t('admin.pending')}</span>}
                    {blog.status === ReviewStatus.Rejected && <span style={{ color: '#ef4444', fontSize: '0.8rem', padding: '2px 8px', background: 'rgba(239,68,68,0.1)', borderRadius: 12 }}>{t('admin.rejected')}</span>}
                    {blog.status === ReviewStatus.RevisionRequested && <span style={{ color: '#f97316', fontSize: '0.8rem', padding: '2px 8px', background: 'rgba(249,115,22,0.1)', borderRadius: 12 }}>Revision</span>}
                  </td>
                  <td>{formatDate(blog.createdDate)}</td>
                  <td>
                    <div className="admin-blog-actions-cell" style={{ gap: 6 }}>
                      <button
                        className="admin-btn-edit"
                        style={{ background: 'rgba(56,189,248,0.15)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.3)' }}
                        onClick={() => navigate(`/${lang}/admin/blogs/detail/${blog.id}`)}
                      >
                        {t('admin.review', 'Review')}
                      </button>
                      <button
                        className="admin-btn-edit"
                        onClick={() => navigate(`/${lang}/admin/blogs/edit/${blog.id}`)}
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
              )})}
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
    </DashboardLayout>
  );
}
