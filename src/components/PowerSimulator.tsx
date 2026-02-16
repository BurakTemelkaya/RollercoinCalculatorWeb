import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { HashPower, PowerUnit } from '../types';
import { LeagueInfo, LEAGUES } from '../data/leagues';
import { getLeagueImage } from '../data/leagueImages';
import { getLeagueByPower } from '../utils/leagueHelper';
import { RollercoinUserResponse } from '../types/user';
import { toBaseUnit, formatHashPower, autoScalePower } from '../utils/powerParser';
import './PowerSimulator.css';

interface PowerSimulatorProps {
    currentLeague: LeagueInfo;
    apiLeagues: LeagueInfo[] | null;
    fetchedUser?: RollercoinUserResponse | null;
    onFetchUser?: (username: string) => Promise<void>;
    isFetchingUser?: boolean;
}

interface AddedMiner {
    id: number;
    name?: string;
    power: string;
    unit: PowerUnit;
    bonus: string;
}

const PowerSimulator: React.FC<PowerSimulatorProps> = ({
    currentLeague,
    apiLeagues,
    fetchedUser,
    onFetchUser,
    isFetchingUser = false
}) => {
    const { t } = useTranslation();

    // User API State
    const [userName, setUserName] = useState('');
    const [fetchMode, setFetchMode] = useState<'username' | 'power'>('username');

    // Current Stats Inputs
    const [statMinersPower, setStatMinersPower] = useState<string>('');
    const [statMinersUnit, setStatMinersUnit] = useState<PowerUnit>('Eh');
    const [statBonus, setStatBonus] = useState<string>('');
    const [statRackPower, setStatRackPower] = useState<string>('');
    const [statRackUnit, setStatRackUnit] = useState<PowerUnit>('Ph');
    const [statGamesPower, setStatGamesPower] = useState<string>('');
    const [statGamesUnit, setStatGamesUnit] = useState<PowerUnit>('Ph');
    const [statTempPower, setStatTempPower] = useState<string>('');
    const [statTempUnit, setStatTempUnit] = useState<PowerUnit>('Ph');

    // New Miner Input
    const [newMinerPower, setNewMinerPower] = useState<string>('');
    const [newMinerUnit, setNewMinerUnit] = useState<PowerUnit>('Ph');
    const [newMinerBonus, setNewMinerBonus] = useState<string>('');

    // List of added miners
    const [addedMiners, setAddedMiners] = useState<AddedMiner[]>([]);

    // Results
    const [simulationResult, setSimulationResult] = useState<{
        newTotalPower: HashPower;
        addedPower: HashPower;
        newLeague: LeagueInfo;
        currentLeague: LeagueInfo;
        isLeagueChange: boolean;
        powerIncrease: HashPower;
        currentTotalPower: HashPower;
    } | null>(null);

    // Sync from fetchedUser prop
    useEffect(() => {
        if (fetchedUser) {
            const minersRawGh = fetchedUser.userPowerResponseDto.miners || 0;
            const gamesRawGh = fetchedUser.userPowerResponseDto.games || 0;

            const baseForBonusGh = minersRawGh + gamesRawGh; // Fix: Base for Bonus includes Miners + Games.
            const bonusPowerRawGh = fetchedUser.userPowerResponseDto.bonus || 0;

            let calculatedBonus = 0;
            if (baseForBonusGh > 0) {
                calculatedBonus = (bonusPowerRawGh / baseForBonusGh) * 100;
            }
            setStatBonus(calculatedBonus.toFixed(2));

            // User requested that inputs be treated as Raw Miner Power.
            // So we populate the input with the Base (Raw) value if fetching.
            const minersHashes = minersRawGh * 1e9;
            const minersScaled = autoScalePower(minersHashes);
            setStatMinersPower(minersScaled.value.toFixed(3));
            setStatMinersUnit(minersScaled.unit);

            // Populate Rack Power (Flat) if available or separate
            // NOTE: fetchedUser.userPowerResponseDto.racks is Base Rack Power usually?
            // User screenshot shows "Rack Bonus" flat power.
            // Let's assume the API 'racks' field corresponds to flat Rack Power for now, 
            // or if it was included in base miners, we might need to separate it.
            // For now, let's just populate it if it exists distinct from miners.
            if (fetchedUser.userPowerResponseDto.racks) {
                const racksHashes = fetchedUser.userPowerResponseDto.racks * 1e9;
                const racksScaled = autoScalePower(racksHashes);
                setStatRackPower(racksScaled.value.toFixed(3));
                setStatRackUnit(racksScaled.unit);
            }

            // gamesRawGh already declared above
            const tempRawGh = fetchedUser.userPowerResponseDto.temp || 0;

            const gamesHashes = gamesRawGh * 1e9;
            const gamesScaled = autoScalePower(gamesHashes);
            setStatGamesPower(gamesScaled.value.toFixed(3));
            setStatGamesUnit(gamesScaled.unit);

            const tempHashes = tempRawGh * 1e9;
            const tempScaled = autoScalePower(tempHashes);
            setStatTempPower(tempScaled.value.toFixed(3));
            setStatTempUnit(tempScaled.unit);
        }
    }, [fetchedUser]);

    const handleFetchClick = async () => {
        if (!userName.trim() || !onFetchUser) return;
        await onFetchUser(userName.trim());
    };

    const handleAddMiner = () => {
        if (!newMinerPower) return;
        setAddedMiners([...addedMiners, {
            id: Date.now(),
            power: newMinerPower,
            unit: newMinerUnit,
            bonus: newMinerBonus || '0'
        }]);
        setNewMinerPower('');
        setNewMinerBonus('');
    };

    const handleRemoveMiner = (id: number) => {
        setAddedMiners(addedMiners.filter(m => m.id !== id));
    };

    // Calculate Simulation
    useEffect(() => {
        const currentMinerVal = parseFloat(statMinersPower) || 0;
        const currentMinerBaseH = toBaseUnit({ value: currentMinerVal, unit: statMinersUnit });
        const currentBonusVal = parseFloat(statBonus) || 0;

        const rackVal = parseFloat(statRackPower) || 0;
        const rackH = toBaseUnit({ value: rackVal, unit: statRackUnit });

        const gamesVal = parseFloat(statGamesPower) || 0;
        const gamesH = toBaseUnit({ value: gamesVal, unit: statGamesUnit });

        const tempVal = parseFloat(statTempPower) || 0;
        const tempH = toBaseUnit({ value: tempVal, unit: statTempUnit });

        // Calculate Current Total based on Inputs (Forward Calculation)
        // Total = ((MinerBase + RackBase) * (1 + Bonus%)) + Games + Temp
        // Analysis shows Rack Power (45Ph) needs to be boosted by Bonus (923%) to match Profile Total (14.7Eh vs 14.3Eh).

        // Note: User snippet previously had games inside bonus and racks outside. 
        // But the data shows Racks need boost. We will boost Racks. 
        // We will keep Games/Temp flat for now as they are small/temporary. (Or putting games inside if user insists, but Racks is the key fix).

        let currentTotalMinersPowerH = (currentMinerBaseH + rackH) * (1 + currentBonusVal / 100);
        let currentTotalPowerH = currentTotalMinersPowerH + gamesH + tempH;

        let addedMinersBaseH = 0;
        let addedMinersBonusVal = 0;

        addedMiners.forEach(m => {
            const val = parseFloat(m.power) || 0;
            addedMinersBaseH += toBaseUnit({ value: val, unit: m.unit });
            addedMinersBonusVal += parseFloat(m.bonus) || 0;
        });

        const previewMinerVal = parseFloat(newMinerPower) || 0;
        const previewMinerH = toBaseUnit({ value: previewMinerVal, unit: newMinerUnit });
        const previewBonusVal = parseFloat(newMinerBonus) || 0;

        const totalAddedBaseH = addedMinersBaseH + previewMinerH;
        const totalAddedBonusVal = addedMinersBonusVal + previewBonusVal;

        // Calculate New State
        const newBaseMinersH = currentMinerBaseH + rackH + totalAddedBaseH; // Racks included in base
        const newTotalBonusPercent = currentBonusVal + totalAddedBonusVal;

        // New Projected Total
        let newTotalMinersPowerH = newBaseMinersH * (1 + (newTotalBonusPercent / 100));

        // Add flat flat sources back
        let newTotalPowerH = newTotalMinersPowerH + gamesH + tempH;

        const newTotalPower = autoScalePower(newTotalPowerH);
        const powerDiff = newTotalPowerH - currentTotalPowerH;
        const powerIncrease = autoScalePower(powerDiff);

        // League Calculation usually considers TOTAL power
        let powerForLeagueCheck = newTotalPowerH;

        // Current League Check
        let currentPowerForLeague = currentTotalPowerH;

        const calculatedCurrentLeague = getLeagueByPower(autoScalePower(currentPowerForLeague), apiLeagues || LEAGUES);
        const newLeague = getLeagueByPower(autoScalePower(powerForLeagueCheck), apiLeagues || LEAGUES);
        const isLeagueChange = newLeague.id !== calculatedCurrentLeague.id;

        if (totalAddedBaseH > 0 || totalAddedBonusVal > 0) {
            setSimulationResult({
                newTotalPower,
                addedPower: powerIncrease,
                newLeague,
                currentLeague: calculatedCurrentLeague,
                isLeagueChange,
                powerIncrease,
                currentTotalPower: autoScalePower(currentTotalPowerH)
            });
        } else {
            setSimulationResult(null);
        }
    }, [statMinersPower, statMinersUnit, statBonus, statRackPower, statRackUnit, statGamesPower, statGamesUnit, statTempPower, statTempUnit, addedMiners, newMinerPower, newMinerUnit, newMinerBonus, currentLeague]);

    const units: PowerUnit[] = ['Gh', 'Th', 'Ph', 'Eh', 'Zh'];

    return (
        <div className="power-simulator">
            <div className="simulator-header">
                <h3 className="section-title">
                    <span className="section-icon">⚡</span>
                    {t('simulator.title')}
                </h3>
                <p className="section-desc">{t('simulator.desc')}</p>
            </div>

            <div className="simulator-content">
                <div className="user-fetcher-row">
                    <div className="input-group compact" style={{ flex: 1 }}>
                        <div className="fetch-mode-selector">
                            <button
                                className={`mode-tab ${fetchMode === 'username' ? 'active' : ''}`}
                                onClick={() => setFetchMode('username')}
                            >
                                {t('simulator.byUsername')}
                            </button>
                            <button
                                className={`mode-tab ${fetchMode === 'power' ? 'active' : ''}`}
                                onClick={() => setFetchMode('power')}
                            >
                                {t('simulator.byPower')}
                            </button>
                        </div>
                        <div className="fetch-input-wrapper">
                            {fetchMode === 'username' ? (
                                <input
                                    type="text"
                                    value={userName}
                                    onChange={(e) => setUserName(e.target.value)}
                                    placeholder={t('simulator.enterUsername')}
                                    className="power-value-input"
                                />
                            ) : (
                                <div className="flex-grow-input mode-info-container">
                                    <span className="mode-info-icon">⚡</span>
                                    <span className="mode-info-text">{t('simulator.usingCurrentStats')}</span>
                                </div>
                            )}
                            <button
                                className="fetch-btn"
                                onClick={handleFetchClick}
                                disabled={isFetchingUser || (fetchMode === 'username' && !userName.trim())}
                            >
                                {isFetchingUser ? <span className="spinner small"></span> : t('simulator.fetch')}
                            </button>
                        </div>
                    </div>
                    {fetchedUser && (
                        <div className="user-profile-summary">
                            <div className="user-avatar">
                                {fetchedUser.userProfileResponseDto.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="user-info">
                                <span className="user-name">{fetchedUser.userProfileResponseDto.name}</span>
                                <span className="user-power-total">
                                    {formatHashPower(autoScalePower(fetchedUser.userPowerResponseDto.current_Power * 1e9))}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="simulator-grid">
                    {(fetchMode === 'power' || fetchedUser) && (
                        <div className="sim-column">
                            <h4>{fetchedUser ? t('simulator.currentStats') + ' (Verified)' : t('simulator.currentStats')}</h4>

                            <div className="responsive-input-row">
                                <div className="input-group compact" style={{ flex: 2 }}>
                                    <label>{t('simulator.minersPower')}</label>
                                    <div className="power-input-row">
                                        <input
                                            type="number"
                                            value={statMinersPower}
                                            onChange={e => setStatMinersPower(e.target.value)}
                                            placeholder="0"
                                            className="power-value-input small"
                                        />
                                        <select
                                            value={statMinersUnit}
                                            onChange={e => setStatMinersUnit(e.target.value as PowerUnit)}
                                            className="power-unit-select small"
                                        >
                                            {units.map(u => <option key={u} value={u}>{u}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="input-group compact" style={{ flex: 1 }}>
                                    <label>{t('simulator.totalBonus')} (%)</label>
                                    <input
                                        type="number"
                                        value={statBonus}
                                        onChange={e => setStatBonus(e.target.value)}
                                        placeholder="0"
                                        className="power-value-input"
                                    />
                                </div>

                                <div className="input-group compact" style={{ flex: 1.5 }}>
                                    <label>{t('simulator.rackPower')}</label>
                                    <div className="power-input-row">
                                        <input
                                            type="number"
                                            value={statRackPower}
                                            onChange={e => setStatRackPower(e.target.value)}
                                            placeholder="0"
                                            className="power-value-input small"
                                        />
                                        <select
                                            value={statRackUnit}
                                            onChange={e => setStatRackUnit(e.target.value as PowerUnit)}
                                            className="power-unit-select small"
                                        >
                                            {units.map(u => <option key={u} value={u}>{u}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '10px' }}>
                                <div className="input-group compact" style={{ flex: 1 }}>
                                    <label>{t('simulator.gamesPower')}</label>
                                    <div className="power-input-row">
                                        <input
                                            type="number"
                                            value={statGamesPower}
                                            onChange={e => setStatGamesPower(e.target.value)}
                                            placeholder="0"
                                            className="power-value-input small"
                                        />
                                        <select
                                            value={statGamesUnit}
                                            onChange={e => setStatGamesUnit(e.target.value as PowerUnit)}
                                            className="power-unit-select small"
                                        >
                                            {units.map(u => <option key={u} value={u}>{u}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="input-group compact" style={{ flex: 1 }}>
                                    <label>{t('simulator.tempPower')}</label>
                                    <div className="power-input-row">
                                        <input
                                            type="number"
                                            value={statTempPower}
                                            onChange={e => setStatTempPower(e.target.value)}
                                            placeholder="0"
                                            className="power-value-input small"
                                        />
                                        <select
                                            value={statTempUnit}
                                            onChange={e => setStatTempUnit(e.target.value as PowerUnit)}
                                            className="power-unit-select small"
                                        >
                                            {units.map(u => <option key={u} value={u}>{u}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="sim-column highlight">
                    <h4>{t('simulator.addMiner')}</h4>

                    <div className="responsive-input-row" style={{ alignItems: 'flex-end' }}>
                        <div className="input-group compact" style={{ flex: 2 }}>
                            <label>{t('simulator.minerPower')}</label>
                            <div className="power-input-row">
                                <input
                                    type="number"
                                    value={newMinerPower}
                                    onChange={e => setNewMinerPower(e.target.value)}
                                    placeholder="0"
                                    className="power-value-input small"
                                />
                                <select
                                    value={newMinerUnit}
                                    onChange={e => setNewMinerUnit(e.target.value as PowerUnit)}
                                    className="power-unit-select small"
                                >
                                    {units.map(u => <option key={u} value={u}>{u}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="input-group compact" style={{ flex: 1 }}>
                            <label>{t('simulator.minerBonus')} (%)</label>
                            <input
                                type="number"
                                value={newMinerBonus}
                                onChange={e => setNewMinerBonus(e.target.value)}
                                placeholder="0"
                                className="power-value-input"
                            />
                        </div>

                        <button
                            className="btn-primary"
                            onClick={handleAddMiner}
                            disabled={!newMinerPower}
                            style={{ height: '42px', flex: '0 0 100px' }}
                        >
                            {t('simulator.add')}
                        </button>
                    </div>

                    {addedMiners.length > 0 && (
                        <div className="added-miners-list">
                            <h5>{t('simulator.addedMinersList')}</h5>
                            {addedMiners.map(miner => (
                                <div key={miner.id} className="added-miner-item">
                                    <span>
                                        {miner.power} {miner.unit}
                                        {parseFloat(miner.bonus) > 0 && ` (+${miner.bonus}%)`}
                                    </span>
                                    <button
                                        className="remove-btn"
                                        onClick={() => handleRemoveMiner(miner.id)}
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {simulationResult && (
                    <div className="simulation-results">
                        <div className="results-inner">
                            <div className="result-row">
                                <div className="result-item">
                                    <span className="label">{t('simulator.currentPower')}</span>
                                    <span className="value secondary">{formatHashPower(simulationResult.currentTotalPower)}</span>
                                </div>
                                <div className="transition-arrow">➜</div>
                                <div className="result-item">
                                    <span className="label">{t('simulator.newTotal')}</span>
                                    <span className="value primary">{formatHashPower(simulationResult.newTotalPower)}</span>
                                    <span className="sub-value success">+{formatHashPower(simulationResult.powerIncrease)}</span>
                                </div>
                            </div>

                            {simulationResult.isLeagueChange ? (
                                <div className="league-transition">
                                    <div className="league-card">
                                        <img src={getLeagueImage(simulationResult.currentLeague.id)} alt="" />
                                        <span>{simulationResult.currentLeague.name}</span>
                                    </div>
                                    <div className="transition-arrow">➜</div>
                                    <div className="league-card new">
                                        <div className="new-badge">NEW!</div>
                                        <div className="move-up-text">{t('simulator.moveUp')}</div>
                                        <img src={getLeagueImage(simulationResult.newLeague.id)} alt="" />
                                        <span>{simulationResult.newLeague.name}</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="league-transition static">
                                    <div className="league-card">
                                        <img src={getLeagueImage(simulationResult.currentLeague.id)} alt="" />
                                        <span>{simulationResult.currentLeague.name}</span>
                                    </div>
                                    <span className="no-change-text">{t('simulator.noChange')}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PowerSimulator;

