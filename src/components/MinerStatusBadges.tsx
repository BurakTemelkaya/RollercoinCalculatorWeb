import { useTranslation } from 'react-i18next';
import sellableIcon from '../assets/sellable.svg';
import setIcon from '../assets/items/set-rack.png';
import './MinerStatusBadges.css';

interface MinerStatusBadgesProps {
    isCanBeSoldOnMp?: boolean | null;
    isInSet?: boolean | null;
}

export default function MinerStatusBadges({ isCanBeSoldOnMp, isInSet }: MinerStatusBadgesProps) {
    const { t } = useTranslation();
    if (typeof isCanBeSoldOnMp !== 'boolean' && isInSet !== true) return null;

    const sellabilityLabel = t(isCanBeSoldOnMp ? 'simulator.sellableMiner' : 'simulator.notSellableMiner');
    const setLabel = t('simulator.setMiner');

    return (
        <span className="miner-status-badges">
            {typeof isCanBeSoldOnMp === 'boolean' && (
                <img src={sellableIcon} alt={sellabilityLabel} title={sellabilityLabel} draggable={false}
                    className={`miner-status-badge miner-status-badge--${isCanBeSoldOnMp ? 'sellable' : 'unsellable'}`} />
            )}
            {isInSet === true && (
                <img src={setIcon} alt={setLabel} title={setLabel} draggable={false}
                    className="miner-status-badge miner-status-badge--set" />
            )}
        </span>
    );
}
