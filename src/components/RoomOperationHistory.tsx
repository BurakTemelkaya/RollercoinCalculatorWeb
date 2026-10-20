import { useTranslation } from 'react-i18next';
import type { RoomOperation } from '../utils/roomOperations';
import { autoScalePower, formatHashPower } from '../utils/powerParser';
import './RoomOperationHistory.css';

export default function RoomOperationHistory({ entries, storageError, placedMinerIds, onLocate }: {
    entries: RoomOperation[]; storageError: boolean; placedMinerIds: ReadonlySet<string>; onLocate: (minerId: string) => void;
}) {
    const { t, i18n } = useTranslation();
    const power = (value: number | null) => value === null ? '—' : formatHashPower(autoScalePower(value * 1e9));
    return <section className="room-operation-history" aria-label={t('roomHistory.title')}>
        {storageError && <p role="alert">{t('roomHistory.storageError')}</p>}
        <details>
            <summary>{t('roomHistory.title')} <span className="room-operation-count">{entries.length}</span></summary>
            <p>{t('roomHistory.scope')}</p>
            {entries.length === 0 ? <p>{t('roomHistory.empty')}</p> : <ol>
                {entries.map(entry => <li key={entry.id} data-operation-kind={entry.kind} data-operation-id={entry.id}>
                    <details>
                        <summary>
                            <strong>{entry.kind === 'change' && entry.changes.length === 1
                                ? `${t(`roomHistory.${entry.changes[0].kind}`)} · ${t(`roomHistory.${entry.changes[0].entity}`)} ×${entry.changes[0].count}`
                                : t(`roomHistory.${entry.kind}`)}</strong>
                            <time dateTime={new Date(entry.at).toISOString()}>{new Date(entry.at).toLocaleString(i18n.resolvedLanguage, { dateStyle: 'short', timeStyle: 'medium' })}</time>
                            <span className="room-operation-power">{power(entry.beforePowerGh)} → {power(entry.afterPowerGh)}</span>
                        </summary>
                        {entry.changes.length === 0 ? <p>{t('roomHistory.noChange')}</p> : <ul>
                            {entry.changes.map(change => <li key={`${change.entity}:${change.kind}`}>
                                <strong>{t(`roomHistory.${change.kind}`)} · {t(`roomHistory.${change.entity}`)} ×{change.count}</strong>
                                {change.miners ? <span className="room-operation-miners">{change.miners.map(miner =>
                                    <button key={miner.id} type="button" data-history-miner-id={miner.id}
                                        disabled={!placedMinerIds.has(miner.id)} onClick={() => onLocate(miner.id)}
                                        title={t(placedMinerIds.has(miner.id) ? 'roomHistory.locateMiner' : 'roomHistory.minerUnavailable')}>
                                        {miner.name}{!placedMinerIds.has(miner.id) && <small> · {t('roomHistory.minerUnavailable')}</small>}
                                    </button>)}</span>
                                    : <span>{change.names.join(', ')}{change.otherNames > 0 && ` · ${t('roomHistory.otherNames', { count: change.otherNames })}`}</span>}
                            </li>)}
                        </ul>}
                    </details>
                </li>)}
            </ol>}
        </details>
    </section>;
}
