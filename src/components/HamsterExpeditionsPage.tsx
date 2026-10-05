import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import rawHamsters from '../data/hamsters.json';
import enLocale from '../locales/en.json';
import { EXPEDITION_MAPS } from '../data/expeditionMaps';
import HamsterSprite from './HamsterSprite';
import type { Hamster } from '../types/hamster';
import { abilitySurvivalBonus, basicSurvivalChance, builderSurvivalBonus, difficultyInfluence, expeditionSurvivalChance, hasMaxStatsUltimate, hasSmartStudy, totalHamsterStats } from '../utils/expeditionChance';
import './HamsterExpeditionsPage.css';
import HamsterSectionNav from './HamsterSectionNav';
import HamsterNumberInput from './HamsterNumberInput';

const HAMSTERS = rawHamsters as Hamster[];
const MAPS = [...EXPEDITION_MAPS].sort((a, b) => Number(a.active === false) - Number(b.active === false));
const ASCENSION = new Set(['badncle', 'goodncle', 'uncle-azoth']);
const isSpecialUltimate = (hamster: Hamster) => hasMaxStatsUltimate(hamster) || hamster.ultimate?.code === 'survives_no_matter_what';
const hasSurvivalBuilder = (hamster: Hamster) => hamster.builderSlots.some(slot => slot.builds.some(build => build.buff.code === 'survival'));
const hasSurvivalPenalty = (hamster: Hamster) => hamster.builderSlots.some(slot => slot.builds.some(build => build.debuff?.code === 'survival'));
const skinAtLevel = (hamster: Hamster, level: number) => hamster.skins.reduce(
  (selected, skin) => skin.level <= level && skin.level > selected.level ? skin : selected,
  hamster.skins[0],
);

