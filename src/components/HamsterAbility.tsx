import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { hamsterAbilityGuide } from '../data/hamsterAbilityGuides';
import type { Hamster, HamsterBuilderOption, HamsterTrait } from '../types/hamster';
import { hamsterAssetUrl } from '../utils/hamsterAssets';
import './HamsterAbility.css';

interface Props {
  hamster: Hamster;
  ability: HamsterTrait | HamsterBuilderOption;
  language: string;
  ultimate?: boolean;
  builder?: boolean;
  inline?: boolean;
}

export default function HamsterAbility({ hamster, ability, language, ultimate = false, builder = false, inline = false }: Props) {
  const { t } = useTranslation();
  const guide = hamsterAbilityGuide(hamster, ability.code, ultimate);
  const text = 'text' in ability ? ability.text : ability.name;
  const effect = text[language] || text.en || ability.code;
  const label = guide?.label ? t(`hamsterAbilityGuide.labels.${guide.label}`) : effect;
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ left: 0, top: 0 });
  const trigger = useRef<HTMLButtonElement>(null);
  const popup = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const id = useId();
  const cancelClose = () => clearTimeout(closeTimer.current);
  const show = () => { cancelClose(); setOpen(true); };
  const hide = (fromMouse = false) => {
    cancelClose();
    closeTimer.current = setTimeout(() => {
      if (fromMouse || (!trigger.current?.contains(document.activeElement) && !popup.current?.contains(document.activeElement))) setOpen(false);
    }, 140);
  };

  useEffect(() => () => clearTimeout(closeTimer.current), []);
  useLayoutEffect(() => {
    if (!open || inline) return;
    const place = () => {
      if (!trigger.current || !popup.current) return;
      const rect = trigger.current.getBoundingClientRect();
      const tip = popup.current.getBoundingClientRect();
      const viewport = document.documentElement.clientWidth;
      setPosition({
        left: Math.max(12, Math.min(rect.left, viewport - tip.width - 12)),
        top: Math.max(12, Math.min(
          rect.bottom + tip.height + 20 <= window.innerHeight ? rect.bottom + 8 : rect.top - tip.height - 8,
          window.innerHeight - tip.height - 12,
        )),
      });
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !trigger.current?.contains(event.target) && !popup.current?.contains(event.target)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        const focusWasInPopup = popup.current?.contains(document.activeElement);
        if (focusWasInPopup) trigger.current?.focus();
        setOpen(false);
      }
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape);
    };
  }, [open, inline, label, t]);

  const content = <>{ability.icon && <img src={hamsterAssetUrl(ability.icon)} alt="" loading="lazy" />}<span>{label}</span></>;
  if (inline) return <div className="hamster-ability-inline">
    <span className="hamster-trait">{content}</span>
    <p className="hamster-ability-description">{guide ? t(`hamsterAbilityGuide.descriptions.${guide.description}`, guide.params) : effect}</p>
    {guide?.example && <div className="hamster-ability-example"><strong>{t('hamsterAbilityGuide.example')}</strong><p>{t(`hamsterAbilityGuide.examples.${guide.example}`, guide.params)}</p></div>}
    {guide?.source && <a href={guide.source} target="_blank" rel="noreferrer">{t('hamsterAbilityGuide.source')} ↗</a>}
  </div>;
  if (!guide) return <span className={builder ? 'hamster-builder-option' : 'hamster-trait'}>{content}</span>;

  return <>
    <button ref={trigger} type="button" className={`hamster-ability-trigger ${builder ? 'hamster-builder-option' : 'hamster-trait'}`}
      aria-haspopup="dialog" aria-expanded={open} aria-controls={open ? id : undefined} aria-describedby={open ? `${id}-description` : undefined}
      onMouseEnter={show} onMouseLeave={() => hide(true)} onFocus={show} onBlur={() => hide()} onClick={event => {
        show();
        if (event.detail === 0) requestAnimationFrame(() => popup.current?.focus());
      }}>
      {content}<span className="hamster-ability-info" aria-hidden="true">ⓘ</span>
    </button>
    {open && createPortal(<div ref={popup} id={id} tabIndex={-1} role="dialog" aria-modal="false" aria-labelledby={`${id}-title`}
      className="hamster-ability-popover" style={position}
      onMouseEnter={cancelClose} onMouseLeave={() => { cancelClose(); setOpen(false); }} onFocus={cancelClose} onBlur={() => hide()}>
      <strong id={`${id}-title`}>{label}</strong>
      {ultimate && effect !== label && !['x3_minus_5_chests_if_it_survives', 'chests_multiplier'].includes(ability.code) && <span className="hamster-ability-effect">{effect}</span>}
      <p id={`${id}-description`}>{t(`hamsterAbilityGuide.descriptions.${guide.description}`, guide.params)}</p>
      {guide.example && <div className="hamster-ability-example"><strong>{t('hamsterAbilityGuide.example')}</strong><p>{t(`hamsterAbilityGuide.examples.${guide.example}`, guide.params)}</p></div>}
      {guide.source && <a href={guide.source} target="_blank" rel="noreferrer">{t('hamsterAbilityGuide.source')} ↗</a>}
    </div>, document.body)}
  </>;
}
