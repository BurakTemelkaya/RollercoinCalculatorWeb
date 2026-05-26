import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { fetchCommentsByBlogId, createComment } from '../services/blogApi';

interface BlogCommentsProps {
  blogId: string;
  languageId: number;
  lang: string;
}

export default function BlogComments({ blogId, languageId, lang }: BlogCommentsProps) {
  const { t } = useTranslation();
  const { user, getValidToken } = useAuth();
  
  const [comments, setComments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [authorName, setAuthorName] = useState(user?.email?.split('@')[0] || '');
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const loadComments = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await fetchCommentsByBlogId(blogId, languageId, 0, 100);
      setComments(data.items || []);
    } catch (err) {
      console.error('Failed to load comments:', err);
      setError(t('blog.commentsLoadError', 'Yorumlar yüklenirken bir hata oluştu.'));
    } finally {
      setIsLoading(false);
    }
  }, [blogId, languageId, t]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  // Update default author name if user logs in later
  useEffect(() => {
    if (user?.email && !authorName) {
      setAuthorName(user.email.split('@')[0]);
    }
  }, [user, authorName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !authorName.trim()) return;

    try {
      setIsSubmitting(true);
      const authToken = await getValidToken();
      await createComment(blogId, authorName.trim(), newComment, languageId, authToken || undefined);
      setNewComment('');
      setSubmitSuccess(true);
      // Wait a moment and reload comments
      setTimeout(() => {
        setSubmitSuccess(false);
        loadComments();
      }, 3000);
    } catch (err) {
      console.error('Comment creation failed:', err);
      alert(t('blog.commentSubmitError', 'Yorum gönderilemedi. Lütfen tekrar deneyin.'));
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
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  // The backend already filters approved comments for public endpoints
  // or returns the appropriate comments based on the user
  const visibleComments = comments;

  return (
    <div className="blog-comments-section" style={{ marginTop: '60px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '40px' }}>
      <h3 style={{ color: '#f1f5f9', fontSize: '1.5rem', marginBottom: '24px' }}>
        {t('blog.comments', 'Yorumlar')}
      </h3>

      {/* Write Comment Form */}
      <div style={{ marginBottom: '40px', background: 'rgba(15, 15, 30, 0.4)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1', fontWeight: 500 }}>
              {t('blog.commentAuthorName', 'Adınız')}
            </label>
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              required
              placeholder={t('blog.authorNamePlaceholder', 'Adınızı girin...')}
              style={{
                width: '100%',
                padding: '12px',
                background: 'rgba(0,0,0,0.2)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: '#fff',
                fontFamily: 'inherit'
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1', fontWeight: 500 }}>
              {t('blog.writeComment', 'Yorum Yaz')}
            </label>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={4}
              required
              placeholder={t('blog.commentPlaceholder', 'Düşüncelerinizi paylaşın...')}
              style={{
                width: '100%',
                padding: '12px',
                background: 'rgba(0,0,0,0.2)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: '#fff',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
            />
          </div>

          {submitSuccess && (
            <div style={{ color: '#4ade80', marginBottom: '16px', fontSize: '0.9rem' }}>
              {t('blog.commentSuccess', 'Yorumunuz başarıyla gönderildi ve onay bekliyor.')}
            </div>
          )}

          <button 
            type="submit" 
            disabled={isSubmitting || !newComment.trim() || !authorName.trim()}
            className="admin-create-btn"
            style={{
              background: (isSubmitting || !newComment.trim() || !authorName.trim()) ? '#475569' : 'linear-gradient(135deg, #7c3aed, #3b82f6)',
              cursor: (isSubmitting || !newComment.trim() || !authorName.trim()) ? 'not-allowed' : 'pointer'
            }}
          >
            {isSubmitting ? t('blog.submitting', 'Gönderiliyor...') : t('blog.submitComment', 'Gönder')}
          </button>
        </form>
      </div>

      {/* Comment List */}
      {isLoading ? (
        <div style={{ textAlign: 'center', color: '#94a3b8', padding: '20px' }}>{t('blog.loading', 'Yükleniyor...')}</div>
      ) : error ? (
        <div style={{ color: '#ef4444', padding: '20px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}>{error}</div>
      ) : visibleComments.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#64748b', padding: '40px 0' }}>
          {t('blog.noComments', 'Henüz yorum yapılmamış. İlk yorumu siz yapın!')}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {visibleComments.map((comment, idx) => (
            <div key={comment.id || idx} style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(124, 58, 237, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a78bfa', fontWeight: 'bold', fontSize: '0.8rem' }}>
                    {(comment.authorName || 'U')?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: '#e2e8f0', fontSize: '0.95rem' }}>{comment.authorName || 'Kullanıcı'}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{formatDate(comment.createdDate)}</div>
                  </div>
                </div>
              </div>
              <div style={{ color: '#cbd5e1', lineHeight: 1.6, whiteSpace: 'pre-wrap', fontSize: '0.95rem' }}>
                {comment.content}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