export default function HamsterExpeditionsPage() {
  const { t } = useTranslation();
  const copy = t('hamsterExpeditions', { returnObjects: true }) as typeof enLocale.hamsterExpeditions;
  const [query, setQuery] = useState('');
  const [levels, setLevels] = useState<Record<string, number>>({});
  const [globalLevel, setGlobalLevel] = useState<number | null>(null);
  const [sets, setSets] = useState<Record<string, number>>({});
  const [builders, setBuilders] = useState<Record<string, 'positive' | 'negative' | null>>({});
  const [ultimates, setUltimates] = useState<Record<string, boolean>>({});
  const [smartStudyPoints, setSmartStudyPoints] = useState<Record<string, number>>({});
  const [selectedSlug, setSelectedSlug] = useState(HAMSTERS[0]?.slug);
  const [selectedMapId, setSelectedMapId] = useState(MAPS[0].id);
  const [sort, setSort] = useState('newest');
  const featureRef = useRef<HTMLElement>(null);
  const mapHeaderAnchorRef = useRef<HTMLDivElement>(null);
  const mapHeaderRef = useRef<HTMLDivElement>(null);
  const mapGridRef = useRef<HTMLDivElement>(null);
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const scrollRangeRef = useRef<HTMLInputElement>(null);
  const scrollLeftRef = useRef<HTMLButtonElement>(null);
  const scrollRightRef = useRef<HTMLButtonElement>(null);
  const scrollMaxRef = useRef(0);
  const mirroredScrollRef = useRef({ header: Number.NaN, table: Number.NaN });
  const dragRef = useRef<{ startX: number; scrollLeft: number; moved: boolean } | null>(null);
  const [tableScrollMax, setTableScrollMax] = useState(0);
  const [headerPosition, setHeaderPosition] = useState({ fixed: false, left: 0, width: 0 });
  const selected = HAMSTERS.find(hamster => hamster.slug === selectedSlug) ?? HAMSTERS[0];
  const selectedMap = MAPS.find(map => map.id === selectedMapId) ?? MAPS[0];
  const levelOf = (hamster: Hamster) => levels[hamster.slug] ?? hamster.skins[0]?.level ?? 1;
  const optionsOf = (hamster: Hamster) => ({ level: levelOf(hamster), setBonus: sets[hamster.slug] ?? 0, builderSurvival: builders[hamster.slug] === 'positive', builderPenalty: builders[hamster.slug] === 'negative', ultimate: ultimates[hamster.slug] ?? false, extraStatPoints: smartStudyPoints[hamster.slug] ?? 0 });
  const changeLevel = (hamster: Hamster, value: number | null) => {
    setGlobalLevel(null);
    setLevels(previous => ({ ...previous, [hamster.slug]: value ?? hamster.skins[0]?.level ?? 1 }));
  };
  const changeSmartStudyTotal = (hamster: Hamster, total: number | null) => {
    const base = totalHamsterStats(hamster, levelOf(hamster));
    setSmartStudyPoints(previous => ({ ...previous, [hamster.slug]: Math.max(0, Math.min(300, total ?? base) - base) }));
  };
  const chanceOf = (hamster: Hamster, difficulty: number) => expeditionSurvivalChance(hamster, difficulty, optionsOf(hamster));
  const visible = useMemo(() => {
    const result = HAMSTERS.filter(hamster => hamster.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
    if (sort === 'newest') result.reverse();
    if (sort === 'chance') result.sort((a, b) => chanceOf(b, selectedMap.difficulty) - chanceOf(a, selectedMap.difficulty) || a.order - b.order);
    return result;
  // The level/bonus maps are part of the sort criterion.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, sort, selectedMap, levels, sets, builders, ultimates, smartStudyPoints]);

  useEffect(() => {
    document.title = `${copy.title} | Rollercoin Calculator`;
    return () => { document.title = 'Rollercoin Calculator'; };
  }, [copy.title]);

  // Keep scroll-only UI out of React state so moving the table does not rerender every row.
  const updateScrollControls = useCallback(() => {
    const left = tableScrollRef.current?.scrollLeft ?? 0;
    if (scrollRangeRef.current) scrollRangeRef.current.value = String(left);
    if (scrollLeftRef.current) scrollLeftRef.current.disabled = left < 1;
    if (scrollRightRef.current) scrollRightRef.current.disabled = left >= scrollMaxRef.current - 1;
  }, []);

  useEffect(() => {
    let frame = 0;
    const updateHeader = () => {
      const anchor = mapHeaderAnchorRef.current;
      const table = tableScrollRef.current;
      if (!anchor || !table) return;
      const rect = anchor.getBoundingClientRect();
      // Include fractional cell overflow so both scroll containers have the same end position.
      if (mapGridRef.current) mapGridRef.current.style.width = `${table.scrollWidth}px`;
      const max = Math.max(0, table.scrollWidth - table.clientWidth);
      scrollMaxRef.current = max;
      setTableScrollMax(max);
      updateScrollControls();
      const navbarHeight = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--navbar-height')) || 76;
      const fixed = rect.top <= navbarHeight && table.getBoundingClientRect().bottom > navbarHeight + rect.height;
      const next = { fixed, left: Math.round(rect.left), width: Math.round(rect.width) };
      setHeaderPosition(previous => previous.fixed === next.fixed && previous.left === next.left && previous.width === next.width ? previous : next);
    };
    const scheduleHeaderUpdate = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => { frame = 0; updateHeader(); });
    };
    const observer = new ResizeObserver(scheduleHeaderUpdate);
    if (mapHeaderAnchorRef.current) observer.observe(mapHeaderAnchorRef.current);
    if (tableScrollRef.current) observer.observe(tableScrollRef.current);
    window.addEventListener('scroll', scheduleHeaderUpdate, { passive: true });
    window.addEventListener('resize', scheduleHeaderUpdate);
    updateHeader();
    return () => { observer.disconnect(); cancelAnimationFrame(frame); window.removeEventListener('scroll', scheduleHeaderUpdate); window.removeEventListener('resize', scheduleHeaderUpdate); };
  }, [updateScrollControls]);

  useEffect(() => { updateScrollControls(); }, [tableScrollMax, updateScrollControls]);

  const selectedOptions = optionsOf(selected);
  const selectedStats = totalHamsterStats(selected, selectedOptions.level, selectedOptions.ultimate, selectedOptions.extraStatPoints);
  const abilityBonus = abilitySurvivalBonus(selected, selectedOptions.level, selectedOptions.builderSurvival, selectedOptions.builderPenalty);
  const percent = (value: number) => `${value.toFixed(2)}%`;
  const signed = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  const syncTableScroll = (from: 'header' | 'table') => {
    const source = from === 'header' ? mapHeaderRef.current : tableScrollRef.current;
    const target = from === 'header' ? tableScrollRef.current : mapHeaderRef.current;
    if (!source || !target) return;
    const mirrored = mirroredScrollRef.current;
    // A programmatic mirror must not scroll the source back or cancel its smooth movement.
    if (Math.abs(mirrored[from] - source.scrollLeft) <= .5) {
      mirrored[from] = Number.NaN;
      updateScrollControls();
      return;
    }
    mirrored[from] = Number.NaN;
    if (Math.abs(target.scrollLeft - source.scrollLeft) > .5) {
      target.scrollLeft = source.scrollLeft;
      mirrored[from === 'header' ? 'table' : 'header'] = target.scrollLeft;
    }
    updateScrollControls();
  };
  const scrollTable = (left: number, smooth = false) => tableScrollRef.current?.scrollTo({ left, behavior: smooth && !window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'smooth' : 'auto' });
  const mapImage = (id: string, layer: string) => `${import.meta.env.BASE_URL}expedition/maps/${id}/${layer}`;
  const selectHamster = (slug: string) => {
    setSelectedSlug(slug);
    featureRef.current?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
      block: 'start',
    });
  };

  return <section className="expedition-calculator">
    <HamsterSectionNav />
    <header className="expedition-calculator-heading">
      <div><span className="hamsters-eyebrow">{copy.eyebrow}</span><h1>{copy.title}</h1><p>{copy.intro}</p></div>
    </header>

    <section className="expedition-calc-feature" aria-label={copy.featured} ref={featureRef}>
      <div className="expedition-calc-identity"><HamsterSprite className="expedition-calc-feature-idle" skin={skinAtLevel(selected, selectedOptions.level)} name={selected.name} size={null} /><div><small>{copy.featured}</small><h2>{selected.name}</h2><span>{selected.generation}. {t('hamsters.generation')}</span></div></div>
      <div className="expedition-calc-controls">
        <div className="expedition-calc-number-label"><span>{copy.level}</span><HamsterNumberInput label={`${selected.name} ${copy.level}`} value={selectedOptions.level} min={selected.skins[0]?.level ?? 1} max={50} onChange={value => changeLevel(selected, value)} /></div>
        {ASCENSION.has(selected.slug) && <label>{copy.set}<select value={selectedOptions.setBonus} onChange={event => setSets(previous => ({ ...previous, [selected.slug]: Number(event.target.value) }))}><option value={0}>{copy.noSet}</option><option value={5}>{copy.twoSet}</option><option value={15}>{copy.fullSet}</option></select></label>}
        {hasSurvivalPenalty(selected) && <label className="expedition-calc-check"><input type="checkbox" checked={selectedOptions.builderPenalty} onChange={event => setBuilders(previous => ({ ...previous, [selected.slug]: event.target.checked ? 'negative' : null }))} />{copy.builder} {signed(builderSurvivalBonus(selected, selectedOptions.level, true))}</label>}
        {hasSurvivalBuilder(selected) && <label className="expedition-calc-check"><input type="checkbox" checked={selectedOptions.builderSurvival} onChange={event => setBuilders(previous => ({ ...previous, [selected.slug]: event.target.checked ? 'positive' : null }))} />{copy.builder} {signed(builderSurvivalBonus(selected, selectedOptions.level))}</label>}
        {isSpecialUltimate(selected) && <label className="expedition-calc-check"><input type="checkbox" checked={selectedOptions.ultimate} onChange={event => setUltimates(previous => ({ ...previous, [selected.slug]: event.target.checked }))} />{copy.ultimate}</label>}
        {hasSmartStudy(selected) && <div className="expedition-calc-smart-study expedition-calc-number-label"><span>{copy.smartStudyTotal}</span><HamsterNumberInput stepper label={`${selected.name}: ${copy.smartStudyTotal}`} value={selectedStats} min={totalHamsterStats(selected, selectedOptions.level)} max={300} onChange={value => changeSmartStudyTotal(selected, value)} /><small>{copy.smartStudyNote}</small></div>}
        {selectedOptions.ultimate && hasMaxStatsUltimate(selected) && <p className="expedition-calc-ability-note">{copy.maxStatsActive}</p>}
        {hasSmartStudy(selected) && selectedStats === 300 && <p className="expedition-calc-ability-note">{copy.fullStats}</p>}
      </div>
      <div className="expedition-calc-breakdown"><span>{copy.stats}<strong>{selectedStats}</strong></span><span>{copy.base}<strong>{percent(basicSurvivalChance(selectedStats))}</strong></span><span>{copy.difficulty}<strong>{signed(difficultyInfluence(selectedMap.difficulty))}</strong></span><span>{copy.abilities}<strong>{signed(abilityBonus + selectedOptions.setBonus)}</strong></span></div>
      <div className="expedition-calc-map-results" aria-label={copy.chooseMap}>{MAPS.map(map => <button type="button" key={map.id} className={`${map.id === selectedMapId ? 'selected' : ''} ${map.active === false ? 'inactive' : ''}`} onClick={() => setSelectedMapId(map.id)} aria-pressed={map.id === selectedMapId}><span>{map.name}</span>{map.active === false && <small>{t('hamsterHub.inactive')}</small>}<strong>{percent(chanceOf(selected, map.difficulty))}</strong></button>)}</div>
    </section>

    <section className="expedition-calc-comparison">
      <div className="expedition-calc-section-heading"><h2>{copy.compare}</h2><span>{visible.length} / {HAMSTERS.length}</span></div>
      <div className="expedition-calc-toolbar">
        <label>{copy.search}<input type="search" value={query} placeholder={copy.placeholder} onChange={event => setQuery(event.target.value)} /></label>
        <div className="expedition-calc-number-label"><span>{copy.allLevels}</span><HamsterNumberInput allowEmpty label={copy.allLevels} value={globalLevel} min={1} max={50} onChange={level => { setGlobalLevel(level); if (level) setLevels(Object.fromEntries(HAMSTERS.map(hamster => [hamster.slug, Math.max(level, hamster.skins[0]?.level ?? 1)]))); }} /></div>
        <label>{copy.chooseMap}<select value={selectedMapId} onChange={event => setSelectedMapId(event.target.value)}>{MAPS.map(map => <option key={map.id} value={map.id}>{map.name}{map.active === false ? ` · ${t('hamsterHub.inactive')}` : ''}</option>)}</select></label>
        <label>{copy.sort}<select value={sort} onChange={event => setSort(event.target.value)}><option value="newest">{copy.newest}</option><option value="oldest">{copy.oldest}</option><option value="chance">{copy.best}</option></select></label>
      </div>
      <div className="expedition-calc-map-header-anchor" ref={mapHeaderAnchorRef} style={{ minHeight: tableScrollMax > 1 ? 128 : 84 }}>
        <div className={`expedition-calc-map-header ${headerPosition.fixed ? 'is-fixed' : ''}`} ref={mapHeaderRef} onScroll={() => syncTableScroll('header')} style={headerPosition.fixed ? { left: headerPosition.left, width: headerPosition.width } : undefined} tabIndex={0} aria-label={copy.chooseMap}>
          {tableScrollMax > 1 && <div className="expedition-calc-scroll-controls">
            <button type="button" ref={scrollLeftRef} aria-label={t('hamsterHub.scrollLeft')} onClick={() => scrollTable((tableScrollRef.current?.scrollLeft ?? 0) - 260, true)}>←</button>
            <input type="range" ref={scrollRangeRef} min={0} max={tableScrollMax} defaultValue={0} aria-label={t('hamsterHub.scrollMaps')} onChange={event => scrollTable(Number(event.target.value))} />
            <button type="button" ref={scrollRightRef} aria-label={t('hamsterHub.scrollRight')} onClick={() => scrollTable((tableScrollRef.current?.scrollLeft ?? 0) + 260, true)}>→</button>
          </div>}
          <div className="expedition-calc-map-grid" ref={mapGridRef}>
            <span>{copy.hamster}</span><span>{copy.level}</span><span>{copy.total}</span>
            {MAPS.map(map => <button type="button" key={map.id} className={`expedition-calc-map-card ${map.id === selectedMapId ? 'selected' : ''} ${map.active === false ? 'inactive' : ''}`} onClick={() => setSelectedMapId(map.id)} aria-pressed={map.id === selectedMapId}>
              <img src={mapImage(map.id, map.base ?? 'layer0.png')} alt="" loading="lazy" />
              {map.scenery && <img src={mapImage(map.id, map.scenery)} alt="" loading="lazy" />}
              <strong>{map.name}</strong><small>{copy.difficultyLabel} {map.difficulty} · {map.durationHours} {copy.hours}</small>
              {map.active === false && <small className="expedition-inactive-badge">{t('hamsterHub.inactive')}</small>}
            </button>)}
          </div>
        </div>
      </div>
      <div className="expedition-calc-table-wrap" ref={tableScrollRef} onScroll={() => syncTableScroll('table')} tabIndex={0} aria-label={copy.compare}
        onPointerDown={event => { if (event.pointerType !== 'mouse' || event.button !== 0 || (event.target as HTMLElement).closest('button, input, select, label, a')) return; dragRef.current = { startX: event.clientX, scrollLeft: event.currentTarget.scrollLeft, moved: false }; }}
        onPointerMove={event => { const drag = dragRef.current; if (!drag || !(event.buttons & 1)) { dragRef.current = null; delete event.currentTarget.dataset.dragging; return; } const delta = event.clientX - drag.startX; if (Math.abs(delta) > 5 || drag.moved) { drag.moved = true; event.currentTarget.setPointerCapture(event.pointerId); event.currentTarget.dataset.dragging = 'true'; event.currentTarget.scrollLeft = drag.scrollLeft - delta; event.preventDefault(); } }}
        onPointerUp={event => { dragRef.current = null; delete event.currentTarget.dataset.dragging; }}
        onPointerCancel={event => { dragRef.current = null; delete event.currentTarget.dataset.dragging; }}>
        <table><colgroup><col className="expedition-col-name" /><col className="expedition-col-level" /><col className="expedition-col-total" />{MAPS.map(map => <col className="expedition-col-map" key={map.id} />)}</colgroup><thead><tr><th scope="col">{copy.hamster}</th><th scope="col">{copy.level}</th><th scope="col">{copy.total}</th>{MAPS.map(map => <th scope="col" key={map.id}>{map.name}</th>)}</tr></thead>
          <tbody>{visible.map(hamster => <tr key={hamster.slug} className={hamster.slug === selectedSlug ? 'selected' : ''}>
            <th scope="row"><button type="button" className="expedition-calc-name" onClick={() => selectHamster(hamster.slug)}><HamsterSprite className="expedition-calc-idle" skin={skinAtLevel(hamster, levelOf(hamster))} name="" size={null} /><span>{hamster.name}</span></button></th>
            <td className="expedition-calc-level-cell"><HamsterNumberInput label={`${hamster.name} ${copy.level}`} value={levelOf(hamster)} min={hamster.skins[0]?.level ?? 1} max={50} onChange={value => changeLevel(hamster, value)} />{hasSmartStudy(hamster) && <HamsterNumberInput stepper label={`${hamster.name}: ${copy.smartStudyTotal}`} value={totalHamsterStats(hamster, levelOf(hamster), false, smartStudyPoints[hamster.slug])} min={totalHamsterStats(hamster, levelOf(hamster))} max={300} onChange={value => changeSmartStudyTotal(hamster, value)} />}</td>
            <td className="expedition-calc-stat-cell"><strong>{totalHamsterStats(hamster, levelOf(hamster), ultimates[hamster.slug], smartStudyPoints[hamster.slug])}</strong><div className="expedition-calc-row-bonuses">
              {abilitySurvivalBonus(hamster, levelOf(hamster)) !== 0 && <span className="expedition-calc-passive" title={copy.abilities}>{signed(abilitySurvivalBonus(hamster, levelOf(hamster)))}</span>}
              {isSpecialUltimate(hamster) && <label title={copy.ultimate}><input type="checkbox" aria-label={`${hamster.name}: ${copy.ultimate}`} checked={ultimates[hamster.slug] ?? false} onChange={event => setUltimates(previous => ({ ...previous, [hamster.slug]: event.target.checked }))} /><span>{copy.ultimate}</span></label>}
              {hasSurvivalPenalty(hamster) && <label title={copy.builder}><input type="checkbox" aria-label={`${hamster.name}: ${copy.builder} ${signed(builderSurvivalBonus(hamster, levelOf(hamster), true))}`} checked={builders[hamster.slug] === 'negative'} onChange={event => setBuilders(previous => ({ ...previous, [hamster.slug]: event.target.checked ? 'negative' : null }))} /><span>{signed(builderSurvivalBonus(hamster, levelOf(hamster), true))}</span></label>}
              {hasSurvivalBuilder(hamster) && <label title={copy.builder}><input type="checkbox" aria-label={`${hamster.name}: ${copy.builder} ${signed(builderSurvivalBonus(hamster, levelOf(hamster)))}`} checked={builders[hamster.slug] === 'positive'} onChange={event => setBuilders(previous => ({ ...previous, [hamster.slug]: event.target.checked ? 'positive' : null }))} /><span>{signed(builderSurvivalBonus(hamster, levelOf(hamster)))}</span></label>}
              {ASCENSION.has(hamster.slug) && <select aria-label={`${hamster.name}: ${copy.set}`} title={sets[hamster.slug] === 15 ? copy.fullSet : sets[hamster.slug] === 5 ? copy.twoSet : copy.noSet} value={sets[hamster.slug] ?? 0} onChange={event => setSets(previous => ({ ...previous, [hamster.slug]: Number(event.target.value) }))}><option value={0}>{copy.noSet}</option><option value={5}>{copy.twoSet}</option><option value={15}>{copy.fullSet}</option></select>}
            </div></td>
            {MAPS.map(map => { const chance = chanceOf(hamster, map.difficulty); return <td key={map.id} className={`${map.id === selectedMapId ? 'highlight' : ''} ${map.active === false ? 'expedition-inactive-cell' : ''}`}><span className={chance >= 75 ? 'chance-high' : chance < 35 ? 'chance-low' : 'chance-mid'}>{percent(chance)}</span></td>; })}
          </tr>)}</tbody></table>
        {!visible.length && <p className="expedition-calc-empty">{copy.noResults}</p>}
      </div>
    </section>

    <aside className="expedition-calc-method"><h2>{copy.method}</h2><p>{copy.note}</p><p>{copy.levelNote}</p><a href="https://rollercoin.com/blog/dev-diaries-vol18" target="_blank" rel="noreferrer">{copy.source} ↗</a></aside>
  </section>;
}
