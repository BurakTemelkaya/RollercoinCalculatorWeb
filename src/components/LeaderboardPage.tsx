import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getLeaderboard, LeaderboardItem } from '../services/userProfileApi';
import { autoScalePower, formatHashPower } from '../utils/powerParser';
import { getLeagueImage } from '../data/leagueImages';
import { getLeagueByPower } from '../utils/leagueHelper';
import { useAuth } from '../contexts/AuthContext';

export default function LeaderboardPage() {
  const { lang } = useParams<{ lang: string }>();
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState<LeaderboardItem[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    getLeaderboard().then(setItems).catch(() => setError(true));
  }, []);

  const lastSync = items?.reduce<string | null>((max, i) => (i.syncedDate && (!max || i.syncedDate > max) ? i.syncedDate : max), null);

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
        {lastSync && (
          <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
            {t('leaderboard.updated', 'Updated every 30 minutes. Last update:')} {new Date(lastSync).toLocaleString(lang)}
          </p>
        )}

        {error && <p role="alert">{t('leaderboard.loadError', 'Leaderboard could not be loaded.')}</p>}
        {!items && !error && <div style={{ textAlign: 'center', padding: 40 }}><span className="spinner" /></div>}
        {items && items.length === 0 && <p>{t('leaderboard.empty', 'No one has joined the leaderboard yet.')}</p>}

        {items && items.length > 0 && (
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
                {items.map((item, index) => (
                  <tr key={item.avatarId ?? item.rollercoinUserName} style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <td style={{ padding: 8 }}>{index + 1}</td>
                    <td style={{ padding: 8 }}>
                      <a href={`https://rollercoin.com/p/${encodeURIComponent(item.rollercoinUserName)}`} target="_blank" rel="noopener noreferrer nofollow">
                        {item.rollercoinUserName}
                      </a>
                    </td>
                    <td style={{ padding: 8 }}>
                      {(() => {
                        // Lig, uygulamanın geri kalanındaki gibi güçten hesaplanır
                        const league = getLeagueByPower(autoScalePower(item.power * 1e9));
                        return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><img src={getLeagueImage(league.id)} alt="" width={24} height={24} loading="lazy" />{league.name}</span>;
                      })()}
                    </td>
                    <td style={{ padding: 8, textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {formatHashPower(autoScalePower(item.power * 1e9))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>
    </div>
  );
}
