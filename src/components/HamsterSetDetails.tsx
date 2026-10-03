import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import rawHamsters from '../data/hamsters.json';
import type { Hamster, HamsterSet } from '../types/hamster';
import { hamsterAssetUrl } from '../utils/hamsterAssets';
import HamsterSprite from './HamsterSprite';
import './HamsterSetsPage.css';

const HAMSTERS = new Map((rawHamsters as Hamster[]).map(hamster => [hamster.slug, hamster]));

export function HamsterSetArtwork({ set }: { set: HamsterSet }) {
  const { t } = useTranslation();
  const total = set.levels.at(-1)?.totalMembers ?? set.members.length;
  return <div className="hamster-set-artwork">
    {Array.from({ length: total }, (_, index) => {
      const member = HAMSTERS.get(set.members[index]);
      return <div className={`hamster-set-art-member member-${index}`} key={member?.slug || index}>
        {member ? <HamsterSprite skin={member.skins[0]} name={member.name} size={110} /> : <span className="hamster-set-unknown" title={t('hamsterHub.memberUnavailable')}>?</span>}
      </div>;
    })}
  </div>;
}

export function HamsterSetRewards({ set, owned, compact = false }: { set: HamsterSet; owned: string[]; compact?: boolean }) {
  const { t, i18n } = useTranslation();
  const language = i18n.language.split('-')[0];
  const count = set.members.filter(slug => owned.includes(slug)).length;
  const unlocked = set.levels.filter(stage => count >= stage.requiredMembers);
  const currentValue = unlocked.reduce((sum, stage) => sum + Number(stage.text.en.match(/\d+/)?.[0] || 0), 0);
  const currentText = (set.completion.text[language] || set.completion.text.en).replace(/\d+/, String(currentValue));
  const effectSummary = (english: string, localized: string) => {
    if (!compact || !set.icon) return localized;
    const amount = english.match(/[+-]?\d+\s*(%|min)/i)?.[0];
    if (!amount) return localized;
    return amount.includes('%') ? amount : t('hamsterHub.minutes', { value: Number(amount.match(/\d+/)?.[0]) });
  };
  const maximumText = set.completion.text[language] || set.completion.text.en;
  const maximumSummary = maximumText.length < 60 ? maximumText : effectSummary(set.completion.text.en, maximumText);
  const currentSummary = currentText.length < 60 ? currentText : effectSummary(set.completion.text.en.replace(/\d+/, String(currentValue)), currentText);
  return <div className="hamster-set-levels">
    <div className="hamster-set-progress"><span>{t('hamsterHub.unlockedLevels', { count: unlocked.length, total: set.levels.length })}</span><progress aria-label={t('hamsterHub.unlockedLevels', { count: unlocked.length, total: set.levels.length })} value={unlocked.length} max={set.levels.length} /></div>
    {set.levels.map(stage => <div className={`hamster-set-level ${count >= stage.requiredMembers ? 'unlocked' : ''}`} key={stage.level}>
      <span>{t('hamsters.level')} {stage.level} <b>{Math.min(count, stage.requiredMembers)}/{stage.requiredMembers}</b></span>
      <span title={stage.text[language] || stage.text.en}>{set.icon && <img src={hamsterAssetUrl(set.icon)} alt="" />}{effectSummary(stage.text.en, stage.text[language] || stage.text.en)}</span>
      <strong>+{Number(stage.rewardRlt).toLocaleString(i18n.language)} RLT</strong>
    </div>)}
    {unlocked.length > 0 && <div className="hamster-set-current"><span>{t('hamsterHub.current')}</span><strong>{currentSummary}</strong></div>}
    <div className="hamster-set-maximum"><span>{t('hamsterHub.maximum')}</span><strong title={maximumText}>{maximumSummary}</strong></div>
    <div className="hamster-set-total">{t('hamsters.totalReward', { value: Number(set.completion.rewardRlt).toLocaleString(i18n.language) })}</div>
  </div>;
}

interface Props {
  set: HamsterSet;
  owned: string[];
  onToggleOwned: (slug: string) => void;
  onClose: () => void;
  onSelectHamster?: (slug: string) => void;
}

export default function HamsterSetDetails({ set, owned, onToggleOwned, onClose, onSelectHamster }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { lang } = useParams();
  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { dialog?.close(); document.body.style.overflow = previousOverflow; };
  }, []);
  const selectMember = (slug: string) => {
    onClose();
    if (onSelectHamster) onSelectHamster(slug);
    else navigate(`/${lang || 'en'}/hamsters?hamster=${encodeURIComponent(slug)}`);
  };
  return <dialog ref={dialogRef} className="hamster-set-dialog" aria-labelledby="hamster-set-dialog-title" onCancel={onClose} onClick={event => { const rect = event.currentTarget.getBoundingClientRect(); if (event.target === event.currentTarget && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) onClose(); }}>
    <div className="hamster-set-dialog-heading"><h2 id="hamster-set-dialog-title">{set.name[i18n.language.split('-')[0]] || set.name.en}</h2><button type="button" aria-label={t('hamsterHub.close')} onClick={onClose}>×</button></div>
    <div className="hamster-set-dialog-body">
      <div><HamsterSetArtwork set={set} /><HamsterSetRewards set={set} owned={owned} /></div>
      <div className="hamster-set-roster"><h3>{t('hamsters.setMembers')}</h3><p>{t('hamsterHub.collectionHint')}</p>
        <div className="hamster-set-member-grid">{set.members.map(slug => {
          const member = HAMSTERS.get(slug);
          return member && <div className={`hamster-set-member ${owned.includes(slug) ? 'owned' : ''}`} key={slug}>
            <label><input type="checkbox" aria-label={`${t('hamsterHub.owned')}: ${member.name}`} checked={owned.includes(slug)} onChange={() => onToggleOwned(slug)} />{t('hamsterHub.owned')}</label>
            <button type="button" onClick={() => selectMember(slug)}><HamsterSprite skin={member.skins[0]} name={member.name} size={112} /><strong>{member.name}</strong></button>
          </div>;
        })}</div>
        {set.members.length < (set.levels.at(-1)?.totalMembers ?? 0) && <p className="hamster-set-announcement">{t('hamsterHub.memberUnavailable')}</p>}
      </div>
    </div>
  </dialog>;
}
