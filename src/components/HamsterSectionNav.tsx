import { useEffect, useRef, useState } from 'react';
import { NavLink, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './HamsterSetsPage.css';

type Pin = { top: number; left: number; width: number };

export default function HamsterSectionNav() {
  const { lang } = useParams();
  const { t } = useTranslation();
  const root = `/${lang || 'en'}/hamsters`;
  const slotRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const [pin, setPin] = useState<Pin | null>(null);
  const [height, setHeight] = useState(0);

  // CSS sticky can't work: html/body/.app-wrapper set overflow-x:hidden, so pin with position:fixed like EarningsTable.
  useEffect(() => {
    let rafId = 0;
    const update = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const slot = slotRef.current;
        const nav = navRef.current;
        if (!slot || !nav) return;
        setHeight(nav.offsetHeight);
        const navbarBottom = Math.max(0, document.querySelector('.sticky-navbar')?.getBoundingClientRect().bottom ?? 0);
        const rect = slot.getBoundingClientRect();
        const next = rect.top <= navbarBottom ? { top: navbarBottom, left: rect.left, width: rect.width } : null;
        setPin(prev => prev && next && prev.top === next.top && prev.left === next.left && prev.width === next.width ? prev : next);
      });
    };
    window.addEventListener('scroll', update, { passive: true });
    document.addEventListener('scroll', update, { passive: true, capture: true });
    window.addEventListener('resize', update, { passive: true });
    const observer = new ResizeObserver(update);
    if (slotRef.current) observer.observe(slotRef.current);
    const navbar = document.querySelector('.sticky-navbar');
    if (navbar) observer.observe(navbar);
    update();
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', update);
      document.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
      observer.disconnect();
    };
  }, []);

  return <div ref={slotRef} className="hamster-section-nav-slot" style={{ height: height || undefined }}>
    <nav
      ref={navRef}
      className={`hamster-section-nav${pin ? ' is-pinned' : ''}`}
      style={pin ? { position: 'fixed', top: pin.top, left: pin.left, width: pin.width } : undefined}
      aria-label={t('hamsterHub.navigation')}
    >
      <NavLink to={root} end><span className="hamster-section-icon icon-hamsters" aria-hidden="true" />{t('hamsters.title')}</NavLink>
      <NavLink to={`${root}/expeditions`}><span className="hamster-section-icon icon-expeditions" aria-hidden="true" />{t('hamsterHub.expeditions')}</NavLink>
      <NavLink to={`${root}/sets`}><span className="hamster-section-icon icon-sets" aria-hidden="true" />{t('hamsterHub.sets')}</NavLink>
    </nav>
  </div>;
}
