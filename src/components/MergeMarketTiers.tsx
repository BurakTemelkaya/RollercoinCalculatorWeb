import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { MarketOffer } from '../utils/marketDepth';
import './MergeMarketTiers.css';

type Props = {
    offers?: MarketOffer[];
    quantity: number;
    /** Units on sale across the whole book; rows beyond the known tiers become an "or above" row */
    totalCount?: number;
    /** Collapsed header; defaults to "Market buy tiers" */
    summary?: ReactNode;
    open?: boolean;
};

export default function MergeMarketTiers({ offers, quantity, totalCount, summary, open }: Props) {
    const { t, i18n } = useTranslation();
    const tiers = (offers ?? [])
        .filter(({ price, quantity }) => Number.isSafeInteger(price) && price > 0 && Number.isSafeInteger(quantity) && quantity > 0)
        .sort((a, b) => a.price - b.price)
        .slice(0, 5);
    const label = summary ?? t('merge.marketTiers');
    if (tiers.length === 0) return summary ? <div className="mmt mmt-static">{summary}</div> : null;

    const num = (n: number) => n.toLocaleString(i18n.language);
    const known = tiers.reduce((sum, tier) => sum + tier.quantity, 0);
    const onSale = Math.max(known, totalCount ?? 0);
    const rest = onSale - known;
    const remaining = Math.max(0, quantity - known);
    let before = 0;
    const rows = tiers.map(tier => {
        const taken = Math.max(0, Math.min(tier.quantity, quantity - before));
        before += tier.quantity;
        return { ...tier, taken };
    });

    return <details className="mmt" open={open}>
        <summary className="mmt-summary">{label}</summary>
        <div className="mmt-book">
            <div className="mmt-head">{t('merge.itemsOnSale')}: <strong>{num(onSale)}</strong></div>
            <table className="mmt-table">
                <thead><tr><th>{t('merge.price')}</th><th>{t('merge.quantity')}</th></tr></thead>
                <tbody>
                    {rows.map(({ price, quantity: stock, taken }) => (
                        <tr key={price} className={taken > 0 ? 'mmt-hit' : undefined}>
                            <td>{price / 1e6} RLT</td>
                            <td>{taken > 0 ? <><span className="mmt-taken">{num(taken)}</span> / {num(stock)}</> : num(stock)}</td>
                        </tr>
                    ))}
                    {rest > 0 && (
                        <tr className={remaining > 0 ? 'mmt-hit' : undefined}>
                            <td>{t('merge.priceOrAbove', { price: tiers[tiers.length - 1].price / 1e6 })}</td>
                            <td>{remaining > 0 ? <><span className="mmt-taken">{num(Math.min(remaining, rest))}</span> / {num(rest)}</> : num(rest)}</td>
                        </tr>
                    )}
                </tbody>
            </table>
            {remaining > rest && <div className="mmt-missing">{t('merge.missingUnits', { count: remaining - rest })}</div>}
        </div>
    </details>;
}
