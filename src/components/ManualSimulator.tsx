
import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { RollercoinUserResponse } from '../types/user';
import { RollercoinRoomResponse } from '../types/room';
import { calculateExactRoomPower } from '../utils/roomParser';
import { autoScalePower, formatHashPower, toBaseUnit } from '../utils/powerParser';
import { PowerUnit } from '../types';
import { LeagueInfo, LEAGUES } from '../data/leagues';
import { getLeagueByPower } from '../utils/leagueHelper';
import { getLeagueImage } from '../data/leagueImages';
import { fetchMerges } from '../services/mergeApi';
import { MergeListItem } from '../types/merge';
import { useApiCooldown } from '../hooks/useApiCooldown';
import Notification from './Notification';
import './ManualSimulator.css';
import './RoomPowerSimulator.css';
import '../components/MergePage.css';

interface ManualSimulatorProps {
    currentLeague: LeagueInfo;
    apiLeagues: LeagueInfo[] | null;
    fetchedUser?: RollercoinUserResponse | null;
    fetchedRoom?: RollercoinRoomResponse | null;
    onFetchUser?: (username: string) => Promise<void>;
    onFetchRoom?: (avatarId: string) => Promise<void>;
    isFetchingUser?: boolean;
    isFetchingRoom?: boolean;
    globalUserName?: string;
    setGlobalUserName?: (val: string) => void;
}

interface AddedMiner {
    id: string;
    name: string;
    power: number;
    bonus: number;
    rackBonus: number;
    fileName?: string;
}

const formatPower = (gh: number) => {
    return formatHashPower(autoScalePower(gh * 1e9));
};

