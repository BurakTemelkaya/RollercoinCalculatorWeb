import { useTranslation } from 'react-i18next';
import { CSSProperties } from 'react';
import { UserPowerResponseDto } from '../types/user';
import { autoScalePower, formatHashPower } from '../utils/powerParser';
import './AccountPowerBreakdown.css';

/** Snapshot of the fetched account, independent of room edits and added miners. */
export default function AccountPowerBreakdown({ power }: { power: UserPowerResponseDto }) {
    const { t, i18n } = useTranslation();
    const hasValue = (value: number | null | undefined): value is number =>
        typeof value === 'number' && Number.isFinite(value) && value > 0;
    const formatPower = (value: number | null | undefined) =>
        typeof value === 'number' && Number.isFinite(value)
            ? formatHashPower(autoScalePower(value * 1e9)) : t('accountPower.unavailable');
    const formatPercent = (value: number | null | undefined) =>
        typeof value === 'number' && Number.isFinite(value)
            ? `${new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 2 }).format(value / 100)}%`
            : t('accountPower.unavailable');
    const sources = [
        { key: 'miners', value: power.miners },
        { key: 'racks', value: power.racks },
        { key: 'bonus', value: power.bonus, percent: power.bonus_percent },
        { key: 'games', value: power.games },
        { key: 'temp', value: power.temp },
        { key: 'freon', value: power.freon },
        { key: 'hamster', value: power.hamster_expedition_bonus_power, percent: power.hamster_expedition_bonus_percent },
    ].filter(source => hasValue(source.value));
    const totals = [
        { key: 'current_Power', label: 'total', value: power.current_Power },
        { key: 'max_Power', label: 'league', value: power.max_Power },
    ].filter(total => hasValue(total.value));

    if (!totals.length && !sources.length) return null;

    return (
        <section className="account-power-breakdown">
            <h3>{t('accountPower.title')}</h3>
            <p className="account-power-description">{t('accountPower.description')}</p>
            {totals.length > 0 && <dl className="account-power-totals">
                {totals.map(total => (
                    <div key={total.key} data-power-source={total.key}>
                        <dt>{t(`accountPower.${total.label}`)}</dt>
                        <dd>{formatPower(total.value)}</dd>
                    </div>
                ))}
            </dl>}
            {sources.length > 0 && <dl className="account-power-sources" style={{ '--power-source-count': sources.length } as CSSProperties}>
                {sources.map(source => (
                    <div key={source.key} data-power-source={source.key}>
                        <dt>{t(`accountPower.${source.key}`)}</dt>
                        <dd>{formatPower(source.value)}</dd>
                        {hasValue(source.percent) && (
                            <dd className="account-power-percent">{t('accountPower.bonusRate', { percent: formatPercent(source.percent) })}</dd>
                        )}
                    </div>
                ))}
            </dl>}
        </section>
    );
}
