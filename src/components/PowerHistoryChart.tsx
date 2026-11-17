import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Line } from 'react-chartjs-2';
import { CategoryScale, Chart as ChartJS, Legend, LinearScale, LineElement, PointElement, Tooltip } from 'chart.js';
import { getLeaderboardHistory, getMyLeaderboardHistory, HistoryRange, LeaderboardHistoryPoint } from '../services/userProfileApi';
import { autoScalePower, formatHashPower } from '../utils/powerParser';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

// Rollercoin powers are in GH/s
const formatPower = (gh: number) => formatHashPower(autoScalePower(gh * 1e9));

// Daily history starts in 2026; at most a year is loaded at once, earlier years are picked one by one
const FIRST_YEAR = 2026;
const RANGES: { key: string; range: HistoryRange }[] = [
  { key: '90', range: { days: 90 } },
  { key: '365', range: { days: 365 } },
  ...Array.from({ length: Math.max(0, new Date().getUTCFullYear() - FIRST_YEAR) }, (_, i) => {
    const year = new Date().getUTCFullYear() - 1 - i;
    return { key: String(year), range: { year } };
  }),
];

/**
 * Daily power (Rollercoin's end-of-day record and our average of 30-minute samples) and in-game rank of one account:
 * a listed account by avatar id, or the signed-in user's own account when a token is given.
 */
export default function PowerHistoryChart({ avatarId, token }: { avatarId?: string; token?: string }) {
  const { t, i18n } = useTranslation();
  const [selected, setSelected] = useState(RANGES[0]);
  const [result, setResult] = useState<{ key: string; points: LeaderboardHistoryPoint[] | null }>({ key: '', points: null });
  const key = `${avatarId ?? 'me'}|${selected.key}`;

  useEffect(() => {
    let cancelled = false;
    (token ? getMyLeaderboardHistory(token, selected.range) : getLeaderboardHistory(avatarId!, selected.range))
      .then(res => { if (!cancelled) setResult({ key, points: res }); })
      .catch(() => { if (!cancelled) setResult({ key, points: null }); });
    return () => { cancelled = true; };
  }, [avatarId, token, selected, key]);

  const rangeButtons = (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
      {RANGES.map(option => {
        const active = option.key === selected.key;
        return (
          <button key={option.key} type="button" onClick={() => setSelected(option)} aria-pressed={active}
            style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer', fontSize: '0.8rem',
              background: active ? 'rgba(59, 130, 246, 0.25)' : 'transparent', color: active ? '#93c5fd' : '#94a3b8' }}>
            {option.key === '90' ? t('leaderboard.range90', 'Last 90 days') : option.key === '365' ? t('leaderboard.range365', 'Last 365 days') : option.key}
          </button>
        );
      })}
    </div>
  );

  if (result.key !== key) return <>{rangeButtons}<div style={{ textAlign: 'center', padding: 24 }}><span className="spinner" /></div></>;
  const points = result.points;
  if (!points) return <>{rangeButtons}<p role="alert">{t('leaderboard.loadError', 'Leaderboard could not be loaded.')}</p></>;
  if (points.length === 0) return <>{rangeButtons}<p>{token ? t('leaderboard.myHistoryEmpty', 'Link your Rollercoin account in your settings; your history builds up here.') : t('leaderboard.historyEmpty', 'No history yet.')}</p></>;

  // Change over the shown range: first and last known power (end-of-day record, else our daily average)
  const known = points.map(p => p.power ?? p.averagePower).filter((v): v is number => v != null);
  const change = known.length > 1 ? known[known.length - 1] - known[0] : null;

  const labels = points.map(p => new Date(`${p.date}T00:00:00Z`).toLocaleDateString(i18n.language, { day: 'numeric', month: 'short', timeZone: 'UTC' }));
  return (
    <>
    {rangeButtons}
    {change != null && (
      <p style={{ margin: '0 0 8px', fontSize: '0.85rem', color: '#94a3b8' }}>
        {t('leaderboard.rangeChange', 'Change in this range')}:{' '}
        <span style={{ color: change > 0 ? '#22c55e' : change < 0 ? '#ef4444' : '#94a3b8' }}>
          {change > 0 ? '+' : change < 0 ? '−' : ''}{formatPower(Math.abs(change))}
        </span>
      </p>
    )}
    <div style={{ height: 280 }}>
      <Line
        data={{
          labels,
          datasets: [
            { label: t('leaderboard.endOfDayPower', 'End-of-day power'), data: points.map(p => p.power), borderColor: '#3b82f6', backgroundColor: '#3b82f6', yAxisID: 'power', spanGaps: true, pointRadius: 2 },
            { label: t('leaderboard.averagePower', 'Daily average power'), data: points.map(p => p.averagePower), borderColor: '#22c55e', backgroundColor: '#22c55e', yAxisID: 'power', spanGaps: true, pointRadius: 2, borderDash: [4, 4] },
            { label: t('leaderboard.gameRank', 'Game rank'), data: points.map(p => p.rank), borderColor: '#f59e0b', backgroundColor: '#f59e0b', yAxisID: 'rank', spanGaps: true, pointRadius: 2 },
          ],
        }}
        options={{
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: { labels: { color: '#cbd5e1' } },
            tooltip: {
              callbacks: {
                label: ctx => `${ctx.dataset.label}: ${ctx.parsed.y == null ? '—' : ctx.dataset.yAxisID === 'rank'
                  ? ctx.parsed.y.toLocaleString(i18n.language)
                  : formatPower(ctx.parsed.y)}`,
              },
            },
          },
          scales: {
            x: { ticks: { color: '#94a3b8', maxRotation: 0, autoSkip: true } },
            power: { position: 'left', ticks: { color: '#94a3b8', callback: value => formatPower(Number(value)) }, grid: { color: 'rgba(255,255,255,0.06)' } },
            // A better rank is a smaller number: draw it upwards like power
            rank: { position: 'right', reverse: true, ticks: { color: '#f59e0b', callback: value => Number(value).toLocaleString(i18n.language) }, grid: { display: false } },
          },
        }}
      />
    </div>
    </>
  );
}
