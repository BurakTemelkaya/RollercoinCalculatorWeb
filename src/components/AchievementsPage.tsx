import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import rawAchievements from '../data/achievements.json';
import CdnImage from './CdnImage';
import { autoScalePower } from '../utils/powerParser';
import rltImg from '../assets/coins/rlt.svg';
import rstImg from '../assets/coins/rst.svg';
import batteryImg from '../assets/items/battery.png';
import './AchievementsPage.css';

// Snapshot of rollercoin.com/achievements (api/main/achievements/tasks-progress). Money amounts are already divided by 1e6.
interface Reward { t: 'money' | 'miner' | 'battery'; c?: string; a?: number; n?: string; f?: string; lv?: number; p?: number; b?: number; mt?: string }
interface Level { lv: number; n: number; d: string; img: string; r: Reward }
interface Achievement { cat: string; type: string; levels: Level[] }

const STATIC = 'https://static.rollercoin.com';
const ACHIEVEMENTS = rawAchievements as Achievement[];
// Icons are copied to public/achievements/{id}.png; Rollercoin's static host is only the fallback.
const localIcon = (img: string) => `${import.meta.env.BASE_URL}achievements/${img.split('/').pop()?.split('?')[0]}`;
const CATEGORIES = ['all', ...new Set(ACHIEVEMENTS.map(a => a.cat))];
const REWARD_FILTERS = ['all', 'RST', 'RLT', 'miner', 'battery'] as const;
const CATEGORY_ICONS: Record<string, string> = {
  hamsters: '🐹', quests: '📜', crypto_exchange: '💱', games: '🎮', taskwall: '📋', miners: '⛏️', crafting: '🛠️', currency: '💰',
};

const total = (a: Achievement, currency: string) =>
  a.levels.reduce((sum, l) => sum + (l.r.t === 'money' && l.r.c === currency ? l.r.a ?? 0 : 0), 0);
const bestMinerPower = (a: Achievement) => Math.max(0, ...a.levels.map(l => (l.r.t === 'miner' ? l.r.p ?? 0 : 0)));
// count_repeats is raw (RLT ×1e6, power in Gh/s), so read the goal as the game writes it in the description.
const goalText = (l: Level) => l.d.match(/\d[\d.,]*(?:\s*(?:RLT|[KMGTPE]h\/s))?/)?.[0] ?? l.n.toLocaleString();
const rewardKey =(r: Reward) => (r.t === 'money' ? r.c ?? '' : r.t);
// Miner power from the API is in Gh/s; autoScalePower works in H/s.
const formatPower = (ghs: number) => {
  const p = autoScalePower(ghs * 1e9);
  return `${p.value.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${p.unit}/s`;
};

const SORTS: Record<string, (a: Achievement, b: Achievement) => number> = {
  order: () => 0,
  name: (a, b) => a.levels[a.levels.length - 1].d.localeCompare(b.levels[b.levels.length - 1].d),
  rst: (a, b) => total(b, 'RST') - total(a, 'RST'),
  rlt: (a, b) => total(b, 'RLT') - total(a, 'RLT'),
  miner: (a, b) => bestMinerPower(b) - bestMinerPower(a),
};

function RewardBadge({ reward }: { reward: Reward }) {
  const { t } = useTranslation();
  const { lang } = useParams<{ lang: string }>();
  if (reward.t === 'miner') {
    const body = (
      <>
        <span className="ach-miner-thumb">
          <CdnImage type="miner" itemId={reward.f ?? ''} fallbackUrl={`${STATIC}/static/img/market/miners/${reward.f?.replace(/['’]/g, '')}.gif?v=1`} alt="" loading="lazy" />
          {(reward.lv ?? 0) > 1 && <img className="ach-miner-level" src={`/miner-levels/level_${reward.lv}.webp`} alt={`Level ${reward.lv}`} />}
        </span>
        <span className="ach-miner-info">
          <strong>{reward.n}</strong>
          <span className="ach-miner-stats">
            {reward.p ? <span className="ach-miner-power">{formatPower(reward.p)}</span> : null}
            {reward.b ? <span className="ach-miner-bonus">+{(reward.b / 100).toLocaleString()}%</span> : null}
          </span>
        </span>
      </>
    );
    // Only merge miners have an all-levels page; the merge page resolves a miner name to its slug.
    return reward.mt === 'merge' ? (
      <Link className="ach-miner ach-miner-link" to={`/${lang}/merges/miner/${encodeURIComponent(reward.n ?? '')}`}
        target="_blank" rel="noopener noreferrer" title={t('achievements.viewMerge')}>
        {body}
        <span className="ach-miner-arrow" aria-hidden="true">↗</span>
      </Link>
    ) : <span className="ach-miner">{body}</span>;
  }
  if (reward.t === 'battery') {
    return <span className="ach-reward"><img src={batteryImg} alt="" />{reward.a}× {t('achievements.battery')}</span>;
  }
  return (
    <span className={`ach-reward ach-reward-${reward.c?.toLowerCase()}`}>
      <img src={reward.c === 'RLT' ? rltImg : rstImg} alt="" />
      {reward.a?.toLocaleString()} {reward.c}
    </span>
  );
}

