/**
 * Blog Editor Page
 *
 * Create or edit blog posts with rich markdown editor (@uiw/react-md-editor).
 * Supports multi-language content, image upload, and live preview.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { useDropzone } from 'react-dropzone';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { useAuth } from '../../contexts/AuthContext';
import {
  fetchLanguages,
  fetchBlogBySlug,
  fetchAdminBlogById,
  createBlog,
  updateBlog,
  uploadBlogImage,
} from '../../services/blogApi';
import type { Language, BlogContentDto } from '../../types/blog';
import '../BlogPage.css';

interface ContentEntry {
  id?: string;
  title: string;
  content: string;
  slug: string;
  languageId: number;
  thumbnailImageUrl?: string | null;
}

export default function BlogEditor() {
  const { lang, slug: editSlug } = useParams<{ lang: string; slug: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, getValidToken } = useAuth();
  const contentFileInputRef = useRef<HTMLInputElement>(null);

  const isEditMode = !!editSlug;
  const location = useLocation();
  const isAdminEdit = isEditMode && location.pathname.includes('/admin/');

  const [languages, setLanguages] = useState<Language[]>([]);
  const [activeLangId, setActiveLangId] = useState<number | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [mainLanguageId, setMainLanguageId] = useState<number | null>(null);
  const [editBlogId, setEditBlogId] = useState<string | null>(null);
  const [contents, setContents] = useState<ContentEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showUpdatePopup, setShowUpdatePopup] = useState(false);

  // Hide global ads for dashboard panels
  useEffect(() => {
    document.body.classList.add('hide-global-ads');
    return () => document.body.classList.remove('hide-global-ads');
  }, []);

  // Load languages
  useEffect(() => {
    fetchLanguages()
      .then((data) => {
        setLanguages(data);
        if (!activeLangId && data.length > 0) {
          const defaultLang = data.find((l) => l.code.toLowerCase() === (lang || 'en').toLowerCase());
          setActiveLangId(defaultLang?.id ?? data[0].id);
          setMainLanguageId(defaultLang?.id ?? data[0].id);
        }
      })
      .catch(console.error);
  }, [lang]);

  // Load existing blog data in edit mode
  useEffect(() => {
    if (!isEditMode || !editSlug) {
      if (!isEditMode) setIsLoading(false);
      return;
    }

    const loadBlog = async () => {
      setIsLoading(true);
      try {
        if (isAdminEdit) {
          // Admin edit: editSlug is actually a blog ID
          const token = await getValidToken();
          if (!token) {
            setError(t('auth.sessionExpired'));
            setIsLoading(false);
            return;
          }
          const adminBlog = await fetchAdminBlogById(editSlug, token);

          setEditBlogId(adminBlog.id);
          setThumbnailUrl(adminBlog.thumbnailImageUrl || '');
          setMainLanguageId(adminBlog.mainLanguageId ?? null);

          const entries: ContentEntry[] = (adminBlog.blogContents || []).map((bc) => ({
            id: bc.id,
            title: bc.title,
            content: bc.content,
            slug: bc.slug,
            languageId: bc.languageId,
            thumbnailImageUrl: bc.thumbnailImageUrl,
          }));

          setContents(entries);
          if (entries.length > 0) {
            setActiveLangId(entries[0].languageId);
          }
        } else {
          // User edit: editSlug is a slug
          const blog = await fetchBlogBySlug(editSlug);

          setEditBlogId(blog.id);
          setThumbnailUrl(blog.thumbnailImageUrl || '');
          setMainLanguageId(blog.mainLanguageId ?? null);

          const entries: ContentEntry[] = [];
          for (const al of (blog.availableLanguages || [])) {
            try {
              const langBlog = al.slug === editSlug ? blog : await fetchBlogBySlug(al.slug);
              const bc = langBlog.blogContent;
              if (bc) {
                entries.push({
                  id: bc.id,
                  title: bc.title,
                  content: bc.content,
                  slug: bc.slug,
                  languageId: bc.languageId,
                  thumbnailImageUrl: bc.thumbnailImageUrl,
                });
              }
            } catch {
              // Skip if content for this language can't be fetched
            }
          }

          setContents(entries);
          if (entries.length > 0) {
            setActiveLangId(entries[0].languageId);
          }
        }
      } catch (err) {
        console.error('Failed to load blog:', err);
        setError(t('blog.loadError'));
      } finally {
        setIsLoading(false);
      }
    };

    loadBlog();
  }, [isEditMode, editSlug, isAdminEdit, t, getValidToken]);

  // Ensure all languages have a content entry (empty for new ones).
  // Runs after languages load (create mode) or after blog loads (edit mode).
  useEffect(() => {
    if (languages.length === 0) return;
    // In edit mode, wait until loading finishes
    if (isEditMode && isLoading) return;

    setContents((prev) => {
      const existingLangIds = new Set(prev.map((c) => c.languageId));
      const missing = languages
        .filter((l) => !existingLangIds.has(l.id))
        .map((l) => ({
          title: '',
          content: '',
          slug: '',
          languageId: l.id,
          thumbnailImageUrl: null,
        }));

      if (missing.length === 0) return prev;
      return [...prev, ...missing];
    });
  }, [languages, isEditMode, isLoading]);

  // Get current language content
  const activeContent = contents.find((c) => c.languageId === activeLangId);

  // Update content for active language
  const updateContent = useCallback(
    (field: keyof ContentEntry, value: string) => {
      setContents((prev) =>
        prev.map((c) =>
          c.languageId === activeLangId ? { ...c, [field]: value } : c
        )
      );
    },
    [activeLangId]
  );

  // Auto-generate slug from title
  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  // Handle thumbnail upload
  const handleThumbnailUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const token = await getValidToken();
      if (!token) {
        setError(t('auth.sessionExpired'));
        return;
      }
      const result = await uploadBlogImage(file, token);
      if (result.isSuccess) {
        setThumbnailUrl(result.url);
      } else {
        setError(t('admin.uploadError'));
      }
    } catch (err) {
      console.error('Upload failed:', err);
      setError(t('admin.uploadError'));
    } finally {
      setIsUploading(false);
    }
  };

  // Handle content image upload (inserts markdown image at cursor)
  const handleContentImageUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const token = await getValidToken();
      if (!token) {
        setError(t('auth.sessionExpired'));
        return;
      }
      const result = await uploadBlogImage(file, token);
      if (result.isSuccess) {
        const imageHtml = `<img src="${result.url}" alt="image" />`;
        updateContent('content', (activeContent?.content || '') + '<br/>' + imageHtml + '<br/>');
      } else {
        setError(t('admin.uploadError'));
      }
    } catch (err) {
      console.error('Upload failed:', err);
      setError(t('admin.uploadError'));
    } finally {
      setIsUploading(false);
    }
  };

  // Handle save
  const handleSave = async () => {
    if (!user) return;

    // Validate
    const filledContents = contents.filter((c) => c.title.trim() && c.content.trim() && c.slug.trim());
    if (filledContents.length === 0) {
      setError(t('admin.fillAtLeastOne'));
      return;
    }
    
    if (!mainLanguageId) {
      setError(t('admin.mainLanguageRequired', 'Ana dil seçimi zorunludur.'));
      return;
    }
    
    if (!thumbnailUrl) {
      setError(t('admin.thumbnailRequired', 'Ana resim (thumbnail) yüklemek zorunludur.'));
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const token = await getValidToken();
      if (!token) {
        setError(t('auth.sessionExpired'));
        return;
      }

      const blogContents: BlogContentDto[] = filledContents.map((c) => ({
        ...(c.id ? { id: c.id } : {}),
        title: c.title,
        content: c.content,
        slug: c.slug,
        languageId: c.languageId,
        thumbnailImageUrl: c.thumbnailImageUrl || null,
      }));

      if (isEditMode && editBlogId) {
        await updateBlog(
          {
            id: editBlogId,
            thumbnailImageUrl: thumbnailUrl,
            creatorUserId: user.userId,
            mainLanguageId,
            blogContents,
          },
          token
        );
        setShowUpdatePopup(true);
      } else {
        await createBlog(
          {
            thumbnailImageUrl: thumbnailUrl,
            creatorUserId: user.userId,
            mainLanguageId,
            blogContents,
          },
          token
        );
        
        const isAdminPath = location.pathname.includes('/admin/');
        if (isAdminPath) {
          setSuccessMsg(t('admin.blogCreated', 'Blog eklendi.'));
          setTimeout(() => navigate(`/${lang}/admin/blogs`), 1500);
        } else {
          setSuccessMsg(t('author.blogCreatedPending', 'Blogunuz eklendi, admin kontrolünden sonra yayınlanacaktır.'));
          setTimeout(() => navigate(`/${lang}/my-blogs`), 2500);
        }
      }
    } catch (err) {
      console.error('Failed to save blog:', err);
      setError(t('admin.saveError'));
    } finally {
      setIsSaving(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        handleThumbnailUpload(acceptedFiles[0]);
      }
    },
    accept: { 'image/*': [] },
    multiple: false,
  });

  if (isLoading) {
    return (
      <div className="blog-editor-page">
        <div className="blog-loading">
          <span className="spinner" />
          <p>{t('blog.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="blog-editor-page" data-color-mode="dark">
      <Helmet>
        <title>{isEditMode ? t('admin.editBlog') : t('admin.createBlog')} | Admin</title>
      </Helmet>

      <div className="static-back-link">
        <Link to={`/${lang}/admin/blogs`}>← {t('admin.blogs')}</Link>
      </div>

      <h1>{isEditMode ? t('admin.editBlog') : t('admin.createBlog')}</h1>

      {error && (
        <div className="blog-error" style={{ marginBottom: 20 }}>
          <p>{error}</p>
        </div>
      )}

      {successMsg && (
        <div style={{
          padding: '12px 16px',
          marginBottom: 20,
          background: 'rgba(34, 197, 94, 0.1)',
          border: '1px solid rgba(34, 197, 94, 0.25)',
          borderRadius: 12,
          color: '#86efac',
          fontSize: '0.85rem',
        }}>
          ✅ {successMsg}
        </div>
      )}

      <div className="blog-editor-form">
        {/* Thumbnail */}
        <div className="editor-field">
          <label>{t('admin.blogThumbnail')}</label>
          <div className="editor-thumbnail-section" {...getRootProps()} style={{ cursor: 'pointer', position: 'relative', border: isDragActive ? '2px dashed #8b5cf6' : '1px solid rgba(255,255,255,0.1)', padding: 16, borderRadius: 12, background: isDragActive ? 'rgba(139, 92, 246, 0.1)' : 'rgba(15, 15, 30, 0.5)', transition: 'all 0.2s ease', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <input {...getInputProps()} />
            <div className="editor-thumbnail-preview" style={{ width: '100%', height: 200, display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: 8, overflow: 'hidden' }}>
              {thumbnailUrl ? (
                <img src={thumbnailUrl} alt="Thumbnail" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#64748b', gap: 8 }}>
                  <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                  <p style={{ margin: 0, fontSize: '0.9rem' }}>
                    {isDragActive ? 'Resmi buraya bırakın...' : 'Resim yüklemek için tıklayın veya sürükleyin'}
                  </p>
                </div>
              )}
            </div>
            {isUploading && (
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 12 }}>
                <span className="spinner" style={{ width: 24, height: 24 }} />
              </div>
            )}
            <div style={{ width: '100%', marginTop: 8 }} onClick={(e) => e.stopPropagation()}>
              <input
                type="text"
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
                placeholder={t('admin.thumbnailUrlPlaceholder')}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: 'rgba(15, 15, 30, 0.5)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8,
                  color: '#e2e8f0',
                  fontSize: '0.8rem',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>
        </div>

        {/* Main Language */}
        <div className="editor-field">
          <label>{t('admin.mainLanguage')}</label>
          <select
            value={mainLanguageId ?? ''}
            onChange={(e) => setMainLanguageId(Number(e.target.value) || null)}
          >
            <option value="">—</option>
            {languages.map((l) => (
              <option key={l.id} value={l.id}>{l.nativeName} ({l.code})</option>
            ))}
          </select>
        </div>

        {/* Language Tabs */}
        <div className="editor-field">
          <label>{t('admin.blogLanguage')}</label>
          <div className="editor-lang-tabs">
            {languages.map((l) => {
              const hasContent = contents.find((c) => c.languageId === l.id && c.title.trim());
              return (
                <button
                  key={l.id}
                  type="button"
                  className={`editor-lang-tab ${activeLangId === l.id ? 'active' : ''}`}
                  onClick={() => setActiveLangId(l.id)}
                >
                  {l.nativeName}
                  {hasContent && <span style={{ marginLeft: 4, color: '#22c55e' }}>●</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content fields for active language */}
        {activeContent && (
          <>
            <div className="editor-field">
              <label>{t('admin.blogTitle')}</label>
              <input
                type="text"
                value={activeContent.title}
                onChange={(e) => updateContent('title', e.target.value)}
                placeholder={t('admin.titlePlaceholder')}
              />
            </div>

            <div className="editor-field">
              <label>{t('admin.blogSlug')}</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  value={activeContent.slug}
                  onChange={(e) => updateContent('slug', e.target.value)}
                  placeholder={t('admin.slugPlaceholder')}
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  className="editor-upload-btn"
                  onClick={() => updateContent('slug', generateSlug(activeContent.title))}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  {t('admin.autoSlug')}
                </button>
              </div>
            </div>

            <div className="editor-field">
              <label style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {t('admin.blogContent')}
                <button
                  type="button"
                  className="editor-upload-btn"
                  style={{ textTransform: 'none', fontSize: '0.75rem', padding: '4px 10px' }}
                  onClick={() => contentFileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  📷 {t('admin.insertImage')}
                </button>
                <input
                  ref={contentFileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleContentImageUpload(file);
                    e.target.value = '';
                  }}
                />
              </label>
              <div className="quill-editor-container">
                <ReactQuill
                  theme="snow"
                  value={activeContent.content}
                  onChange={(val) => updateContent('content', val || '')}
                  style={{ height: '400px', marginBottom: '50px', background: 'rgba(255,255,255,0.02)', color: '#fff' }}
                  modules={{
                    toolbar: [
                      [{ header: [1, 2, 3, false] }],
                      ['bold', 'italic', 'underline', 'strike'],
                      [{ list: 'ordered' }, { list: 'bullet' }],
                      ['link', 'image', 'video'],
                      ['clean'],
                    ],
                  }}
                />
              </div>
            </div>

            {/* Live Preview */}
            <div className="editor-field" style={{ marginTop: '60px' }}>
              <label style={{ color: '#a78bfa', fontWeight: 600, borderBottom: '1px solid rgba(167, 139, 250, 0.2)', paddingBottom: '8px', marginBottom: '16px' }}>
                👁️ {t('admin.livePreview', 'Canlı Önizleme')}
              </label>
              <div className="blog-content" style={{ padding: '20px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', minHeight: '150px' }}>
                <ReactMarkdown rehypePlugins={[rehypeRaw]} remarkPlugins={[remarkGfm]}>
                  {activeContent.content || '*İçerik bekleniyor...*'}
                </ReactMarkdown>
              </div>
            </div>
          </>
        )}

        {/* Actions */}
        <div className="editor-actions">
          <button
            type="button"
            className="editor-cancel-btn"
            onClick={() => navigate(`/${lang}/admin/blogs`)}
          >
            {t('admin.cancel')}
          </button>
          <button
            type="button"
            className="editor-save-btn"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <><span className="spinner" style={{ width: 14, height: 14 }} /> {t('admin.saving')}</>
            ) : (
              t('admin.save')
            )}
          </button>
        </div>
      </div>

      {showUpdatePopup && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)', zIndex: 9999,
          display: 'flex', justifyContent: 'center', alignItems: 'center'
        }}>
          <div style={{
            background: '#1e293b', padding: '24px 32px', borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
          }}>
            <h3 style={{ color: '#22c55e', margin: '0 0 16px', fontSize: '1.25rem' }}>
              ✅ {t('admin.blogUpdated', 'Blog güncellendi!')}
            </h3>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 24 }}>
              <button
                onClick={() => setShowUpdatePopup(false)}
                style={{
                  padding: '8px 16px', background: 'rgba(255,255,255,0.1)',
                  color: '#e2e8f0', border: 'none', borderRadius: 8, cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                {t('admin.stayOnPage', 'Sayfada Kal')}
              </button>
              <button
                onClick={() => navigate(location.pathname.includes('/admin/') ? `/${lang}/admin/blogs` : `/${lang}/my-blogs`)}
                style={{
                  padding: '8px 16px', background: '#3b82f6',
                  color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                {t('admin.returnToList', 'Blog Listesine Dön')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
