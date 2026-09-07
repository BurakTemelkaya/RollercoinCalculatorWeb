import { useState, type MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { ParsedException } from '../../types/log';

interface StackTraceViewerProps {
  exception: ParsedException;
  rawJson?: string;
}

export default function StackTraceViewer({ exception, rawJson }: StackTraceViewerProps) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [appCodeOnly, setAppCodeOnly] = useState(false);
  const [showRawJson, setShowRawJson] = useState(false);
  const [copied, setCopied] = useState(false);

  const appFramesCount = exception.frames.filter((f) => f.isAppCode).length;
  const displayedFrames = appCodeOnly
    ? exception.frames.filter((f) => f.isAppCode)
    : exception.frames;

  const handleCopyStackTrace = async (e: MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(exception.rawStackTrace);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy stack trace', err);
    }
  };

  return (
    <div
      style={{
        margin: '6px 0',
        borderRadius: '8px',
        border: '1px solid rgba(239, 68, 68, 0.35)',
        background: 'rgba(239, 68, 68, 0.06)',
        overflow: 'hidden',
        fontFamily: "'JetBrains Mono', Consolas, monospace",
      }}
    >
      {/* Exception Card Header */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
          padding: '10px 14px',
          cursor: 'pointer',
          background: 'rgba(239, 68, 68, 0.1)',
          borderBottom: isExpanded ? '1px solid rgba(239, 68, 68, 0.2)' : 'none',
          userSelect: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', minWidth: 0 }}>
          {/* Arrow */}
          <span
            style={{
              color: '#f87171',
              fontSize: '0.75rem',
              transition: 'transform 0.2s',
              transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
              display: 'inline-block',
            }}
          >
            ▶
          </span>

          {/* Exception Type Badge */}
          <span
            style={{
              padding: '2px 8px',
              borderRadius: '4px',
              background: 'rgba(239, 68, 68, 0.25)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#fca5a5',
              fontSize: '0.75rem',
              fontWeight: 700,
            }}
            title={exception.type}
          >
            {exception.shortType}
          </span>

          {/* Method Name if available */}
          {exception.methodName && (
            <span
              style={{
                padding: '2px 6px',
                borderRadius: '4px',
                background: 'rgba(139, 92, 246, 0.15)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                color: '#c4b5fd',
                fontSize: '0.72rem',
              }}
            >
              Method: {exception.methodName}
            </span>
          )}

          {/* User if available */}
          {exception.user && (
            <span
              style={{
                padding: '2px 6px',
                borderRadius: '4px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#94a3b8',
                fontSize: '0.72rem',
              }}
            >
              User: {exception.user}
            </span>
          )}

          {/* Exception Message */}
          <span
            style={{
              color: '#fecaca',
              fontWeight: 600,
              fontSize: '0.85rem',
              wordBreak: 'break-word',
            }}
          >
            {exception.message}
          </span>
        </div>

        {/* Header Right Actions */}
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          onClick={(e) => e.stopPropagation()}
        >
          <span style={{ fontSize: '0.75rem', color: '#f87171', opacity: 0.8 }}>
            {exception.frames.length} frames ({appFramesCount} app)
          </span>

          <button
            onClick={handleCopyStackTrace}
            style={{
              background: copied ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255, 255, 255, 0.08)',
              border: `1px solid ${copied ? 'rgba(34, 197, 94, 0.4)' : 'rgba(255, 255, 255, 0.15)'}`,
              color: copied ? '#4ade80' : '#fca5a5',
              borderRadius: '4px',
              padding: '3px 8px',
              fontSize: '0.72rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
            title={t('admin.copyStackTrace', 'Stack Trace Kopyala')}
          >
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            {copied ? t('admin.copied', 'Kopyalandı!') : t('admin.copy', 'Kopyala')}
          </button>
        </div>
      </div>

      {/* Expanded Stack Trace Details */}
      {isExpanded && (
        <div style={{ padding: '10px 14px', background: 'rgba(10, 14, 20, 0.8)' }}>
          {/* Sub-toolbar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '10px',
              flexWrap: 'wrap',
              gap: '8px',
              fontSize: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => setAppCodeOnly(false)}
                style={{
                  background: !appCodeOnly ? 'rgba(239, 68, 68, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                  border: `1px solid ${!appCodeOnly ? 'rgba(239, 68, 68, 0.4)' : 'rgba(255, 255, 255, 0.1)'}`,
                  color: !appCodeOnly ? '#fca5a5' : '#8b949e',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                {t('admin.allFrames', 'Tüm Çağrılar')} ({exception.frames.length})
              </button>

              <button
                onClick={() => setAppCodeOnly(true)}
                style={{
                  background: appCodeOnly ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                  border: `1px solid ${appCodeOnly ? 'rgba(56, 189, 248, 0.4)' : 'rgba(255, 255, 255, 0.1)'}`,
                  color: appCodeOnly ? '#38bdf8' : '#8b949e',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                {t('admin.appCodeOnly', 'Yalnızca Uygulama Kodu')} ({appFramesCount})
              </button>
            </div>

            {rawJson && (
              <button
                onClick={() => setShowRawJson(!showRawJson)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                }}
              >
                {showRawJson ? t('admin.hideRawJson', 'JSON Gizle') : t('admin.showRawJson', 'Ham JSON')}
              </button>
            )}
          </div>

          {/* Raw JSON Debug View */}
          {showRawJson && rawJson && (
            <pre
              style={{
                margin: '0 0 12px',
                padding: '10px 12px',
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '6px',
                color: '#e2e8f0',
                fontSize: '0.75rem',
                overflowX: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
              }}
            >
              {rawJson}
            </pre>
          )}

          {/* Frames List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {displayedFrames.map((frame) => (
              <div
                key={frame.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  background: frame.isAppCode ? 'rgba(139, 92, 246, 0.08)' : 'transparent',
                  borderLeft: frame.isAppCode
                    ? '3px solid #a78bfa'
                    : '3px solid rgba(255, 255, 255, 0.05)',
                  fontSize: '0.78rem',
                  lineHeight: '1.4',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = frame.isAppCode
                    ? 'rgba(139, 92, 246, 0.14)'
                    : 'rgba(255, 255, 255, 0.03)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = frame.isAppCode
                    ? 'rgba(139, 92, 246, 0.08)'
                    : 'transparent';
                }}
              >
                {/* Frame index */}
                <span
                  style={{
                    color: frame.isAppCode ? '#a78bfa' : '#475569',
                    fontSize: '0.72rem',
                    width: '24px',
                    textAlign: 'right',
                    flexShrink: 0,
                    userSelect: 'none',
                  }}
                >
                  {frame.id}
                </span>

                {/* Method & Location */}
                <div style={{ flex: 1, minWidth: 0, wordBreak: 'break-word' }}>
                  <span
                    style={{
                      color: frame.isAppCode ? '#38bdf8' : '#64748b',
                      fontWeight: frame.isAppCode ? 600 : 400,
                    }}
                  >
                    at {frame.method}
                  </span>

                  {/* File Path & Line */}
                  {frame.filePath && (
                    <div
                      style={{
                        marginTop: '2px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        flexWrap: 'wrap',
                      }}
                    >
                      <span
                        style={{
                          color: '#fbbf24',
                          fontWeight: 500,
                          fontSize: '0.74rem',
                          background: 'rgba(251, 191, 36, 0.1)',
                          padding: '1px 6px',
                          borderRadius: '3px',
                          border: '1px solid rgba(251, 191, 36, 0.2)',
                        }}
                        title={frame.filePath}
                      >
                        📄 {frame.fileName || frame.filePath}
                        {frame.lineNumber !== undefined && `:line ${frame.lineNumber}`}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
