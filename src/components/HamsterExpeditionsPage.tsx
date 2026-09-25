import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import rawHamsters from '../data/hamsters.json';
import enLocale from '../locales/en.json';
import { EXPEDITION_MAPS } from '../data/expeditionMaps';
import { hamsterAssetUrl } from '../utils/hamsterAssets';
import type { Hamster } from '../types/hamster';
import { abilitySurvivalBonus, basicSurvivalChance, difficultyInfluence, expeditionSurvivalChance, hasMaxStatsUltimate, hasSmartStudy, totalHamsterStats } from '../utils/expeditionChance';
import './HamsterExpeditionsPage.css';

const HAMSTERS = rawHamsters as Hamster[];
const MAPS = [...EXPEDITION_MAPS].sort((a, b) => b.difficulty - a.difficulty || b.durationHours - a.durationHours);
const ASCENSION = new Set(['badncle', 'goodncle', 'uncle-azoth']);
const isSpecialUltimate = (hamster: Hamster) => hasMaxStatsUltimate(hamster) || hamster.ultimate?.code === 'survives_no_matter_what';
const hasSurvivalBuilder = (hamster: Hamster) => hamster.builderSlots.some(slot => slot.builds.some(build => build.buff.code === 'survival'));
const skinAtLevel = (hamster: Hamster, level: number) => hamster.skins.reduce(
  (selected, skin) => skin.level <= level && skin.level > selected.level ? skin : selected,
  hamster.skins[0],
);

