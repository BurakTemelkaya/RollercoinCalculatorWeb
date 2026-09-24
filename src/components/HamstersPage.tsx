import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import rawHamsters from '../data/hamsters.json';
import rawSets from '../data/hamsterSets.json';
import { EXPEDITION_MAPS } from '../data/expeditionMaps';
import { HAMSTER_BESTIARY, bestiaryUrl } from '../data/hamsterBestiary';
import type { Hamster, HamsterAnimationAction, HamsterBuilderOption, HamsterSet, HamsterTrait } from '../types/hamster';
import { hamsterAssetUrl } from '../utils/hamsterAssets';
import ExpeditionScene from './ExpeditionScene';
import HamsterSprite from './HamsterSprite';
import './HamstersPage.css';

const HAMSTERS = rawHamsters as Hamster[];
const SETS = rawSets as HamsterSet[];
const HAMSTERS_BY_SLUG = new Map(HAMSTERS.map(hamster => [hamster.slug, hamster]));
const STAT_ICONS = {
  health: `${import.meta.env.BASE_URL}expedition/icons/health.webp`,
  strength: `${import.meta.env.BASE_URL}expedition/icons/strength.webp`,
  luck: `${import.meta.env.BASE_URL}expedition/icons/luck.webp`,
};
const ANIMATIONS: { action: HamsterAnimationAction; label: string }[] = [
  { action: 'walk', label: 'animationWalk' },
  { action: 'tap_reaction', label: 'animationTap' },
  { action: 'go_sleep', label: 'animationSleep' },
  { action: 'take_chest', label: 'animationChest' },
  { action: 'win_loop', label: 'animationWin' },
];

function BuilderOption({ option, language }: { option: HamsterBuilderOption; language: string }) {
  return (
    <span className="hamster-builder-option">
      {option.icon && <img src={hamsterAssetUrl(option.icon)} alt="" loading="lazy" />}
      <span>{option.name[language] || option.name.en || option.code}</span>
    </span>
  );
}

function Trait({ trait, language }: { trait: HamsterTrait; language: string }) {
  return (
    <span className="hamster-trait">
      {trait.icon && <img src={hamsterAssetUrl(trait.icon)} alt="" loading="lazy" />}
      {trait.text[language] || trait.text.en || trait.code}
    </span>
  );
}

