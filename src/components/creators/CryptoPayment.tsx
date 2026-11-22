import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export interface CoinNetwork { coin: string; network?: string | null }

/** En çok kullanılan coin/ağ çiftleri; listede yoksa "Diğer" ile elle girilir. */
export const COIN_PRESETS: CoinNetwork[] = [
    { coin: 'USDT', network: 'TRC20' }, { coin: 'USDT', network: 'BEP20' }, { coin: 'USDT', network: 'ERC20' },
    { coin: 'USDT', network: 'Polygon' }, { coin: 'USDT', network: 'Solana' }, { coin: 'USDT', network: 'TON' },
    { coin: 'USDC', network: 'ERC20' }, { coin: 'USDC', network: 'BEP20' }, { coin: 'USDC', network: 'Polygon' },
    { coin: 'USDC', network: 'Solana' }, { coin: 'USDC', network: 'Base' },
    { coin: 'BTC', network: 'Bitcoin' }, { coin: 'ETH', network: 'Ethereum' }, { coin: 'ETH', network: 'Arbitrum' },
    { coin: 'ETH', network: 'Base' }, { coin: 'BNB', network: 'BEP20' }, { coin: 'SOL', network: 'Solana' },
    { coin: 'TRX', network: 'TRC20' }, { coin: 'TON', network: 'TON' }, { coin: 'LTC', network: 'Litecoin' },
    { coin: 'DOGE', network: 'Dogecoin' }, { coin: 'POL', network: 'Polygon' }, { coin: 'XRP', network: 'XRP Ledger' },
];

const EXPLORERS: [RegExp, string][] = [
    [/trc20|tron|^trx$/, 'https://tronscan.org/#/transaction/'],
    [/bep20|bsc|binance smart|^bnb$/, 'https://bscscan.com/tx/'],
    [/arbitrum/, 'https://arbiscan.io/tx/'],
    [/optimism/, 'https://optimistic.etherscan.io/tx/'],
    [/^base$/, 'https://basescan.org/tx/'],
    [/polygon|matic|^pol$/, 'https://polygonscan.com/tx/'],
    [/erc20|ethereum|^eth$/, 'https://etherscan.io/tx/'],
    [/solana|^sol$|spl/, 'https://solscan.io/tx/'],
    [/^ton$/, 'https://tonviewer.com/transaction/'],
    [/bitcoin cash|^bch$/, 'https://blockchair.com/bitcoin-cash/transaction/'],
    [/bitcoin|^btc$/, 'https://mempool.space/tx/'],
    [/litecoin|^ltc$/, 'https://blockchair.com/litecoin/transaction/'],
    [/dogecoin|^doge$/, 'https://blockchair.com/dogecoin/transaction/'],
    [/xrp|ripple/, 'https://xrpscan.com/tx/'],
];

/** İşlemin blok gezgini adresi: önce ağa, yoksa coin'e bakılır; tanınmazsa Blockchair araması. */
export function txExplorerUrl(coin: string, network: string | null | undefined, txHash: string): string {
    const tx = encodeURIComponent(txHash.trim());
    for (const key of [network, coin]) {
        const value = key?.trim().toLowerCase();
        if (!value) continue;
        const match = EXPLORERS.find(([pattern]) => pattern.test(value));
        if (match) return match[1] + tx;
    }
    return `https://blockchair.com/search?q=${tx}`;
}

export function TxLink({ coin, network, txHash }: { coin: string; network?: string | null; txHash: string }) {
    return (
        <a href={txExplorerUrl(coin, network, txHash)} target="_blank" rel="noopener noreferrer" className="creator-tx" title={txHash}>
            <code>{txHash.length > 20 ? `${txHash.slice(0, 10)}…${txHash.slice(-8)}` : txHash}</code> ↗
        </a>
    );
}

const label = (o: CoinNetwork) => (o.network ? `${o.coin} (${o.network})` : o.coin);
const same = (a: CoinNetwork, b: CoinNetwork) =>
    a.coin.toLowerCase() === b.coin.toLowerCase() && (a.network ?? '').toLowerCase() === (b.network ?? '').toLowerCase();

/** Hazır listeden seçim; "Diğer" seçilince coin ve ağ elle yazılır. */
export function CoinNetworkSelect({ value, onChange, options = COIN_PRESETS, required }: {
    value: CoinNetwork;
    onChange: (value: CoinNetwork) => void;
    options?: (CoinNetwork & { hint?: string })[];
    required?: boolean;
}) {
    const { t } = useTranslation();
    const index = options.findIndex(o => same(o, value));
    // Listede olmayan kayıtlı değer ya da kullanıcı "Diğer"i seçti
    const [other, setOther] = useState(index < 0 && value.coin !== '');
    const isOther = other || (index < 0 && value.coin !== '');
    const selectValue = isOther ? 'other' : index >= 0 ? String(index) : '';

    return (
        <>
            <label className="creator-field">
                {t('creators.coinNetwork', 'Coin / ağ')}{required && ' *'}
                <select required={required} value={selectValue} onChange={e => {
                    const v = e.target.value;
                    setOther(v === 'other');
                    onChange(v === 'other' || v === '' ? { coin: '', network: '' } : { coin: options[Number(v)].coin, network: options[Number(v)].network ?? '' });
                }}>
                    <option value="">—</option>
                    {options.map((o, i) => <option key={i} value={i}>{label(o)}{o.hint ? ` — ${o.hint}` : ''}</option>)}
                    <option value="other">{t('creators.otherCoin', 'Diğer (elle gir)')}</option>
                </select>
            </label>
            {isOther && (
                <>
                    <label className="creator-field">{t('creators.coin', 'Coin')}{required && ' *'}
                        <input required={required} maxLength={20} placeholder="USDT" value={value.coin} onChange={e => onChange({ ...value, coin: e.target.value })} />
                    </label>
                    <label className="creator-field">{t('creators.network', 'Ağ')}
                        <input maxLength={30} placeholder="TRC20" value={value.network ?? ''} onChange={e => onChange({ ...value, network: e.target.value })} />
                    </label>
                </>
            )}
        </>
    );
}
