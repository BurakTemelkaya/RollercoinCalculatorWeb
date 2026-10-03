import { useTranslation } from 'react-i18next';
import type { HamsterSkin } from '../types/hamster';
import HamsterSprite from './HamsterSprite';
import './HamsterAppearancePicker.css';

interface Props {
  skins: HamsterSkin[];
  name: string;
  value: number;
  onChange: (level: number) => void;
}

export default function HamsterAppearancePicker({ skins, name, value, onChange }: Props) {
  const { t } = useTranslation();
  return <div className="hamster-appearance-picker">
    <span className="hamster-appearance-picker-label">{t('hamsters.appearance')}</span>
    <div className="hamster-appearance-picker-cards" role="group" aria-label={t('hamsters.appearance')}>
      {skins.map(skin => <button type="button" key={skin.level}
        className={`hamster-appearance-choice ${skin.level === value ? 'selected' : ''}`}
        aria-label={`${name} · ${t('hamsters.level')} ${skin.level}`}
        aria-pressed={skin.level === value} onClick={() => onChange(skin.level)}>
        {skin.level === value && <span className="hamster-appearance-choice-check" aria-hidden="true">✓</span>}
        <HamsterSprite skin={skin} name="" size={104} />
        <strong>{t('hamsters.level')} {skin.level}</strong>
      </button>)}
    </div>
  </div>;
}