export default function HamstersPage() {
  const { t, i18n } = useTranslation();
  const [query, setQuery] = useState('');
  const [generation, setGeneration] = useState('all');
  const [sort, setSort] = useState('order');
  const [selectedSlug, setSelectedSlug] = useState(HAMSTERS[0]?.slug);
  const [level, setLevel] = useState(1);
  const [mapId, setMapId] = useState(EXPEDITION_MAPS[3].id);
  const [animation, setAnimation] = useState<HamsterAnimationAction>('walk');
  const [reactionTrigger, setReactionTrigger] = useState(0);

  const filtered = useMemo(() => {
    const term = query.trim().toLocaleLowerCase();
    const items = HAMSTERS.filter(hamster =>
      (generation === 'all' || hamster.generation === Number(generation)) &&
      hamster.name.toLocaleLowerCase().includes(term)
    );
    if (sort === 'name') items.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === 'stats') items.sort((a, b) =>
      (b.stats.health + b.stats.strength + b.stats.luck) - (a.stats.health + a.stats.strength + a.stats.luck)
    );
    return items;
  }, [query, generation, sort]);

  const selected = filtered.find(hamster => hamster.slug === selectedSlug) || filtered[0];
  const skin = selected?.skins.find(item => item.level === level) || selected?.skins[0];
  const map = EXPEDITION_MAPS.find(item => item.id === mapId) || EXPEDITION_MAPS[0];
  const language = i18n.language.split('-')[0];
  const selectedSets = selected ? SETS.filter(set => set.members.includes(selected.slug)) : [];
  const bestiary = selected ? HAMSTER_BESTIARY[selected.slug] : undefined;

  const selectHamster = (hamster: Hamster) => {
    setSelectedSlug(hamster.slug);
    setLevel(hamster.skins[0]?.level ?? 1);
    setAnimation('walk');
    setReactionTrigger(value => value + 1);
    requestAnimationFrame(() => document.querySelector('.hamster-feature')?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'start',
    }));
  };

  const selectSetMember = (slug: string) => {
    const member = HAMSTERS_BY_SLUG.get(slug);
    if (!member) return;
    setQuery('');
    setGeneration('all');
    selectHamster(member);
  };

  useEffect(() => {
    document.title = `${t('hamsters.title')} | Rollercoin Calculator`;
    return () => { document.title = t('seo.title'); };
  }, [t, i18n.language]);

  return (
    <section className="hamsters-page">
      <meta name="description" content={t('hamsters.description')} />
      <header className="hamsters-heading">
        <div>
          <span className="hamsters-eyebrow">ROLLERCOIN · EXPEDITION</span>
          <h2>{t('hamsters.title')}</h2>
          <p>{t('hamsters.description')}</p>
        </div>
        <div className="hamsters-heading-actions"><Link className="hamsters-expedition-link" to={`/${language}/hamsters/expeditions`}>{t('hamsters.calculateExpeditions')} →</Link><span className="hamsters-total">{HAMSTERS.length} {t('hamsters.characters')}</span></div>
      </header>

      {selected && skin && (
          <div className="hamster-feature">
            <div className="hamster-stage-panel">
              <div className="hamster-panel-heading">
                <div>
                  <span className="hamster-kicker">{selected.generation}. {t('hamsters.generation')}</span>
                  <h3>{selected.name}</h3>
                </div>
                <div className="hamster-heading-meta">
                  {selectedSets.map(set => (
                    <details className="hamster-set-disclosure" key={set.slug}>
                      <summary>{t('hamsters.memberOfSet', { name: set.name[language] || set.name.en })}</summary>
                      <div className="hamster-set-popover">
                        <strong>{set.name[language] || set.name.en}</strong>
                        <span>{t('hamsters.setMembers')}</span>
                        <div className="hamster-set-members">
                          {set.members.map(slug => {
                            const member = HAMSTERS_BY_SLUG.get(slug);
                            return member && <button type="button" key={slug} aria-label={member.name} onClick={event => { event.currentTarget.closest('details')?.removeAttribute('open'); selectSetMember(slug); }}><HamsterSprite skin={member.skins[0]} name={member.name} size={54} /><span>{member.name}</span></button>;
                          })}
                        </div>
                        <div className="hamster-set-rewards">
                          <strong>{t('hamsters.setRewards')}</strong>
                          <ul>{set.levels.map(stage => <li key={stage.level}>
                            <span>{t('hamsters.setUnlock', { count: stage.requiredMembers, total: stage.totalMembers })}</span>
                            <span>{stage.text[language] || stage.text.en}</span>
                            <strong>+{Number(stage.rewardRlt).toLocaleString(i18n.language)} RLT</strong>
                          </li>)}</ul>
                          <span>{t('hamsters.totalReward', { value: Number(set.completion.rewardRlt).toLocaleString(i18n.language) })}</span>
                        </div>
                      </div>
                    </details>
                  ))}
                  <span className="hamster-level-badge">LVL {String(skin.level).padStart(2, '0')}</span>
                </div>
              </div>
              <ExpeditionScene map={map} skin={skin} name={selected.name} animation={animation} reactionTrigger={reactionTrigger} reactionLabel={t('hamsters.tapHint')} />
              <div className="hamster-animation-controls">
                <span>{t('hamsters.animations')}</span>
                <div role="group" aria-label={t('hamsters.animations')}>
                  {ANIMATIONS.filter(item => skin.animations[item.action]).map(item => (
                    <button
                      type="button"
                      key={item.action}
                      className={animation === item.action ? 'active' : ''}
                      aria-pressed={animation === item.action}
                      onClick={() => { setAnimation(item.action); if (item.action === 'tap_reaction') setReactionTrigger(value => value + 1); }}
                    >{t(`hamsters.${item.label}`)}</button>
                  ))}
                </div>
                <small>{t('hamsters.tapHint')}</small>
              </div>
              <div className="hamster-stage-controls">
                <label>
                  <span>{t('hamsters.map')}</span>
                  <select value={mapId} onChange={event => setMapId(event.target.value)}>
                    {EXPEDITION_MAPS.map(option => <option value={option.id} key={option.id}>{option.name}</option>)}
                  </select>
                </label>
                <label>
                  <span>{t('hamsters.appearance')}</span>
                  <select value={skin.level} onChange={event => setLevel(Number(event.target.value))}>
                    {selected.skins.map(option => <option value={option.level} key={option.level}>{t('hamsters.level')} {option.level}</option>)}
                  </select>
                </label>
              </div>
            </div>

            <div className="hamster-details-panel">
              <h3>{t('hamsters.stats')}</h3>
              <div className="hamster-stats-grid">
              {([
                ['health', selected.stats.health],
                ['strength', selected.stats.strength],
                ['luck', selected.stats.luck],
              ] as const).map(([key, value]) => (
                <div className={`hamster-stat hamster-stat-${key}`} key={key}>
                  <img className="hamster-stat-icon" src={STAT_ICONS[key]} alt="" />
                  <span className="hamster-stat-name">{t(`hamsters.${key}`)}</span>
                  <strong>{value}</strong>
                  {bestiary?.maxStats && <small className="hamster-stat-max">{t('hamsters.maxStat', { value: bestiary.maxStats[key] })}</small>}
                  <span className="hamster-stat-track"><span style={{ width: `${Math.min(100, value)}%` }} /></span>
                </div>
              ))}
              </div>
              {bestiary && <div className="hamster-bestiary-details">
                {bestiary.restHours !== undefined && <span>{t('hamsters.restTime', { hours: bestiary.restHours })}</span>}
                <a href={bestiaryUrl(bestiary.path)} target="_blank" rel="noreferrer">{t('hamsters.officialBestiary')} ↗</a>
              </div>}
              <h3 className="hamster-traits-title">{t('hamsters.abilities')}</h3>
              <div className="hamster-traits">
                {selected.abilities.map(trait => <Trait trait={trait} language={language} key={trait.code} />)}
                {selected.ultimate && <Trait trait={selected.ultimate} language={language} />}
                {!selected.abilities.length && !selected.ultimate && <span className="hamster-muted">{t('hamsters.noAbilities')}</span>}
              </div>
              {selected.ultimateChargePoints !== null && <p className="hamster-charge-points">{t('hamsters.chargePoints', { value: selected.ultimateChargePoints })}</p>}
              {selected.builderSlots.length > 0 && (
                <div className="hamster-builder">
                  <h3>{t('hamsters.builder')}</h3>
                  {selected.builderSlots.map((slot, slotIndex) => (
                    <section className="hamster-builder-slot" key={slotIndex}>
                      <h4>{t('hamsters.slot', { value: slotIndex + 1 })} · {slot.title[language] || slot.title.en}</h4>
                      <div className="hamster-builder-builds">
                        {slot.builds.map((build, buildIndex) => (
                          <div className="hamster-builder-build" key={buildIndex}>
                            <strong>{t('hamsters.build', { value: buildIndex + 1 })}</strong>
                            <div className="hamster-builder-line"><span className="hamster-buff-label">{t('hamsters.buff')}</span><BuilderOption option={build.buff} language={language} /></div>
                            {build.debuff && <div className="hamster-builder-line"><span className="hamster-debuff-label">{t('hamsters.debuff')}</span><BuilderOption option={build.debuff} language={language} /></div>}
                            {build.buff.levels && <div className="hamster-builder-levels">{build.buff.levels.map(item => <span key={item.level}>{item.level === 'basic' ? t('hamsters.basic') : `Lv ${item.level}`}: {item.value}</span>)}</div>}
                          </div>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              )}
            </div>
          </div>
      )}
      <div className="hamsters-toolbar">
        <label className="hamsters-search">
          <span>{t('hamsters.search')}</span>
          <input value={query} onChange={event => setQuery(event.target.value)} placeholder={t('hamsters.searchPlaceholder')} type="search" />
        </label>
        <label>
          <span>{t('hamsters.generation')}</span>
          <select value={generation} onChange={event => setGeneration(event.target.value)}>
            <option value="all">{t('hamsters.allGenerations')}</option>
            {[1, 2, 3].map(value => <option value={value} key={value}>{value}. {t('hamsters.generation')}</option>)}
          </select>
        </label>
        <label>
          <span>{t('hamsters.sort')}</span>
          <select value={sort} onChange={event => setSort(event.target.value)}>
            <option value="order">{t('hamsters.originalOrder')}</option>
            <option value="name">{t('hamsters.nameOrder')}</option>
            <option value="stats">{t('hamsters.statOrder')}</option>
          </select>
        </label>
        <span className="hamsters-results">{filtered.length} {t('hamsters.results')}</span>
      </div>
      {selected && skin ? (
        <>
          <h3 className="hamsters-list-title">{t('hamsters.catalog')}</h3>
          {[...new Set(filtered.map(hamster => hamster.generation))].sort((a, b) => a - b).map(group => (
            <section className="hamsters-generation" key={group}>
              <div className="hamsters-generation-heading"><h4>{group}. {t('hamsters.generation')}</h4><span>{filtered.filter(hamster => hamster.generation === group).length} {t('hamsters.characters')}</span></div>
              <div className="hamsters-grid">
                {filtered.filter(hamster => hamster.generation === group).map(hamster => (
              <button
                type="button"
                className={`hamster-card ${hamster.slug === selected.slug ? 'selected' : ''}`}
                key={hamster.slug}
                onClick={() => selectHamster(hamster)}
                aria-pressed={hamster.slug === selected.slug}
              >
                <span className="hamster-card-art"><HamsterSprite skin={hamster.skins[0]} name={hamster.name} size={96} /></span>
                <strong>{hamster.name}</strong>
                <span className="hamster-card-generation">{hamster.generation}. {t('hamsters.generation')}</span>
                <span className="hamster-card-stats">
                  <span><img src={STAT_ICONS.health} alt={t('hamsters.health')} />{hamster.stats.health}</span>
                  <span><img src={STAT_ICONS.strength} alt={t('hamsters.strength')} />{hamster.stats.strength}</span>
                  <span><img src={STAT_ICONS.luck} alt={t('hamsters.luck')} />{hamster.stats.luck}</span>
                </span>
              </button>
                ))}
              </div>
            </section>
          ))}
        </>
      ) : <div className="hamsters-empty">{t('hamsters.empty')}</div>}
    </section>
  );
}
