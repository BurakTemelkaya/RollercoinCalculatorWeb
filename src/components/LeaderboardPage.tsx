import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  getLeaderboard,
  getLeaderboardFilters,
  getMyLeaderboardPosition,
  LeaderboardFilters,
  LeaderboardItem,
  LeaderboardPosition,
  LeaderboardResponse,
} from '../services/userProfileApi';
import { autoScalePower, formatHashPower } from '../utils/powerParser';
import { getLeagueImage } from '../data/leagueImages';
import { LEAGUES } from '../data/leagues';
import { countryFlag, countryName, countryOptions } from '../data/countries';
import { useAuth } from '../contexts/AuthContext';
import RadixSelect from './RadixSelect';
import Pagination from './Pagination';

const PAGE_SIZE = 50;
// Radix Select does not allow an empty item value
const ALL = 'all';

const toFilter = (country: string, leagueId: string) => ({
  country: country === ALL ? undefined : country,
  leagueId: leagueId === ALL ? undefined : leagueId,
});

// Rollercoin powers are in GH/s
const formatPower = (gh: number) => formatHashPower(autoScalePower(gh * 1e9));

// undefined too: an API that predates the field omits it
function PowerChange({ value }: { value?: number | null }) {
  if (value == null) return <span style={{ color: '#64748b' }}>—</span>;
  const color = value > 0 ? '#22c55e' : value < 0 ? '#ef4444' : '#94a3b8';
  return <span style={{ color }}>{value > 0 ? '+' : value < 0 ? '−' : ''}{formatPower(Math.abs(value))}</span>;
}

