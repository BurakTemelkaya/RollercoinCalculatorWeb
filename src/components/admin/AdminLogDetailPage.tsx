import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { getLogFileContent } from '../../services/logApi';
import { LogFileDetail } from '../../types/log';
import DashboardLayout from '../DashboardLayout';
import AdminLogViewer from './AdminLogViewer';
import '../BlogPage.css';

export default function AdminLogDetailPage() {
  const { lang, fileName } = useParams<{ lang: string; fileName: string }>();
  const { t } = useTranslation();
  const { accessToken } = useAuth();

  const [detail, setDetail] = useState<LogFileDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const decodedFileName = fileName ? decodeURIComponent(fileName) : '';

  const loadLogDetail = useCallback(async () => {
    if (!decodedFileName) {
      setError(t('admin.logFileNotFound', 'Log dosyası adı belirtilmedi.'));
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getLogFileContent(decodedFileName, accessToken);
      setDetail(data);
    } catch (err: any) {
      console.error('Failed to load log detail:', err);
      setError(err?.message || t('admin.logDetailError', 'Log dosyası yüklenirken bir hata oluştu.'));
    } finally {
      setLoading(false);
    }
  }, [decodedFileName, accessToken, t]);

  useEffect(() => {
    loadLogDetail();
  }, [loadLogDetail]);

  const pageTitle = decodedFileName
    ? `${decodedFileName} - ${t('admin.logViewer', 'Log Görüntüleyici')}`
    : t('admin.logViewer', 'Log Görüntüleyici');

  return (
    <DashboardLayout
      title={pageTitle}
      isAdmin={true}
      adminBackTo={`/${lang}/admin/logs`}
      adminBackLabel={t('admin.backToLogs', 'Log Listesine Dön')}
    >
      <div style={{ maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
        {/* Breadcrumb / Top Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Link
              to={`/${lang}/admin/logs`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: '#94a3b8',
                textDecoration: 'none',
                fontSize: '0.9rem',
                fontWeight: 500,
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#f8fafc';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#94a3b8';
              }}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              {t('admin.manageLogs', 'Sistem Logları')}
            </Link>
            <span style={{ color: '#64748b' }}>/</span>
            <span style={{ color: '#f1f5f9', fontWeight: 600, fontSize: '0.9rem' }}>
              {decodedFileName}
            </span>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            style={{
              padding: '16px 20px',
              background: 'rgba(239, 68, 68, 0.12)',
              color: '#f87171',
              borderRadius: '8px',
              marginBottom: '20px',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
            }}
          >
            <span>{error}</span>
            <button
              onClick={loadLogDetail}
              style={{
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#fca5a5',
                padding: '6px 14px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 600,
              }}
            >
              {t('admin.retry', 'Tekrar Dene')}
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '80px 20px',
              background: '#0d1117',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: '#94a3b8',
            }}
          >
            <span className="spinner" style={{ width: '32px', height: '32px', marginBottom: '16px' }} />
            <span>{t('admin.loadingLogFile', 'Log dosyası yükleniyor...')}</span>
          </div>
        )}

        {/* Loaded Detail Viewer */}
        {!loading && detail && (
          <AdminLogViewer
            detail={detail}
            onRefresh={loadLogDetail}
            isLoading={loading}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
