import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { LeagueInfo, LEAGUES } from '../data/leagues';
import { getLeagueByPower } from '../utils/leagueHelper';
import { RollercoinUserResponse } from '../types/user';
import { RollercoinRoomResponse } from '../types/room';
import { calculateExactRoomPower } from '../utils/roomParser';
import { RoomSimulator } from './RoomSimulator';
import { autoScalePower, formatHashPower } from '../utils/powerParser';
import { useApiCooldown } from '../hooks/useApiCooldown';
import { getLeagueImage } from '../data/leagueImages';
import './RoomPowerSimulator.css';

interface RoomPowerSimulatorProps {
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

const RoomPowerSimulator: React.FC<RoomPowerSimulatorProps> = ({
    apiLeagues,
    fetchedUser,
    fetchedRoom,
    onFetchUser,
    onFetchRoom,
    isFetchingUser = false,
    isFetchingRoom = false,
    globalUserName = '',
    setGlobalUserName = () => { }
}) => {
    const { t } = useTranslation();
    const { cooldownRemaining, canFetch, setFetchStarted } = useApiCooldown();

    const [localUserName, setLocalUserName] = useState(globalUserName);
    const [simulatedRoom, setSimulatedRoom] = useState<RollercoinRoomResponse | null>(null);

    useEffect(() => {
        setLocalUserName(globalUserName);
    }, [globalUserName]);

    useEffect(() => {
        if (fetchedRoom) {
            setSimulatedRoom(fetchedRoom);
        } else {
            setSimulatedRoom(null);
        }
    }, [fetchedRoom]);

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

    // Get temporary power values from API dto
    const dto = fetchedUser?.userPowerResponseDto;
    const hamsterBonusPercent = dto?.hamster_expedition_bonus_percent || 0;
    const freonPowerGh = dto?.freon || 0;
    const gamesPowerGh = dto?.games || 0;
    const tempPowerGh = dto?.temp || 0;

    // Global power values from API
    const globalBaseMinerPowerGh = dto?.miners || 0;
    const globalBonusPercent = dto?.bonus_percent || 0;

    // ORIGINAL Room State
    const originalExactPower = fetchedRoom ? calculateExactRoomPower(fetchedRoom) : null;
    const originalLeaguePowerGh = originalExactPower ? originalExactPower.totalLeaguePowerGh : 0;
    const originalRoomBasePowerGh = originalExactPower ? originalExactPower.baseMinerPowerGh : 0;
    const originalLeague = getLeagueByPower(autoScalePower(originalLeaguePowerGh * 1e9), apiLeagues || LEAGUES);

    // SIMULATED Room State
    const exactPower = simulatedRoom ? calculateExactRoomPower(simulatedRoom) : null;
    const leaguePowerGh = exactPower ? exactPower.totalLeaguePowerGh : 0;
    const simulatedRoomBasePowerGh = exactPower ? exactPower.baseMinerPowerGh : 0;
    const hamsterBonusPowerGh = exactPower ? exactPower.baseMinerPowerGh * (hamsterBonusPercent / 10000) : 0;
    const currentLeague = getLeagueByPower(autoScalePower(leaguePowerGh * 1e9), apiLeagues || LEAGUES);

    // 1. NEW TOTAL POWER CALCULATION (Global Logic)
    // Find the delta in base miner power caused by the room simulation
    const basePowerDeltaGh = simulatedRoomBasePowerGh - originalRoomBasePowerGh;
    const newGlobalBaseMinerPowerGh = globalBaseMinerPowerGh + basePowerDeltaGh;
    
    // Original total power uses API global values
    const apiBonus = dto?.bonus || 0;
    const calculatedPercentBonus = globalBaseMinerPowerGh * (globalBonusPercent / 10000);
    const flatBonusGh = apiBonus - calculatedPercentBonus;
    
    const originalTotalPowerGh = dto ? dto.current_Power : 0;
    const unlistedPowerGh = dto ? (dto.current_Power - (globalBaseMinerPowerGh + apiBonus + tempPowerGh + gamesPowerGh)) : 0;
    
    // New total power uses updated global base power (assuming bonus_percent stays constant for room modifications)
    const newGlobalBonusPowerGh = (newGlobalBaseMinerPowerGh * (globalBonusPercent / 10000)) + flatBonusGh;
    const totalPowerGh = newGlobalBaseMinerPowerGh + newGlobalBonusPowerGh + tempPowerGh + gamesPowerGh + unlistedPowerGh;

    // 2. LEAGUE POWER DELTA (Room Logic)
    const powerDiffGh = leaguePowerGh - originalLeaguePowerGh;
    const totalPowerDiffGh = totalPowerGh - originalTotalPowerGh;

    const powerDiff = autoScalePower(Math.abs(powerDiffGh) * 1e9);
    const isLeagueChange = originalLeague && currentLeague.id !== originalLeague.id;

    return (
        <section className="power-simulator">
            <div className="ms-header">
                <h2><span className="section-icon">🏠</span> {t('simulator.roomTitle', 'Oda Simülatörü')}</h2>
                <p>{t('simulator.desc')}</p>
                <div className="warning-banner" style={{ marginTop: '10px', padding: '10px', background: 'rgba(255, 193, 7, 0.1)', border: '1px solid #ffc107', borderRadius: '8px', color: '#ffc107', fontSize: '0.85rem' }}>
                    ⚠️ {t('simulator.disclaimer', 'Uyarı: Buradaki hesaplanan değerler oyun içi gizli mekanikler veya eksik veriler nedeniyle hatalı olabilir. Lütfen işlemlerinizi buna dikkat ederek yapın. Sitemiz olası hatalardan kesinlikle sorumluluk kabul etmez.')}
                </div>
            </div>

            <div className="simulator-content">
                {/* Username Input */}
                <div className="user-fetcher-row" style={{ marginBottom: '1.5rem' }}>
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
                                {isFetchingUser ? (
                                    <span className="spinner small"></span>
                                ) : !canFetch ? (
                                    <span className="cooldown-text" style={{ fontSize: '13px' }}>{Math.ceil(cooldownRemaining / 1000)}s</span>
                                ) : (
                                    t('simulator.fetch')
                                )}
                            </button>
                        </div>
                    </div>
                    {fetchedUser && !simulatedRoom && (
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

                {/* Fetch Room Button */}
                {fetchedUser && !simulatedRoom && (
                    <div className="beautiful-fetch-room">
                        <div className="fetch-room-card">
                            <div className="fetch-room-icon">🔍</div>
                            <div className="fetch-room-content">
                                <h3>{t('simulator.fetchRoom', 'Odamın Verilerini Çek')}</h3>
                                <p>{t('simulator.roomFetchNote', 'Tam lig gücünüzü (envanter bonusları hariç) görmek için odanızı taratın.')}</p>
                            </div>
                            <button
                                className="premium-fetch-btn"
                                onClick={handleFetchRoom}
                                disabled={isFetchingRoom}
                            >
                                {isFetchingRoom ? (
                                    <><span className="spinner small"></span> {t('simulator.fetchingRoom', 'Taranıyor...')}</>
                                ) : (
                                    <span>{t('simulator.fetch', 'Tarat')}</span>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* Simulated Room Area */}
                {simulatedRoom && exactPower && (
                    <div className="simulated-room-container" style={{ minWidth: 0, width: '100%' }}>
                        <div className="league-power-dashboard">
                            <div className="lpd-header">
                                <div className="lpd-league">
                                    <img src={getLeagueImage(currentLeague.id)} alt={currentLeague.name} className="lpd-league-icon" />
                                    <span className="lpd-league-name">{currentLeague.name} League</span>
                                </div>
                                <div className="lpd-power">
                                    <span className="lpd-power-label">{t('simulator.leaguePower', 'League Power')}</span>
                                    <span className="lpd-power-val">{formatHashPower(autoScalePower(leaguePowerGh * 1e9))}</span>
                                </div>
                            </div>
                            <div className="lpd-stats">
                                <div className="lpd-stat">
                                    <span className="label">{t('simulator.minersPower', 'Miners Power')}</span>
                                    <span className="value">{formatHashPower(autoScalePower(exactPower.baseMinerPowerGh * 1e9))}</span>
                                </div>
                                <div className="lpd-stat">
                                    <span className="label">{t('simulator.collectionBonus', 'Collection Bonus')}</span>
                                    <span className="value">{(exactPower.collectionBonusPercent / 100).toFixed(2)}%</span>
                                </div>
                                <div className="lpd-stat">
                                    <span className="label">{t('simulator.rackPower', 'Rack Power')}</span>
                                    <span className="value">{formatHashPower(autoScalePower(exactPower.rackBonusPowerGh * 1e9))}</span>
                                </div>
                                {(exactPower.setPercentBonusPowerGh > 0 || exactPower.setBonusPowerGh > 0) && (
                                    <div className="lpd-stat">
                                        <span className="label">{t('simulator.setBonus', 'Set Bonus')}</span>
                                        <span className="value">
                                            {exactPower.setPercentBonusPowerGh > 0
                                                ? `+${formatHashPower(autoScalePower(exactPower.setPercentBonusPowerGh * 1e9))}`
                                                : ''}
                                            {exactPower.setBonusPowerGh > 0
                                                ? `${exactPower.setPercentBonusPowerGh > 0 ? ' + ' : '+'}${formatHashPower(autoScalePower(exactPower.setBonusPowerGh * 1e9))}`
                                                : ''}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {fetchedUser?.userPowerResponseDto && (
                            <div className="lpd-stats temporary-power-dashboard" style={{ marginTop: '-10px', marginBottom: '25px', padding: '15px 20px', background: 'rgba(28, 28, 40, 0.4)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                <div className="lpd-stat" style={{ flex: 1, padding: '8px', background: 'rgba(0,0,0,0.2)' }}>
                                    <span className="label" style={{ fontSize: '0.75rem' }}>{t('simulator.gamesPower', 'Oyun Gücü')}</span>
                                    <span className="value" style={{ fontSize: '1rem', color: '#0dcaf0' }}>{formatHashPower(autoScalePower(gamesPowerGh * 1e9))}</span>
                                </div>
                                <div className="lpd-stat" style={{ flex: 1, padding: '8px', background: 'rgba(0,0,0,0.2)' }}>
                                    <span className="label" style={{ fontSize: '0.75rem' }}>{t('simulator.tempPower', 'Geçici Güç')}</span>
                                    <span className="value" style={{ fontSize: '1rem', color: '#ffc107' }}>{formatHashPower(autoScalePower(tempPowerGh * 1e9))}</span>
                                </div>
                                <div className="lpd-stat" style={{ flex: 1, padding: '8px', background: 'rgba(0,0,0,0.2)' }}>
                                    <span className="label" style={{ fontSize: '0.75rem' }}>{t('simulator.freonPower', 'Freon Gücü')}</span>
                                    <span className="value" style={{ fontSize: '1rem', color: '#0dcaf0' }}>{formatHashPower(autoScalePower(freonPowerGh * 1e9))}</span>
                                </div>
                                {hamsterBonusPercent > 0 && (
                                    <div className="lpd-stat" style={{ flex: 1, padding: '8px', background: 'rgba(0,0,0,0.2)' }}>
                                        <span className="label" style={{ fontSize: '0.75rem' }}>{t('simulator.hamsterBonus', 'Hamster Bonus')}</span>
                                        <span className="value" style={{ fontSize: '1rem', color: '#ff9800' }}>{(hamsterBonusPercent / 100).toFixed(0)}% (+{formatHashPower(autoScalePower(hamsterBonusPowerGh * 1e9))})</span>
                                    </div>
                                )}
                            </div>
                        )}

                        <RoomSimulator
                            key={fetchedUser?.userProfileResponseDto?.avatar_Id || 'default'}
                            room={simulatedRoom}
                            onChange={setSimulatedRoom}
                            userId={fetchedUser?.userProfileResponseDto?.avatar_Id}
                        />

                        {originalExactPower && Math.abs(powerDiffGh) > 0.001 && (
                            <div className="simulation-results">
                                <div className="results-inner">
                                    <div className="result-row" style={{ borderBottom: '1px solid #3c3e58', paddingBottom: '15px', marginBottom: '15px' }}>
                                        <div className="result-item">
                                            <span className="label">{t('simulator.currentTotalPower', 'Mevcut Toplam Güç')}</span>
                                            <span className="value secondary">{formatHashPower(autoScalePower(originalTotalPowerGh * 1e9))}</span>
                                        </div>
                                        <div className="transition-arrow">➜</div>
                                        <div className="result-item">
                                            <span className="label">{t('simulator.newTotalPower', 'Yeni Toplam Güç')}</span>
                                            <span className="value primary">{formatHashPower(autoScalePower(totalPowerGh * 1e9))}</span>
                                            <span className={`sub-value ${totalPowerDiffGh >= 0 ? 'success' : 'danger'}`}>
                                                {totalPowerDiffGh >= 0 ? '+' : '-'}{formatHashPower(autoScalePower(Math.abs(totalPowerDiffGh) * 1e9))}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="result-row">
                                        <div className="result-item">
                                            <span className="label">{t('simulator.currentLeaguePower', 'Mevcut Lig Gücü')}</span>
                                            <span className="value secondary">{formatHashPower(autoScalePower(originalLeaguePowerGh * 1e9))}</span>
                                        </div>
                                        <div className="transition-arrow">➜</div>
                                        <div className="result-item">
                                            <span className="label">{t('simulator.newLeaguePower', 'Yeni Lig Gücü')}</span>
                                            <span className="value primary">{formatHashPower(autoScalePower(leaguePowerGh * 1e9))}</span>
                                            <span className={`sub-value ${powerDiffGh >= 0 ? 'success' : 'danger'}`}>
                                                {powerDiffGh >= 0 ? '+' : '-'}{formatHashPower(powerDiff)}
                                            </span>
                                        </div>
                                    </div>

                                    {isLeagueChange ? (
                                        <div className="league-transition">
                                            <div className="league-card">
                                                <img
                                                    src={getLeagueImage(originalLeague.id)}
                                                    alt={`${originalLeague.name} League`}
                                                />
                                                <span>{originalLeague.name}</span>
                                            </div>
                                            <div className="transition-arrow">➜</div>
                                            <div className="league-card new">
                                                <div className="new-badge">NEW!</div>
                                                <div className="move-up-text">{t('simulator.moveUp', 'New League')}</div>
                                                <img
                                                    src={getLeagueImage(currentLeague.id)}
                                                    alt={`${currentLeague.name} League`}
                                                />
                                                <span>{currentLeague.name}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="league-transition static">
                                            <div className="league-card">
                                                <img
                                                    src={getLeagueImage(originalLeague.id)}
                                                    alt={`${originalLeague.name} League`}
                                                />
                                                <span>{originalLeague.name}</span>
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
        </section>
    );
};

export default RoomPowerSimulator;
