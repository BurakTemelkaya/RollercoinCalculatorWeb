import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { NAV_ICONS } from '../utils/icons';
import './EventsNavMenu.css';

const canHover = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/** "Events" nav entry that opens a menu with Progression Event and Puzzle Event. */
export default function EventsNavMenu({ mobile = false, onNavigate }: { mobile?: boolean; onNavigate?: () => void }) {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const closeTimer = useRef<number | undefined>(undefined);
  useEffect(() => () => clearTimeout(closeTimer.current), []);

  useEffect(() => setOpen(false), [location.pathname, location.search]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      const target = e.target as Node;
      if (!buttonRef.current?.contains(target) && !menuRef.current?.contains(target)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpen(false); buttonRef.current?.focus(); }
    };
    // Desktop menu is fixed-positioned outside the scrolling nav, so close it when the page or the nav scrolls.
    const close = () => !mobile && setOpen(false);
    const scroller = buttonRef.current?.closest('.sticky-nav-links');
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', close);
    window.addEventListener('resize', close);
    scroller?.addEventListener('scroll', close);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', close);
      window.removeEventListener('resize', close);
      scroller?.removeEventListener('scroll', close);
    };
  }, [open, mobile]);

  const openMenu = () => {
    clearTimeout(closeTimer.current);
    if (!mobile && buttonRef.current) {
      const r = buttonRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 6, left: Math.max(8, Math.min(r.left, window.innerWidth - 228)) });
    }
    setOpen(true);
  };
  const toggle = (e: React.MouseEvent) => {
    // A mouse click on a hover-opened menu keeps it open; keyboard (detail 0) and touch still toggle.
    if (open && e.detail > 0 && canHover()) return;
    if (open) setOpen(false); else openMenu();
  };

  // Desktop with a real mouse: open on hover, close shortly after the pointer leaves both the button and the menu.
  const hoverProps = mobile ? {} : {
    onMouseEnter: () => { if (canHover()) openMenu(); },
    onMouseLeave: () => {
      if (!canHover()) return;
      closeTimer.current = window.setTimeout(() => setOpen(false), 150);
    },
  };

  const lang = i18n.language;
  const isEvents = /\/(events?|puzzle)(\/|$)/.test(location.pathname);
  const items = [
    { to: `/${lang}/events`, icon: NAV_ICONS.events, label: t('nav.progressionEvent') },
    { to: `/${lang}/events?type=puzzle`, icon: NAV_ICONS.puzzle, label: t('nav.puzzleEvent') },
  ];

  // Desktop: portalled to <body> so the nav's horizontal scroller doesn't clip it.
  const menu = (
    <div
      ref={menuRef}
      id={menuId}
      className="events-nav-menu"
      {...hoverProps}
      style={mobile || !pos ? undefined : { position: 'fixed', top: pos.top, left: pos.left }}
    >
      {items.map(item => (
        <Link key={item.to} to={item.to} className="events-nav-item" onClick={() => { setOpen(false); onNavigate?.(); }}>
          {item.icon} {item.label}
        </Link>
      ))}
    </div>
  );

  return (
    <div className={`events-nav ${mobile ? 'events-nav-mobile' : ''}`}>
      <button
        ref={buttonRef}
        type="button"
        className={`${mobile ? 'mobile-nav-link' : 'nav-link'} events-nav-trigger ${isEvents ? 'active' : ''}`}
        aria-expanded={open}
        aria-controls={menuId}
        onClick={toggle}
        {...hoverProps}
      >
        {NAV_ICONS.events} {t('nav.events')}
        <span className={`events-nav-caret ${open ? 'open' : ''}`} aria-hidden="true">▾</span>
      </button>
      {open && (mobile ? menu : pos && createPortal(menu, document.body))}
    </div>
  );
}