const ManualSimulator: React.FC<ManualSimulatorProps> = ({
    apiLeagues,
    fetchedUser,
    fetchedRoom,
    onFetchUser,
    onFetchRoom,
    isFetchingUser,
    isFetchingRoom,
    globalUserName = '',
    setGlobalUserName = () => {}
}) => {
    const { t } = useTranslation();
    const { canFetch, setFetchStarted } = useApiCooldown();
    const [localUserName, setLocalUserName] = useState(globalUserName);
    
    // Tab State: 'manual' or 'search'
    const [activeInputTab, setActiveInputTab] = useState<'manual' | 'search'>('manual');

    // Manual Entry State
    const [manualPower, setManualPower] = useState('');
    const [manualUnit, setManualUnit] = useState<PowerUnit>('Th');
    const [manualBonus, setManualBonus] = useState('');
    const [manualRackBonus, setManualRackBonus] = useState('');

    // Global Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchedMiners, setSearchedMiners] = useState<MergeListItem[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchRackBonus, setSearchRackBonus] = useState('');
    const [pageIndex, setPageIndex] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    // Filter states
    const [minPower, setMinPower] = useState<string>('');
    const [maxPower, setMaxPower] = useState<string>('');
    const [minPowerUnit, setMinPowerUnit] = useState<PowerUnit>('Gh');
    const [maxPowerUnit, setMaxPowerUnit] = useState<PowerUnit>('Gh');

    const [minBonus, setMinBonus] = useState<string>('');
    const [maxBonus, setMaxBonus] = useState<string>('');
    
    const [sortBy, setSortBy] = useState<string>('power');
    const [isDescending, setIsDescending] = useState<boolean>(true);

    // Added Miners State
    const [addedMiners, setAddedMiners] = useState<AddedMiner[]>([]);

    // Notifications State
    const [notifications, setNotifications] = useState<{ id: string, message: string, type: 'success' | 'error' | 'info' }[]>([]);

    const addNotification = (message: string, type: 'success' | 'error' | 'info') => {
        const id = Date.now().toString() + Math.random().toString();
        setNotifications(prev => [...prev, { id, message, type }]);
    };

    const removeNotification = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    useEffect(() => {
        setLocalUserName(globalUserName);
    }, [globalUserName]);

    const handleFetchClick = async () => {
        setGlobalUserName(localUserName.trim());
        if (!localUserName.trim() || !onFetchUser || !canFetch) return;
        await onFetchUser(localUserName.trim());
        setFetchStarted();
    };

    const handleFetchRoom = () => {
        if (fetchedUser?.userProfileResponseDto?.avatar_Id && onFetchRoom) {
            onFetchRoom(fetchedUser.userProfileResponseDto.avatar_Id);
        }
    };

    const handleAddManual = () => {
        const val = parseFloat(manualPower);
        if (isNaN(val) || val <= 0) return;
        
        const powerBase = toBaseUnit({ value: val, unit: manualUnit }) / 1e9; // in Gh
        const bonus = parseFloat(manualBonus) || 0;
        const rack = parseFloat(manualRackBonus) || 0;

        setAddedMiners([...addedMiners, {
            id: Date.now().toString(),
            name: t('simulator.manualInput', 'Manuel Giriş'),
            power: powerBase,
            bonus,
            rackBonus: rack
        }]);

        addNotification(t('simulator.minerAdded', { name: t('simulator.manualInput', 'Manuel Giriş') }) || `${t('simulator.manualInput', 'Manuel Giriş')} eklendi.`, 'success');

        setManualPower('');
        setManualBonus('');
        setManualRackBonus('');
    };

    const handleAddSearchedMiner = (miner: MergeListItem) => {
        const rack = parseFloat(searchRackBonus) || 0;
        setAddedMiners([...addedMiners, {
            id: Date.now().toString() + Math.random().toString(),
            name: miner.resultItemName,
            power: miner.resultItemPower, // Already in Gh!
            bonus: miner.resultItemPercent / 100, // API gives 150 = 1.5%
            rackBonus: rack,
            fileName: miner.resultItemFileName
        }]);
        const levelStr = miner.resultItemLevel > 0 ? t('simulator.minerLevelPrefix', { level: miner.resultItemLevel }) : '';
        const fullName = `${levelStr}${miner.resultItemName}`;
        
        addNotification(t('simulator.minerAdded', { name: fullName }), 'success');
    };

    const removeMiner = (id: string) => {
        setAddedMiners(addedMiners.filter(m => m.id !== id));
    };

    // Calculate actual Gh/s values for the search API based on user input and unit
    const getMinPowerGh = () => minPower ? (toBaseUnit({ value: Number(minPower), unit: minPowerUnit }) / 1e9) : undefined;
    const getMaxPowerGh = () => maxPower ? (toBaseUnit({ value: Number(maxPower), unit: maxPowerUnit }) / 1e9) : undefined;

    // Handle slider changes by converting the Gh/s slider value back into the currently selected unit
    const handleMinPowerSlider = (ghVal: number) => {
        const asHs = ghVal * 1e9;
        let converted = asHs;
        if (minPowerUnit === 'Th') converted = asHs / 1e12;
        else if (minPowerUnit === 'Ph') converted = asHs / 1e15;
        else if (minPowerUnit === 'Eh') converted = asHs / 1e18;
        else converted = ghVal; // Gh
        setMinPower(converted.toString());
    };

    const handleMaxPowerSlider = (ghVal: number) => {
        const asHs = ghVal * 1e9;
        let converted = asHs;
        if (maxPowerUnit === 'Th') converted = asHs / 1e12;
        else if (maxPowerUnit === 'Ph') converted = asHs / 1e15;
        else if (maxPowerUnit === 'Eh') converted = asHs / 1e18;
        else converted = ghVal; // Gh
        setMaxPower(converted.toString());
    };

    const handleSearchMiners = async (page = 0) => {
        setIsSearching(true);
        try {
            const params: any = {
                pageIndex: page,
                pageSize: 20,
                sortBy,
                isDescending
            };
            if (searchQuery) params.searchName = searchQuery;
            
            const minGh = getMinPowerGh();
            if (minGh !== undefined) params.minPower = minGh;
            
            const maxGh = getMaxPowerGh();
            if (maxGh !== undefined) params.maxPower = maxGh;
            
            if (minBonus) params.minBonus = Number(minBonus);
            if (maxBonus) params.maxBonus = Number(maxBonus);

            const res = await fetchMerges(params);
            if (res && res.items) {
                setSearchedMiners(res.items);
                setPageIndex(res.index);
                setTotalPages(res.pages);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsSearching(false);
        }
    };

    const baseRoomPower = useMemo(() => {
        if (fetchedRoom) {
            return calculateExactRoomPower(fetchedRoom);
        }
        return {
            baseMinerPowerGh: 0,
            collectionBonusPercent: 0,
            rackBonusPowerGh: 0,
            totalLeaguePowerGh: 0,
            placedMinersCount: 0
        };
    }, [fetchedRoom]);

    const simulation = useMemo(() => {
        if (!fetchedRoom) return null;

        let totalAddedPower = 0;
        let totalAddedBonusPercent = 0;
        let totalAddedRackPower = 0;

        addedMiners.forEach(m => {
            totalAddedPower += m.power;
            totalAddedBonusPercent += m.bonus;
            totalAddedRackPower += (m.power * (m.rackBonus / 100));
        });

        const newBaseMinerPower = baseRoomPower.baseMinerPowerGh + totalAddedPower;
        const newCollectionBonus = (baseRoomPower.collectionBonusPercent / 100) + totalAddedBonusPercent;
        const newRackBonusPower = baseRoomPower.rackBonusPowerGh + totalAddedRackPower;

        const newLeaguePowerGh = newBaseMinerPower + (newBaseMinerPower * (newCollectionBonus / 100)) + newRackBonusPower;
        
        const currentLeague = getLeagueByPower(autoScalePower(baseRoomPower.totalLeaguePowerGh * 1e9), apiLeagues || LEAGUES);
        const newLeague = getLeagueByPower(autoScalePower(newLeaguePowerGh * 1e9), apiLeagues || LEAGUES);

        return {
            newLeaguePowerGh,
            powerIncreaseGh: newLeaguePowerGh - baseRoomPower.totalLeaguePowerGh,
            currentLeague,
            newLeague,
            isLeagueChange: currentLeague.id !== newLeague.id,
            totalAddedPower,
            totalAddedBonusPercent,
            totalAddedRackPower
        };
    }, [baseRoomPower, addedMiners, apiLeagues, fetchedRoom]);

    const formatPowerStr = (gh: number) => formatHashPower(autoScalePower(gh * 1e9));

    // Calculate current slider values in Gh/s
    const sliderMinGh = getMinPowerGh() || 0;
    const sliderMaxGh = getMaxPowerGh() || 16830000000;

    return (
        <section className="manual-simulator">
            <div className="ms-header">
                <h2><span className="section-icon">⚡</span> {t('simulator.title', 'Güç Simülatörü')}</h2>
                <p>{t('simulator.manualDesc', 'Oda verilerinizi çekerek temel gücünüzü bulun ve manuel olarak veya veri tabanından madenci ekleyerek gücünüzü hesaplayın.')}</p>
            </div>

            <div className="ms-content">
                <div className="user-fetcher-row">
                    <div className="input-group compact" style={{ flex: 1 }}>
                        <div className="fetch-input-wrapper" style={{ marginTop: 0 }}>
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
                            <button
                                className="fetch-btn"
                                onClick={handleFetchClick}
                                disabled={isFetchingUser || !localUserName.trim() || !canFetch}
                            >
                                {isFetchingUser ? <span className="spinner small"></span> : t('simulator.fetch')}
                            </button>
                        </div>
                    </div>
                </div>

                {fetchedUser && !fetchedRoom && (
                    <div className="beautiful-fetch-room">
                        <div className="fetch-room-card">
                            <div className="fetch-room-icon">🔍</div>
                            <div className="fetch-room-content">
                                <h3>{t('simulator.fetchRoom', 'Odamın Verilerini Çek')}</h3>
                                <p>{t('simulator.roomFetchNote', 'Tam lig gücünüzü hesaplamak için odanızı taratmalısınız.')}</p>
                            </div>
                            <button 
                                className="premium-fetch-btn"
                                onClick={handleFetchRoom}
                                disabled={isFetchingRoom}
                            >
                                {isFetchingRoom ? <><span className="spinner small"></span> {t('simulator.fetchingRoom', 'Taranıyor...')}</> : <span>{t('simulator.fetch', 'Tarat')}</span>}
                            </button>
                        </div>
                    </div>
                )}

                {fetchedRoom && (
                    <div className="ms-card">
                        <h3 style={{ marginBottom: '1.5rem', fontSize: '1.3rem' }}><span className="section-icon">➕</span> {t('simulator.addMiner', 'Madenci Ekle')}</h3>
                        
                        <div className="main-tabs" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '2rem', marginTop: '1rem', background: 'var(--bg-tertiary)', padding: '6px', borderRadius: 'var(--radius-md)' }}>
                            <button 
                                className={`main-tab ${activeInputTab === 'manual' ? 'active' : ''}`}
                                onClick={() => setActiveInputTab('manual')}
                                style={{ 
                                    width: '100%', margin: 0, justifyContent: 'center',
                                    background: activeInputTab === 'manual' ? 'var(--accent-secondary)' : 'transparent',
                                    color: activeInputTab === 'manual' ? '#fff' : 'var(--text-secondary)',
                                    border: 'none',
                                    borderRadius: 'var(--radius-sm)',
                                    padding: '10px',
                                    fontSize: '14px',
                                    fontWeight: activeInputTab === 'manual' ? 700 : 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    boxShadow: activeInputTab === 'manual' ? '0 2px 8px rgba(0,0,0,0.2)' : 'none'
                                }}
                            >
                                <span className="tab-icon">✍️</span>
                                {t('simulator.manualTab', 'Manuel Ekle')}
                            </button>
                            <button 
                                className={`main-tab ${activeInputTab === 'search' ? 'active' : ''}`}
                                onClick={() => setActiveInputTab('search')}
                                style={{ 
                                    width: '100%', margin: 0, justifyContent: 'center',
                                    background: activeInputTab === 'search' ? 'var(--accent-secondary)' : 'transparent',
                                    color: activeInputTab === 'search' ? '#fff' : 'var(--text-secondary)',
                                    border: 'none',
                                    borderRadius: 'var(--radius-sm)',
                                    padding: '10px',
                                    fontSize: '14px',
                                    fontWeight: activeInputTab === 'search' ? 700 : 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    boxShadow: activeInputTab === 'search' ? '0 2px 8px rgba(0,0,0,0.2)' : 'none'
                                }}
                            >
                                <span className="tab-icon">🔍</span>
                                {t('merge.searchAddMiner', 'Search / Add Miner')}
                            </button>
                        </div>

                        <div className="tab-slider-viewport" style={{ overflow: 'hidden' }}>
                            <div className="tab-slider-track" style={{ 
                                display: 'flex', 
                                transition: 'transform 0.3s ease-in-out', 
                                transform: activeInputTab === 'manual' ? 'translateX(0)' : 'translateX(-100%)',
                                alignItems: 'flex-start'
                            }}>
                                <div className="tab-slider-slide" style={{ width: '100%', flexShrink: 0, height: activeInputTab === 'manual' ? 'auto' : 0, overflow: activeInputTab === 'manual' ? 'visible' : 'hidden' }}>
                                    <div className="ms-input-row" style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', marginTop: '1rem', display: 'flex', gap: '20px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                                        <div className="input-group" style={{ flex: '1 1 200px' }}>
                                            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', display: 'block' }}>{t('simulator.minerPower', 'Madenci Gücü')}</label>
                                            <div className="power-input-container" style={{ display: 'flex', width: '100%' }}>
                                                <input 
                                                    type="number" 
                                                    className="power-value-input" 
                                                    placeholder="0"
                                                    value={manualPower}
                                                    onChange={e => setManualPower(e.target.value)}
                                                    style={{ flex: 1, minWidth: 0, background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRight: 'none', padding: '10px 14px', fontSize: '14px', color: 'var(--text-primary)', fontWeight: 600, borderTopLeftRadius: 'var(--radius-md)', borderBottomLeftRadius: 'var(--radius-md)', outline: 'none' }}
                                                />
                                                <select 
                                                    className="power-unit-select"
                                                    value={manualUnit}
                                                    onChange={e => setManualUnit(e.target.value as PowerUnit)}
                                                    style={{ width: '80px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontWeight: 600, padding: '0 10px', cursor: 'pointer', borderTopRightRadius: 'var(--radius-md)', borderBottomRightRadius: 'var(--radius-md)' }}
                                                >
                                                    <option value="Gh">Gh</option>
                                                    <option value="Th">Th</option>
                                                    <option value="Ph">Ph</option>
                                                    <option value="Eh">Eh</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="input-group" style={{ flex: '1 1 150px' }}>
                                            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', display: 'block' }}>{t('simulator.minerBonus', 'Madenci Bonusu')} (%)</label>
                                            <input 
                                                type="number" 
                                                className="power-value-input" 
                                                placeholder="0"
                                                value={manualBonus}
                                                onChange={e => setManualBonus(e.target.value)}
                                                style={{ width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: '14px', color: 'var(--text-primary)', fontWeight: 600, outline: 'none' }}
                                            />
                                        </div>
                                        <div className="input-group" style={{ flex: '1 1 150px' }}>
                                            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', display: 'block' }}>{t('simulator.rackBonus', 'Raf Bonusu')} (%)</label>
                                            <input 
                                                type="number" 
                                                className="power-value-input" 
                                                placeholder="0"
                                                value={manualRackBonus}
                                                onChange={e => setManualRackBonus(e.target.value)}
                                                style={{ width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: '14px', color: 'var(--text-primary)', fontWeight: 600, outline: 'none' }}
                                            />
                                        </div>
                                        <div className="input-group" style={{ flex: '0 0 auto' }}>
                                            <button 
                                                className="fetch-btn" 
                                                onClick={handleAddManual} 
                                                disabled={!manualPower} 
                                                style={{ padding: '0 24px', fontSize: '15px', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent-secondary)', color: '#fff', borderRadius: 'var(--radius-md)', border: 'none', cursor: !manualPower ? 'not-allowed' : 'pointer', opacity: !manualPower ? 0.6 : 1, fontWeight: 800, transition: 'all 0.2s' }}
                                                onMouseEnter={e => { if(manualPower) { e.currentTarget.style.background = 'var(--accent-primary)'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
                                                onMouseLeave={e => { if(manualPower) { e.currentTarget.style.background = 'var(--accent-secondary)'; e.currentTarget.style.transform = 'translateY(0)'; } }}
                                            >
                                                {t('simulator.add', 'Ekle')}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="tab-slider-slide" style={{ width: '100%', flexShrink: 0, height: activeInputTab === 'search' ? 'auto' : 0, overflow: activeInputTab === 'search' ? 'visible' : 'hidden' }}>
                                    <div className="miner-search-area" style={{ marginTop: '1rem', padding: 0 }}>
                                <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                                    <div className="rc-filter-container" style={{ flex: '1 1 300px', maxWidth: 400 }}>
                                        <h3 style={{ marginTop: 0, marginBottom: 20, fontSize: 18, borderBottom: '1px solid #3c3e58', paddingBottom: 10 }}>{t('merge.filters', 'Filtreler')}</h3>

                                        <div className="rc-filter-group">
                                            <label className="rc-filter-label">{t('merge.filterPower', 'Güç Aralığı')}:</label>
                                            <div className="rc-dual-slider-container">
                                                <div className="rc-dual-slider-fill" style={{ left: `${(sliderMinGh / 16830000000) * 100}%`, width: `${((sliderMaxGh - sliderMinGh) / 16830000000) * 100}%` }} />
                                                <input
                                                    type="range"
                                                    className="rc-native-slider rc-slider-min"
                                                    min="0" max="16830000000" step="1000000"
                                                    value={sliderMinGh}
                                                    onChange={e => handleMinPowerSlider(Math.min(Number(e.target.value), sliderMaxGh - 1000000))}
                                                />
                                                <input
                                                    type="range"
                                                    className="rc-native-slider rc-slider-max"
                                                    min="0" max="16830000000" step="1000000"
                                                    value={sliderMaxGh}
                                                    onChange={e => handleMaxPowerSlider(Math.max(Number(e.target.value), sliderMinGh + 1000000))}
                                                />
                                            </div>
                                            <div className="rc-filter-inputs" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '8px' }}>
                                                <div style={{ display: 'flex', gap: '4px' }}>
                                                    <input type="number" className="rc-filter-input" value={minPower} onChange={e => setMinPower(e.target.value)} placeholder="0" style={{ width: '100%' }} />
                                                    <select className="rc-select" value={minPowerUnit} onChange={e => setMinPowerUnit(e.target.value as PowerUnit)} style={{ padding: '0 4px' }}>
                                                        <option value="Gh">Gh</option>
                                                        <option value="Th">Th</option>
                                                        <option value="Ph">Ph</option>
                                                        <option value="Eh">Eh</option>
                                                    </select>
                                                </div>
                                                <div style={{ display: 'flex', gap: '4px' }}>
                                                    <input type="number" className="rc-filter-input" value={maxPower} onChange={e => setMaxPower(e.target.value)} placeholder={t('merge.max', 'Max')} style={{ width: '100%' }} />
                                                    <select className="rc-select" value={maxPowerUnit} onChange={e => setMaxPowerUnit(e.target.value as PowerUnit)} style={{ padding: '0 4px' }}>
                                                        <option value="Gh">Gh</option>
                                                        <option value="Th">Th</option>
                                                        <option value="Ph">Ph</option>
                                                        <option value="Eh">Eh</option>
                                                    </select>
                                                </div>
                                                <button className="rc-filter-ok" onClick={() => handleSearchMiners(0)}>OK</button>
                                            </div>
                                            <div style={{ fontSize: 12, color: '#03e1e4', marginTop: 8, display: 'flex', justifyContent: 'space-between' }}>
                                                <span>{t('merge.min', 'Min')}: {sliderMinGh ? formatPower(sliderMinGh) : '0'}</span>
                                                <span>{t('merge.max', 'Max')}: {sliderMaxGh < 16830000000 ? formatPower(sliderMaxGh) : t('merge.unlimited', 'Sınırsız')}</span>
                                            </div>
                                        </div>

                                        <div className="rc-filter-group">
                                            <label className="rc-filter-label">{t('merge.filterBonus', 'Bonus Aralığı')}:</label>
                                            <div className="rc-dual-slider-container">
                                                <div className="rc-dual-slider-fill" style={{ left: `${(Number(minBonus || 0) / 135) * 100}%`, width: `${((Number(maxBonus || 135) - Number(minBonus || 0)) / 135) * 100}%` }} />
                                                <input
                                                    type="range"
                                                    className="rc-native-slider rc-slider-min"
                                                    min="0" max="135" step="1"
                                                    value={minBonus || 0}
                                                    onChange={e => setMinBonus(Math.min(Number(e.target.value), Number(maxBonus || 135) - 1).toString())}
                                                />
                                                <input
                                                    type="range"
                                                    className="rc-native-slider rc-slider-max"
                                                    min="0" max="135" step="1"
                                                    value={maxBonus || 135}
                                                    onChange={e => setMaxBonus(Math.max(Number(e.target.value), Number(minBonus || 0) + 1).toString())}
                                                />
                                            </div>
                                            <div className="rc-filter-inputs">
                                                <input type="number" className="rc-filter-input" value={minBonus} onChange={e => setMinBonus(e.target.value)} placeholder="0" />
                                                <span className="rc-filter-separator">-</span>
                                                <input type="number" className="rc-filter-input" value={maxBonus} onChange={e => setMaxBonus(e.target.value)} placeholder={t('merge.max', 'Max')} />
                                                <button className="rc-filter-ok" onClick={() => handleSearchMiners(0)}>OK</button>
                                            </div>
                                        </div>

                                        <div className="rc-filter-group" style={{ borderTop: '1px solid #3c3e58', paddingTop: 20 }}>
                                            <label className="rc-filter-label" style={{ marginBottom: 10 }}>{t('merge.sorting', 'Sıralama')}:</label>
                                            <div className="rc-filter-inputs">
                                                <select value={sortBy} onChange={e => { setSortBy(e.target.value); setTimeout(() => handleSearchMiners(0), 50); }} className="rc-select">
                                                    <option value="power">{t('merge.sortOptions.power', 'Güç')}</option>
                                                    <option value="percent">{t('merge.sortOptions.bonus', 'Bonus')}</option>
                                                    <option value="name">{t('merge.sortOptions.name', 'İsim')}</option>
                                                    <option value="newest">{t('merge.sortOptions.newest', 'En Yeni')}</option>
                                                </select>
                                                <button className="rc-filter-ok" onClick={() => { setIsDescending(!isDescending); setTimeout(() => handleSearchMiners(0), 50); }} style={{ padding: '8px 10px', fontSize: 15 }}>
                                                    {isDescending ? '▼' : '▲'}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="rc-filter-group" style={{ marginTop: 20 }}>
                                            <input type="text" className="rc-search-input" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearchMiners(0)} placeholder={t('merge.searchByName', 'İsimle Ara')} />
                                            <button className="rc-filter-search-btn" onClick={() => handleSearchMiners(0)} disabled={isSearching}>
                                                {isSearching ? <span className="spinner small"></span> : t('merge.searchBtn', 'ARA')}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="miner-search-results-wrapper" style={{ flex: '2 1 300px', minWidth: 0, background: '#15162a', padding: 20, borderRadius: 8, border: '1px solid #514e72' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, flexWrap: 'wrap', gap: 10 }}>
                                            <h3 style={{ margin: 0, color: '#fff' }}>{t('merge.searchResults', 'Arama Sonuçları')}</h3>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg-tertiary)', padding: '5px 15px', borderRadius: 'var(--radius-md)', border: '1px solid #3c3e58' }}>
                                                <label style={{ color: '#fff', fontSize: 14, fontWeight: 600, margin: 0 }}>{t('simulator.rackBonus', 'Raf Bonusu')} (%)</label>
                                                <input 
                                                    type="number" 
                                                    className="power-value-input" 
                                                    placeholder="0"
                                                    value={searchRackBonus}
                                                    onChange={e => setSearchRackBonus(e.target.value)}
                                                    style={{ width: '80px', padding: '5px 10px', fontSize: 14, background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: '#fff', outline: 'none' }}
                                                />
                                            </div>
                                        </div>
                                        <div className="miner-search-results" style={{ display: 'flex', flexWrap: 'wrap', gap: 10, maxHeight: 600, overflowY: 'auto', padding: 5 }}>
                                            {searchedMiners.map(miner => (
                                                <div
                                                    key={miner.id}
                                                    style={{
                                                        background: '#2f3045', padding: 10, borderRadius: 4,
                                                        display: 'flex', flexDirection: 'column', alignItems: 'center', width: 130,
                                                        border: '1px solid #514e72', transition: 'border 0.2s', position: 'relative'
                                                    }}
                                                    onMouseEnter={(e) => e.currentTarget.style.borderColor = '#03e1e4'}
                                                    onMouseLeave={(e) => e.currentTarget.style.borderColor = '#514e72'}
                                                >
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleAddSearchedMiner(miner); }}
                                                        style={{
                                                            position: 'absolute', top: -5, right: -5, background: '#03e1e4', color: '#1a1b2e',
                                                            border: 'none', borderRadius: '50%', width: 26, height: 26, fontSize: 18,
                                                            fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            boxShadow: '0 2px 4px rgba(0,0,0,0.4)', zIndex: 10
                                                        }}
                                                        title={t('simulator.add', 'Ekle')}
                                                    >
                                                        +
                                                    </button>
                                                    {miner.resultItemFileName ? (
                                                        <img
                                                            src={`https://static.rollercoin.com/static/img/market/miners/${miner.resultItemFileName?.includes('.') ? miner.resultItemFileName : (miner.resultItemFileName + '.gif')}?v=1.2.1`}
                                                            style={{ width: 50, height: 'auto', pointerEvents: 'none' }}
                                                            onError={(e) => {
                                                                const target = e.target as HTMLImageElement;
                                                                if (!target.src.includes('.png')) target.src = `https://static.rollercoin.com/static/img/market/miners/${miner.resultItemFileName?.split('.')[0] || 'crypto_combo'}.png`;
                                                            }}
                                                        />
                                                    ) : (
                                                        <div style={{ fontSize: '30px' }}>📦</div>
                                                    )}
                                                    <span style={{ color: '#fff', fontSize: 12, textAlign: 'center', marginTop: 8, fontWeight: 'bold', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', width: '100%' }}>{miner.resultItemName}</span>
                                                    <span style={{ color: '#888', fontSize: 11 }}>Lvl {miner.resultItemLevel} • {miner.resultItemWidth} Hücre</span>
                                                    <span style={{ color: '#03e1e4', fontSize: 12, marginTop: 4 }}>{formatPowerStr(miner.resultItemPower)}</span>
                                                    {miner.resultItemPercent > 0 && <span style={{ color: '#28a745', fontSize: 11 }}>+{(miner.resultItemPercent / 100).toFixed(2)}% Bonus</span>}
                                                </div>
                                            ))}
                                            {searchedMiners.length === 0 && !isSearching && (
                                                <div style={{ color: '#888', textAlign: 'center', width: '100%', padding: '20px' }}>
                                                    {t('merge.dragDropHint', 'Aradığınız kriterlere uygun madenci bulunamadı.')}
                                                </div>
                                            )}
                                        </div>

                                        {totalPages > 1 && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, paddingTop: 15, borderTop: '1px solid #3c3e58' }}>
                                                <button onClick={() => handleSearchMiners(pageIndex - 1)} disabled={pageIndex === 0 || isSearching} style={{ padding: '5px 10px', background: '#514e72', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>{t('pagination.previous', 'Önceki')}</button>
                                                <span style={{ color: '#aaa' }}>{pageIndex + 1} / {totalPages}</span>
                                                <button onClick={() => handleSearchMiners(pageIndex + 1)} disabled={pageIndex >= totalPages - 1 || isSearching} style={{ padding: '5px 10px', background: '#514e72', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>{t('pagination.next', 'Sonraki')}</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        {addedMiners.length > 0 && (
                            <div className="ms-added-miners" style={{ marginTop: '2rem', padding: '1.5rem', background: '#1c1c28', borderRadius: '12px', border: '1px solid #3c3e58' }}>
                                <h4 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '1.5rem', marginTop: 0 }}>
                                    {t('simulator.addedMinersList', 'Eklenen Madenciler')} ({addedMiners.length})
                                </h4>
                                <div className="ms-miner-list" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                    {addedMiners.map(miner => (
                                        <div
                                            key={miner.id}
                                            style={{
                                                background: '#2f3045', padding: 10, borderRadius: 4,
                                                display: 'flex', flexDirection: 'column', alignItems: 'center', width: 130,
                                                border: '1px solid #514e72', transition: 'border 0.2s', position: 'relative'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.borderColor = '#d9534f'}
                                            onMouseLeave={(e) => e.currentTarget.style.borderColor = '#514e72'}
                                        >
                                            <button
                                                onClick={() => removeMiner(miner.id)}
                                                style={{
                                                    position: 'absolute', top: -5, right: -5, background: '#d9534f', color: '#fff',
                                                    border: 'none', borderRadius: '50%', width: 26, height: 26, fontSize: 14,
                                                    fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    boxShadow: '0 2px 4px rgba(0,0,0,0.4)', zIndex: 10
                                                }}
                                                title={t('common.remove', 'Sil')}
                                            >
                                                ✕
                                            </button>
                                            {miner.fileName ? (
                                                <img
                                                    src={`https://static.rollercoin.com/static/img/market/miners/${miner.fileName?.includes('.') ? miner.fileName : (miner.fileName + '.gif')}?v=1.2.1`}
                                                    style={{ width: 50, height: 'auto', pointerEvents: 'none', marginTop: 5 }}
                                                    onError={(e) => {
                                                        const target = e.target as HTMLImageElement;
                                                        if (!target.src.includes('.png')) target.src = `https://static.rollercoin.com/static/img/market/miners/${miner.fileName?.split('.')[0] || 'crypto_combo'}.png`;
                                                    }}
                                                />
                                            ) : (
                                                <div style={{ fontSize: '30px', marginTop: 10 }}>📦</div>
                                            )}
                                            <span style={{ color: '#fff', fontSize: 12, textAlign: 'center', marginTop: 8, fontWeight: 'bold', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', width: '100%' }}>{miner.name}</span>
                                            <span style={{ color: '#03e1e4', fontSize: 12, marginTop: 4 }}>⚡ {formatHashPower(autoScalePower(miner.power * 1e9))}</span>
                                            {miner.bonus > 0 && <span style={{ color: '#28a745', fontSize: 11 }}>🎁 +{miner.bonus.toFixed(2)}%</span>}
                                            {miner.rackBonus > 0 && <span style={{ color: '#2196f3', fontSize: 11 }}>🗄️ +{miner.rackBonus}%</span>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {simulation && (
                            <div className="simulation-results" style={{ marginTop: '2rem' }}>
                                <div className="results-inner">
                                    <div className="result-row" style={{ borderBottom: '1px solid #3c3e58', paddingBottom: '15px', marginBottom: '15px' }}>
                                        <div className="result-item">
                                            <span className="label">{t('simulator.currentTotalPower', 'Mevcut Toplam Güç')}</span>
                                            <span className="value secondary">{formatHashPower(autoScalePower((baseRoomPower.totalLeaguePowerGh + (fetchedUser?.userPowerResponseDto?.games || 0) + (fetchedUser?.userPowerResponseDto?.temp || 0) + (fetchedUser?.userPowerResponseDto?.freon || 0)) * 1e9))}</span>
                                        </div>
                                        <div className="transition-arrow">➜</div>
                                        <div className="result-item">
                                            <span className="label">{t('simulator.newTotalPower', 'Yeni Toplam Güç')}</span>
                                            <span className="value primary">{formatHashPower(autoScalePower((simulation.newLeaguePowerGh + (fetchedUser?.userPowerResponseDto?.games || 0) + (fetchedUser?.userPowerResponseDto?.temp || 0) + (fetchedUser?.userPowerResponseDto?.freon || 0)) * 1e9))}</span>
                                            <span className={`sub-value ${simulation.powerIncreaseGh >= 0 ? 'success' : 'danger'}`}>
                                                {simulation.powerIncreaseGh >= 0 ? '+' : '-'}{formatHashPower(autoScalePower(Math.abs(simulation.powerIncreaseGh) * 1e9))}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="result-row">
                                        <div className="result-item">
                                            <span className="label">{t('simulator.currentLeaguePower', 'Mevcut Lig Gücü')}</span>
                                            <span className="value secondary">{formatHashPower(autoScalePower(baseRoomPower.totalLeaguePowerGh * 1e9))}</span>
                                        </div>
                                        <div className="transition-arrow">➜</div>
                                        <div className="result-item">
                                            <span className="label">{t('simulator.newLeaguePower', 'Yeni Lig Gücü')}</span>
                                            <span className="value primary">{formatHashPower(autoScalePower(simulation.newLeaguePowerGh * 1e9))}</span>
                                            <span className={`sub-value ${simulation.powerIncreaseGh >= 0 ? 'success' : 'danger'}`}>
                                                {simulation.powerIncreaseGh >= 0 ? '+' : '-'}{formatHashPower(autoScalePower(Math.abs(simulation.powerIncreaseGh) * 1e9))}
                                            </span>
                                        </div>
                                    </div>

                                    {simulation.isLeagueChange ? (
                                        <div className="league-transition">
                                            <div className="league-card">
                                                <img
                                                    src={getLeagueImage(simulation.currentLeague.id)}
                                                    alt={`${simulation.currentLeague.name} League`}
                                                />
                                                <span>{simulation.currentLeague.name}</span>
                                            </div>
                                            <div className="transition-arrow">➜</div>
                                            <div className="league-card new">
                                                <div className="new-badge">NEW!</div>
                                                <div className="move-up-text">{t('simulator.moveUp', 'New League')}</div>
                                                <img
                                                    src={getLeagueImage(simulation.newLeague.id)}
                                                    alt={`${simulation.newLeague.name} League`}
                                                />
                                                <span>{simulation.newLeague.name}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="league-transition static">
                                            <div className="league-card">
                                                <img
                                                    src={getLeagueImage(simulation.currentLeague.id)}
                                                    alt={`${simulation.currentLeague.name} League`}
                                                />
                                                <span>{simulation.currentLeague.name}</span>
                                            </div>
                                            <span className="no-change-text">{t('simulator.noChange', 'No change')}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
            {/* Notifications */}
            {createPortal(
                <div className="notification-container">
                    {notifications.map(n => (
                        <Notification key={n.id} message={n.message} type={n.type} onClose={() => removeNotification(n.id)} />
                    ))}
                </div>,
                document.body
            )}
        </section>
    );
};

export default ManualSimulator;
