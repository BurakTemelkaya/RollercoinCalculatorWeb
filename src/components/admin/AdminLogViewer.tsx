import { useState, useMemo, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { LogFileDetail, LogLevel } from '../../types/log';
import { parseCSharpLogs, getLogLevelBadgeStyle, formatLogDate, formatFileSize } from '../../utils/logFormatter';
import StackTraceViewer from './StackTraceViewer';

interface AdminLogViewerProps {
  detail: LogFileDetail;
  fileLength?: number;
  onRefresh?: () => void;
  isLoading?: boolean;
  onClose?: () => void;
  fullscreenLink?: string;
}

export default function AdminLogViewer({
  detail,
  fileLength,
  onRefresh,
  isLoading = false,
  onClose,
  fullscreenLink,
}: AdminLogViewerProps) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<'ALL' | LogLevel>('ALL');
  const [isWordWrap, setIsWordWrap] = useState(true);
  const [isRawMode, setIsRawMode] = useState(false);
  const [copied, setCopied] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const bottomAnchorRef = useRef<HTMLDivElement>(null);

  // Parse C# log entries
  const parsedLines = useMemo(() => {
    return parseCSharpLogs(detail.content);
  }, [detail.content]);

  // Counts by log level
  const counts = useMemo(() => {
    const map: Record<string, number> = {
      ALL: parsedLines.length,
      Information: 0,
      Warning: 0,
      Error: 0,
      Debug: 0,
      Other: 0,
    };

    for (const line of parsedLines) {
      if (line.level in map) {
        map[line.level]++;
      } else if (line.level === 'Fatal') {
        map['Error']++;
      } else {
        map['Other']++;
      }
    }
    return map;
  }, [parsedLines]);

  // Filter lines based on search term and selected level
  const filteredLines = useMemo(() => {
    let result = parsedLines;

    if (selectedLevel !== 'ALL') {
      if (selectedLevel === 'Error') {
        result = result.filter(l => l.level === 'Error' || l.level === 'Fatal');
      } else {
        result = result.filter(l => l.level === selectedLevel);
      }
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(l =>
        l.message.toLowerCase().includes(q) ||
        (l.timestamp && l.timestamp.toLowerCase().includes(q)) ||
        l.level.toLowerCase().includes(q)
      );
    }

    return result;
  }, [parsedLines, selectedLevel, searchTerm]);

  // Reset copied status after 2 seconds
  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  const handleCopyAll = async () => {
    try {
      await navigator.clipboard.writeText(detail.content);
      setCopied(true);
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([detail.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = detail.name || 'log.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const scrollToTop = () => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const scrollToBottom = () => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  };

  const highlightSearch = (text: string) => {
    if (!searchTerm.trim()) return text;
    const parts = text.split(new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === searchTerm.toLowerCase() ? (
            <mark
              key={i}
              style={{
                background: 'rgba(250, 204, 21, 0.35)',
                color: '#fef08a',
                borderRadius: '3px',
                padding: '0 2px',
              }}
            >
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: '600px',
        maxHeight: '85vh',
        background: '#0d1117',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 12px 36px rgba(0, 0, 0, 0.4)',
        fontFamily: 'inherit',
      }}
    >
      {/* Top Header Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '14px 18px',
          background: 'rgba(22, 27, 34, 0.95)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(59, 130, 246, 0.2))',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              color: '#a78bfa',
              flexShrink: 0,
            }}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="4 17 10 11 4 5" />
              <line x1="12" y1="19" x2="20" y2="19" />
            </svg>
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span
                style={{
                  fontWeight: 600,
                  fontSize: '1rem',
                  color: '#f0f6fc',
                  fontFamily: "'JetBrains Mono', Consolas, monospace",
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={detail.name}
              >
                {detail.name}
              </span>
              {fileLength !== undefined && (
                <span
                  style={{
                    fontSize: '0.75rem',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    background: 'rgba(56, 189, 248, 0.1)',
                    color: '#38bdf8',
                    border: '1px solid rgba(56, 189, 248, 0.25)',
                    fontWeight: 500,
                  }}
                >
                  {formatFileSize(fileLength)}
                </span>
              )}
              <span
                style={{
                  fontSize: '0.75rem',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  color: '#8b949e',
                }}
              >
                {parsedLines.length} {t('admin.lines', 'satır')}
              </span>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#8b949e', marginTop: '2px' }}>
              {t('admin.lastModified', 'Son Değiştirilme')}: {formatLogDate(detail.lastWriteTime)}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#c9d1d9',
                padding: '6px 12px',
                borderRadius: '6px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                fontSize: '0.8rem',
                transition: 'all 0.2s',
              }}
              title={t('admin.refresh', 'Yenile')}
            >
              <svg
                viewBox="0 0 24 24"
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{ animation: isLoading ? 'spin 1s linear infinite' : 'none' }}
              >
                <path d="M23 4v6h-6M1 20v-6h6" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
              {t('admin.refresh', 'Yenile')}
            </button>
          )}

          <button
            onClick={handleCopyAll}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: copied ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255, 255, 255, 0.06)',
              border: `1px solid ${copied ? 'rgba(34, 197, 94, 0.4)' : 'rgba(255, 255, 255, 0.1)'}`,
              color: copied ? '#4ade80' : '#c9d1d9',
              padding: '6px 12px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.8rem',
              transition: 'all 0.2s',
            }}
            title={copied ? t('admin.copied', 'Kopyalandı!') : t('admin.copy', 'Kopyala')}
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            {copied ? t('admin.copied', 'Kopyalandı!') : t('admin.copy', 'Kopyala')}
          </button>

          <button
            onClick={handleDownload}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(59, 130, 246, 0.15)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              color: '#60a5fa',
              padding: '6px 12px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 500,
              transition: 'all 0.2s',
            }}
            title={t('admin.download', 'İndir')}
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            {t('admin.download', 'İndir')}
          </button>

          {fullscreenLink && (
            <a
              href={fullscreenLink}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(139, 92, 246, 0.15)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                color: '#a78bfa',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.8rem',
                textDecoration: 'none',
                fontWeight: 500,
                transition: 'all 0.2s',
              }}
              title={t('admin.openFullscreen', 'Tam Sayfada Aç')}
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              {t('admin.fullscreen', 'Tam Sayfa')}
            </a>
          )}

          {onClose && (
            <button
              onClick={onClose}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#8b949e',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '1.2rem',
                lineHeight: 1,
              }}
              title={t('admin.close', 'Kapat')}
            >
              &times;
            </button>
          )}
        </div>
      </div>

      {/* Toolbar: Search & Level Filters */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
          padding: '10px 18px',
          background: 'rgba(18, 22, 29, 0.8)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        {/* Search Bar */}
        <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: '400px' }}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('admin.searchLogsPlaceholder', 'Loglarda ara (örn. Token, Event, Error)...')}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              background: 'rgba(13, 17, 23, 0.9)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '6px',
              padding: '6px 32px 6px 30px',
              color: '#f0f6fc',
              fontSize: '0.85rem',
              outline: 'none',
              fontFamily: "'JetBrains Mono', Consolas, monospace",
            }}
          />
          <svg
            viewBox="0 0 24 24"
            width="14"
            height="14"
            fill="none"
            stroke="#8b949e"
            strokeWidth="2"
            style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                color: '#8b949e',
                cursor: 'pointer',
                fontSize: '14px',
                padding: '2px',
              }}
            >
              &times;
            </button>
          )}
        </div>

        {/* Level Badges Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setSelectedLevel('ALL')}
            style={{
              background: selectedLevel === 'ALL' ? '#38bdf8' : 'rgba(255, 255, 255, 0.06)',
              color: selectedLevel === 'ALL' ? '#0f172a' : '#94a3b8',
              border: 'none',
              borderRadius: '6px',
              padding: '4px 10px',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {t('admin.all', 'Tümü')} ({counts.ALL})
          </button>

          <button
            onClick={() => setSelectedLevel('Information')}
            style={{
              background: selectedLevel === 'Information' ? 'rgba(56, 189, 248, 0.25)' : 'rgba(56, 189, 248, 0.08)',
              color: '#38bdf8',
              border: `1px solid ${selectedLevel === 'Information' ? '#38bdf8' : 'rgba(56, 189, 248, 0.2)'}`,
              borderRadius: '6px',
              padding: '4px 10px',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            INF ({counts.Information})
          </button>

          {counts.Warning > 0 && (
            <button
              onClick={() => setSelectedLevel('Warning')}
              style={{
                background: selectedLevel === 'Warning' ? 'rgba(251, 191, 36, 0.25)' : 'rgba(251, 191, 36, 0.08)',
                color: '#fbbf24',
                border: `1px solid ${selectedLevel === 'Warning' ? '#fbbf24' : 'rgba(251, 191, 36, 0.2)'}`,
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              WRN ({counts.Warning})
            </button>
          )}

          {counts.Error > 0 && (
            <button
              onClick={() => setSelectedLevel('Error')}
              style={{
                background: selectedLevel === 'Error' ? 'rgba(248, 113, 113, 0.3)' : 'rgba(248, 113, 113, 0.1)',
                color: '#f87171',
                border: `1px solid ${selectedLevel === 'Error' ? '#f87171' : 'rgba(248, 113, 113, 0.3)'}`,
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              ERR ({counts.Error})
            </button>
          )}
        </div>

        {/* Quick View Controls: Wrap, Raw, Scroll */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={() => setIsWordWrap(!isWordWrap)}
            style={{
              background: isWordWrap ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              color: isWordWrap ? '#a78bfa' : '#8b949e',
              border: `1px solid ${isWordWrap ? 'rgba(139, 92, 246, 0.4)' : 'rgba(255, 255, 255, 0.1)'}`,
              borderRadius: '6px',
              padding: '4px 8px',
              fontSize: '0.75rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
            title={t('admin.wordWrap', 'Satır Kaydır')}
          >
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="15" y2="12" />
              <polyline points="15 9 18 12 15 15" />
              <path d="M21 18H7a4 4 0 0 1-4-4v0" />
            </svg>
            {t('admin.wrap', 'Kaydır')}
          </button>

          <button
            onClick={() => setIsRawMode(!isRawMode)}
            style={{
              background: isRawMode ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              color: isRawMode ? '#38bdf8' : '#8b949e',
              border: `1px solid ${isRawMode ? 'rgba(56, 189, 248, 0.4)' : 'rgba(255, 255, 255, 0.1)'}`,
              borderRadius: '6px',
              padding: '4px 8px',
              fontSize: '0.75rem',
              cursor: 'pointer',
            }}
            title={t('admin.toggleRaw', 'Ham Metin / Formatlı Görünüm')}
          >
            {isRawMode ? t('admin.formatted', 'Formatlı') : t('admin.raw', 'Ham Metin')}
          </button>

          <button
            onClick={scrollToTop}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#8b949e',
              borderRadius: '6px',
              padding: '4px 6px',
              cursor: 'pointer',
            }}
            title={t('admin.scrollToTop', 'En Başa Git')}
          >
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="18 15 12 9 6 15" />
            </svg>
          </button>

          <button
            onClick={scrollToBottom}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#8b949e',
              borderRadius: '6px',
              padding: '4px 6px',
              cursor: 'pointer',
            }}
            title={t('admin.scrollToBottom', 'En Sona Git')}
          >
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main Log Display Area */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: isWordWrap ? 'hidden' : 'auto',
          padding: '12px 0',
          background: '#0a0d13',
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace",
          fontSize: '0.85rem',
          lineHeight: '1.6',
        }}
      >
        {isRawMode ? (
          <pre
            style={{
              margin: 0,
              padding: '0 20px',
              color: '#e6edf3',
              whiteSpace: isWordWrap ? 'pre-wrap' : 'pre',
              wordBreak: isWordWrap ? 'break-word' : 'normal',
            }}
          >
            {detail.content}
          </pre>
        ) : filteredLines.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '48px 20px',
              color: '#8b949e',
            }}
          >
            <svg
              viewBox="0 0 24 24"
              width="36"
              height="36"
              fill="none"
              stroke="#6e7681"
              strokeWidth="1.5"
              style={{ margin: '0 auto 12px', display: 'block' }}
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <div style={{ fontSize: '0.95rem', fontWeight: 500, color: '#c9d1d9' }}>
              {t('admin.noMatchingLogs', 'Aramanızla eşleşen log kaydı bulunamadı.')}
            </div>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                style={{
                  marginTop: '12px',
                  background: 'rgba(56, 189, 248, 0.1)',
                  color: '#38bdf8',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  borderRadius: '6px',
                  padding: '6px 14px',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                }}
              >
                {t('admin.clearSearch', 'Aramayı Temizle')}
              </button>
            )}
          </div>
        ) : (
          filteredLines.map((line) => {
            const badgeStyle = getLogLevelBadgeStyle(line.level);
            return (
              <div
                key={line.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  padding: '3px 18px',
                  borderLeft: line.level === 'Error' || line.level === 'Fatal'
                    ? '3px solid #f87171'
                    : line.level === 'Warning'
                    ? '3px solid #fbbf24'
                    : '3px solid transparent',
                  background: line.level === 'Error' || line.level === 'Fatal'
                    ? 'rgba(239, 68, 68, 0.08)'
                    : 'transparent',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => {
                  if (line.level !== 'Error' && line.level !== 'Fatal') {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (line.level !== 'Error' && line.level !== 'Fatal') {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                {/* Line Number */}
                <span
                  style={{
                    width: '42px',
                    flexShrink: 0,
                    textAlign: 'right',
                    color: '#484f58',
                    userSelect: 'none',
                    marginRight: '16px',
                    fontSize: '0.78rem',
                    lineHeight: '1.6',
                  }}
                >
                  {line.id}
                </span>

                {/* Timestamp */}
                {line.timestamp ? (
                  <span
                    style={{
                      color: '#7d8590',
                      marginRight: '12px',
                      flexShrink: 0,
                      fontSize: '0.8rem',
                      lineHeight: '1.6',
                    }}
                  >
                    {line.timestamp}
                  </span>
                ) : null}

                {/* Log Level Badge */}
                {!line.isContinuation ? (
                  <span
                    style={{
                      padding: '1px 6px',
                      borderRadius: '4px',
                      background: badgeStyle.bg,
                      color: badgeStyle.color,
                      border: `1px solid ${badgeStyle.borderColor}`,
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      marginRight: '12px',
                      flexShrink: 0,
                      userSelect: 'none',
                      lineHeight: '1.4',
                    }}
                  >
                    {badgeStyle.label}
                  </span>
                ) : (
                  <span
                    style={{
                      width: '44px',
                      marginRight: '12px',
                      flexShrink: 0,
                    }}
                  />
                )}

                {/* Message Body or Exception Stack Trace */}
                {line.exception ? (
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <StackTraceViewer exception={line.exception} rawJson={line.raw} />
                  </div>
                ) : (
                  <span
                    style={{
                      color: line.level === 'Error' || line.level === 'Fatal'
                        ? '#fca5a5'
                        : line.level === 'Warning'
                        ? '#fde68a'
                        : line.isContinuation
                        ? '#8b949e'
                        : '#c9d1d9',
                      wordBreak: isWordWrap ? 'break-word' : 'normal',
                      whiteSpace: isWordWrap ? 'pre-wrap' : 'pre',
                      flex: 1,
                    }}
                  >
                    {highlightSearch(line.message)}
                  </span>
                )}
              </div>
            );
          })
        )}
        <div ref={bottomAnchorRef} />
      </div>

      {/* Footer Info Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 18px',
          background: 'rgba(22, 27, 34, 0.95)',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          fontSize: '0.75rem',
          color: '#8b949e',
        }}
      >
        <div>
          {t('admin.showingLines', 'Gösterilen')}: {filteredLines.length} / {parsedLines.length}
          {searchTerm && ` (${t('admin.filteredBySearch', 'filtreli')})`}
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <span>Serilog / C# Log Format</span>
          <span>UTF-8</span>
        </div>
      </div>
    </div>
  );
}
