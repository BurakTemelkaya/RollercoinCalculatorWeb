import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import './PromoCodeButton.css';

const RECENT_KEY = 'rollercoin_recent_promocodes';
const MAX_RECENT = 8;

const promoUrl = (code: string) => `https://rollercoin.com/game?promocode=${encodeURIComponent(code)}`;

function loadRecent(): string[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter((c): c is string => typeof c === 'string').slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
}

function saveRecent(codes: string[]) {
  try { localStorage.setItem(RECENT_KEY, JSON.stringify(codes)); } catch { /* storage blocked: list just won't persist */ }
}

const TicketIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 8a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-2a2 2 0 0 0 0-4z" />
    <path d="M9 6v2M9 11v2M9 16v2" />
  </svg>
);

export default function PromoCodeButton() {
  const { t } = useTranslation();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [code, setCode] = useState('');
  const [recent, setRecent] = useState<string[]>([]);
  const [normalize, setNormalize] = useState(true);
  const [stripSpecial, setStripSpecial] = useState(true);

  const open = () => {
    setRecent(loadRecent());
    dialogRef.current?.showModal();
    inputRef.current?.focus();
  };
  const close = () => dialogRef.current?.close();

  const updateRecent = (next: string[]) => {
    setRecent(next);
    saveRecent(next);
  };

  const redeem = (raw: string) => {
    let value = normalize ? raw.replace(/\s+/g, '').toLowerCase() : raw.trim();
    // Keep only RFC 3986 unreserved characters, which never need URL encoding.
    if (stripSpecial) value = value.replace(/[^A-Za-z0-9\-._~]/g, '');
    if (!value) return;
    window.open(promoUrl(value), '_blank', 'noopener,noreferrer');
    // Most recent first; case-insensitive dedupe so "Test" and "test" don't both appear.
    updateRecent([value, ...recent.filter(c => c.toLowerCase() !== value.toLowerCase())].slice(0, MAX_RECENT));
    setCode('');
  };

  return (
    <>
      <button type="button" className="promo-fab" onClick={open} aria-haspopup="dialog" aria-label={t('promo.button')}>
        <TicketIcon />
        <span className="promo-fab-label">{t('promo.button')}</span>
      </button>

      <dialog
        ref={dialogRef}
        className="promo-dialog"
        aria-labelledby="promo-dialog-title"
        onClick={e => { if (e.target === e.currentTarget) close(); }}
      >
        <div className="promo-dialog-body">
          <div className="promo-dialog-header">
            <span className="promo-dialog-icon"><TicketIcon /></span>
            <h2 id="promo-dialog-title">{t('promo.title')}</h2>
            <button type="button" className="promo-dialog-close" onClick={close} aria-label={t('promo.close')}>×</button>
          </div>
          <p className="promo-dialog-desc">{t('promo.description')}</p>

          <form onSubmit={e => { e.preventDefault(); redeem(code); }}>
            <input
              ref={inputRef}
              className="promo-input"
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder={t('promo.placeholder')}
              aria-label={t('promo.placeholder')}
              maxLength={64}
              autoComplete="off"
              spellCheck={false}
            />
            <label className="promo-normalize">
              <input type="checkbox" checked={normalize} onChange={e => setNormalize(e.target.checked)} />
              <span>{t('promo.normalize')}</span>
            </label>
            <label className="promo-normalize">
              <input type="checkbox" checked={stripSpecial} onChange={e => setStripSpecial(e.target.checked)} />
              <span>{t('promo.stripSpecial')}</span>
            </label>
            <button type="submit" className="promo-submit" disabled={!code.trim()}>{t('promo.submit')}</button>
          </form>

          {recent.length > 0 && (
            <div className="promo-recent">
              <div className="promo-recent-header">
                <span>{t('promo.recent')}</span>
                <button type="button" className="promo-recent-clear" onClick={() => updateRecent([])}>{t('promo.clear')}</button>
              </div>
              <ul>
                {recent.map(c => (
                  <li key={c}>
                    <a href={promoUrl(c)} target="_blank" rel="noopener noreferrer" onClick={() => updateRecent([c, ...recent.filter(x => x !== c)])}>{c}</a>
                    <button type="button" onClick={() => updateRecent(recent.filter(x => x !== c))} aria-label={`${t('promo.remove')}: ${c}`}>×</button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </dialog>
    </>
  );
}
