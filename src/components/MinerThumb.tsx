import CdnImage from './CdnImage';
import './MinerThumb.css';

/** Small miner artwork with its level badge, for lists and tooltips. */
export default function MinerThumb({ filename, level = 0 }: { filename?: string; level?: number }) {
    return <span className="miner-thumb" aria-hidden="true">
        {filename && <CdnImage type="miner" itemId={filename} alt="" loading="lazy"
            fallbackUrl={`https://static.rollercoin.com/static/img/market/miners/${filename}.gif?v=1.2.1`} />}
        {level > 0 && <img className="miner-thumb-level" src={`/miner-levels/level_${level + 1}.webp`} alt="" />}
    </span>;
}
