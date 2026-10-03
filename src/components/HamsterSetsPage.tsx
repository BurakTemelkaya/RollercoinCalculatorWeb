import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import rawSets from '../data/hamsterSets.json';
import type { HamsterSet } from '../types/hamster';
import useHamsterCollection from '../hooks/useHamsterCollection';
import HamsterSectionNav from './HamsterSectionNav';
import HamsterSetDetails, { HamsterSetArtwork, HamsterSetRewards } from './HamsterSetDetails';
import './HamsterSetsPage.css';

const SETS = rawSets as HamsterSet[];

export default function HamsterSetsPage() {
  const { t, i18n } = useTranslation();
  const [selectedSet, setSelectedSet] = useState<HamsterSet | null>(null);
  const { owned, toggleOwned } = useHamsterCollection();
  useEffect(() => { document.title = `${t('hamsterHub.sets')} | Rollercoin Calculator`; }, [t]);
  return <section className="hamster-sets-page">
    <HamsterSectionNav />
    <header className="hamster-sets-heading"><span>ROLLERCOIN · EXPEDITION</span><h1>{t('hamsterHub.sets')}</h1><p>{t('hamsterHub.setDescription')}</p></header>
    <div className="hamster-sets-grid">{SETS.map(set => <article className="hamster-set-card" key={set.slug}>
      <button type="button" className="hamster-set-card-open" onClick={() => setSelectedSet(set)} aria-label={t('hamsterHub.openSet', { name: set.name[i18n.language.split('-')[0]] || set.name.en })}>
        <span className="hamster-set-card-heading"><strong>{set.name[i18n.language.split('-')[0]] || set.name.en}</strong><span aria-hidden="true">↗</span></span>
        <HamsterSetArtwork set={set} />
        <HamsterSetRewards set={set} owned={owned} compact />
      </button>
    </article>)}</div>
    {selectedSet && <HamsterSetDetails set={selectedSet} owned={owned} onToggleOwned={toggleOwned} onClose={() => setSelectedSet(null)} />}
  </section>;
}
