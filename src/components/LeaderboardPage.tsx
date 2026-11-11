import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getLeaderboard, LeaderboardResponse } from '../services/userProfileApi';
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

export default function LeaderboardPage() {
  const { lang } = useParams<{ lang: string }>();
  const { t, i18n } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [page, setPage] = useState(0);
  const [country, setCountry] = useState(ALL);
  const [leagueId, setLeagueId] = useState(ALL);
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getLeaderboard({
      pageIndex: page,
      pageSize: PAGE_SIZE,
      country: country === ALL ? undefined : country,
      leagueId: leagueId === ALL ? undefined : leagueId,
    })
      .then(res => { if (!cancelled) { setData(res); setError(false); } })
      .catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, [page, country, leagueId]);

  const changeFilter = (setter: (v: string) => void) => (value: string) => {
    setter(value);
    setPage(0);
  };

  const items = data?.items ?? [];
  const lastSync = items.reduce<string | null>((max, i) => (i.syncedDate && (!max || i.syncedDate > max) ? i.syncedDate : max), null);
  const leagueOptions = [
    { value: ALL, label: t('leaderboard.allLeagues', 'All leagues') },
    ...LEAGUES.map(l => ({ value: l.id, label: l.name, icon: getLeagueImage(l.id) })),
  ];
  const countryFilterOptions = [
    { value: ALL, label: t('leaderboard.allCountries', 'All countries') },
    ...countryOptions(i18n.language, data?.countries ?? []),
  ];

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
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => {
                  // Rollercoin's own league assignment, stored by the backend (not derived from power)
                  const league = LEAGUES.find(l => l.id === item.leagueId);
                  return (
                    <tr key={item.avatarId ?? item.rollercoinUserName} style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                      <td style={{ padding: 8 }}>{data!.index * data!.size + index + 1}</td>
                      <td style={{ padding: 8 }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                          {item.country && (
                            <img src={countryFlag(item.country)} alt={countryName(item.country, i18n.language)} title={countryName(item.country, i18n.language)} width={20} height={15} loading="lazy" />
                          )}
                          <a href={`https://rollercoin.com/p/${encodeURIComponent(item.rollercoinUserName)}`} target="_blank" rel="noopener noreferrer nofollow">
                            {item.rollercoinUserName}
                          </a>
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
                      <td style={{ padding: 8, textAlign: 'right', whiteSpace: 'nowrap' }}>
                        {formatHashPower(autoScalePower(item.power * 1e9))}
                      </td>
                    </tr>
                  );
                })}
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
