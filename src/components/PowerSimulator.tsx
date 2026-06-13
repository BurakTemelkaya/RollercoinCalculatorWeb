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
    const [statHamsterBonus, setStatHamsterBonus] = useState<string>(() => getStoredStr('hamsterBonus', ''));

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
    useEffect(() => { localStorage.setItem('rollercoin_sim_hamsterBonus', statHamsterBonus); }, [statHamsterBonus]);
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

            const baseForBonusGh = minersRawGh + gamesRawGh;

            let calculatedBonus = 0;
            let calculatedHamsterBonus = 0;
            if (fetchedUser.userPowerResponseDto.bonus_percent !== undefined) {
                const totalApiBonusPercent = fetchedUser.userPowerResponseDto.bonus_percent / 100;
                if (fetchedUser.userPowerResponseDto.hamster_expedition_bonus_percent !== undefined) {
                    calculatedHamsterBonus = fetchedUser.userPowerResponseDto.hamster_expedition_bonus_percent / 100;
                }
                // The API's 'bonus_percent' ALREADY includes 'hamster_expedition_bonus_percent'
                // So we subtract it to get the true base collection bonus
                calculatedBonus = totalApiBonusPercent - calculatedHamsterBonus;
            } else if (baseForBonusGh > 0) {
                const totalApiBonusPwr = fetchedUser.userPowerResponseDto.bonus || 0;
                const hamsterPwr = fetchedUser.userPowerResponseDto.hamster_expedition_bonus_power || 0;
                // The API's 'bonus' ALREADY includes 'hamster_expedition_bonus_power'
                const baseBonusPwr = totalApiBonusPwr - hamsterPwr;

                calculatedBonus = (baseBonusPwr / baseForBonusGh) * 100;
                calculatedHamsterBonus = (hamsterPwr / baseForBonusGh) * 100;
            }
            setStatBonus(calculatedBonus.toFixed(4));
            setStatHamsterBonus(calculatedHamsterBonus > 0 ? calculatedHamsterBonus.toFixed(4) : '');

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
            const racksRawGh = fetchedUser.userPowerResponseDto.racks || 0;
            if (racksRawGh > 0) {
                const racksHashes = racksRawGh * 1e9;
                const racksScaled = autoScalePower(racksHashes);
                setStatRackPower(racksScaled.value.toFixed(3));
                setStatRackUnit(racksScaled.unit);
            } else {
                setStatRackPower('0');
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

        const rackVal = parseFloat(statRackPower) || 0;
        const rackH = toBaseUnit({ value: rackVal, unit: statRackUnit });

        const gamesVal = parseFloat(statGamesPower) || 0;
        const gamesH = toBaseUnit({ value: gamesVal, unit: statGamesUnit });

        const tempVal = parseFloat(statTempPower) || 0;
        const tempH = toBaseUnit({ value: tempVal, unit: statTempUnit });
        const freonVal = parseFloat(statFreonPower) || 0;
        const freonH = toBaseUnit({ value: freonVal, unit: statFreonUnit });

        // === Official Rollercoin Formula (from FAQ & Blog) ===
        // Total Power = Miners + Games + RackBonus + TempPower + CollectionBonus
        //
        // Collection Bonus applies to: ✅ Miners, ✅ Games
        // Collection Bonus does NOT apply to: ❌ Rack Bonus, ❌ Temp Power
        //
        // === League Determination ===
        // League-qualifying power (affects league): Miners + RackBonus + (Miners * Bonus%) - Freon
        // Non-league power (does NOT affect league): Games, Temp Power
        // Games & Temp power inflate your total but don't help you advance leagues.

        // We calculate "hidden" backend offsets to keep API precision without locking inputs.
        // E.g. inventory miners count towards max_Power but aren't in 'miners' field, 
        // and 'Games' collection bonus must be perfectly isolated.
        let hiddenLeagueOffset = 0;
        let hiddenTotalOffset = 0;

        if (fetchMode === 'username' && fetchedUser) {
            const api = fetchedUser.userPowerResponseDto;

            // To perfectly cancel out the rounding applied when populating the UI,
            // we calculate the formula using the exact same rounded numbers the UI inputs have (.toFixed(3)).
            const uiMiners = toBaseUnit({
                value: parseFloat(autoScalePower((api.miners || 0) * 1e9).value.toFixed(3)),
                unit: autoScalePower((api.miners || 0) * 1e9).unit
            });
            const uiGames = toBaseUnit({
                value: parseFloat(autoScalePower((api.games || 0) * 1e9).value.toFixed(3)),
                unit: autoScalePower((api.games || 0) * 1e9).unit
            });
            const uiRacks = toBaseUnit({
                value: parseFloat(autoScalePower((api.racks || 0) * 1e9).value.toFixed(3)),
                unit: autoScalePower((api.racks || 0) * 1e9).unit
            });
            const uiTemp = toBaseUnit({
                value: parseFloat(autoScalePower((api.temp || 0) * 1e9).value.toFixed(3)),
                unit: autoScalePower((api.temp || 0) * 1e9).unit
            });
            const uiFreon = toBaseUnit({
                value: parseFloat(autoScalePower((api.freon || 0) * 1e9).value.toFixed(3)),
                unit: autoScalePower((api.freon || 0) * 1e9).unit
            });

            let rawBaseBonusVal = 0;
            let rawHamsterBonusVal = 0;
            if (api.bonus_percent !== undefined) {
                const totalApiBonusPercent = api.bonus_percent / 100;
                if (api.hamster_expedition_bonus_percent !== undefined) {
                    rawHamsterBonusVal = api.hamster_expedition_bonus_percent / 100;
                }
                rawBaseBonusVal = totalApiBonusPercent - rawHamsterBonusVal;
            } else if (((api.miners || 0) + (api.games || 0)) > 0) {
                const totalBonusPwr = api.bonus || 0;
                const hamsterPwr = api.hamster_expedition_bonus_power || 0;
                const baseBonusPwr = totalBonusPwr - hamsterPwr;

                rawBaseBonusVal = (baseBonusPwr / ((api.miners || 0) + (api.games || 0))) * 100;
                rawHamsterBonusVal = (hamsterPwr / ((api.miners || 0) + (api.games || 0))) * 100;
            }
            const uiBaseBonusVal = parseFloat(rawBaseBonusVal.toFixed(4));
            const uiTotalBonusVal = parseFloat((rawBaseBonusVal + rawHamsterBonusVal).toFixed(4));

            // League power only uses base collection bonus! Hamster bonus does NOT count for league.
            const uiFormulaLeague = uiMiners * (1 + uiBaseBonusVal / 100) + uiRacks - uiFreon;
            const uiFormulaTotal = (uiMiners + uiGames) * (1 + uiTotalBonusVal / 100) + uiRacks + uiTemp;

            // League power = miners + (bonus ON MINERS) + racks - freon
            const apiBaseBonusPwr = (api.bonus || 0) - (api.hamster_expedition_bonus_power || 0);
            const totalBaseGh = (api.miners || 0) + (api.games || 0);
            const apiBaseBonusOnMinersPwr = totalBaseGh > 0 ? apiBaseBonusPwr * ((api.miners || 0) / totalBaseGh) : 0;
            const apiLeaguePowerGh = (api.miners || 0) + apiBaseBonusOnMinersPwr + (api.racks || 0) - (api.freon || 0);
            hiddenLeagueOffset = (apiLeaguePowerGh * 1e9) - uiFormulaLeague;

            // api.current_Power already includes hamster expedition bonus (it's part of api.bonus)
            hiddenTotalOffset = ((api.current_Power || 0) * 1e9) - uiFormulaTotal;
        }

        // --- Current State Base ---
        // Calculate based on the visible input fields (which the user might have edited)
        const currentBaseBonusVal = parseFloat(statBonus) || 0;
        const currentTotalBonusVal = currentBaseBonusVal + (parseFloat(statHamsterBonus) || 0);

        // League power ONLY uses the Base Bonus, NOT the Hamster Bonus!
        let currentLeaguePowerH = currentMinerBaseH * (1 + currentBaseBonusVal / 100) + rackH - freonH;

        const bonusBase = currentMinerBaseH + gamesH;
        let currentTotalPowerH = (bonusBase * (1 + currentTotalBonusVal / 100)) + rackH + tempH;

        // Apply backend offsets so that if inputs match API exactly, the output matches API exactly.
        // If inputs are edited, it correctly scales from the edit.
        currentLeaguePowerH += hiddenLeagueOffset;
        currentTotalPowerH += hiddenTotalOffset;


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

        // --- New State (Calculated via Inputs + Offset) ---
        const newTotalBonusPercent = currentTotalBonusVal + totalAddedBonusVal;
        const newBaseBonusPercent = currentBaseBonusVal + totalAddedBonusVal; // assuming added miner gives regular collection bonus
        const newAllMinersH = currentMinerBaseH + totalAddedBaseH;

        const newLeaguePowerH = (newAllMinersH * (1 + newBaseBonusPercent / 100)) + rackH - freonH + hiddenLeagueOffset;

        const newBonusBaseH = newAllMinersH + gamesH;
        let newTotalPowerH = (newBonusBaseH * (1 + newTotalBonusPercent / 100)) + rackH + tempH + hiddenTotalOffset;

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
    }, [statMinersPower, statMinersUnit, statBonus, statHamsterBonus, statRackPower, statRackUnit, statGamesPower, statGamesUnit, statTempPower, statTempUnit, statFreonPower, statFreonUnit, addedMiners, newMinerPower, newMinerUnit, newMinerBonus, currentLeague]);

    const units: PowerUnit[] = ['Gh', 'Th', 'Ph', 'Eh', 'Zh'];

    return (
        <section className="power-simulator">
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

                                <div className="input-group compact mobile-half" style={{ flex: 1 }}>
                                    <label>{t('simulator.hamsterBonus')} (%)</label>
                                    <input
                                        type="number"
                                        value={statHamsterBonus}
                                        onChange={e => setStatHamsterBonus(e.target.value)}
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
        </section >
    );
};

export default PowerSimulator;