export default function HamsterExpeditionsPage() {
  const { lang } = useParams();
  const { t } = useTranslation();
  const copy = t('hamsterExpeditions', { returnObjects: true }) as typeof enLocale.hamsterExpeditions;
  const [query, setQuery] = useState('');
  const [levels, setLevels] = useState<Record<string, number>>({});
  const [globalLevel, setGlobalLevel] = useState<number | null>(null);
  const [sets, setSets] = useState<Record<string, number>>({});
  const [builders, setBuilders] = useState<Record<string, boolean>>({});
  const [ultimates, setUltimates] = useState<Record<string, boolean>>({});
  const [smartStudyPoints, setSmartStudyPoints] = useState<Record<string, number>>({});
  const [selectedSlug, setSelectedSlug] = useState(HAMSTERS[0]?.slug);
  const [selectedMapId, setSelectedMapId] = useState(MAPS[0].id);
  const [sort, setSort] = useState('order');
  const featureRef = useRef<HTMLElement>(null);
  const mapHeaderAnchorRef = useRef<HTMLDivElement>(null);
  const mapHeaderRef = useRef<HTMLDivElement>(null);
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const [headerPosition, setHeaderPosition] = useState({ fixed: false, left: 0, width: 0 });
  const selected = HAMSTERS.find(hamster => hamster.slug === selectedSlug) ?? HAMSTERS[0];
  const selectedMap = MAPS.find(map => map.id === selectedMapId) ?? MAPS[0];
  const levelOf = (hamster: Hamster) => levels[hamster.slug] ?? hamster.skins[0]?.level ?? 1;
  const optionsOf = (hamster: Hamster) => ({ level: levelOf(hamster), setBonus: sets[hamster.slug] ?? 0, builderSurvival: builders[hamster.slug] ?? false, ultimate: ultimates[hamster.slug] ?? false, extraStatPoints: smartStudyPoints[hamster.slug] ?? 0 });
  const chanceOf = (hamster: Hamster, difficulty: number) => expeditionSurvivalChance(hamster, difficulty, optionsOf(hamster));
  const visible = useMemo(() => {
    const result = HAMSTERS.filter(hamster => hamster.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
    if (sort === 'chance') result.sort((a, b) => chanceOf(b, selectedMap.difficulty) - chanceOf(a, selectedMap.difficulty) || a.order - b.order);
    return result;
  // The level/bonus maps are part of the sort criterion.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, sort, selectedMap, levels, sets, builders, ultimates, smartStudyPoints]);

  useEffect(() => {
    document.title = `${copy.title} | Rollercoin Calculator`;
    return () => { document.title = 'Rollercoin Calculator'; };
  }, [copy.title]);

  useEffect(() => {
    const updateHeader = () => {
      const anchor = mapHeaderAnchorRef.current;
      const table = tableScrollRef.current;
      if (!anchor || !table) return;
      const rect = anchor.getBoundingClientRect();
      const navbarHeight = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--navbar-height')) || 76;
      const fixed = rect.top <= navbarHeight && table.getBoundingClientRect().bottom > navbarHeight + rect.height;
      const next = { fixed, left: Math.round(rect.left), width: Math.round(rect.width) };
      setHeaderPosition(previous => previous.fixed === next.fixed && previous.left === next.left && previous.width === next.width ? previous : next);
    };
    const observer = new ResizeObserver(updateHeader);
    if (mapHeaderAnchorRef.current) observer.observe(mapHeaderAnchorRef.current);
    window.addEventListener('scroll', updateHeader, { passive: true });
    window.addEventListener('resize', updateHeader);
    updateHeader();
    return () => { observer.disconnect(); window.removeEventListener('scroll', updateHeader); window.removeEventListener('resize', updateHeader); };
  }, []);

  const selectedOptions = optionsOf(selected);
  const selectedStats = totalHamsterStats(selected, selectedOptions.level, selectedOptions.ultimate, selectedOptions.extraStatPoints);
  const abilityBonus = abilitySurvivalBonus(selected, selectedOptions.level, selectedOptions.builderSurvival);
  const percent = (value: number) => `${value.toFixed(2)}%`;
  const signed = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  const syncTableScroll = (from: 'header' | 'table') => {
    const source = from === 'header' ? mapHeaderRef.current : tableScrollRef.current;
    const target = from === 'header' ? tableScrollRef.current : mapHeaderRef.current;
    if (source && target && target.scrollLeft !== source.scrollLeft) target.scrollLeft = source.scrollLeft;
  };
  const mapImage = (id: string, layer: string) => `${import.meta.env.BASE_URL}expedition/maps/${id}/${layer}`;
  const selectHamster = (slug: string) => {
    setSelectedSlug(slug);
    featureRef.current?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
      block: 'start',
    });
  };

  return <section className="expedition-calculator">
    <header className="expedition-calculator-heading">
      <div><span className="hamsters-eyebrow">{copy.eyebrow}</span><h1>{copy.title}</h1><p>{copy.intro}</p></div>
      <Link to={`/${lang || 'en'}/hamsters`} className="expedition-back">← {copy.back}</Link>
    </header>

    <section className="expedition-calc-feature" aria-label={copy.featured} ref={featureRef}>
      <div className="expedition-calc-identity"><img className="expedition-calc-feature-idle" src={hamsterAssetUrl(skinAtLevel(selected, selectedOptions.level).idle)} alt={selected.name} /><div><small>{copy.featured}</small><h2>{selected.name}</h2><span>{selected.generation}. {t('hamsters.generation')}</span></div></div>
      <div className="expedition-calc-controls">
        <label>{copy.level}<select aria-label={`${selected.name} ${copy.level}`} value={selectedOptions.level} onChange={event => { setGlobalLevel(null); setLevels(previous => ({ ...previous, [selected.slug]: Number(event.target.value) })); }}>{Array.from({ length: 51 - (selected.skins[0]?.level ?? 1) }, (_, index) => index + (selected.skins[0]?.level ?? 1)).map(value => <option key={value} value={value}>{value}</option>)}</select></label>
        {ASCENSION.has(selected.slug) && <label>{copy.set}<select value={selectedOptions.setBonus} onChange={event => setSets(previous => ({ ...previous, [selected.slug]: Number(event.target.value) }))}><option value={0}>{copy.noSet}</option><option value={5}>{copy.twoSet}</option><option value={15}>{copy.fullSet}</option></select></label>}
        {hasSurvivalBuilder(selected) && <label className="expedition-calc-check"><input type="checkbox" checked={selectedOptions.builderSurvival} onChange={event => setBuilders(previous => ({ ...previous, [selected.slug]: event.target.checked }))} />{copy.builder}</label>}
        {isSpecialUltimate(selected) && <label className="expedition-calc-check"><input type="checkbox" checked={selectedOptions.ultimate} onChange={event => setUltimates(previous => ({ ...previous, [selected.slug]: event.target.checked }))} />{copy.ultimate}</label>}
        {hasSmartStudy(selected) && <label className="expedition-calc-smart-study">{copy.smartStudy}<input type="number" min={0} max={300 - selected.stats.health - selected.stats.strength - selected.stats.luck} step={1} value={selectedOptions.extraStatPoints} onChange={event => setSmartStudyPoints(previous => ({ ...previous, [selected.slug]: Math.min(300 - selected.stats.health - selected.stats.strength - selected.stats.luck, Math.max(0, Math.floor(Number(event.target.value) || 0))) }))} /><small>{copy.smartStudyNote}</small></label>}
        {selectedOptions.ultimate && hasMaxStatsUltimate(selected) && <p className="expedition-calc-ability-note">{copy.maxStatsActive}</p>}
        {hasSmartStudy(selected) && selectedStats === 300 && <p className="expedition-calc-ability-note">{copy.fullStats}</p>}
      </div>
      <div className="expedition-calc-breakdown"><span>{copy.stats}<strong>{selectedStats}</strong></span><span>{copy.base}<strong>{percent(basicSurvivalChance(selectedStats))}</strong></span><span>{copy.difficulty}<strong>{signed(difficultyInfluence(selectedMap.difficulty))}</strong></span><span>{copy.abilities}<strong>{signed(abilityBonus + selectedOptions.setBonus)}</strong></span></div>
      <div className="expedition-calc-map-results" aria-label={copy.chooseMap}>{MAPS.map(map => <button type="button" key={map.id} className={map.id === selectedMapId ? 'selected' : ''} onClick={() => setSelectedMapId(map.id)} aria-pressed={map.id === selectedMapId}><span>{map.name}</span><strong>{percent(chanceOf(selected, map.difficulty))}</strong></button>)}</div>
    </section>

    <section className="expedition-calc-comparison">
      <div className="expedition-calc-section-heading"><h2>{copy.compare}</h2><span>{visible.length} / {HAMSTERS.length}</span></div>
      <div className="expedition-calc-toolbar">
        <label>{copy.search}<input type="search" value={query} placeholder={copy.placeholder} onChange={event => setQuery(event.target.value)} /></label>
        <label>{copy.allLevels}<select value={globalLevel ?? ''} onChange={event => { const level = Number(event.target.value); setGlobalLevel(level || null); if (level) setLevels(Object.fromEntries(HAMSTERS.map(hamster => [hamster.slug, Math.max(level, hamster.skins[0]?.level ?? 1)]))); }}><option value="">—</option>{Array.from({ length: 50 }, (_, index) => index + 1).map(value => <option key={value} value={value}>{value}</option>)}</select></label>
        <label>{copy.chooseMap}<select value={selectedMapId} onChange={event => setSelectedMapId(event.target.value)}>{MAPS.map(map => <option key={map.id} value={map.id}>{map.name}</option>)}</select></label>
        <label>{copy.sort}<select value={sort} onChange={event => setSort(event.target.value)}><option value="order">{copy.original}</option><option value="chance">{copy.best}</option></select></label>
      </div>
      <div className="expedition-calc-map-header-anchor" ref={mapHeaderAnchorRef}>
        <div className={`expedition-calc-map-header ${headerPosition.fixed ? 'is-fixed' : ''}`} ref={mapHeaderRef} onScroll={() => syncTableScroll('header')} style={headerPosition.fixed ? { left: headerPosition.left, width: headerPosition.width } : undefined} tabIndex={0} aria-label={copy.chooseMap}>
          <div className="expedition-calc-map-grid">
            <span>{copy.hamster}</span><span>{copy.level}</span><span>{copy.total}</span>
            {MAPS.map(map => <button type="button" key={map.id} className={`expedition-calc-map-card ${map.id === selectedMapId ? 'selected' : ''}`} onClick={() => setSelectedMapId(map.id)} aria-pressed={map.id === selectedMapId}>
              <img src={mapImage(map.id, map.base ?? 'layer0.png')} alt="" loading="lazy" />
              {map.scenery && <img src={mapImage(map.id, map.scenery)} alt="" loading="lazy" />}
              <strong>{map.name}</strong><small>{copy.difficultyLabel} {map.difficulty} · {map.durationHours} {copy.hours}</small>
            </button>)}
          </div>
        </div>
      </div>
      <div className="expedition-calc-table-wrap" ref={tableScrollRef} onScroll={() => syncTableScroll('table')} tabIndex={0} aria-label={copy.compare}>
        <table><colgroup><col className="expedition-col-name" /><col className="expedition-col-level" /><col className="expedition-col-total" />{MAPS.map(map => <col className="expedition-col-map" key={map.id} />)}</colgroup><thead><tr><th scope="col">{copy.hamster}</th><th scope="col">{copy.level}</th><th scope="col">{copy.total}</th>{MAPS.map(map => <th scope="col" key={map.id}>{map.name}</th>)}</tr></thead>
          <tbody>{visible.map(hamster => <tr key={hamster.slug} className={hamster.slug === selectedSlug ? 'selected' : ''}>
            <th scope="row"><button type="button" className="expedition-calc-name" onClick={() => selectHamster(hamster.slug)}><img className="expedition-calc-idle" src={hamsterAssetUrl(skinAtLevel(hamster, levelOf(hamster)).idle)} alt="" loading="lazy" /><span>{hamster.name}</span></button></th>
            <td><select aria-label={`${hamster.name} ${copy.level}`} value={levelOf(hamster)} onChange={event => { setGlobalLevel(null); setLevels(previous => ({ ...previous, [hamster.slug]: Number(event.target.value) })); }}>{Array.from({ length: 51 - (hamster.skins[0]?.level ?? 1) }, (_, index) => index + (hamster.skins[0]?.level ?? 1)).map(value => <option key={value} value={value}>{value}</option>)}</select></td>
            <td className="expedition-calc-stat-cell"><strong>{totalHamsterStats(hamster, levelOf(hamster), ultimates[hamster.slug], smartStudyPoints[hamster.slug])}</strong><div className="expedition-calc-row-bonuses">
              {abilitySurvivalBonus(hamster, levelOf(hamster)) !== 0 && <span className="expedition-calc-passive" title={copy.abilities}>{signed(abilitySurvivalBonus(hamster, levelOf(hamster)))}</span>}
              {isSpecialUltimate(hamster) && <label title={copy.ultimate}><input type="checkbox" aria-label={`${hamster.name}: ${copy.ultimate}`} checked={ultimates[hamster.slug] ?? false} onChange={event => setUltimates(previous => ({ ...previous, [hamster.slug]: event.target.checked }))} /><span>{copy.ultimate}</span></label>}
              {hasSurvivalBuilder(hamster) && <label title={copy.builder}><input type="checkbox" aria-label={`${hamster.name}: ${copy.builder}`} checked={builders[hamster.slug] ?? false} onChange={event => setBuilders(previous => ({ ...previous, [hamster.slug]: event.target.checked }))} /><span>{signed(abilitySurvivalBonus(hamster, levelOf(hamster), true) - abilitySurvivalBonus(hamster, levelOf(hamster)))}</span></label>}
              {ASCENSION.has(hamster.slug) && <select aria-label={`${hamster.name}: ${copy.set}`} title={copy.set} value={sets[hamster.slug] ?? 0} onChange={event => setSets(previous => ({ ...previous, [hamster.slug]: Number(event.target.value) }))}><option value={0}>{copy.noSet}</option><option value={5}>{copy.twoSet}</option><option value={15}>{copy.fullSet}</option></select>}
              {hasSmartStudy(hamster) && <label title={copy.smartStudy}>Smart Study +<input type="number" min={0} max={300 - hamster.stats.health - hamster.stats.strength - hamster.stats.luck} step={1} aria-label={`${hamster.name}: ${copy.smartStudy}`} value={smartStudyPoints[hamster.slug] ?? 0} onChange={event => setSmartStudyPoints(previous => ({ ...previous, [hamster.slug]: Math.min(300 - hamster.stats.health - hamster.stats.strength - hamster.stats.luck, Math.max(0, Math.floor(Number(event.target.value) || 0))) }))} /></label>}
            </div></td>
            {MAPS.map(map => { const chance = chanceOf(hamster, map.difficulty); return <td key={map.id} className={map.id === selectedMapId ? 'highlight' : ''}><span className={chance >= 75 ? 'chance-high' : chance < 35 ? 'chance-low' : 'chance-mid'}>{percent(chance)}</span></td>; })}
          </tr>)}</tbody></table>
        {!visible.length && <p className="expedition-calc-empty">{copy.noResults}</p>}
      </div>
    </section>

    <aside className="expedition-calc-method"><h2>{copy.method}</h2><p>{copy.note}</p><p>{copy.levelNote}</p><a href="https://rollercoin.com/blog/dev-diaries-vol18" target="_blank" rel="noreferrer">{copy.source} ↗</a></aside>
  </section>;
}
