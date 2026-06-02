/**
 * Blog Editor Page
 *
 * Create or edit blog posts with rich text editor (ReactQuill).
 * Supports multi-language content, thumbnail upload, and content images.
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ReactQuill, { Quill } from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
// @ts-ignore
import BlotFormatter from '@enzedonline/quill-blot-formatter2';
import '@enzedonline/quill-blot-formatter2/dist/css/quill-blot-formatter2.css';
// @ts-ignore
import QuillImageDropAndPaste from 'quill-image-drop-and-paste';

if (Quill && !Quill.imports['modules/blotFormatter']) {
  Quill.register('modules/blotFormatter', BlotFormatter);
}
if (Quill && !Quill.imports['modules/imageDropAndPaste']) {
  Quill.register('modules/imageDropAndPaste', QuillImageDropAndPaste);
}
import { useDropzone } from 'react-dropzone';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';
import DashboardLayout from '../DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';
import { ApiError } from '../../services/apiClient';
import {
  fetchLanguages,
  fetchBlogBySlug,
  fetchAdminBlogById,
  createBlog,
  createBlogByAdmin,
  updateBlog,
  updateBlogByAdmin,
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
  const quillRef = useRef<ReactQuill>(null);
  const turnstileRef = useRef<TurnstileInstance | null>(null);
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY ?? '';
  const hasSiteKey = siteKey.trim().length > 0;

  const isEditMode = !!editSlug;
  const location = useLocation();
  const isAdminPath = location.pathname.includes('/admin/');
  const isAdminEdit = isEditMode && isAdminPath;
  const requiresTurnstile = !isAdminPath && hasSiteKey;

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
  const [turnstileToken, setTurnstileToken] = useState<string>('');

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
        const editor = quillRef.current?.getEditor();
        if (editor) {
          const range = editor.getSelection(true) || { index: editor.getLength() };
          editor.insertEmbed(range.index, 'image', result.url, 'user');
          editor.setSelection(range.index + 1, 0);
        } else {
          const imageHtml = `<img src="${result.url}" alt="image" />`;
          updateContent('content', (activeContent?.content || '') + '<br/>' + imageHtml + '<br/>');
        }
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

  const uploadImageRef = useRef(handleContentImageUpload);
  uploadImageRef.current = handleContentImageUpload;

  const imageDropHandler = useCallback(function(this: any, _imageDataUrl: string, _type: string, imageData: any) {
    const file = imageData.toFile();
    if (file) {
      uploadImageRef.current(file);
    }
  }, []);

  const quillModules = useMemo(() => ({
    toolbar: {
      container: [
        [{ font: [] }],
        [{ header: [1, 2, 3, 4, 5, 6, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ color: [] }, { background: [] }],
        [{ script: 'sub' }, { script: 'super' }],
        ['blockquote', 'code-block'],
        [{ list: 'ordered' }, { list: 'bullet' }, { list: 'check' }],
        [{ indent: '-1' }, { indent: '+1' }, { align: [] }],
        ['link', 'image', 'video'],
        ['clean'],
      ],
      handlers: {
        image: function(this: any) {
          const input = document.createElement('input');
          input.setAttribute('type', 'file');
          input.setAttribute('accept', 'image/*');
          input.click();

          input.onchange = () => {
            const file = input.files ? input.files[0] : null;
            if (file) {
              uploadImageRef.current(file);
            }
          };
        }
      }
    },
    blotFormatter: {
      image: { allowAltTitleEdit: true, allowCompressor: true, imageOversizeProtection: true },
      video: {}
    },
    imageDropAndPaste: {
      handler: imageDropHandler
    }
  }), [imageDropHandler]);

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

    if (requiresTurnstile && !turnstileToken) {
      setError(t('input.errors.turnstileFailed'));
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
        if (isAdminPath) {
          await updateBlogByAdmin(
            {
              id: editBlogId,
              thumbnailImageUrl: thumbnailUrl,
              creatorUserId: user.userId,
              mainLanguageId,
              blogContents,
            },
            token
          );
        } else {
          await updateBlog(
            {
              id: editBlogId,
              thumbnailImageUrl: thumbnailUrl,
              creatorUserId: user.userId,
              mainLanguageId,
              blogContents,
            },
            token,
            turnstileToken
          );
        }
        setShowUpdatePopup(true);
      } else {
        if (isAdminPath) {
          await createBlogByAdmin(
            {
              thumbnailImageUrl: thumbnailUrl,
              creatorUserId: user.userId,
              mainLanguageId,
              blogContents,
            },
            token
          );
        } else {
          await createBlog(
            {
              thumbnailImageUrl: thumbnailUrl,
              creatorUserId: user.userId,
              mainLanguageId,
              blogContents,
            },
            token,
            turnstileToken
          );
        }

        if (isAdminPath) {
          setSuccessMsg(t('admin.blogCreated', 'Blog eklendi.'));
          setTimeout(() => navigate(`/${lang}/admin/blogs`), 1500);
        } else {
          setSuccessMsg(t('author.blogCreatedPending', 'Blogunuz eklendi, admin kontrolünden sonra yayınlanacaktır.'));
          setTimeout(() => navigate(`/${lang}/my-blogs`), 2500);
        }
      }
      if (requiresTurnstile) {
        setTurnstileToken('');
        turnstileRef.current?.reset();
      }
    } catch (err) {
      console.error('Failed to save blog:', err);
      if (err instanceof ApiError) {
        if (err.isRateLimit) {
          setError(t('input.errors.tooManyRequests'));
        } else if (err.isForbidden && requiresTurnstile) {
          setError(t('input.errors.turnstileFailed'));
        } else {
          setError(err.detail || t('admin.saveError'));
        }
      } else {
        setError(t('admin.saveError'));
      }
      if (requiresTurnstile) {
        setTurnstileToken('');
        turnstileRef.current?.reset();
      }
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
      <DashboardLayout title={t('blog.loading')} isAdmin={true}>
        <div className="blog-loading">
          <span className="spinner" />
          <p>{t('blog.loading')}</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      title={isEditMode ? t('admin.editBlog') : t('admin.createBlog')} 
      isAdmin={true}
    >
      <div className="blog-editor-page" data-color-mode="dark" style={{ padding: 0 }}>
        <div className="static-back-link" style={{ marginBottom: 16 }}>
          <Link to={`/${lang}/admin/blogs`}>← {t('admin.manageBlogs')}</Link>
        </div>
        <h1 style={{ marginTop: 0 }}>{isEditMode ? t('admin.editBlog') : t('admin.createBlog')}</h1>

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
              </label>
              <style>{`
                .admin-quill-wrapper .quill {
                  background: rgba(30, 41, 59, 0.4) !important;
                  border-radius: 8px !important;
                  box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.2) !important;
                  border: 1px solid rgba(167, 139, 250, 0.2) !important;
                  display: flex !important;
                  flex-direction: column !important;
                  height: 600px !important;
                  overflow: hidden !important;
                }
                .admin-quill-wrapper .ql-toolbar.ql-snow {
                  border: none !important;
                  border-bottom: 1px solid rgba(167, 139, 250, 0.2) !important;
                  background: rgba(255, 255, 255, 0.08) !important;
                  padding: 12px !important;
                  border-top-left-radius: 8px !important;
                  border-top-right-radius: 8px !important;
                }
                .admin-quill-wrapper .ql-toolbar.ql-snow .ql-stroke {
                  stroke: #cbd5e1 !important;
                }
                .admin-quill-wrapper .ql-toolbar.ql-snow .ql-fill {
                  fill: #cbd5e1 !important;
                }
                .admin-quill-wrapper .ql-toolbar.ql-snow .ql-picker {
                  color: #cbd5e1 !important;
                }
                .admin-quill-wrapper .ql-toolbar.ql-snow button:hover .ql-stroke,
                .admin-quill-wrapper .ql-toolbar.ql-snow button.ql-active .ql-stroke,
                .admin-quill-wrapper .ql-toolbar.ql-snow .ql-picker-label:hover .ql-stroke,
                .admin-quill-wrapper .ql-toolbar.ql-snow .ql-picker-label.ql-active .ql-stroke,
                .admin-quill-wrapper .ql-toolbar.ql-snow .ql-picker-item:hover .ql-stroke,
                .admin-quill-wrapper .ql-toolbar.ql-snow .ql-picker-item.ql-selected .ql-stroke {
                  stroke: #a78bfa !important;
                }
                .admin-quill-wrapper .ql-toolbar.ql-snow button:hover .ql-fill,
                .admin-quill-wrapper .ql-toolbar.ql-snow button.ql-active .ql-fill,
                .admin-quill-wrapper .ql-toolbar.ql-snow .ql-picker-label:hover .ql-fill,
                .admin-quill-wrapper .ql-toolbar.ql-snow .ql-picker-label.ql-active .ql-fill,
                .admin-quill-wrapper .ql-toolbar.ql-snow .ql-picker-item:hover .ql-fill,
                .admin-quill-wrapper .ql-toolbar.ql-snow .ql-picker-item.ql-selected .ql-fill {
                  fill: #a78bfa !important;
                }
                .admin-quill-wrapper .ql-toolbar.ql-snow .ql-picker-options {
                  background: #1e293b !important;
                  border: 1px solid rgba(167, 139, 250, 0.3) !important;
                }
                .admin-quill-wrapper .ql-container.ql-snow {
                  border: none !important;
                  font-family: inherit !important;
                  font-size: 1.05rem !important;
                  color: #f8fafc !important;
                  flex: 1 !important;
                  display: flex !important;
                  flex-direction: column !important;
                  overflow: hidden !important;
                }
                .admin-quill-wrapper .ql-editor {
                  padding: 20px !important;
                  flex: 1 !important;
                  overflow-y: auto !important;
                }
                .admin-quill-wrapper .ql-editor [class^="ql-image-align-"] {
                  display: flex !important;
                  flex-wrap: wrap !important;
                  width: var(--resize-width, auto);
                  max-width: 100% !important;
                }
                .admin-quill-wrapper .ql-editor [class^="ql-image-align-"] > img {
                  flex: 1 1 auto !important;
                  z-index: 1 !important;
                  width: 100%;
                }
                .admin-quill-wrapper .ql-editor .ql-image-align-left {
                  margin: 0.5rem 1rem 0.5rem 0 !important;
                  float: left !important;
                }
                .admin-quill-wrapper .ql-editor .ql-image-align-center {
                  margin: 1rem auto !important;
                }
                .admin-quill-wrapper .ql-editor .ql-image-align-right {
                  margin: 0.5rem 0 0.5rem 1rem !important;
                  float: right !important;
                }
              `}</style>
              <div className="admin-quill-wrapper">
                <ReactQuill
                  ref={quillRef}
                  theme="snow"
                  value={activeContent.content}
                  onChange={(val, _delta, source) => {
                    if (source === 'user') {
                      updateContent('content', val || '');
                    }
                  }}
                  style={{ marginBottom: '50px', color: '#fff' }}
                  modules={quillModules}
                />
              </div>
            </div>

            {/* Live Preview */}
            <div className="editor-field" style={{ marginTop: '60px' }}>
              <label style={{ color: '#a78bfa', fontWeight: 600, borderBottom: '1px solid rgba(167, 139, 250, 0.2)', paddingBottom: '8px', marginBottom: '16px' }}>
                👁️ {t('admin.livePreview', 'Canlı Önizleme')}
              </label>
              <div className="blog-content" style={{ padding: '20px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', minHeight: '150px' }}>
                <div dangerouslySetInnerHTML={{ __html: activeContent.content || '<em>İçerik bekleniyor...</em>' }} />
              </div>
            </div>
          </>
        )}

        {requiresTurnstile && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
            <Turnstile
              ref={turnstileRef}
              siteKey={siteKey}
              onSuccess={setTurnstileToken}
              options={{
                theme: 'dark',
                size: 'normal',
              }}
            />
          </div>
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
            disabled={isSaving || (requiresTurnstile && !turnstileToken)}
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
  </DashboardLayout>
  );
}
