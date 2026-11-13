import { useEffect, useRef, useState, type SyntheticEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { fetchPuzzleEvent, type PuzzleEventData, type PuzzleReward } from '../services/puzzleEventApi';
import { getNotificationPreferences } from '../services/notificationApi';
import { useAuth } from '../contexts/AuthContext';
import { getCdnBaseUrl } from '../config/api';
import type { ProgressionReward, RewardType } from '../types/progressionEvent';
import { RewardTile } from './ProgressionEvent';
import './PuzzleEvent.css';

/** Task types Rollercoin uses; each gets its own group. Anything new falls into "other". */
const TASK_ICONS: Record<string, string> = {
    buy_rlt: '🛒',
    games: '🎮',
    open_particular_lootbox: '🎁',
};

/** Tasks split by type, groups in the order their first task appears. */
function groupTasks(tasks: PuzzleEventData['tasks']) {
    const groups = new Map<string, PuzzleEventData['tasks']>();
    for (const task of tasks) {
        const key = task.type && task.type in TASK_ICONS ? task.type : 'other';
        groups.set(key, [...(groups.get(key) ?? []), task]);
    }
    return [...groups];
}

/** URL of our own copy of an event image, or null when the backend did not give a path. */
const ownImage = (path?: string | null) => (path ? `${getCdnBaseUrl()}/${path}` : null);

/** `onError` handler: when our copy is missing, show Rollercoin's original instead. */
const fallbackTo = (url?: string | null) => (e: SyntheticEvent<HTMLImageElement>) => {
    if (url && e.currentTarget.src !== url) e.currentTarget.src = url;
};

/** Adapts a puzzle reward to the progression reward shape so both events share one image/label resolver. */
function toProgressionReward(r: PuzzleReward): ProgressionReward {
    const text = { en: r.name ?? '', cn: r.name ?? '' };
    return {
        id: '',
        item_id: r.itemId,
        amount: r.amount,
        currency: r.currency ?? '',
        ttl_time: r.ttlTime,
        required_level: 0,
        type: r.type as RewardType,
        title: text,
        description: text,
        range_count: { min: 0, max: 0 },
        item_media_url: r.mediaUrl,
        cdn_image_path: r.imagePath,
        item: r.type === 'miner' && r.fileName ? {
            _id: r.itemId ?? '',
            power: r.power ?? 0,
            width: 2,
            name: text,
            description: text,
            created_by_title: { link: '', text: '' },
            level: r.minerLevel ?? 0,
            type: 'basic',
            filename: r.fileName,
            image_version: r.imageVersion ?? undefined,
            frames_data: { frame_width: 0, frame_height: 0 },
            is_can_be_sold_on_mp: null,
            bonus: r.bonus ?? 0,
            is_in_set: null,
        } : undefined,
    };
}

function useCountdown(endDate: string | null, t: (key: string) => string): string | null {
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 60_000);
        return () => clearInterval(timer);
    }, []);
    if (!endDate) return null;
    const minutes = Math.floor((new Date(endDate).getTime() - now) / 60_000);
    if (minutes <= 0) return t('event.ended');
    return `${Math.floor(minutes / 1440)}${t('event.daysShort')} : ${Math.floor(minutes / 60) % 24}${t('event.hoursShort')} : ${minutes % 60}${t('event.minutesShort')}`;
}

