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

    // The API's current_Power is bugged (it multiplies bonus by 100x). We recalculate it.
    const trueCurrentPower = fetchedUser?.userPowerResponseDto ? (
        fetchedUser.userPowerResponseDto.miners +
        (fetchedUser.userPowerResponseDto.miners * ((fetchedUser.userPowerResponseDto.bonus_percent || 0) / 1000000)) + // 1538050 -> 1.53805
        fetchedUser.userPowerResponseDto.racks +
        (fetchedUser.userPowerResponseDto.games || 0) +
        (fetchedUser.userPowerResponseDto.temp || 0) +
        (fetchedUser.userPowerResponseDto.freon || 0) +
        (fetchedUser.userPowerResponseDto.hamster_expedition_bonus_power || 0)
    ) : 0;

    const handleFetchRoom = () => {
        if (fetchedUser?.userProfileResponseDto?.avatar_Id && onFetchRoom) {
            onFetchRoom(fetchedUser.userProfileResponseDto.avatar_Id);
        }
    };

    // The API userPowerResponseDto.bonus_percent is scaled by 10000 (e.g. 1538050 = 153.8050%),
    // but roomParser expects it scaled by 100 (e.g. 15380.5 = 153.805%). So we divide by 100.
    const actualBonusPercent = ((fetchedUser?.userPowerResponseDto?.bonus_percent || 0) / 100) - ((fetchedUser?.userPowerResponseDto?.hamster_expedition_bonus_percent || 0) / 100);
    const exactPower = simulatedRoom ? calculateExactRoomPower(simulatedRoom, fetchedRoom, actualBonusPercent) : null;
    const leaguePowerGh = exactPower ? exactPower.totalLeaguePowerGh : 0;
    const currentLeague = getLeagueByPower(autoScalePower(leaguePowerGh * 1e9), apiLeagues || LEAGUES);

    const originalExactPower = fetchedRoom ? calculateExactRoomPower(fetchedRoom, fetchedRoom, actualBonusPercent) : null;
    const originalLeaguePowerGh = originalExactPower ? originalExactPower.totalLeaguePowerGh : 0;
    const originalLeague = getLeagueByPower(autoScalePower(originalLeaguePowerGh * 1e9), apiLeagues || LEAGUES);

    const powerDiffGh = leaguePowerGh - originalLeaguePowerGh;
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
                                    {formatHashPower(autoScalePower(trueCurrentPower * 1e9))}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Fetch Room Button (Beautifully Styled) */}
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
                                    <span className="label">{t('simulator.totalBonus', 'Total Bonus')}</span>
                                    <span className="value">{(exactPower.collectionBonusPercent / 100).toFixed(2)}%</span>
                                </div>
                                <div className="lpd-stat">
                                    <span className="label">{t('simulator.rackPower', 'Rack Power')}</span>
                                    <span className="value">{formatHashPower(autoScalePower(exactPower.rackBonusPowerGh * 1e9))}</span>
                                </div>
                            </div>
                        </div>

                        {fetchedUser?.userPowerResponseDto && (
                            <div className="lpd-stats temporary-power-dashboard" style={{ marginTop: '-10px', marginBottom: '25px', padding: '15px 20px', background: 'rgba(28, 28, 40, 0.4)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                <div className="lpd-stat" style={{ flex: 1, padding: '8px', background: 'rgba(0,0,0,0.2)' }}>
                                    <span className="label" style={{ fontSize: '0.75rem' }}>{t('simulator.gamesPower', 'Oyun Gücü')}</span>
                                    <span className="value" style={{ fontSize: '1rem', color: '#0dcaf0' }}>{formatHashPower(autoScalePower((fetchedUser.userPowerResponseDto.games || 0) * 1e9))}</span>
                                </div>
                                <div className="lpd-stat" style={{ flex: 1, padding: '8px', background: 'rgba(0,0,0,0.2)' }}>
                                    <span className="label" style={{ fontSize: '0.75rem' }}>{t('simulator.tempPower', 'Geçici Güç')}</span>
                                    <span className="value" style={{ fontSize: '1rem', color: '#ffc107' }}>{formatHashPower(autoScalePower((fetchedUser.userPowerResponseDto.temp || 0) * 1e9))}</span>
                                </div>
                                <div className="lpd-stat" style={{ flex: 1, padding: '8px', background: 'rgba(0,0,0,0.2)' }}>
                                    <span className="label" style={{ fontSize: '0.75rem' }}>{t('simulator.freonPower', 'Freon Gücü')}</span>
                                    <span className="value" style={{ fontSize: '1rem', color: '#0dcaf0' }}>{formatHashPower(autoScalePower((fetchedUser.userPowerResponseDto.freon || 0) * 1e9))}</span>
                                </div>
                            </div>
                        )}

                        <RoomSimulator
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
                                            <span className="value secondary">{formatHashPower(autoScalePower((trueCurrentPower || (originalLeaguePowerGh + (fetchedUser?.userPowerResponseDto?.games || 0) + (fetchedUser?.userPowerResponseDto?.temp || 0) + (fetchedUser?.userPowerResponseDto?.freon || 0) + (fetchedUser?.userPowerResponseDto?.hamster_expedition_bonus_power || 0))) * 1e9))}</span>
                                        </div>
                                        <div className="transition-arrow">➜</div>
                                        <div className="result-item">
                                            <span className="label">{t('simulator.newTotalPower', 'Yeni Toplam Güç')}</span>
                                            <span className="value primary">{formatHashPower(autoScalePower(((trueCurrentPower || (originalLeaguePowerGh + (fetchedUser?.userPowerResponseDto?.games || 0) + (fetchedUser?.userPowerResponseDto?.temp || 0) + (fetchedUser?.userPowerResponseDto?.freon || 0) + (fetchedUser?.userPowerResponseDto?.hamster_expedition_bonus_power || 0))) + powerDiffGh) * 1e9))}</span>
                                            <span className={`sub-value ${powerDiffGh >= 0 ? 'success' : 'danger'}`}>
                                                {powerDiffGh >= 0 ? '+' : '-'}{formatHashPower(powerDiff)}
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
