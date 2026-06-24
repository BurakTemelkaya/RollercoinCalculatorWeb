/**
 * Admin Review List Page
 *
 * Displays all blog reviews. Allows admins to create new reviews.
 */

import { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { fetchAdminBlogReviews, createBlogReview } from '../../services/blogApi';
import Pagination from '../Pagination';
import { ReviewStatus, type BlogReviewListDto } from '../../types/blog';
import DashboardLayout from '../DashboardLayout';
import '../BlogPage.css';

const PAGE_SIZE = 20;

interface ReviewListResponse {
  items: BlogReviewListDto[];
  index: number;
  size: number;
  count: number;
  pages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

function getStatusBadge(status: ReviewStatus, t: any): { label: string; color: string; bg: string } {
  switch (status) {
    case ReviewStatus.Approved:
      return { label: t('admin.approved', 'Approved'), color: '#22c55e', bg: 'rgba(34,197,94,0.1)' };
    case ReviewStatus.Rejected:
      return { label: t('admin.rejected', 'Rejected'), color: '#ef4444', bg: 'rgba(239,68,68,0.1)' };
    case ReviewStatus.RevisionRequested:
      return { label: t('admin.revisionRequested', 'Revision Requested'), color: '#f97316', bg: 'rgba(249,115,22,0.1)' };
    case ReviewStatus.Pending:
    default:
      return { label: t('admin.pending', 'Pending'), color: '#eab308', bg: 'rgba(234,179,8,0.1)' };
  }
}

export default function AdminReviewList() {
  const { lang } = useParams<{ lang: string }>();
  const { t } = useTranslation();
  const { getValidToken } = useAuth();

  const [reviews, setReviews] = useState<BlogReviewListDto[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [hasPrevious, setHasPrevious] = useState(false);
  const [hasNext, setHasNext] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New review form
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewBlogId, setReviewBlogId] = useState('');
  const [reviewStatus, setReviewStatus] = useState<ReviewStatus>(ReviewStatus.Approved);
  const [reviewNote, setReviewNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Hide global ads
  useEffect(() => {
    document.body.classList.add('hide-global-ads');
    return () => document.body.classList.remove('hide-global-ads');
  }, []);

  const loadReviews = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = await getValidToken();
      if (!token) {
        setError(t('auth.sessionExpired'));
        setIsLoading(false);
        return;
      }

      const data = (await fetchAdminBlogReviews(token, undefined, currentPage, PAGE_SIZE)) as ReviewListResponse;
      setReviews(data.items || []);
      setTotalPages(data.pages || 0);
      setHasPrevious(data.hasPrevious ?? false);
      setHasNext(data.hasNext ?? false);
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
      setError('Failed to load reviews.');
    } finally {
      setIsLoading(false);
    }
  }, [getValidToken, currentPage, t]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const handleCreateReview = async () => {
    if (!reviewBlogId.trim()) return;
    setIsSubmitting(true);
    try {
      const token = await getValidToken();
      if (!token) return;

      await createBlogReview(reviewBlogId.trim(), reviewStatus, reviewNote, token);
      setShowReviewForm(false);
      setReviewBlogId('');
      setReviewNote('');
      setReviewStatus(ReviewStatus.Approved);
      await loadReviews();
    } catch (err) {
      console.error('Failed to create review:', err);
      alert('Failed to create review.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <DashboardLayout title={t('admin.manageReviews', 'Manage Reviews')} isAdmin={true}>

      <div className="admin-blog-header">
        <h1>{t('admin.manageReviews', 'Manage Reviews')}</h1>
        <div className="admin-blog-actions">
          <button
            className="admin-create-btn"
            onClick={() => setShowReviewForm(!showReviewForm)}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            {t('admin.newReview', 'New Review')}
          </button>
        </div>
      </div>

      {/* New Review Form */}
      {showReviewForm && (
        <div style={{
          background: 'rgba(15, 15, 30, 0.6)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 12,
          padding: 20,
          marginBottom: 24,
        }}>
          <h3 style={{ color: '#f1f5f9', margin: '0 0 16px', fontSize: '1rem' }}>
            {t('admin.newReview', 'New Review')}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ color: '#94a3b8', fontSize: '0.85rem', display: 'block', marginBottom: 4 }}>{t('admin.blogId', 'Blog ID')}</label>
              <input
                type="text"
                value={reviewBlogId}
                onChange={(e) => setReviewBlogId(e.target.value)}
                placeholder="Enter Blog ID (GUID)..."
                style={{
                  width: '100%', padding: '10px 12px',
                  background: 'rgba(15, 15, 30, 0.5)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8, color: '#e2e8f0',
                  fontFamily: 'inherit', fontSize: '0.9rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div>
              <label style={{ color: '#94a3b8', fontSize: '0.85rem', display: 'block', marginBottom: 4 }}>{t('admin.status', 'Status')}</label>
              <select
                value={reviewStatus}
                onChange={(e) => setReviewStatus(Number(e.target.value) as ReviewStatus)}
                style={{
                  padding: '10px 12px',
                  background: 'rgba(15, 15, 30, 0.5)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8, color: '#e2e8f0',
                  fontFamily: 'inherit',
                }}
              >
                <option value={ReviewStatus.Approved}>{t('admin.approved')}</option>
                <option value={ReviewStatus.Rejected}>{t('admin.rejected')}</option>
                <option value={ReviewStatus.RevisionRequested}>{t('admin.revisionRequested', 'Revision Requested')}</option>
              </select>
            </div>
            <div>
              <label style={{ color: '#94a3b8', fontSize: '0.85rem', display: 'block', marginBottom: 4 }}>
                {t('admin.reviewNote', 'Review Note')}
              </label>
              <textarea
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder={t('admin.reviewNotePlaceholder', 'Optional review note...')}
                rows={3}
                style={{
                  width: '100%', padding: '10px 12px',
                  background: 'rgba(15, 15, 30, 0.5)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8, color: '#e2e8f0',
                  fontFamily: 'inherit', fontSize: '0.9rem',
                  resize: 'vertical', boxSizing: 'border-box',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={handleCreateReview}
                disabled={isSubmitting || !reviewBlogId.trim()}
                className="admin-create-btn"
                style={{ padding: '8px 20px' }}
              >
                {isSubmitting ? t('admin.saving') : t('blog.submitComment', 'Submit')}
              </button>
              <button
                onClick={() => setShowReviewForm(false)}
                className="editor-cancel-btn"
                style={{ padding: '8px 20px' }}
              >
                {t('admin.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

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
      ) : reviews.length === 0 ? (
        <div className="blog-empty">
          <p>{t('admin.noComments', 'No reviews found.')}</p>
        </div>
      ) : (
        <>
          <table className="admin-blog-table">
            <thead>
              <tr>
                <th>{t('admin.blogId', 'Blog ID')}</th>
                <th>{t('admin.author', 'Reviewer')}</th>
                <th>{t('admin.reviewNote', 'Note')}</th>
                <th style={{ width: 120 }}>{t('admin.status')}</th>
                <th style={{ width: 160 }}>{t('admin.date')}</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((review) => {
                const badge = getStatusBadge(review.status, t);
                const reviewerName = review.reviewerUser
                  ? (review.reviewerUser.name || review.reviewerUser.email?.split('@')[0] || 'Admin')
                  : 'Admin';

                return (
                  <tr key={review.id}>
                    <td>
                      <Link
                        to={`/${lang}/admin/blogs/detail/${review.blogId}`}
                        style={{ fontSize: '0.8rem', color: '#a78bfa', fontFamily: 'monospace', textDecoration: 'none' }}
                      >
                        {review.blogId.substring(0, 8)}...
                      </Link>
                    </td>
                    <td style={{ color: '#e2e8f0' }}>{reviewerName}</td>
                    <td style={{ color: '#cbd5e1', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {review.reviewNote || '—'}
                    </td>
                    <td>
                      <span style={{
                        fontSize: '0.8rem', padding: '2px 8px',
                        borderRadius: 12, color: badge.color, background: badge.bg,
                      }}>
                        {badge.label}
                      </span>
                    </td>
                    <td style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                      {formatDate(review.createdDate)}
                    </td>
                  </tr>
                );
              })}
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
