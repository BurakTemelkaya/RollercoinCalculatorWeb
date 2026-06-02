/**
 * Admin Comment List Page
 *
 * Displays all blog comments with filtering by status.
 * Allows admins to approve or reject pending comments.
 */

import { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { buildApiUrl } from '../../config/api';
import { apiFetch } from '../../services/apiClient';
import Pagination from '../Pagination';
import { BlogCommentReviewStatus } from '../../types/blog';
import DashboardLayout from '../DashboardLayout';
import '../BlogPage.css';

const PAGE_SIZE = 20;

// Type definition for comments returned from admin endpoint
interface AdminCommentDto {
  id: string;
  authorName: string;
  content: string;
  blogId: string;
  blogContentTitle?: string;
  languageId: number;
  status: BlogCommentReviewStatus;
  createdDate: string;
}

interface CommentListResponse {
  items: AdminCommentDto[];
  index: number;
  size: number;
  count: number;
  pages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export default function AdminCommentList() {
  const { lang } = useParams<{ lang: string }>();
  const { t } = useTranslation();
  const { user, getValidToken } = useAuth();

  const [comments, setComments] = useState<AdminCommentDto[]>([]);
  const [statusFilter, setStatusFilter] = useState<BlogCommentReviewStatus | ''>(BlogCommentReviewStatus.Pending);
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

  // Fetch comments
  const loadComments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = await getValidToken();
      if (!token) {
        setError(t('auth.sessionExpired'));
        setIsLoading(false);
        return;
      }

      const params = new URLSearchParams({
        'PageRequest.PageIndex': String(currentPage),
        'PageRequest.PageSize': String(PAGE_SIZE),
      });
      
      if (statusFilter !== '') {
        params.append('Status', String(statusFilter));
      }

      const url = buildApiUrl(`/api/BlogComment/get-admin-blog-comments?${params.toString()}`);
      const response = await apiFetch(url, {
        method: 'GET',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      const data = (await response.json()) as CommentListResponse;
      setComments(data.items || []);
      setTotalPages(data.pages || 0);
      setHasPrevious(data.hasPrevious ?? false);
      setHasNext(data.hasNext ?? false);
    } catch (err) {
      console.error('Failed to fetch comments:', err);
      setError('Failed to load comments.');
    } finally {
      setIsLoading(false);
    }
  }, [getValidToken, currentPage, statusFilter, t]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  // Handle Approve/Reject
  const handleStatusChange = async (commentId: string, newStatus: BlogCommentReviewStatus) => {
    if (!user) return;
    try {
      const token = await getValidToken();
      if (!token) return;

      const url = buildApiUrl(`/api/BlogComment/comment-review`); 
      
      const payload = {
        BlogCommentReview: {
          CommentId: commentId,
          ReviewerUserId: user.userId,
          Status: newStatus
        }
      };

      await apiFetch(url, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
      });
      
      // Reload comments to reflect changes
      loadComments();
    } catch (err) {
      console.error('Failed to update comment status:', err);
      alert('Failed to update comment status.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <DashboardLayout title={t('admin.manageComments')} isAdmin={true}>

      <div className="blog-header">
        <h1>{t('admin.manageComments')}</h1>
        <p className="blog-description">{t('admin.manageCommentsDesc')}</p>
      </div>

      <div style={{ marginBottom: 20, display: 'flex', gap: 16, alignItems: 'center' }}>
        <label style={{ color: '#e2e8f0', fontWeight: 600 }}>{t('admin.filterByStatus')}</label>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value === '' ? '' : Number(e.target.value) as BlogCommentReviewStatus);
            setCurrentPage(0);
          }}
          style={{
            padding: '8px 12px',
            background: 'rgba(15, 15, 30, 0.5)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8,
            color: '#e2e8f0',
          }}
        >
          <option value="">{t('admin.all')}</option>
          <option value={BlogCommentReviewStatus.Pending}>{t('admin.pending')}</option>
          <option value={BlogCommentReviewStatus.Approved}>{t('admin.approved')}</option>
          <option value={BlogCommentReviewStatus.Rejected}>{t('admin.rejected')}</option>
        </select>
      </div>

      {isLoading ? (
        <div className="blog-loading">
          <span className="spinner" />
          <p>{t('blog.loading')}</p>
        </div>
      ) : error ? (
        <div className="blog-error">
          <p>{error}</p>
        </div>
      ) : comments.length === 0 ? (
        <div className="blog-empty">
          <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <p>{t('admin.noComments')}</p>
        </div>
      ) : (
        <>
          <table className="admin-blog-table">
            <thead>
              <tr>
                <th style={{ width: 120 }}>{t('admin.author')}</th>
                <th style={{ width: 200 }}>{t('admin.blogTitle', 'Blog Title')}</th>
                <th>{t('admin.content')}</th>
                <th style={{ width: 100 }}>{t('admin.status')}</th>
                <th style={{ width: 140 }}>{t('admin.date')}</th>
                <th style={{ width: 180 }}>{t('admin.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {comments.map((comment) => (
                <tr key={comment.id}>
                  <td>{comment.authorName}</td>
                  <td>
                    <Link 
                      to={`/${lang}/admin/blogs/detail/${comment.blogId}`}
                      style={{ 
                        display: '-webkit-box', 
                        maxHeight: 60, 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis', 
                        WebkitLineClamp: 2, 
                        WebkitBoxOrient: 'vertical', 
                        color: '#a78bfa', 
                        fontSize: '0.9rem',
                        textDecoration: 'none'
                      }}
                    >
                      {comment.blogContentTitle || 'Belirtilmedi'}
                    </Link>
                  </td>
                  <td>
                    <div style={{ maxHeight: 60, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {comment.content}
                    </div>
                  </td>
                  <td>
                    {comment.status === BlogCommentReviewStatus.Approved && <span style={{ color: '#22c55e', fontSize: '0.8rem', padding: '2px 8px', background: 'rgba(34,197,94,0.1)', borderRadius: 12 }}>{t('admin.approved')}</span>}
                    {comment.status === BlogCommentReviewStatus.Pending && <span style={{ color: '#eab308', fontSize: '0.8rem', padding: '2px 8px', background: 'rgba(234,179,8,0.1)', borderRadius: 12 }}>{t('admin.pending')}</span>}
                    {comment.status === BlogCommentReviewStatus.Rejected && <span style={{ color: '#ef4444', fontSize: '0.8rem', padding: '2px 8px', background: 'rgba(239,68,68,0.1)', borderRadius: 12 }}>{t('admin.rejected')}</span>}
                  </td>
                  <td>{formatDate(comment.createdDate)}</td>
                  <td>
                    <div className="admin-blog-actions-cell" style={{ gap: 8 }}>
                      {comment.status !== BlogCommentReviewStatus.Approved && (
                        <button
                          className="admin-btn-edit"
                          style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', borderColor: 'rgba(34, 197, 94, 0.3)' }}
                          onClick={() => handleStatusChange(comment.id, BlogCommentReviewStatus.Approved)}
                        >
                          {t('admin.approve')}
                        </button>
                      )}
                      {comment.status !== BlogCommentReviewStatus.Rejected && (
                        <button
                          className="admin-btn-delete"
                          onClick={() => handleStatusChange(comment.id, BlogCommentReviewStatus.Rejected)}
                        >
                          {t('admin.reject')}
                        </button>
                      )}
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
    </DashboardLayout>
  );
}
