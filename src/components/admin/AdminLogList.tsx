import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { getLogFiles, getLogFileContent } from '../../services/logApi';
import { LogFileInfo, LogFileDetail } from '../../types/log';
import { formatFileSize, formatLogDate } from '../../utils/logFormatter';
import DashboardLayout from '../DashboardLayout';
import AdminLogViewer from './AdminLogViewer';
import '../BlogPage.css';

type SortOption = 'newest' | 'oldest' | 'sizeDesc' | 'sizeAsc' | 'nameAsc';

export default function AdminLogList() {
  const { lang } = useParams<{ lang: string }>();
  const { t } = useTranslation();
  const { accessToken } = useAuth();

  const [logFiles, setLogFiles] = useState<LogFileInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  // Modal quick-preview state
  const [activeLogFile, setActiveLogFile] = useState<LogFileInfo | null>(null);
  const [activeLogDetail, setActiveLogDetail] = useState<LogFileDetail | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const files = await getLogFiles(accessToken);
      setLogFiles(files);
    } catch (err: any) {
      console.error('Failed to load log files:', err);
      setError(err?.message || t('admin.logsLoadError', 'Log dosyaları yüklenirken bir hata oluştu.'));
    } finally {
      setLoading(false);
    }
  }, [accessToken, t]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Statistics calculation
  const stats = useMemo(() => {
    const totalFiles = logFiles.length;
    const totalBytes = logFiles.reduce((acc, f) => acc + (f.length || 0), 0);
    
    // Find latest log file based on lastWriteTime
    let latestLog: LogFileInfo | null = null;
    let latestTime = 0;

    for (const f of logFiles) {
      const time = new Date(f.lastWriteTime || f.creationTime).getTime();
      if (!isNaN(time) && time > latestTime) {
        latestTime = time;
        latestLog = f;
      }
    }

    return {
      totalFiles,
      totalBytes,
      latestLog,
    };
  }, [logFiles]);

  // Filtered & Sorted files
  const processedFiles = useMemo(() => {
    let list = [...logFiles];

    // Filter by name
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((f) => f.fileName.toLowerCase().includes(q));
    }

    // Sort
    list.sort((a, b) => {
      switch (sortBy) {
        case 'newest': {
          const timeA = new Date(a.lastWriteTime || a.creationTime).getTime() || 0;
          const timeB = new Date(b.lastWriteTime || b.creationTime).getTime() || 0;
          return timeB - timeA;
        }
        case 'oldest': {
          const timeA = new Date(a.lastWriteTime || a.creationTime).getTime() || 0;
          const timeB = new Date(b.lastWriteTime || b.creationTime).getTime() || 0;
          return timeA - timeB;
        }
        case 'sizeDesc':
          return (b.length || 0) - (a.length || 0);
        case 'sizeAsc':
          return (a.length || 0) - (b.length || 0);
        case 'nameAsc':
          return a.fileName.localeCompare(b.fileName);
        default:
          return 0;
      }
    });

    return list;
  }, [logFiles, searchQuery, sortBy]);

  // Quick modal open handler
  const handleOpenPreview = async (file: LogFileInfo) => {
    setActiveLogFile(file);
    setActiveLogDetail(null);
    setModalLoading(true);
    setModalError(null);

    try {
      const detail = await getLogFileContent(file.fileName, accessToken);
      setActiveLogDetail(detail);
    } catch (err: any) {
      console.error('Failed to preview log file:', err);
      setModalError(err?.message || t('admin.logDetailError', 'Log dosyası açılamadı.'));
    } finally {
      setModalLoading(false);
    }
  };

  const handleDownloadFile = async (file: LogFileInfo) => {
    try {
      const detail = await getLogFileContent(file.fileName, accessToken);
      const blob = new Blob([detail.content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
      alert(t('admin.downloadFailed', 'Dosya indirilemedi.'));
    }
  };

  return (
    <DashboardLayout title={t('admin.manageLogs', 'Sistem Logları')} isAdmin={true}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
        
        {/* Header Title & Refresh */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: '1.5rem',
                color: '#f8fafc',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#8b5cf6" strokeWidth="2">
                <polyline points="4 17 10 11 4 5" />
                <line x1="12" y1="19" x2="20" y2="19" />
              </svg>
              {t('admin.manageLogs', 'Sistem Logları')}
            </h1>
            <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: '0.9rem' }}>
              {t('admin.manageLogsDesc', 'C# arka plan servis ve cron job log kayıtlarını inceleyin.')}
            </p>
          </div>

          <button
            onClick={fetchLogs}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(139, 92, 246, 0.15)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              color: '#c4b5fd',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '0.9rem',
              fontWeight: 600,
              transition: 'all 0.2s',
            }}
          >
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }}
            >
              <path d="M23 4v6h-6M1 20v-6h6" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            {t('admin.refresh', 'Yenile')}
          </button>
        </div>

        {/* Error Notification */}
        {error && (
          <div
            style={{
              padding: '16px 20px',
              background: 'rgba(239, 68, 68, 0.12)',
              color: '#f87171',
              borderRadius: '8px',
              marginBottom: '24px',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>{error}</span>
            <button
              onClick={fetchLogs}
              style={{
                background: 'rgba(239, 68, 68, 0.2)',
                border: 'none',
                color: '#fca5a5',
                padding: '4px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              {t('admin.retry', 'Tekrar Dene')}
            </button>
          </div>
        )}

        {/* Top Metric Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          {/* Card 1: Total Files */}
          <div
            style={{
              background: 'rgba(30, 30, 50, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              padding: '18px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                background: 'rgba(139, 92, 246, 0.15)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#a78bfa',
              }}
            >
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <div>
              <div style={{ color: '#94a3b8', fontSize: '0.82rem', fontWeight: 500 }}>
                {t('admin.totalLogFiles', 'Toplam Log Dosyası')}
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f8fafc', marginTop: '2px' }}>
                {stats.totalFiles}
              </div>
            </div>
          </div>

          {/* Card 2: Total Storage Size */}
          <div
            style={{
              background: 'rgba(30, 30, 50, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              padding: '18px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                background: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#38bdf8',
              }}
            >
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
                <ellipse cx="12" cy="5" rx="9" ry="3" />
                <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
              </svg>
            </div>
            <div>
              <div style={{ color: '#94a3b8', fontSize: '0.82rem', fontWeight: 500 }}>
                {t('admin.totalLogSize', 'Toplam Boyut')}
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f8fafc', marginTop: '2px' }}>
                {formatFileSize(stats.totalBytes)}
              </div>
            </div>
          </div>

          {/* Card 3: Latest Log Activity */}
          <div
            style={{
              background: 'rgba(30, 30, 50, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              padding: '18px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                background: 'rgba(34, 197, 94, 0.15)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#4ade80',
              }}
            >
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ color: '#94a3b8', fontSize: '0.82rem', fontWeight: 500 }}>
                {t('admin.latestLog', 'Son Güncellenen Log')}
              </div>
              <div
                style={{
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  color: '#f8fafc',
                  marginTop: '2px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={stats.latestLog?.fileName || '-'}
              >
                {stats.latestLog ? stats.latestLog.fileName : '-'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                {stats.latestLog ? formatLogDate(stats.latestLog.lastWriteTime) : '-'}
              </div>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div
          style={{
            background: 'rgba(30, 30, 50, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          {/* Search Box */}
          <div style={{ position: 'relative', flex: '1 1 280px', maxWidth: '420px' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('admin.searchLogFilePlaceholder', 'Dosya adına göre ara (örn. 20260901.txt)...')}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                background: 'rgba(15, 15, 30, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '8px',
                padding: '10px 36px 10px 38px',
                color: '#f8fafc',
                fontSize: '0.9rem',
                outline: 'none',
              }}
            />
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="none"
              stroke="#64748b"
              strokeWidth="2"
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  fontSize: '16px',
                }}
              >
                &times;
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{t('admin.sortBy', 'Sırala')}:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              style={{
                background: 'rgba(15, 15, 30, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '8px',
                color: '#f8fafc',
                padding: '8px 14px',
                fontSize: '0.85rem',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <option value="newest">{t('admin.sortNewest', 'En Yeni (Değişiklik Tarihi)')}</option>
              <option value="oldest">{t('admin.sortOldest', 'En Eski (Değişiklik Tarihi)')}</option>
              <option value="sizeDesc">{t('admin.sortSizeDesc', 'En Büyük Boyut')}</option>
              <option value="sizeAsc">{t('admin.sortSizeAsc', 'En Küçük Boyut')}</option>
              <option value="nameAsc">{t('admin.sortNameAsc', 'Dosya Adı (A-Z)')}</option>
            </select>
          </div>
        </div>

        {/* Log Files Table Card */}
        <div
          style={{
            background: 'rgba(30, 30, 50, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            overflow: 'hidden',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', background: 'rgba(255, 255, 255, 0.02)' }}>
                  <th style={{ padding: '14px 18px', color: '#94a3b8', fontWeight: 600, fontSize: '0.85rem' }}>
                    {t('admin.fileName', 'Dosya Adı')}
                  </th>
                  <th style={{ padding: '14px 18px', color: '#94a3b8', fontWeight: 600, fontSize: '0.85rem' }}>
                    {t('admin.fileSize', 'Boyut')}
                  </th>
                  <th style={{ padding: '14px 18px', color: '#94a3b8', fontWeight: 600, fontSize: '0.85rem' }}>
                    {t('admin.creationDate', 'Oluşturulma Tarihi')}
                  </th>
                  <th style={{ padding: '14px 18px', color: '#94a3b8', fontWeight: 600, fontSize: '0.85rem' }}>
                    {t('admin.lastModified', 'Son Değiştirilme')}
                  </th>
                  <th style={{ padding: '14px 18px', color: '#94a3b8', fontWeight: 600, fontSize: '0.85rem', textAlign: 'right' }}>
                    {t('admin.actions', 'İşlemler')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '56px 16px', color: '#94a3b8' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                        <span className="spinner" style={{ width: '28px', height: '28px' }} />
                      </div>
                      {t('admin.loadingLogFiles', 'Log dosyaları yükleniyor...')}
                    </td>
                  </tr>
                ) : processedFiles.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '56px 16px', color: '#94a3b8' }}>
                      <svg
                        viewBox="0 0 24 24"
                        width="36"
                        height="36"
                        fill="none"
                        stroke="#64748b"
                        strokeWidth="1.5"
                        style={{ margin: '0 auto 12px', display: 'block' }}
                      >
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                      {searchQuery
                        ? t('admin.noMatchingLogFiles', 'Arama kriterlerine uygun log dosyası bulunamadı.')
                        : t('admin.noLogFilesFound', 'Henüz listelenecek bir log dosyası bulunmuyor.')}
                    </td>
                  </tr>
                ) : (
                  processedFiles.map((file) => (
                    <tr
                      key={file.fileName}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      {/* File Name */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#a78bfa" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                          </svg>
                          <button
                            onClick={() => handleOpenPreview(file)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#f0f6fc',
                              fontWeight: 600,
                              fontSize: '0.9rem',
                              fontFamily: "'JetBrains Mono', Consolas, monospace",
                              cursor: 'pointer',
                              padding: 0,
                              textAlign: 'left',
                              textDecoration: 'none',
                              transition: 'color 0.15s',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = '#38bdf8';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = '#f0f6fc';
                            }}
                            title={t('admin.clickToPreview', 'Önizlemek için tıklayın')}
                          >
                            {file.fileName}
                          </button>
                        </div>
                      </td>

                      {/* File Size */}
                      <td style={{ padding: '14px 18px' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: 'rgba(56, 189, 248, 0.12)',
                            color: '#38bdf8',
                            border: '1px solid rgba(56, 189, 248, 0.25)',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            fontFamily: "'JetBrains Mono', Consolas, monospace",
                          }}
                        >
                          {formatFileSize(file.length)}
                        </span>
                      </td>

                      {/* Creation Date */}
                      <td style={{ padding: '14px 18px', color: '#94a3b8', fontSize: '0.85rem' }}>
                        {formatLogDate(file.creationTime)}
                      </td>

                      {/* Last Modified */}
                      <td style={{ padding: '14px 18px', color: '#cbd5e1', fontSize: '0.85rem' }}>
                        {formatLogDate(file.lastWriteTime)}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                          {/* Quick Preview Button */}
                          <button
                            onClick={() => handleOpenPreview(file)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              background: 'rgba(139, 92, 246, 0.15)',
                              color: '#a78bfa',
                              border: '1px solid rgba(139, 92, 246, 0.3)',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              transition: 'all 0.2s',
                            }}
                            title={t('admin.viewLog', 'İncele')}
                          >
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                            {t('admin.view', 'İncele')}
                          </button>

                          {/* Full Page Button */}
                          <Link
                            to={`/${lang}/admin/logs/${encodeURIComponent(file.fileName)}`}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '32px',
                              height: '32px',
                              background: 'rgba(255, 255, 255, 0.06)',
                              color: '#94a3b8',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              borderRadius: '6px',
                              textDecoration: 'none',
                              transition: 'all 0.2s',
                            }}
                            title={t('admin.openFullscreen', 'Tam Sayfada Aç')}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = '#f8fafc';
                              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = '#94a3b8';
                              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                            }}
                          >
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                              <polyline points="15 3 21 3 21 9" />
                              <line x1="10" y1="14" x2="21" y2="3" />
                            </svg>
                          </Link>

                          {/* Download Button */}
                          <button
                            onClick={() => handleDownloadFile(file)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '32px',
                              height: '32px',
                              background: 'rgba(59, 130, 246, 0.1)',
                              color: '#60a5fa',
                              border: '1px solid rgba(59, 130, 246, 0.2)',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                            }}
                            title={t('admin.download', 'İndir')}
                          >
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="7 10 12 15 17 10" />
                              <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Quick-Preview Drawer / Overlay */}
        {activeLogFile && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.75)',
              backdropFilter: 'blur(4px)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
              boxSizing: 'border-box',
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setActiveLogFile(null);
              }
            }}
          >
            <div
              style={{
                width: '100%',
                maxWidth: '1200px',
                height: '85vh',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {modalLoading ? (
                <div
                  style={{
                    height: '100%',
                    background: '#0d1117',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#94a3b8',
                  }}
                >
                  <span className="spinner" style={{ width: '32px', height: '32px', marginBottom: '16px' }} />
                  <span>{t('admin.loadingLogFile', 'Log dosyası açılıyor...')}</span>
                </div>
              ) : modalError ? (
                <div
                  style={{
                    padding: '32px',
                    background: '#0d1117',
                    borderRadius: '12px',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#f87171',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '12px' }}>
                    {modalError}
                  </div>
                  <button
                    onClick={() => setActiveLogFile(null)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: 'none',
                      color: '#f8fafc',
                      padding: '8px 20px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                    }}
                  >
                    {t('admin.close', 'Kapat')}
                  </button>
                </div>
              ) : activeLogDetail ? (
                <AdminLogViewer
                  detail={activeLogDetail}
                  fileLength={activeLogFile.length}
                  onClose={() => setActiveLogFile(null)}
                  fullscreenLink={`/${lang}/admin/logs/${encodeURIComponent(activeLogFile.fileName)}`}
                  onRefresh={() => handleOpenPreview(activeLogFile)}
                />
              ) : null}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
