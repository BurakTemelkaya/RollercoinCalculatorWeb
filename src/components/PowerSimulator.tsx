import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { HashPower, PowerUnit } from '../types';
import { LeagueInfo, LEAGUES } from '../data/leagues';
import { getLeagueImage } from '../data/leagueImages';
import { getLeagueByPower } from '../utils/leagueHelper';
import { RollercoinUserResponse } from '../types/user';
import { toBaseUnit, formatHashPower, autoScalePower } from '../utils/powerParser';
import { useApiCooldown } from '../hooks/useApiCooldown';
import './PowerSimulator.css';

interface PowerSimulatorProps {
    currentLeague: LeagueInfo;
    apiLeagues: LeagueInfo[] | null;
    fetchedUser?: RollercoinUserResponse | null;
    onFetchUser?: (username: string) => Promise<void>;
    isFetchingUser?: boolean;
    globalUserName?: string;
    setGlobalUserName?: (val: string) => void;
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
    isFetchingUser = false,
    globalUserName = '',
    setGlobalUserName = () => { }
}) => {
    const { t } = useTranslation();

    // User API State
    const [fetchMode, setFetchMode] = useState<'username' | 'power'>('username');
    const [localUserName, setLocalUserName] = useState(globalUserName);
    useEffect(() => {
        setLocalUserName(globalUserName);
    }, [globalUserName]);

    // Local Storage Helpers
    const getStoredStr = (key: string, def: string) => localStorage.getItem(`rollercoin_sim_${key}`) || def;
    const getStoredUnit = (key: string, def: PowerUnit) => (localStorage.getItem(`rollercoin_sim_${key}`) as PowerUnit) || def;

    // Current Stats Inputs
    const [statMinersPower, setStatMinersPower] = useState<string>(() => getStoredStr('miners', ''));
    const [statMinersUnit, setStatMinersUnit] = useState<PowerUnit>(() => getStoredUnit('minersUnit', 'Eh'));
    const [statBonus, setStatBonus] = useState<string>(() => getStoredStr('bonus', ''));
    const [statRackPower, setStatRackPower] = useState<string>(() => getStoredStr('rack', ''));
    const [statRackUnit, setStatRackUnit] = useState<PowerUnit>(() => getStoredUnit('rackUnit', 'Ph'));
    const [statGamesPower, setStatGamesPower] = useState<string>(() => getStoredStr('games', ''));
    const [statGamesUnit, setStatGamesUnit] = useState<PowerUnit>(() => getStoredUnit('gamesUnit', 'Ph'));
    const [statTempPower, setStatTempPower] = useState<string>(() => getStoredStr('temp', ''));
    const [statTempUnit, setStatTempUnit] = useState<PowerUnit>(() => getStoredUnit('tempUnit', 'Ph'));
    const [statFreonPower, setStatFreonPower] = useState<string>(() => getStoredStr('freon', ''));
    const [statFreonUnit, setStatFreonUnit] = useState<PowerUnit>(() => getStoredUnit('freonUnit', 'Ph'));

    // New Miner Input
    const [newMinerPower, setNewMinerPower] = useState<string>(() => getStoredStr('newMiner', ''));
    const [newMinerUnit, setNewMinerUnit] = useState<PowerUnit>(() => getStoredUnit('newMinerUnit', 'Ph'));
    const [newMinerBonus, setNewMinerBonus] = useState<string>(() => getStoredStr('newBonus', ''));

    // List of added miners
    const [addedMiners, setAddedMiners] = useState<AddedMiner[]>(() => {
        const saved = localStorage.getItem('rollercoin_sim_addedMiners');
        return saved ? JSON.parse(saved) : [];
    });

    // Save outputs to local storage
    useEffect(() => { localStorage.setItem('rollercoin_sim_miners', statMinersPower); }, [statMinersPower]);
    useEffect(() => { localStorage.setItem('rollercoin_sim_minersUnit', statMinersUnit); }, [statMinersUnit]);
    useEffect(() => { localStorage.setItem('rollercoin_sim_bonus', statBonus); }, [statBonus]);
    useEffect(() => { localStorage.setItem('rollercoin_sim_rack', statRackPower); }, [statRackPower]);
    useEffect(() => { localStorage.setItem('rollercoin_sim_rackUnit', statRackUnit); }, [statRackUnit]);
    useEffect(() => { localStorage.setItem('rollercoin_sim_games', statGamesPower); }, [statGamesPower]);
    useEffect(() => { localStorage.setItem('rollercoin_sim_gamesUnit', statGamesUnit); }, [statGamesUnit]);
    useEffect(() => { localStorage.setItem('rollercoin_sim_temp', statTempPower); }, [statTempPower]);
    useEffect(() => { localStorage.setItem('rollercoin_sim_tempUnit', statTempUnit); }, [statTempUnit]);
    useEffect(() => { localStorage.setItem('rollercoin_sim_freon', statFreonPower); }, [statFreonPower]);
    useEffect(() => { localStorage.setItem('rollercoin_sim_freonUnit', statFreonUnit); }, [statFreonUnit]);
    useEffect(() => { localStorage.setItem('rollercoin_sim_newMiner', newMinerPower); }, [newMinerPower]);
    useEffect(() => { localStorage.setItem('rollercoin_sim_newMinerUnit', newMinerUnit); }, [newMinerUnit]);
    useEffect(() => { localStorage.setItem('rollercoin_sim_newBonus', newMinerBonus); }, [newMinerBonus]);
    useEffect(() => { localStorage.setItem('rollercoin_sim_addedMiners', JSON.stringify(addedMiners)); }, [addedMiners]);

    // Results
    const [simulationResult, setSimulationResult] = useState<{
        newTotalPower: HashPower;
        addedPower: HashPower;
        newLeague: LeagueInfo;
        currentLeague: LeagueInfo;
        isLeagueChange: boolean;
        powerIncrease: HashPower;
        currentTotalPower: HashPower;
        currentLeaguePower: HashPower;
        newLeaguePower: HashPower;
    } | null>(null);

    // Sync from fetchedUser prop
    useEffect(() => {
        if (fetchedUser) {
            const minersRawGh = fetchedUser.userPowerResponseDto.miners || 0;
            const gamesRawGh = fetchedUser.userPowerResponseDto.games || 0;

            const baseForBonusGh = minersRawGh + gamesRawGh; // Fix: Base for Bonus includes Miners + Games.

            const freonRawGhForBonus = fetchedUser.userPowerResponseDto.freon || 0;
            // The API 'bonus' field bundles the 'freon' power within it.
            // We must subtract it so we don't inflate the Bonus %.
            const bonusPowerRawGh = Math.max(0, (fetchedUser.userPowerResponseDto.bonus || 0) - freonRawGhForBonus);

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

            const freonRawGh = fetchedUser.userPowerResponseDto.freon || 0;
            if (freonRawGh > 0) {
                const freonHashes = freonRawGh * 1e9;
                const freonScaled = autoScalePower(freonHashes);
                setStatFreonPower(freonScaled.value.toFixed(3));
                setStatFreonUnit(freonScaled.unit);
            } else {
                setStatFreonPower('');
            }
        }
    }, [fetchedUser]);

    const { cooldownRemaining, canFetch, setFetchStarted } = useApiCooldown();

    const handleFetchClick = async () => {
        setGlobalUserName(localUserName.trim());
        if (!localUserName.trim() || !onFetchUser || (!canFetch && fetchMode === 'username')) return;
        await onFetchUser(localUserName.trim());
        setFetchStarted();
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

        const freonVal = parseFloat(statFreonPower) || 0;
        const freonH = toBaseUnit({ value: freonVal, unit: statFreonUnit });

        // === Official Rollercoin Formula (from FAQ & Blog) ===
        // Total Power = (Games + Miners) * (1 + CollectionBonus%) + RackBonus + TempPower
        //
        // Collection Bonus applies to: ✅ Miners, ✅ Games
        // Collection Bonus does NOT apply to: ❌ Rack Bonus, ❌ Temp Power
        //
        // === League Determination ===
        // League-qualifying power (affects league): Miners * (1 + Bonus%) + RackBonus
        // Non-league power (does NOT affect league): Games, Temp Power
        // Games & Temp power inflate your total but don't help you advance leagues.

        // --- Current State ---
        // League Power = Miners * (1 + Bonus%) + Racks
        const currentLeaguePowerH = currentMinerBaseH * (1 + currentBonusVal / 100) + rackH;

        // Total Power = (Games + Miners) * (1 + Bonus%) + Racks + Temp + Freon
        const bonusBase = currentMinerBaseH + gamesH;
        let currentBoostedPowerH = bonusBase * (1 + currentBonusVal / 100);
        let currentTotalPowerH = currentBoostedPowerH + rackH + tempH + freonH;

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

        // --- New State ---
        const newTotalBonusPercent = currentBonusVal + totalAddedBonusVal;
        const newAllMinersH = currentMinerBaseH + totalAddedBaseH;

        // New League Power = (AllMiners) * (1 + NewBonus%) + Racks
        const newLeaguePowerH = newAllMinersH * (1 + newTotalBonusPercent / 100) + rackH;

        // New Total Power = (Games + AllMiners) * (1 + NewBonus%) + Racks + Temp + Freon
        const newBonusBaseH = newAllMinersH + gamesH;
        let newBoostedPowerH = newBonusBaseH * (1 + (newTotalBonusPercent / 100));
        let newTotalPowerH = newBoostedPowerH + rackH + tempH + freonH;

        const newTotalPower = autoScalePower(newTotalPowerH);
        const powerDiff = newTotalPowerH - currentTotalPowerH;
        const powerIncrease = autoScalePower(powerDiff);

        // League determination uses ONLY league-qualifying power (Miners + Bonus + Racks)
        // Games and Temp power do NOT affect league!
        const calculatedCurrentLeague = getLeagueByPower(autoScalePower(currentLeaguePowerH), apiLeagues || LEAGUES);
        const newLeague = getLeagueByPower(autoScalePower(newLeaguePowerH), apiLeagues || LEAGUES);
        const isLeagueChange = newLeague.id !== calculatedCurrentLeague.id;

        if (totalAddedBaseH > 0 || totalAddedBonusVal > 0) {
            setSimulationResult({
                newTotalPower,
                addedPower: powerIncrease,
                newLeague,
                currentLeague: calculatedCurrentLeague,
                isLeagueChange,
                powerIncrease,
                currentTotalPower: autoScalePower(currentTotalPowerH),
                currentLeaguePower: autoScalePower(currentLeaguePowerH),
                newLeaguePower: autoScalePower(newLeaguePowerH),
            });
        } else {
            setSimulationResult(null);
        }
    }, [statMinersPower, statMinersUnit, statBonus, statRackPower, statRackUnit, statGamesPower, statGamesUnit, statTempPower, statTempUnit, statFreonPower, statFreonUnit, addedMiners, newMinerPower, newMinerUnit, newMinerBonus, currentLeague]);

    const units: PowerUnit[] = ['Gh', 'Th', 'Ph', 'Eh', 'Zh'];

    return (
        <div className="power-simulator">
            <div className="simulator-header">
                <h2 className="section-title">
                    <span className="section-icon">⚡</span>
                    {t('simulator.title')}
                </h2>
                <p className="section-desc">{t('simulator.desc')}</p>
            </div>

            <div className="simulator-content">
                <div className="user-fetcher-row">
                    <div className="input-group compact" style={{ flex: 1 }}>
                        <div className="fetch-mode-selector">
                            <div
                                className="mode-tab-bg"
                                style={{ transform: fetchMode === 'username' ? 'translateX(0)' : 'translateX(100%)' }}
                            />
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
                                    value={localUserName}
                                    onChange={(e) => setLocalUserName(e.target.value)}
                                    onBlur={() => setGlobalUserName(localUserName)}
                                    placeholder={t('simulator.enterUsername')}
                                    className="power-value-input"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleFetchClick();
                                    }}
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
                                disabled={isFetchingUser || (fetchMode === 'username' && (!localUserName.trim() || !canFetch))}
                            >
                                {isFetchingUser ? (
                                    <span className="spinner small"></span>
                                ) : !canFetch && fetchMode === 'username' ? (
                                    <span className="cooldown-text" style={{ fontSize: '13px' }}>{Math.ceil(cooldownRemaining / 1000)}s</span>
                                ) : (
                                    t('simulator.fetch')
                                )}
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
                                <div className="input-group compact mobile-full" style={{ flex: 2 }}>
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

                                <div className="input-group compact mobile-half" style={{ flex: 1 }}>
                                    <label>{t('simulator.totalBonus')} (%)</label>
                                    <input
                                        type="number"
                                        value={statBonus}
                                        onChange={e => setStatBonus(e.target.value)}
                                        placeholder="0"
                                        className="power-value-input"
                                    />
                                </div>

                                <div className="input-group compact mobile-half" style={{ flex: 1.5 }}>
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

                            <div className="responsive-input-row">
                                <div className="input-group compact mobile-half" style={{ flex: 1 }}>
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

                                <div className="input-group compact mobile-half" style={{ flex: 1 }}>
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

                                <div className="input-group compact mobile-half" style={{ flex: 1 }}>
                                    <label>{t('simulator.freonPower')}</label>
                                    <div className="power-input-row">
                                        <input
                                            type="number"
                                            value={statFreonPower}
                                            onChange={e => setStatFreonPower(e.target.value)}
                                            placeholder="0"
                                            className="power-value-input small"
                                        />
                                        <select
                                            value={statFreonUnit}
                                            onChange={e => setStatFreonUnit(e.target.value as PowerUnit)}
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
                        <div className="input-group compact mobile-full" style={{ flex: 2 }}>
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

                        <div className="input-group compact mobile-full">
                            <label>{t('simulator.minerBonus')} (%)</label>
                            <div className="bonus-add-row">
                                <input
                                    type="number"
                                    value={newMinerBonus}
                                    onChange={e => setNewMinerBonus(e.target.value)}
                                    placeholder="0"
                                    className="power-value-input"
                                />
                                <button
                                    className="btn-primary add-miner-btn"
                                    onClick={handleAddMiner}
                                    disabled={!newMinerPower}
                                >
                                    {t('simulator.add')}
                                </button>
                            </div>
                        </div>
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
                            {/* Total Power Row */}
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

                            {/* League Power Breakdown */}
                            <div className="league-power-breakdown">
                                <div className="league-power-row">
                                    <div className="league-power-item">
                                        <span className="league-power-label">🏆 {t('simulator.leaguePower')}</span>
                                        <span className="league-power-value">{formatHashPower(simulationResult.currentLeaguePower)}</span>
                                    </div>
                                    <div className="transition-arrow small">➜</div>
                                    <div className="league-power-item">
                                        <span className="league-power-value accent">{formatHashPower(simulationResult.newLeaguePower)}</span>
                                    </div>
                                </div>
                                <div className="league-power-note">
                                    <span className="note-icon">ℹ️</span>
                                    <span>{t('simulator.leaguePowerNote')}</span>
                                </div>
                            </div>

                            {simulationResult.isLeagueChange ? (
                                <div className="league-transition">
                                    <div className="league-card">
                                        <img
                                            src={getLeagueImage(simulationResult.currentLeague.id)}
                                            alt={`${simulationResult.currentLeague.name} League`}
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.onerror = null;
                                                target.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
                                                target.style.display = 'none';
                                            }}
                                        />
                                        <span>{simulationResult.currentLeague.name}</span>
                                    </div>
                                    <div className="transition-arrow">➜</div>
                                    <div className="league-card new">
                                        <div className="new-badge">NEW!</div>
                                        <div className="move-up-text">{t('simulator.moveUp')}</div>
                                        <img
                                            src={getLeagueImage(simulationResult.newLeague.id)}
                                            alt={`${simulationResult.newLeague.name} League`}
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.onerror = null;
                                                target.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
                                                target.style.display = 'none';
                                            }}
                                        />
                                        <span>{simulationResult.newLeague.name}</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="league-transition static">
                                    <div className="league-card">
                                        <img
                                            src={getLeagueImage(simulationResult.currentLeague.id)}
                                            alt={`${simulationResult.currentLeague.name} League`}
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.onerror = null;
                                                target.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
                                                target.style.display = 'none';
                                            }}
                                        />
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