export default function AchievementsPage() {
  const { t } = useTranslation();
  const { lang } = useParams<{ lang: string }>();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [rewardFilter, setRewardFilter] = useState<string>('all');
  const [sort, setSort] = useState('order');

  const filtered = useMemo(() => {
    const term = query.trim().toLocaleLowerCase();
    return ACHIEVEMENTS.filter(a =>
      (category === 'all' || a.cat === category) &&
      (rewardFilter === 'all' || a.levels.some(l => rewardKey(l.r) === rewardFilter)) &&
      (!term || a.levels.some(l => l.d.toLocaleLowerCase().includes(term) || l.r.n?.toLocaleLowerCase().includes(term)))
    ).sort(SORTS[sort]);
  }, [query, category, rewardFilter, sort]);

  const stats = useMemo(() => ({
    levels: ACHIEVEMENTS.reduce((s, a) => s + a.levels.length, 0),
    rst: ACHIEVEMENTS.reduce((s, a) => s + total(a, 'RST'), 0),
    rlt: ACHIEVEMENTS.reduce((s, a) => s + total(a, 'RLT'), 0),
    miners: ACHIEVEMENTS.reduce((s, a) => s + a.levels.filter(l => l.r.t === 'miner').length, 0),
  }), []);

  return (
    <section className="achievements-page">
      <title>{`${t('achievements.title')} | Rollercoin Calculator`}</title>
      <meta name="description" content={t('achievements.description')} />
      <link rel="canonical" href={`https://rollercoincalculator.app/${lang}/achievements`} />

      <header className="ach-heading">
        <span className="ach-eyebrow">ROLLERCOIN · ACHIEVEMENTS</span>
        <h2>{t('achievements.title')}</h2>
        <p>{t('achievements.description')}</p>
        <div className="ach-stats">
          <div><strong>{ACHIEVEMENTS.length}</strong><span>{t('achievements.statAchievements')}</span></div>
          <div><strong>{stats.levels}</strong><span>{t('achievements.statLevels')}</span></div>
          <div><strong><img src={rstImg} alt="" />{stats.rst.toLocaleString()}</strong><span>{t('achievements.statTotal', { currency: 'RST' })}</span></div>
          <div><strong><img src={rltImg} alt="" />{stats.rlt.toLocaleString()}</strong><span>{t('achievements.statTotal', { currency: 'RLT' })}</span></div>
          <div><strong>{stats.miners}</strong><span>{t('achievements.statMiners')}</span></div>
        </div>
      </header>

      <div className="ach-toolbar">
        <label className="ach-field ach-search">
          <span>{t('achievements.search')}</span>
          <input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder={t('achievements.searchPlaceholder')} />
        </label>
        <label className="ach-field">
          <span>{t('achievements.reward')}</span>
          <select value={rewardFilter} onChange={e => setRewardFilter(e.target.value)}>
            {REWARD_FILTERS.map(r => <option key={r} value={r}>{r === 'all' ? t('achievements.allRewards') : r === 'miner' ? t('achievements.miner') : r === 'battery' ? t('achievements.battery') : r}</option>)}
          </select>
        </label>
        <label className="ach-field">
          <span>{t('achievements.sort')}</span>
          <select value={sort} onChange={e => setSort(e.target.value)}>
            {Object.keys(SORTS).map(s => <option key={s} value={s}>{t(`achievements.sort_${s}`)}</option>)}
          </select>
        </label>
        <div className="ach-chips" role="group" aria-label={t('achievements.category')}>
          {CATEGORIES.map(c => (
            <button type="button" key={c} className={category === c ? 'active' : ''} aria-pressed={category === c} onClick={() => setCategory(c)}>
              {t(`achievements.cat_${c}`)}
              <span>{c === 'all' ? ACHIEVEMENTS.length : ACHIEVEMENTS.filter(a => a.cat === c).length}</span>
            </button>
          ))}
        </div>
      </div>

      <p className="ach-count">{filtered.length} {t('achievements.results')}</p>

      {CATEGORIES.slice(1).map(cat => {
        const items = filtered.filter(a => a.cat === cat);
        if (items.length === 0) return null;
        return (
          <section className="ach-group" key={cat}>
            <h3 className="ach-group-title">
              <span aria-hidden="true">{CATEGORY_ICONS[cat] ?? '🏆'}</span>
              {t(`achievements.cat_${cat}`)}
              <span className="ach-group-count">{items.length}</span>
            </h3>
            <div className="ach-grid">
              {items.map(a => {
                const last = a.levels[a.levels.length - 1];
                return (
                  <article className="ach-card" key={a.type}>
                    <div className="ach-card-head">
                      <img className="ach-icon" src={localIcon(last.img)} alt="" loading="lazy"
                        onError={e => { if (!e.currentTarget.src.startsWith(STATIC)) e.currentTarget.src = `${STATIC}${last.img}`; }} />
                      <h4>{last.d}</h4>
                    </div>
                    <ol className="ach-levels">
                      {a.levels.map(l => (
                        <li key={l.lv}>
                          <span className="ach-lv">{l.lv}</span>
                          <span className="ach-goal" title={l.d}>{goalText(l)}</span>
                          <RewardBadge reward={l.r} />
                        </li>
                      ))}
                    </ol>
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}
      {filtered.length === 0 && <p className="ach-empty">{t('achievements.empty')}</p>}
    </section>
  );
}