export default function PuzzleEvent() {
    const { lang, puzzleSlug } = useParams<{ lang: string; puzzleSlug?: string }>();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [data, setData] = useState<PuzzleEventData | null>(null);
    const [error, setError] = useState(false);
    const [attempt, setAttempt] = useState(0);
    // Slug we just redirected to; skips refetching data we already have
    const redirectedSlugRef = useRef<string | null>(null);
    const countdown = useCountdown(data?.endDate ?? null, t);
    const { isAuthenticated, getValidToken } = useAuth();
    const [notifyEnabled, setNotifyEnabled] = useState(false);

    // The "get notified" link is pointless for someone who already turned the puzzle notification on
    useEffect(() => {
        if (!isAuthenticated) return;
        let active = true;
        getValidToken()
            .then(token => (token ? getNotificationPreferences(token) : []))
            .then(preferences => {
                if (active) setNotifyEnabled(preferences.some(p => p.notificationType === 'Puzzle' && (p.isEmailEnabled || p.isWebPushEnabled)));
            })
            .catch(() => { /* keep showing the link */ });
        return () => { active = false; };
    }, [isAuthenticated, getValidToken]);

    useEffect(() => {
        if (puzzleSlug && redirectedSlugRef.current === puzzleSlug) return;
        let active = true;
        fetchPuzzleEvent(puzzleSlug)
            .then(result => {
                if (!active) return;
                setData(result);
                setError(false);
                // `/puzzle` shows the latest event; move to its permanent `/puzzle/{slug}` address
                const segment = result.slug || result.id;
                if (!puzzleSlug && segment) {
                    redirectedSlugRef.current = segment;
                    navigate(`/${lang}/puzzle/${segment}`, { replace: true });
                }
            })
            .catch(err => {
                console.error('Failed to fetch puzzle event:', err);
                if (!active) return;
                setData(null); // do not keep showing the previous event under an error
                setError(true);
            });
        return () => { active = false; };
    }, [attempt, puzzleSlug, lang, navigate]);

    const pageTitle = `${data?.name ? `${data.name} - ` : ''}${t('puzzle.title')} | RollerCoin Calculator`;
    const pageSegment = data?.slug || data?.id || puzzleSlug;
    const pageUrl = `https://rollercoincalculator.app/${lang}/puzzle${pageSegment ? `/${pageSegment}` : ''}`;
    const head = (
        <>
            <title>{pageTitle}</title>
            <meta name="description" content={t('puzzle.metaDesc')} />
            <link rel="canonical" href={pageUrl} />
            <meta property="og:type" content="website" />
            <meta property="og:title" content={pageTitle} />
            <meta property="og:description" content={t('puzzle.metaDesc')} />
            <meta property="og:url" content={pageUrl} />
            <meta property="og:image" content={ownImage(data?.headerImgPath) ?? data?.headerImg ?? 'https://rollercoincalculator.app/icon.png'} />
        </>
    );

    if (error) {
        return (
            <div className="pz-container pz-state">
                {head}
                <p>{t('event.fetchError')}</p>
                <button className="pz-retry" onClick={() => { setError(false); setAttempt(a => a + 1); }}>{t('event.retry')}</button>
            </div>
        );
    }
    if (!data) return <div className="pz-container pz-state">{head}<span className="spinner" /></div>;
    if (!data.id) return <div className="pz-container pz-state">{head}<p>{t('puzzle.noEvent')}</p></div>;

    const pieceIcon = data.rewardIcon && (
        <img className="pz-piece" src={ownImage(data.rewardIconPath) ?? data.rewardIcon} alt="" onError={fallbackTo(data.rewardIcon)} />
    );

    return (
        <div className="pz-container">
            {head}

            <header className="pz-header">
                {data.headerImg && (
                    <img className="pz-header-img" src={ownImage(data.headerImgPath) ?? data.headerImg} alt="" onError={fallbackTo(data.headerImg)} />
                )}
                <div className="pz-header-body">
                    {countdown && <span className="pz-countdown">⏱ {countdown}</span>}
                    <h1>{data.name}</h1>
                    <p>{t('puzzle.intro')}</p>
                    <Link className="pz-notify" to={`/${lang}/events?type=puzzle`}>📋 {t('event.eventHistory')}</Link>
                    {!(isAuthenticated && notifyEnabled) && (
                        <Link className="pz-notify" to={`/${lang}/notification-settings`}>🔔 {t('puzzle.notify')}</Link>
                    )}
                </div>
            </header>

            {data.levels.length > 0 && (
                <section className="pz-card">
                    <h2>{t('puzzle.levelRewards')}</h2>
                    <div className="pz-levels">
                        {data.levels.map(level => (
                            <div className="pz-level" key={level.level}>
                                <span className="pz-level-xp">{pieceIcon} {level.requiredXp}</span>
                                {level.rewards.map((reward, i) => <RewardTile key={i} reward={toProgressionReward(reward)} lang={lang} />)}
                            </div>
                        ))}
                    </div>
                </section>
            )}

            <div className="pz-columns">
                {data.tasks.length > 0 && (
                    <section className="pz-card">
                        <h2>{t('puzzle.tasks')} <span className="pz-count">{data.tasks.length}</span></h2>
                        {groupTasks(data.tasks).map(([type, tasks]) => (
                            <div className="pz-task-group" key={type}>
                                <h3>
                                    <span aria-hidden="true">{TASK_ICONS[type] ?? '✅'}</span>
                                    {t(`puzzle.taskGroups.${type}`)}
                                    <span className="pz-count">{tasks.length}</span>
                                </h3>
                                <ul className="pz-tasks">
                                    {tasks.map((task, i) => (
                                        <li key={i}>
                                            <span className="pz-task-title">{task.title}</span>
                                            {task.spins > 0 && <span className="pz-task-spins">+{task.spins} {pieceIcon || '🧩'}</span>}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </section>
                )}

                <section className="pz-card">
                    <h2>{t('puzzle.board')} <span className="pz-count">{data.board.length}</span></h2>
                    <div
                        className="pz-board"
                        style={{
                            gridTemplateColumns: `repeat(${data.cols}, minmax(0, 1fr))`,
                            // A CSS background has no onError: our copy is layered over the original, so whichever loads is shown
                            backgroundImage: data.backgroundImg
                                ? [
                                    'linear-gradient(rgba(10, 14, 23, 0.55), rgba(10, 14, 23, 0.55))',
                                    ...[ownImage(data.backgroundImgPath), data.backgroundImg].filter(Boolean).map(url => `url(${url})`),
                                ].join(', ')
                                : undefined,
                        }}
                    >
                        {data.board.map((reward, i) => (
                            <div key={i} style={{ gridColumn: `span ${Math.min(reward.cells, data.cols)}` }}>
                                <RewardTile reward={toProgressionReward(reward)} lang={lang} className={reward.cells > 1 ? 'pz-big' : ''} />
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}
