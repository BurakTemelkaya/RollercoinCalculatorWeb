import { useTranslation } from 'react-i18next';
import { EXPEDITION_MAPS } from '../data/expeditionMaps';
import './HamsterMapPicker.css';

interface Props {
  value: string;
  onChange: (id: string) => void;
}

export default function HamsterMapPicker({ value, onChange }: Props) {
  const { t } = useTranslation();
  const imageUrl = (id: string, file: string) => `${import.meta.env.BASE_URL}expedition/maps/${id}/${file}`;
  return <div className="hamster-map-picker">
    <span className="hamster-map-picker-label">{t('hamsters.map')}</span>
    <div className="hamster-map-picker-grid" role="group" aria-label={t('hamsters.map')}>
      {EXPEDITION_MAPS.map(map => <button key={map.id} type="button"
        className={`hamster-map-choice ${value === map.id ? 'selected' : ''} ${map.active === false ? 'inactive' : ''}`}
        aria-pressed={value === map.id} onClick={() => onChange(map.id)}>
        {map.base && <img src={imageUrl(map.id, map.base)} alt="" loading="lazy" />}
        {map.scenery && <img src={imageUrl(map.id, map.scenery)} alt="" loading="lazy" />}
        {value === map.id && <span className="hamster-map-choice-check" aria-hidden="true">✓</span>}
        <strong>{map.name}</strong>
        <small>{t('hamsterExpeditions.difficultyLabel')} {map.difficulty} · {map.durationHours} {t('hamsterExpeditions.hours')}</small>
        {map.active === false && <small className="hamster-map-choice-inactive">{t('hamsterHub.inactive')}</small>}
      </button>)}
    </div>
  </div>;
}