function LeaderboardRow({ item, position, isMine }: { item: LeaderboardItem; position: number; isMine?: boolean }) {
  const { t, i18n } = useTranslation();
  // Rollercoin's own league assignment, stored by the backend (not derived from power)
  const league = LEAGUES.find(l => l.id === item.leagueId);
  return (
    <tr style={isMine
      ? { background: 'rgba(59, 130, 246, 0.15)', outline: '1px solid rgba(59, 130, 246, 0.5)' }
      : { borderTop: '1px solid rgba(255,255,255,0.08)' }}>
      <td style={{ padding: 8 }}>{position.toLocaleString(i18n.language)}</td>
      <td style={{ padding: 8 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          {item.country && (
            <img src={countryFlag(item.country)} alt={countryName(item.country, i18n.language)} title={countryName(item.country, i18n.language)} width={20} height={15} loading="lazy" />
          )}
          <a href={`https://rollercoin.com/p/${encodeURIComponent(item.rollercoinUserName)}`} target="_blank" rel="noopener noreferrer nofollow">
            {item.rollercoinUserName}
          </a>
          {isMine && (
            <span style={{ fontSize: '0.7rem', padding: '1px 6px', borderRadius: 999, background: '#3b82f6', color: '#fff' }}>
              {t('leaderboard.you', 'You')}
            </span>
          )}
        </span>
      </td>
      <td style={{ padding: 8 }}>
        {item.leagueId && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <img src={getLeagueImage(item.leagueId)} alt="" width={24} height={24} loading="lazy" />
            {league?.name ?? '—'}
          </span>
        )}
      </td>
      <td style={{ padding: 8, textAlign: 'right', whiteSpace: 'nowrap' }}>{formatPower(item.power)}</td>
      <td style={{ padding: 8, textAlign: 'right', whiteSpace: 'nowrap' }}><PowerChange value={item.powerChange} /></td>
      <td style={{ padding: 8, textAlign: 'right' }}>{item.gameRank?.toLocaleString(i18n.language) ?? '—'}</td>
    </tr>
  );
}

export default function LeaderboardPage() {
  const { lang } = useParams<{ lang: string }>();
  const { t, i18n } = useTranslation();
  const { isAuthenticated, accessToken } = useAuth();
  const [page, setPage] = useState(0);
  const [country, setCountry] = useState(ALL);
  const [leagueId, setLeagueId] = useState(ALL);
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [error, setError] = useState(false);
  const [filters, setFilters] = useState<LeaderboardFilters | null>(null);
  const [mine, setMine] = useState<LeaderboardPosition | null>(null);

  useEffect(() => {
    // Without counts the selects fall back to all leagues and no countries
    getLeaderboardFilters().then(setFilters).catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    getLeaderboard({ ...toFilter(country, leagueId), pageIndex: page, pageSize: PAGE_SIZE })
      .then(res => { if (!cancelled) { setData(res); setError(false); } })
      .catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, [page, country, leagueId]);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    getMyLeaderboardPosition(accessToken, toFilter(country, leagueId))
      .then(res => { if (!cancelled) setMine(res); })
      .catch(() => { if (!cancelled) setMine(null); });
    return () => { cancelled = true; };
  }, [accessToken, country, leagueId]);

  const changeFilter = (setter: (v: string) => void) => (value: string) => {
    setter(value);
    setPage(0);
  };

  const items = data?.items ?? [];
  const lastSync = items.reduce<string | null>((max, i) => (i.syncedDate && (!max || i.syncedDate > max) ? i.syncedDate : max), null);
  const leagueCounts = new Map(filters?.leagues.map(l => [l.value, l.count]));
  const countryCounts = new Map(filters?.countries.map(c => [c.value, c.count]));
  const leagueOptions = [
    { value: ALL, label: t('leaderboard.allLeagues', 'All leagues') },
    ...(filters ? LEAGUES.filter(l => leagueCounts.has(l.id)) : LEAGUES).map(l => ({
      value: l.id,
      label: leagueCounts.has(l.id) ? `${l.name} (${leagueCounts.get(l.id)})` : l.name,
      icon: getLeagueImage(l.id),
    })),
  ];
  const countryFilterOptions = [
    { value: ALL, label: t('leaderboard.allCountries', 'All countries') },
    ...countryOptions(i18n.language, [...countryCounts.keys()]).map(o => ({ ...o, label: `${o.label} (${countryCounts.get(o.value)})` })),
  ];
  const myRow = isAuthenticated && mine?.position && mine.item ? { item: mine.item, position: mine.position } : null;

  return (
    <div className="static-page-container">
      <title>{`${t('leaderboard.title', 'Leaderboard')} | ${t('app.title')}`}</title>
      <meta name="description" content={t('leaderboard.description', 'Rollercoin power ranking of RollercoinCalculator members.')} />
      <link rel="canonical" href={`https://rollercoincalculator.app/${lang}/leaderboard`} />

      <div className="static-back-link">
        <Link to={`/${lang}`}>← {t('event.backToCalc')}</Link>
      </div>

      <article className="static-content">
        <h1>{t('leaderboard.title', 'Leaderboard')}</h1>
        <p>
          {t('leaderboard.description', 'Rollercoin power ranking of RollercoinCalculator members.')}{' '}
          {isAuthenticated
            ? <Link to={`/${lang}/notification-settings`}>{t('leaderboard.joinSettings', 'Join from your settings.')}</Link>
            : <Link to={`/${lang}/register`}>{t('leaderboard.joinRegister', 'Sign up to join.')}</Link>}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, margin: '16px 0' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.8rem', color: '#94a3b8' }}>
            {t('leaderboard.filterCountry', 'Filter by country')}
            <RadixSelect value={country} onValueChange={changeFilter(setCountry)} options={countryFilterOptions} ariaLabel={t('leaderboard.filterCountry', 'Filter by country')} searchPlaceholder={t('profile.countrySearch', 'Search country')} fullWidth />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.8rem', color: '#94a3b8' }}>
            {t('leaderboard.filterLeague', 'Filter by league')}
            <RadixSelect value={leagueId} onValueChange={changeFilter(setLeagueId)} options={leagueOptions} ariaLabel={t('leaderboard.filterLeague', 'Filter by league')} fullWidth />
          </label>
        </div>

        {lastSync && (
          <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
            {t('leaderboard.updated', 'Updated every 30 minutes. Last update:')} {new Date(lastSync).toLocaleString(lang)}
          </p>
        )}

        {error && <p role="alert">{t('leaderboard.loadError', 'Leaderboard could not be loaded.')}</p>}
        {!data && !error && <div style={{ textAlign: 'center', padding: 40 }}><span className="spinner" /></div>}
        {data && items.length === 0 && (
          <p>
            {country !== ALL || leagueId !== ALL
              ? t('leaderboard.noResults', 'No accounts match these filters.')
              : t('leaderboard.empty', 'No one has joined the leaderboard yet.')}
          </p>
        )}

        {items.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', color: '#94a3b8' }}>
                  <th style={{ padding: 8 }}>#</th>
                  <th style={{ padding: 8 }}>{t('leaderboard.user', 'User')}</th>
                  <th style={{ padding: 8 }}>{t('leaderboard.league', 'League')}</th>
                  <th style={{ padding: 8, textAlign: 'right' }}>{t('leaderboard.power', 'Power')}</th>
                  <th style={{ padding: 8, textAlign: 'right', whiteSpace: 'nowrap' }} title={t('leaderboard.change24hHint', "Difference between Rollercoin's last two daily power records")}>
                    {t('leaderboard.change24h', '24h change')}
                  </th>
                  <th style={{ padding: 8, textAlign: 'right', whiteSpace: 'nowrap' }} title={t('leaderboard.gameRankHint', 'Overall rank in Rollercoin, not the position on this leaderboard')}>
                    {t('leaderboard.gameRank', 'Game rank')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* The signed-in user's own position, pinned above the list */}
                {myRow && <LeaderboardRow item={myRow.item} position={myRow.position} isMine />}
                {items.map((item, index) => (
                  <LeaderboardRow key={item.avatarId ?? item.rollercoinUserName} item={item} position={data!.index * data!.size + index + 1} />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {data && (
          <Pagination
            currentPage={data.index}
            totalPages={data.pages}
            hasPrevious={data.hasPrevious}
            hasNext={data.hasNext}
            onPageChange={setPage}
          />
        )}
      </article>
    </div>
  );
}
