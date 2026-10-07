import { useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { PriceChange24h } from '../services/priceApi';

interface CoinMarketPriceProps {
    currency: string;
    price: number;
    change?: PriceChange24h;
}

export default function CoinMarketPrice({ currency, price, change }: CoinMarketPriceProps) {
    const { t } = useTranslation();
    const tooltipId = useId();
    const [anchor, setAnchor] = useState<DOMRect | null>(null);
    const validChange = change && Number.isFinite(change.previousPrice) && change.previousPrice > 0 &&
        Number.isFinite(change.changePercent) ? change : undefined;
    const direction = validChange ? Math.sign(validChange.changePercent) : 0;
    const formatPrice = (value: number, detailed = false) => value.toLocaleString('en-US', {
        style: 'currency', currency: 'USD', minimumFractionDigits: 2,
        maximumFractionDigits: detailed ? 8 : value < 1 ? 6 : 2,
    });
    const changeText = validChange?.changePercent.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: Math.abs(validChange.changePercent) < 0.01 ? 6 : 2,
        signDisplay: 'exceptZero',
    });
    const lines = [
        t('table.priceCurrent', { price: formatPrice(price, true) }),
        ...(validChange ? [
            t('table.pricePrevious24h', { price: formatPrice(validChange.previousPrice, true) }),
            t('table.priceChange24h', { change: `${changeText}%` }),
        ] : [t(currency === 'USDT' ? 'table.priceFixed' : 'table.priceChangeUnavailable')]),
    ];

    useEffect(() => {
        if (!anchor) return;
        const hide = () => setAnchor(null);
        document.addEventListener('scroll', hide, true);
        window.addEventListener('resize', hide);
        return () => {
            document.removeEventListener('scroll', hide, true);
            window.removeEventListener('resize', hide);
        };
    }, [anchor]);

    const above = anchor && anchor.bottom + 100 > window.innerHeight;
    const tooltipWidth = Math.min(300, window.innerWidth - 24);
    return <>
        <span
            className={`coin-market-price${direction > 0 ? ' price-up' : direction < 0 ? ' price-down' : ''}`}
            tabIndex={0}
            aria-label={`${currency}: ${lines.join('. ')}`}
            aria-describedby={anchor ? tooltipId : undefined}
            onMouseEnter={event => setAnchor(event.currentTarget.getBoundingClientRect())}
            onMouseLeave={() => setAnchor(null)}
            onFocus={event => setAnchor(event.currentTarget.getBoundingClientRect())}
            onBlur={() => setAnchor(null)}
            onKeyDown={event => { if (event.key === 'Escape') setAnchor(null); }}
        >
            {formatPrice(price)}
        </span>
        {anchor && createPortal(
            <div
                id={tooltipId}
                role="tooltip"
                className="coin-price-tooltip"
                style={{
                    width: tooltipWidth,
                    left: Math.max(12, Math.min(anchor.left, window.innerWidth - tooltipWidth - 12)),
                    top: above ? anchor.top - 8 : anchor.bottom + 8,
                    transform: above ? 'translateY(-100%)' : undefined,
                }}
            >
                {lines.map((line, index) => <div key={index}>{line}</div>)}
            </div>, document.body
        )}
    </>;
}
