import type { MarketOffer } from '../utils/marketDepth';

export default function MergeMarketTiers({ offers, quantity }: { offers?: MarketOffer[]; quantity: number }) {
    const tiers = (offers ?? [])
        .filter(({ price, quantity }) => Number.isSafeInteger(price) && price > 0 && Number.isSafeInteger(quantity) && quantity > 0)
        .sort((a, b) => a.price - b.price)
        .slice(0, 5);
    if (tiers.length === 0) return null;

    const stock = tiers.reduce((sum, tier) => sum + tier.quantity, 0);
    const remaining = Math.max(0, quantity - stock);
    const rows = tiers.map((tier, i) => {
        const before = tiers.slice(0, i).reduce((sum, t) => sum + t.quantity, 0);
        return { ...tier, taken: Math.max(0, Math.min(tier.quantity, quantity - before)) };
    });

    return <details open style={{ marginTop: 8, fontSize: '0.8rem' }}>
        <summary>Market alış kademeleri</summary>
        <table style={{ width: '100%', textAlign: 'left' }}>
            <thead><tr><th>Alınacak / stok</th><th>RLT / adet</th></tr></thead>
            <tbody>{rows.map(({ price, quantity, taken }, index) => (
                <tr key={index}><td>{taken} / {quantity}</td><td>{price / 1e6}</td></tr>
            ))}</tbody>
        </table>
        {remaining > 0 && <strong style={{ color: '#efbd50' }}>{remaining} adet eksik</strong>}
    </details>;
}
