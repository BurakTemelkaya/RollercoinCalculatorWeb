import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CreatorDetail, VideoEventType, addCreatorVideo, deleteCreatorVideo, getVideoMeta, videoThumbnail, videoTitle } from '../../services/contentCreatorApi';
import { fetchProgressionEventList } from '../../services/progressionEventApi';
import { fetchPuzzleEventList } from '../../services/puzzleEventApi';
import { languageFlag } from './CreatorShared';

type EventOption = { id: string; name: string; createdDate: string };

const emptyVideo = { eventType: VideoEventType.Progression as number, eventId: '', url: '', titles: {} as Record<string, string> };

/** Yayıncı panelindeki etkinlik videoları: etkinlik arama, platformdan başlık getirme, dile göre başlıklar. */
export default function CreatorVideoManager({ creator, token, busy, run, reload }: {
    creator: CreatorDetail;
    token: string;
    busy: boolean;
    run: (action: () => Promise<void>, success: string) => Promise<void>;
    reload: () => Promise<void>;
}) {
    const { t, i18n } = useTranslation();
    const [events, setEvents] = useState<{ progression: EventOption[]; puzzle: EventOption[] }>({ progression: [], puzzle: [] });
    const [video, setVideo] = useState(emptyVideo);
    const [search, setSearch] = useState('');
    const [fetching, setFetching] = useState(false);
    const [fetchNote, setFetchNote] = useState<string | null>(null);

    // Başlık alanları yayıncının içerik dillerinde; ilki zorunlu
    const languages = creator.languages.length ? creator.languages : [i18n.language];

    useEffect(() => {
        const newestFirst = (list: EventOption[]) => [...list].sort((a, b) => b.createdDate.localeCompare(a.createdDate));
        Promise.all([fetchProgressionEventList(0, 50), fetchPuzzleEventList(0, 50)])
            .then(([progression, puzzle]) => setEvents({ progression: newestFirst(progression.items), puzzle: newestFirst(puzzle.items) }))
            .catch(() => undefined);
    }, []);

    const all = video.eventType === VideoEventType.Puzzle ? events.puzzle : events.progression;

    // Liste yüklenince ya da tür değişince en son etkinlik seçili gelir (liste en yeniden eskiye sıralı)
    const latestId = all[0]?.id ?? '';
    useEffect(() => {
        if (latestId) setVideo(v => (v.eventId ? v : { ...v, eventId: latestId }));
    }, [latestId]);
    const filtered = useMemo(() => {
        const q = search.trim().toLocaleLowerCase(i18n.language);
        return q ? all.filter(ev => ev.name.toLocaleLowerCase(i18n.language).includes(q)) : all;
    }, [all, search, i18n.language]);

    const eventName = (type: number, id: string) =>
        (type === VideoEventType.Puzzle ? events.puzzle : events.progression).find(e => e.id === id)?.name ?? id;
    const formatEventDate = (value: string) => new Date(value).toLocaleDateString(i18n.language, { month: 'short', year: 'numeric' });

    const fetchTitles = async () => {
        setFetching(true);
        setFetchNote(null);
        try {
            const meta = await getVideoMeta(token, video.url, languages);
            if (Object.keys(meta.titles).length === 0) {
                setFetchNote(t('creators.titleNotFound', 'Bu linkten başlık alınamadı; başlığı kendin yazabilirsin.'));
                return;
            }
            // Yalnızca boş alanları doldur; yayıncının yazdığını ezme
            setVideo(v => ({ ...v, titles: { ...meta.titles, ...Object.fromEntries(Object.entries(v.titles).filter(([, x]) => x.trim())) } }));
            const distinct = new Set(Object.values(meta.titles));
            setFetchNote(distinct.size === 1 && languages.length > 1
                ? t('creators.titleSameAll', 'Platform başlığın çevirisini vermedi; tüm dillere aynı başlık yazıldı, istersen düzenle.')
                : t('creators.titleFetched', 'Başlık platformdan alındı.'));
        } catch (err) {
            setFetchNote(err instanceof Error ? err.message : String(err));
        } finally {
            setFetching(false);
        }
    };

    const onSubmit = (e: FormEvent) => {
        e.preventDefault();
        run(async () => {
            await addCreatorVideo(token, video);
            setVideo(v => ({ ...emptyVideo, eventType: v.eventType, eventId: v.eventId }));
            setFetchNote(null);
            await reload();
        }, t('creators.videoAdded', 'Video eklendi.'));
    };

    const onDelete = (id: string) => {
        if (!window.confirm(t('creators.deleteVideoConfirm', 'Bu video silinsin mi?'))) return;
        run(async () => { await deleteCreatorVideo(token, id); await reload(); }, t('creators.videoDeleted', 'Video silindi.'));
    };

    return (
        <div className="creator-panel-block">
            <h2>{t('creators.eventVideos', 'Etkinlik videoları')}</h2>
            <p className="creator-hint" style={{ margin: '0 0 16px', fontSize: '0.9rem' }}>{t('creators.eventVideosHelp', 'Videoların (YouTube, TikTok, Twitch, X postları vb.) ilgili Progression veya Puzzle event sayfasında, profilin yayındayken gösterilir. Etkinlik başına en fazla 3 video.')}</p>

            <form className="creator-video-form" onSubmit={onSubmit}>
                <div className="creator-video-form-row">
                    <label className="creator-field">
                        {t('creators.eventType', 'Etkinlik türü')}
                        <select value={video.eventType} onChange={e => {
                            const type = Number(e.target.value);
                            const latest = (type === VideoEventType.Puzzle ? events.puzzle : events.progression)[0]?.id ?? '';
                            setVideo({ ...video, eventType: type, eventId: latest });
                            setSearch('');
                        }}>
                            <option value={VideoEventType.Progression}>Progression Event</option>
                            <option value={VideoEventType.Puzzle}>Puzzle Event</option>
                        </select>
                    </label>
                    <label className="creator-field">
                        {t('creators.searchEvent', 'Etkinlik ara')}
                        <input type="search" placeholder={t('creators.searchEventPlaceholder', 'Etkinlik adı...')} value={search} onChange={e => setSearch(e.target.value)} />
                    </label>
                    <label className="creator-field creator-field--grow">
                        {t('creators.event', 'Etkinlik')} *
                        <select required value={video.eventId} onChange={e => setVideo({ ...video, eventId: e.target.value })}>
                            <option value="">{filtered.length ? '—' : t('creators.noEventMatch', 'Eşleşen etkinlik yok')}</option>
                            {filtered.map(ev => <option key={ev.id} value={ev.id}>{ev.name} · {formatEventDate(ev.createdDate)}</option>)}
                        </select>
                    </label>
                </div>

                <div className="creator-video-form-row">
                    <label className="creator-field creator-field--grow">
                        {t('creators.videoUrl', 'Video / X post linki')} *
                        <input required type="url" placeholder="https://youtube.com/shorts/... · https://tiktok.com/... · https://twitch.tv/..." value={video.url}
                            onChange={e => setVideo({ ...video, url: e.target.value })} />
                    </label>
                    <button type="button" className="creator-btn creator-btn--ghost" disabled={fetching || !/^https?:\/\/\S+\.\S+/.test(video.url)} onClick={fetchTitles}>
                        {fetching ? t('creators.fetching', 'Getiriliyor...') : t('creators.fetchTitle', 'Başlığı getir')}
                    </button>
                </div>
                {fetchNote && <p className="creator-hint" style={{ margin: 0 }}>{fetchNote}</p>}

                <div className="creator-video-titles">
                    {languages.map((lang, i) => {
                        const flag = languageFlag(lang);
                        return (
                            <label className="creator-field" key={lang}>
                                <span className="creator-lang-label">
                                    {flag?.icon && <img src={flag.icon} alt="" width={18} height={13} />}
                                    {t('creators.titleIn', { defaultValue: 'Başlık ({{lang}})', lang: flag?.label ?? lang })}{i === 0 && ' *'}
                                </span>
                                <input required={i === 0} minLength={2} maxLength={100} value={video.titles[lang] ?? ''}
                                    onChange={e => setVideo({ ...video, titles: { ...video.titles, [lang]: e.target.value } })} />
                            </label>
                        );
                    })}
                </div>

                <div><button className="creator-btn" disabled={busy}>{t('creators.addVideo', 'Video ekle')}</button></div>
            </form>

            {creator.videos.length > 0 && (
                <ul className="creator-video-list">
                    {creator.videos.map(v => {
                        const thumb = videoThumbnail(v);
                        return (
                            <li key={v.id}>
                                <a href={v.url} target="_blank" rel="noopener noreferrer" className="creator-video-list-thumb">
                                    {thumb ? <img src={thumb} alt="" loading="lazy" /> : <span aria-hidden="true">▶</span>}
                                </a>
                                <div className="creator-video-list-body">
                                    <a href={v.url} target="_blank" rel="noopener noreferrer"><strong>{videoTitle(v, i18n.language)}</strong></a>
                                    <span className="creator-hint">
                                        {v.eventType === VideoEventType.Puzzle ? 'Puzzle' : 'Progression'} · {eventName(v.eventType, v.eventId)}
                                        {Object.keys(v.titles ?? {}).length > 1 && ` · ${Object.keys(v.titles).map(l => l.toUpperCase()).join(', ')}`}
                                    </span>
                                </div>
                                <button type="button" className="creator-btn creator-btn--danger" disabled={busy} onClick={() => onDelete(v.id)}>{t('creators.delete', 'Sil')}</button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
