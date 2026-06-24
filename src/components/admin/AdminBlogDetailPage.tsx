/**
 * Admin Blog Detail Page
 *
 * View blog details and write reviews (approve/reject with notes).
 * Shows existing reviews for this blog.
 */

import { useState, useEffect, useCallback, memo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import {
  fetchAdminBlogById,
  fetchAdminBlogReviewsByBlogId,
  createBlogReview,
  fetchLanguages,
} from '../../services/blogApi';
import { ReviewStatus, type AdminBlogDetail, type BlogReviewListDto, type Language } from '../../types/blog';
import DashboardLayout from '../DashboardLayout';
import '../BlogPage.css';

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

// Extract ReviewForm to prevent re-rendering the whole page (and preview) when typing
const ReviewForm = memo(({ 
  blogId, 
  onReviewSubmitted, 
  t 
}: { 
  blogId: string; 
  onReviewSubmitted: () => void;
  t: any;
}) => {
  const { getValidToken } = useAuth();
  const [reviewStatus, setReviewStatus] = useState<ReviewStatus>(ReviewStatus.Approved);
  const [reviewNote, setReviewNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitReview = async () => {
    setIsSubmitting(true);
    try {
      const token = await getValidToken();
      if (!token) return;

      await createBlogReview(blogId, reviewStatus, reviewNote, token);
      setReviewNote('');
      setReviewStatus(ReviewStatus.Approved);
      onReviewSubmitted();
    } catch (err) {
      console.error('Failed to submit review:', err);
      alert('Failed to submit review.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      background: 'rgba(15, 15, 30, 0.5)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 12, padding: 20, marginBottom: 20,
    }}>
      <h3 style={{ color: '#f1f5f9', margin: '0 0 16px', fontSize: '1rem' }}>
        ✍️ {t('admin.writeReview', 'Write Review')}
      </h3>

      <div style={{ marginBottom: 12 }}>
        <label style={{ color: '#94a3b8', fontSize: '0.85rem', display: 'block', marginBottom: 4 }}>
          {t('admin.status')}
        </label>
        <select
          value={reviewStatus}
          onChange={(e) => setReviewStatus(Number(e.target.value) as ReviewStatus)}
          style={{
            width: '100%', padding: '8px 12px',
            background: 'rgba(15, 15, 30, 0.5)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8, color: '#e2e8f0',
            fontFamily: 'inherit', boxSizing: 'border-box',
          }}
        >
          <option value={ReviewStatus.Approved}>{t('admin.approved')}</option>
          <option value={ReviewStatus.Rejected}>{t('admin.rejected')}</option>
          <option value={ReviewStatus.RevisionRequested}>{t('admin.revisionRequested', 'Revision Requested')}</option>
        </select>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={{ color: '#94a3b8', fontSize: '0.85rem', display: 'block', marginBottom: 4 }}>
          {t('admin.reviewNote', 'Review Note')}
        </label>
        <textarea
          value={reviewNote}
          onChange={(e) => setReviewNote(e.target.value)}
          placeholder={t('admin.reviewNotePlaceholder', 'Optional review note...')}
          rows={4}
          style={{
            width: '100%', padding: '8px 12px',
            background: 'rgba(15, 15, 30, 0.5)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8, color: '#e2e8f0',
            fontFamily: 'inherit', fontSize: '0.9rem',
            resize: 'vertical', boxSizing: 'border-box',
          }}
        />
      </div>

      <button
        onClick={handleSubmitReview}
        disabled={isSubmitting}
        className="admin-create-btn"
        style={{ width: '100%', justifyContent: 'center' }}
      >
        {isSubmitting ? (
          <><span className="spinner" style={{ width: 14, height: 14 }} /> {t('admin.saving')}</>
        ) : (
          t('admin.submitReview', 'Submit Review')
        )}
      </button>
    </div>
  );
});

export default function AdminBlogDetailPage() {
  const { lang, blogId } = useParams<{ lang: string; blogId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { getValidToken } = useAuth();

  const [blog, setBlog] = useState<AdminBlogDetail | null>(null);
  const [reviews, setReviews] = useState<BlogReviewListDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [languages, setLanguages] = useState<Language[]>([]);

  const [selectedLangId, setSelectedLangId] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Hide global ads
  useEffect(() => {
    document.body.classList.add('hide-global-ads');
    return () => document.body.classList.remove('hide-global-ads');
  }, []);

  const loadData = useCallback(async () => {
    if (!blogId) return;
    setIsLoading(true);
    setError(null);

    try {
      const token = await getValidToken();
      if (!token) {
        setError(t('auth.sessionExpired'));
        setIsLoading(false);
        return;
      }

      const [blogData, reviewsData, langsData] = await Promise.all([
        fetchAdminBlogById(blogId, token),
        fetchAdminBlogReviewsByBlogId(blogId, token).catch(() => ({ items: [] })),
        fetchLanguages().catch(() => []),
      ]);

      setBlog(blogData);
      setReviews(reviewsData.items || []);
      setLanguages(langsData);

      if (blogData.blogContents?.length > 0 && !selectedLangId) {
        setSelectedLangId(blogData.blogContents[0].languageId);
      }
    } catch (err) {
      console.error('Failed to load blog detail:', err);
      setError(t('blog.loadError'));
    } finally {
      setIsLoading(false);
    }
  }, [blogId, getValidToken, t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch { return dateStr; }
  };

  const selectedContent = blog?.blogContents?.find(c => c.languageId === selectedLangId);

  return (
    <DashboardLayout 
      title={t('admin.blogDetail', 'Blog Detail')} 
      isAdmin={true} 
    >
      <div className="blog-editor-page" data-color-mode="dark" style={{ padding: 0 }}>
        <div className="static-back-link" style={{ marginBottom: 16 }}>
          <Link to={`/${lang}/admin/blogs`}>← {t('admin.manageBlogs')}</Link>
        </div>

      {isLoading ? (
        <div className="blog-loading">
          <span className="spinner" />
          <p>{t('blog.loading')}</p>
        </div>
      ) : error ? (
        <div className="blog-error"><p>{error}</p></div>
      ) : !blog ? (
        <div className="blog-empty"><p>{t('admin.blogNotFound', 'Blog not found.')}</p></div>
      ) : (
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          {/* Left: Blog Info */}
          <div style={{ flex: '1 1 500px', minWidth: 0 }}>
            <div style={{
              background: 'rgba(15, 15, 30, 0.5)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12, padding: 24, marginBottom: 24,
            }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div>
                  <h1 style={{ color: '#f1f5f9', margin: 0, fontSize: '1.5rem' }}>
                    {selectedContent?.title || 'Untitled'}
                  </h1>
                  <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: 4 }}>
                    ID: <code style={{ color: '#a78bfa' }}>{blog.id}</code>
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {blog.status !== undefined && (() => {
                    const badge = getStatusBadge(blog.status!, t);
                    return (
                      <span style={{
                        padding: '4px 12px', borderRadius: 16,
                        fontSize: '0.8rem', fontWeight: 600,
                        color: badge.color, background: badge.bg,
                      }}>
                        {badge.label}
                      </span>
                    );
                  })()}
                  <button
                    className="admin-btn-edit"
                    onClick={() => navigate(`/${lang}/admin/blogs/edit/${blog.id}`)}
                  >
                    {t('admin.editBlog')}
                  </button>
                </div>
              </div>

              {/* Thumbnail */}
              {blog.thumbnailImageUrl && (
                <img
                  src={blog.thumbnailImageUrl}
                  alt=""
                  style={{
                    width: '100%', maxHeight: 300, objectFit: 'cover',
                    borderRadius: 8, marginBottom: 16,
                  }}
                />
              )}

              {/* Meta info */}
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: '0.85rem', color: '#94a3b8', marginBottom: 16 }}>
                <span>📅 {t('blog.publishedAt')}: {formatDate(blog.createdDate)}</span>
                {blog.updatedDate && <span>✏️ Updated: {formatDate(blog.updatedDate)}</span>}
                {blog.approvedDate && <span>✅ Approved: {formatDate(blog.approvedDate)}</span>}
                {blog.creatorUser && (
                  <span>👤 {blog.creatorUser.name || blog.creatorUser.email?.split('@')[0] || 'Author'}</span>
                )}
                {blog.approvedUser && (
                  <span>🛡️ Approved by: {blog.approvedUser.name || blog.approvedUser.email?.split('@')[0] || 'Admin'}</span>
                )}
              </div>

              {/* Language tabs */}
              {blog.blogContents && blog.blogContents.length > 0 && (
                <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                  {blog.blogContents.map((bc) => {
                    const langObj = languages.find(l => l.id === bc.languageId);
                    const langDisplay = langObj?.nativeName || langObj?.code || bc.language?.nativeName || bc.language?.code || `Lang ${bc.languageId}`;
                    return (
                      <button
                        key={bc.languageId}
                        onClick={() => setSelectedLangId(bc.languageId)}
                        style={{
                          padding: '6px 16px', borderRadius: 16,
                          border: selectedLangId === bc.languageId
                            ? '1px solid rgba(124,58,237,0.5)'
                            : '1px solid rgba(255,255,255,0.1)',
                          background: selectedLangId === bc.languageId
                            ? 'rgba(124,58,237,0.15)'
                            : 'transparent',
                          color: selectedLangId === bc.languageId ? '#c4b5fd' : '#94a3b8',
                          cursor: 'pointer', fontSize: '0.85rem', fontFamily: 'inherit',
                        }}
                      >
                        {langDisplay}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Content preview */}
              {selectedContent && (
                <div style={{
                  background: 'rgba(0,0,0,0.2)',
                  borderRadius: 8, padding: 16,
                  color: '#e2e8f0', fontSize: '0.9rem',
                  maxHeight: 400, overflow: 'auto',
                  lineHeight: 1.7,
                  position: 'relative'
                }}>
                  <button
                    onClick={() => setIsFullscreen(true)}
                    style={{
                      position: 'absolute', top: 12, right: 12,
                      background: 'rgba(15,15,30,0.8)', border: '1px solid rgba(255,255,255,0.2)',
                      color: '#e2e8f0', padding: '4px 10px', borderRadius: 6, cursor: 'pointer',
                      fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6, zIndex: 10
                    }}
                  >
                    ⛶ {t('admin.fullscreen', 'Fullscreen')}
                  </button>
                  <div dangerouslySetInnerHTML={{ __html: selectedContent.content }} />
                </div>
              )}
            </div>
          </div>

          {/* Right: Reviews */}
          <div style={{ flex: '0 0 400px', minWidth: 0 }}>
            
            {/* Write Review Form (Isolated state) */}
            {blogId && (
              <ReviewForm 
                blogId={blogId} 
                onReviewSubmitted={loadData} 
                t={t} 
              />
            )}

            {/* Existing Reviews */}
            <div style={{
              background: 'rgba(15, 15, 30, 0.5)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12, padding: 20,
            }}>
              <h3 style={{ color: '#f1f5f9', margin: '0 0 16px', fontSize: '1rem' }}>
                📋 {t('admin.existingReviews', 'Existing Reviews')} ({reviews.length})
              </h3>

              {reviews.length === 0 ? (
                <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
                  {t('admin.noReviews', 'No reviews yet.')}
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {reviews.map((review) => {
                    const badge = getStatusBadge(review.status, t);
                    const reviewerName = review.reviewerUser
                      ? (review.reviewerUser.name || review.reviewerUser.email?.split('@')[0] || 'Admin')
                      : 'Admin';

                    return (
                      <div
                        key={review.id}
                        style={{
                          background: 'rgba(0,0,0,0.2)',
                          borderRadius: 8, padding: 12,
                          borderLeft: `3px solid ${badge.color}`,
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <span style={{ color: '#e2e8f0', fontSize: '0.85rem', fontWeight: 600 }}>
                            {reviewerName}
                          </span>
                          <span style={{
                            fontSize: '0.75rem', padding: '2px 8px',
                            borderRadius: 10, color: badge.color, background: badge.bg,
                          }}>
                            {badge.label}
                          </span>
                        </div>
                        {review.reviewNote && (
                          <p style={{ color: '#cbd5e1', fontSize: '0.85rem', margin: '4px 0 8px', lineHeight: 1.5 }}>
                            {review.reviewNote}
                          </p>
                        )}
                        <span style={{ color: '#64748b', fontSize: '0.75rem' }}>
                          {formatDate(review.createdDate)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Modal */}
      {isFullscreen && selectedContent && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(10, 10, 20, 0.95)', zIndex: 99999,
          display: 'flex', flexDirection: 'column'
        }}>
          <div style={{
            padding: '16px 24px', background: 'rgba(0,0,0,0.5)',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <h2 style={{ margin: 0, color: '#f1f5f9', fontSize: '1.25rem' }}>{selectedContent.title}</h2>
            <button
              onClick={() => setIsFullscreen(false)}
              style={{
                background: 'transparent', border: 'none', color: '#f87171',
                fontSize: '1.5rem', cursor: 'pointer', padding: '0 8px',
                lineHeight: 1
              }}
              title="Close Fullscreen"
            >
              ✕
            </button>
          </div>
          <div style={{
            flex: 1, overflow: 'auto', padding: '32px',
            maxWidth: 1000, margin: '0 auto', width: '100%',
            color: '#e2e8f0', fontSize: '1.05rem', lineHeight: 1.8,
            boxSizing: 'border-box'
          }}>
            <div dangerouslySetInnerHTML={{ __html: selectedContent.content }} />
          </div>
        </div>
      )}
      </div>
    </DashboardLayout>
  );
}
