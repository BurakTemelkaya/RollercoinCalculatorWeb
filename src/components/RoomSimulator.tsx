import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { RollercoinRoomResponse, ApiRoomRack, ApiRoomMiner } from '../types/room';
import { autoScalePower, toBaseUnit } from '../utils/powerParser';
import { guessSetByMinerName, guessSetByRackName } from '../utils/setCalculator';
import { PowerUnit } from '../types';
import { fetchUserMinersFromApi, MinerDto } from '../services/userApi';
import Notification from './Notification';
import './RoomSimulator.css';

function formatPower(powerGhs: number): string {
    if (!powerGhs) return '0 H/s';
    const baseValue = powerGhs * 1e9;
    const scaled = autoScalePower(baseValue);
    const formatted = scaled.value.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 3,
    });
    return `${formatted} ${scaled.unit}/s`;
}

interface RoomSimulatorProps {
    room: RollercoinRoomResponse;
    onChange: (newRoom: RollercoinRoomResponse) => void;
    userId?: string;
}

export const RoomSimulator: React.FC<RoomSimulatorProps> = ({ room, onChange, userId }) => {
    const { t } = useTranslation();
    const [isAddRackOpen, setIsAddRackOpen] = useState(false);
    const [addRackTarget, setAddRackTarget] = useState<{ x: number, y: number } | null>(null);
    const [isMobileMinerSearchOpen, setIsMobileMinerSearchOpen] = useState(false);
    const [currentRoomIndex, setCurrentRoomIndex] = useState(0);
    const [initialRoom] = useState<RollercoinRoomResponse>(JSON.parse(JSON.stringify(room)));
    const [history, setHistory] = useState<RollercoinRoomResponse[]>([]);

    // Notifications State
    const [notifications, setNotifications] = useState<{ id: string, message: string, type: 'success' | 'error' | 'info' }[]>([]);

    const addNotification = (message: string, type: 'success' | 'error' | 'info') => {
        const id = Date.now().toString() + Math.random().toString();
        setNotifications(prev => [...prev, { id, message, type }]);
    };

    const removeNotification = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const handleRoomChange = (newRoom: RollercoinRoomResponse) => {
        setHistory(prev => [...prev, room]);
        onChange(newRoom);
    };

    const handleUndo = () => {
        if (history.length > 0) {
            const prevRoom = history[history.length - 1];
            setHistory(h => h.slice(0, -1));
            onChange(prevRoom);
            addNotification(t('simulator.undoSuccess'), 'info');
        }
    };

    const handleReset = () => {
        if (window.confirm(t('simulator.resetConfirm', 'Tüm değişiklikleri geri alıp en baştaki haline dönmek istediğinize emin misiniz?'))) {
            onChange(initialRoom);
            setHistory([]);
            setCurrentRoomIndex(0);
            addNotification(t('simulator.roomReset'), 'info');
        }
    };

    const [newRackBonus, setNewRackBonus] = useState('0');

    // Miner Arama State'leri
    const [searchQuery, setSearchQuery] = useState('');
    const [minPower, setMinPower] = useState('');
    const [maxPower, setMaxPower] = useState('');
    const [minPowerUnit, setMinPowerUnit] = useState<PowerUnit>('Gh');
    const [maxPowerUnit, setMaxPowerUnit] = useState<PowerUnit>('Gh');

    const getMinPowerGh = () => minPower ? (toBaseUnit({ value: Number(minPower), unit: minPowerUnit }) / 1e9) : undefined;
    const getMaxPowerGh = () => maxPower ? (toBaseUnit({ value: Number(maxPower), unit: maxPowerUnit }) / 1e9) : undefined;

    const handleMinPowerSlider = (ghVal: number) => {
        const asHs = ghVal * 1e9;
        let converted = asHs;
        if (minPowerUnit === 'Th') converted = asHs / 1e12;
        else if (minPowerUnit === 'Ph') converted = asHs / 1e15;
        else if (minPowerUnit === 'Eh') converted = asHs / 1e18;
        else converted = ghVal;
        setMinPower(converted.toString());
    };

    const handleMaxPowerSlider = (ghVal: number) => {
        const asHs = ghVal * 1e9;
        let converted = asHs;
        if (maxPowerUnit === 'Th') converted = asHs / 1e12;
        else if (maxPowerUnit === 'Ph') converted = asHs / 1e15;
        else if (maxPowerUnit === 'Eh') converted = asHs / 1e18;
        else converted = ghVal;
        setMaxPower(converted.toString());
    };

    const [minBonus, setMinBonus] = useState('');
    const [maxBonus, setMaxBonus] = useState('135');
    const [minerWidth, setMinerWidth] = useState('');
    const [sortBy, setSortBy] = useState('power');
    const [isDescending, setIsDescending] = useState(true);

    const [minerList, setMinerList] = useState<MinerDto[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [pageIndex, setPageIndex] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [draggedMiner, setDraggedMiner] = useState<MinerDto | null>(null);
    const [dragTarget, setDragTarget] = useState<{ rackId: string, x: number, y: number, width: number } | null>(null);
    const [activeTooltipId, setActiveTooltipId] = useState<string | null>(null);
    const [mobileTargetRackId, setMobileTargetRackId] = useState<string | null>(null);

    const handleSearchMiners = async (page = 0) => {
        if (!userId) {
            alert(t('simulator.linkAccountAlert'));
            return;
        }

        if (!searchQuery && !minPower && !maxPower && !minBonus && !maxBonus && !minerWidth) {
            alert(t('simulator.searchFilterRequired', 'Arama yapmak için en az bir filtre (İsim, Güç, Bonus veya Boyut) girmelisiniz!'));
            return;
        }

        setIsSearching(true);
        try {
            const params: any = { PageIndex: page };
            if (searchQuery) params.Name = searchQuery;
            const minGh = getMinPowerGh();
            if (minGh !== undefined) params.MinMinerPower = minGh;
            const maxGh = getMaxPowerGh();
            if (maxGh !== undefined) params.MaxMinerPower = maxGh;
            if (minBonus) params.MinMinerBonus = Math.round(Number(minBonus) * 100);
            if (maxBonus) params.MaxMinerBonus = Math.round(Number(maxBonus) * 100);
            if (minerWidth) params.Width = Number(minerWidth);
            if (sortBy) params.SortBy = sortBy;
            params.IsDescending = isDescending;

            const res = await fetchUserMinersFromApi(params);
            setMinerList(res.items || []);
            setTotalPages(res.pages || 1);
            setPageIndex(page);
        } catch (err) {
            console.error('Miner aranırken hata:', err);
        } finally {
            setIsSearching(false);
        }
    };

    const firstInstanceMinerIds = useMemo(() => {
        const uniqueSet = new Set<string>();
        const firstIds = new Set<string>();
        (room.miners || [])
            .filter(m => m.placement?.user_rack_id)
            .forEach(miner => {
                const hash = `${miner.miner_id}_${miner.level || 0}`;
                if (!uniqueSet.has(hash)) {
                    uniqueSet.add(hash);
                    firstIds.add(miner._id);
                }
            });
        return firstIds;
    }, [room.miners]);

    const globalBasePower = useMemo(() => {
        return (room.miners || [])
            .filter(m => m.placement?.user_rack_id)
            .reduce((sum, m) => sum + (Number(m.power) || 0), 0);
    }, [room.miners]);

    // === MOBİL TESPİTİ ===
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 991);
    useEffect(() => {
        const onResize = () => setIsMobile(window.innerWidth <= 991);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    const handleDeleteRack = (rackId: string) => {
        const newRacks = (room.racks || []).filter(r => r._id !== rackId);
        const newMiners = (room.miners || []).filter(m => m.placement?.user_rack_id !== rackId);
        handleRoomChange({ ...room, racks: newRacks, miners: newMiners });
    };

    const handleDeleteMiner = (minerId: string) => {
        const newMiners = (room.miners || []).filter(m => m._id !== minerId);
        handleRoomChange({ ...room, miners: newMiners });
    };

    const handleAddRack = () => {
        try {
            const activeRoom = room.rooms ? room.rooms[currentRoomIndex] : null;
            if (!activeRoom) {
                alert(t('simulator.noActiveRoom'));
                return;
            }

            const activeRoomId = activeRoom._id;
            const activeLevel = Number(activeRoom.room_info?.level || 0);
            const roomRacks = (room.racks || []).filter(r => r.placement?.user_room_id === activeRoomId);

            const maxAllowedRacks = activeLevel === 0 ? 12 : 18;
            if (roomRacks.length >= maxAllowedRacks) {
                alert(t('simulator.maxRacksReached', { max: maxAllowedRacks }));
                setIsAddRackOpen(false);
                return;
            }

            const maxRows = activeLevel === 0 ? 2 : 3;

            let targetX = -1; let targetY = -1;

            if (addRackTarget) {
                targetX = addRackTarget.x;
                targetY = addRackTarget.y;
            } else {
                for (let y = 0; y < maxRows; y++) {
                    const config = getRowConfig(activeLevel, y);
                    for (let x = 0; x < config.capacity; x++) {
                        // Check if visual spot (x, y) is occupied
                        const isOccupied = roomRacks.some(r => {
                            const rx = Number(r.placement?.x || 0);
                            const ry = Number(r.placement?.y || 0);
                            const pos = getVisualPosition(rx, ry, activeLevel);
                            return pos.visualX === x && pos.visualY === y;
                        });
                        if (!isOccupied) {
                            targetX = x; targetY = y; break;
                        }
                    }
                    if (targetX !== -1) break;
                }
            }

            if (targetX === -1) {
                addNotification(t('simulator.roomFull'), 'error');
                setIsAddRackOpen(false);
                return;
            }

            const { apiX, apiY } = getApiPosition(targetX, targetY, activeLevel);

            const fakeId = 'mock_rack_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
            const newRack: any = {
                _id: fakeId,
                rack_id: '5a4e4aca032ecc8ffe42ed81',
                name: 'Basic Rack',
                bonus: parseFloat(newRackBonus || '0') * 100,
                cells: 8,
                type: 'rack',
                rack_info: { width: 2, height: 4 },
                placement: { room_level: activeRoom.room_info?.level || 0, user_room_id: activeRoomId, x: apiX, y: apiY }
            };

            const updatedRoom = { ...room, racks: [...(room.racks || []), newRack as ApiRoomRack] };
            handleRoomChange(updatedRoom);
            setIsAddRackOpen(false);
            setAddRackTarget(null);
            setNewRackBonus('0');
            addNotification(t('simulator.rackAddedSuccess'), 'success');
            setIsAddRackOpen(false);
        } catch (err: any) {
            addNotification(t('simulator.rackAddedError', { error: err.message }), 'error');
            console.error(err);
        }
    };

    const handleDropMiner = (e: React.DragEvent<HTMLDivElement>, rackId: string) => {
        e.preventDefault();
        setDragTarget(null);
        const minerData = e.dataTransfer.getData('miner');
        if (minerData) {
            try {
                const miner = JSON.parse(minerData) as MinerDto;

                const rect = e.currentTarget.getBoundingClientRect();
                const rack: any = (room.racks || []).find(r => r._id === rackId);
                const rackHeight = rack?.rack_info?.height || 4;
                const offsetY = e.clientY - rect.top;
                let cellY = Math.floor(offsetY / (rect.height / rackHeight));
                if (cellY < 0) cellY = 0;
                if (cellY >= rackHeight) cellY = rackHeight - 1;

                const offsetX = e.clientX - rect.left;
                let cellX = Math.floor(offsetX / (rect.width / 2));
                if (cellX < 0) cellX = 0;
                if (cellX > 1) cellX = 1;

                if (miner.width === 2) cellX = 0;

                submitAddMinerApi(miner, rackId, cellX, cellY);
            } catch (err) {
                console.error('Miner parse error', err);
            }
        }
    };

    const handleAutoPlaceMiner = (miner: MinerDto) => {
        let racks = room.racks || [];
        if (isMobile && mobileTargetRackId) {
            const targetRack = racks.find(r => r._id === mobileTargetRackId);
            if (targetRack) racks = [targetRack];
        }

        const miners = room.miners || [];

        for (const rack of racks) {
            const rackMiners = miners.filter(m => m.placement?.user_rack_id === rack._id);
            const rackHeight = (rack as any)?.rack_info?.height || 4;
            const width = miner.width || 1;

            for (let y = 0; y < rackHeight; y++) {
                if (width === 2) {
                    if (!rackMiners.some(m => m.placement?.y === y)) {
                        submitAddMinerApi(miner, rack._id, 0, y);
                        return;
                    }
                } else {
                    for (let x = 0; x < 2; x++) {
                        const taken = rackMiners.some(m => m.placement?.y === y && m.placement?.x === x);
                        const blocked = rackMiners.some(m => m.placement?.y === y && m.width === 2);
                        if (!taken && !blocked) {
                            submitAddMinerApi(miner, rack._id, x, y);
                            return;
                        }
                    }
                }
            }
        }
        addNotification('Bu minerı koyacak boş bir yer bulunamadı!', 'error');
    };

    const submitAddMinerApi = (miner: MinerDto, targetRackId: string, forceX?: number, forceY?: number) => {
        const rackMiners = (room.miners || []).filter(m => m.placement?.user_rack_id === targetRackId);
        const rack: any = (room.racks || []).find(r => r._id === targetRackId);
        const rackHeight = rack?.rack_info?.height || 4;
        const width = miner.width || 1;

        let targetX = forceX ?? -1;
        let targetY = forceY ?? -1;

        if (targetX !== -1 && targetY !== -1) {
            const taken = rackMiners.some(m => m.placement?.y === targetY && m.placement?.x === targetX);
            const blocked = rackMiners.some(m => m.placement?.y === targetY && (m.width === 2 || width === 2));
            if (taken || blocked) {
                addNotification('Hedeflenen hücre dolu!', 'error');
                return;
            }
        } else {
            for (let y = 0; y < rackHeight; y++) {
                if (width === 2) {
                    if (!rackMiners.some(m => m.placement?.y === y)) { targetY = y; targetX = 0; break; }
                } else {
                    for (let x = 0; x < 2; x++) {
                        const taken = rackMiners.some(m => m.placement?.y === y && m.placement?.x === x);
                        const blocked = rackMiners.some(m => m.placement?.y === y && m.width === 2);
                        if (!taken && !blocked) { targetY = y; targetX = x; break; }
                    }
                    if (targetY !== -1) break;
                }
            }
        }

        if (targetY === -1) { addNotification(t('simulator.rackFull'), 'error'); return; }

        let isMove = false;
        if ((miner as any).placement?.user_rack_id) {
            isMove = true;
        }

        if (isMove && targetRackId === (miner as any).placement.user_rack_id && targetX === (miner as any).placement.x && targetY === (miner as any).placement.y) {
            setDraggedMiner(null);
            setDragTarget(null);
            return;
        }

        if (isMove) {
            const takenByOther = rackMiners.some(m => m._id !== (miner as any)._id && m.placement?.y === targetY && m.placement?.x === targetX);
            const blockedByOther = rackMiners.some(m => m._id !== (miner as any)._id && m.placement?.y === targetY && (m.width === 2 || width === 2));
            if (takenByOther || blockedByOther) {
                addNotification('Hedeflenen hücre dolu!', 'error');
                return;
            }
        }

        const isMinerInRackSet = () => {
            if (!rack || !rack.rack_info || !rack.rack_info.name) return false;
            const rackSet = guessSetByRackName(rack.rack_info.name);
            if (!rackSet) return false;
            const minerSet = guessSetByMinerName(miner.name);
            return minerSet !== null && minerSet.title.en === rackSet.title.en;
        };

        const fakeId = isMove ? (miner as any)._id : ('mock_miner_' + Date.now() + '_' + Math.floor(Math.random() * 1000));
        const newMiner: ApiRoomMiner = {
            _id: fakeId, miner_id: miner.id || (miner as any).miner_id || ('mock_model_' + Date.now()), name: miner.name,
            power: miner.power, bonus_percent: miner.percent || (miner as any).bonus_percent || 0,
            width, level: miner.level || 0, type: 'miner', is_in_set: isMinerInRackSet(),
            updated: miner.createdDate || (miner as any).updated || new Date().toISOString(), filename: miner.fileName || (miner as any).filename || 'abyss_walker',
            placement: { user_rack_id: targetRackId, x: targetX, y: targetY }
        };

        if (isMove) {
            handleRoomChange({
                ...room,
                miners: (room.miners || []).map(m => m._id === fakeId ? newMiner : m)
            });
            const levelStr = (newMiner.level + 1) > 0 ? ` (Lvl ${newMiner.level + 1})` : '';
            addNotification(`${newMiner.name}${levelStr} başarıyla taşındı.`, 'success');
        } else {
            handleRoomChange({ ...room, miners: [...(room.miners || []), newMiner] });
            const levelStr = (newMiner.level + 1) > 0 ? ` (Lvl ${newMiner.level + 1})` : '';
            addNotification(t('simulator.minerAddedSuccess', { name: `${newMiner.name}${levelStr}` }), 'success');
        }
        setDraggedMiner(null);
        setDragTarget(null);
    };

    const getRowConfig = (level: number, y: number) => {
        if (level === 0) {
            if (y === 0) return { capacity: 8, offset: 0 };
            if (y === 1) return { capacity: 4, offset: 2 };
            return { capacity: 0, offset: 0 };
        } else {
            if (y === 0) return { capacity: 4, offset: 2 };
            if (y === 1) return { capacity: 8, offset: 0 };
            if (y === 2) return { capacity: 6, offset: 1 };
            return { capacity: 0, offset: 0 };
        }
    };

    const getVisualPosition = (x: number, y: number, level: number) => {
        if (level === 0) {
            if (y === 0) return { visualX: x, visualY: 0 };
            if (y === 2) return { visualX: x + 4, visualY: 0 };
            if (y === 1) return { visualX: x, visualY: 1 };
            return { visualX: x, visualY: y };
        } else {
            if (y === 0) {
                if (x < 4) return { visualX: x, visualY: 0 };
                else return { visualX: x - 4, visualY: 1 };
            }
            if (y === 1) {
                return { visualX: x + 2, visualY: 1 };
            }
            if (y === 2) {
                return { visualX: x, visualY: 2 };
            }
            return { visualX: x, visualY: y };
        }
    };

    const getApiPosition = (visualX: number, visualY: number, level: number) => {
        if (level === 0) {
            if (visualY === 0) {
                if (visualX >= 4) return { apiX: visualX - 4, apiY: 2 };
                return { apiX: visualX, apiY: 0 };
            }
            if (visualY === 1) return { apiX: visualX, apiY: 1 };
            return { apiX: visualX, apiY: visualY };
        } else {
            if (visualY === 0) {
                return { apiX: visualX, apiY: 0 };
            }
            if (visualY === 1) {
                if (visualX < 2) return { apiX: visualX + 4, apiY: 0 };
                else return { apiX: visualX - 2, apiY: 1 };
            }
            if (visualY === 2) {
                return { apiX: visualX, apiY: 2 };
            }
            return { apiX: visualX, apiY: visualY };
        }
    };

    const getMinerStyle = (width: number, mX: number, mY: number, rackHeight: number): React.CSSProperties => {
        const yOffsetsSize2 = [-25, 15, 55, 95];
        const yOffsetsSize1 = [-25, 15, 55, 95];

        const yOffsets = width === 2 ? yOffsetsSize2 : yOffsetsSize1;
        const effectiveY = rackHeight === 3 ? mY + 1 : mY;
        const finalTop = yOffsets[effectiveY] ?? 0;

        let finalLeft = 0;
        if (width === 2) {
            finalLeft = effectiveY === 0 ? 12.5 : 10;
        } else {
            finalLeft = mX === 0 ? -5 : 35;
        }

        return {
            top: `${finalTop}px`,
            left: `${finalLeft}px`,
            zIndex: 10 + effectiveY
        };
    };

    if (!room) return null;
    const userRooms = room.rooms && room.rooms.length > 0 ? room.rooms : [];
    const currentRoom = userRooms[currentRoomIndex] || null;
    if (!currentRoom) return null;
    const currentRoomLevel = currentRoom.room_info?.level || 0;
    const maxRows = currentRoomLevel === 0 ? 2 : 3;
    const currentRoomRacks = (room.racks || []).filter(r => r.placement?.user_room_id === currentRoom._id);
    const currentRoomMiners = room.miners || [];

    const colsCount = 8;

    const validDropZones: { x: number, y: number, gridX: number }[] = [];
    for (let y = 0; y < maxRows; y++) {
        const config = getRowConfig(currentRoomLevel, y);
        for (let x = 0; x < config.capacity; x++) {
            validDropZones.push({ x, y, gridX: x + config.offset });
        }
    }

    let roomBasePower = 0;
    let roomRackBonusPower = 0;
    let totalRoomBonus = 0;

    currentRoomMiners.forEach(miner => {
        const rack = currentRoomRacks.find(r => r._id === miner.placement?.user_rack_id);
        if (rack) {
            roomBasePower += Number(miner.power) || 0;
            const rackBonus = (rack as any)?.bonus || 0;
            if (rackBonus > 0) {
                roomRackBonusPower += (Number(miner.power) || 0) * (rackBonus / 10000);
            }

            const isFirst = firstInstanceMinerIds.has(miner._id);
            if (isFirst && ((miner as any).percent > 0 || miner.bonus_percent > 0)) {
                totalRoomBonus += (miner as any).percent || miner.bonus_percent || 0;
            }
        }
    });

    const totalRoomPower = roomBasePower + roomRackBonusPower;
    const roomMinerBonusPower = globalBasePower * (totalRoomBonus / 10000);
    const roomPowerWithBonus = totalRoomPower + roomMinerBonusPower;
    const effectiveRackBonusPercent = roomBasePower > 0 ? (roomRackBonusPower / roomBasePower) * 100 : 0;

    return (
        <div className="room-simulator-wrapper" onClick={() => setActiveTooltipId(null)}>
            <div className="room-sim-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 15, position: 'relative', zIndex: 10 }}>
                <span className="modal-title">
                    {t('simulator.roomTitle')}
                </span>

                <div className="room-stats-container">
                    <div className="room-stat-item">
                        <span className="rs-label">{t('simulator.roomBasePower')}</span>
                        <span className="rs-value primary">{formatPower(Number(roomBasePower))}</span>
                    </div>
                    <div className="room-stat-item">
                        <span className="rs-label">{t('simulator.rackBonuses')}</span>
                        <span className="rs-value success">+{effectiveRackBonusPercent.toFixed(2)}%</span>
                        <span className="rs-subvalue">+{formatPower(roomRackBonusPower)}</span>
                    </div>
                    <div className="room-stat-item">
                        <span className="rs-label">{t('simulator.minerBonuses')}</span>
                        <span className="rs-value success">+{(totalRoomBonus / 100).toFixed(2)}%</span>
                        <span className="rs-subvalue">+{formatPower(roomMinerBonusPower)}</span>
                    </div>
                    <div className="room-stat-item">
                        <span className="rs-label">{t('simulator.roomTotalPower')}</span>
                        <span className="rs-value highlight">{formatPower(roomPowerWithBonus)}</span>
                    </div>
                </div>
            </div>

            <div className="room-grid-area">
                <div className="room-grid-area-inner">
                    <div
                        className="racks-grid"
                        style={isMobile ? {} : {
                            gridTemplateColumns: `repeat(${colsCount}, 97px)`,
                            gridTemplateRows: `repeat(${maxRows}, 155px)`
                        }}
                    >
                        {!isMobile && validDropZones.map((zone) => (
                            <div
                                key={`dz-${zone.x}-${zone.y}`}
                                className="rack-drop-wrapper card-rack-item"
                                style={{
                                    gridColumn: zone.gridX + 1,
                                    gridRow: zone.y + 1,
                                    cursor: 'pointer'
                                }}
                                onClick={() => {
                                    setAddRackTarget({ x: zone.x, y: zone.y });
                                    setIsAddRackOpen(true);
                                }}
                                title={t('simulator.addRackHere')}
                            >
                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0 }} className="rack-drop-hover">
                                    <span style={{ fontSize: 24, color: '#fff', background: 'rgba(0,0,0,0.5)', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</span>
                                </div>
                            </div>
                        ))}

                        {(() => {
                            const sortedRacks = [...currentRoomRacks].sort((a, b) => {
                                const yA = Number(a.placement?.y || 0);
                                const yB = Number(b.placement?.y || 0);
                                if (yA !== yB) return yA - yB;
                                return Number(a.placement?.x || 0) - Number(b.placement?.x || 0);
                            });

                            return sortedRacks.map((rack, idx) => {
                                const rackX = Number(rack.placement?.x || 0);
                                const rackY = Number(rack.placement?.y || 0);
                                const { visualX, visualY } = getVisualPosition(rackX, rackY, currentRoomLevel);

                                const rackHeight = (rack as any)?.rack_info?.height || 4;
                                const rackMiners = currentRoomMiners.filter(m => m.placement?.user_rack_id === rack._id);

                                const config = getRowConfig(currentRoomLevel, visualY);
                                const gridX = visualX + config.offset;

                                return (
                                    <div
                                        key={`rack-${rack._id}`}
                                        className={`card-rack-item card-rack-item-${idx}`}
                                        onClick={() => {
                                            if (isMobile) {
                                                setMobileTargetRackId(rack._id);
                                                setIsMobileMinerSearchOpen(true);
                                            }
                                        }}
                                        onDragOver={(e) => {
                                            e.preventDefault();
                                            if (!draggedMiner) return;
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            const rackHeight = (rack as any)?.rack_info?.height || 4;

                                            const offsetY = e.clientY - rect.top;
                                            let cellY = Math.floor(offsetY / (rect.height / rackHeight));
                                            if (cellY < 0) cellY = 0;
                                            if (cellY >= rackHeight) cellY = rackHeight - 1;

                                            const offsetX = e.clientX - rect.left;
                                            let cellX = Math.floor(offsetX / (rect.width / 2));
                                            if (cellX < 0) cellX = 0;
                                            if (cellX > 1) cellX = 1;

                                            if (draggedMiner.width === 2) cellX = 0;

                                            setDragTarget({ rackId: rack._id, x: cellX, y: cellY, width: draggedMiner.width || 1 });
                                        }}
                                        onDragLeave={() => setDragTarget(null)}
                                        onDrop={(e) => handleDropMiner(e, rack._id)}
                                        style={isMobile ? {} : {
                                            gridColumn: gridX + 1,
                                            gridRow: visualY + 1
                                        }}
                                    >
                                        <img
                                            className="rack-item"
                                            src={`https://static.rollercoin.com/static/img/game/inventory/racks/${rack.rack_id}.png?v=1.2.5`}
                                            alt={rack.name}
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                if (!target.src.includes('.gif')) target.src = `https://static.rollercoin.com/static/img/game/inventory/racks/${rack.rack_id}.gif?v=1.2.5`;
                                                else target.style.display = 'none';
                                            }}
                                        />

                                        <div className={`rack-tooltip ${rackY === 0 || rackY >= 2 ? 'rack-tooltip-down' : ''}`}>
                                            <div style={{ color: '#03e1e4', fontWeight: 'bold' }}>{rack.name}</div>
                                            <div style={{ color: '#aaa' }}>{t('merge.cell')}: {(rack as any)?.rack_info?.capacity || 8}</div>
                                            {((rack as any)?.bonus || 0) > 0 && <div style={{ color: '#28a745' }}>{t('merge.bonusAmount', { amount: (((rack as any)?.bonus || 0) / 100).toFixed(2) })}</div>}
                                        </div>

                                        <div className="rack-actions-overlay">
                                            <button className="action-icon-btn" onClick={(e) => { e.stopPropagation(); handleDeleteRack(rack._id); }} title="Delete Rack">✕</button>
                                        </div>

                                        <div className="miners-block-wrapper" style={{ minHeight: '100%' }}>
                                            {dragTarget && dragTarget.rackId === rack._id && (
                                                <div style={{
                                                    position: 'absolute',
                                                    top: getMinerStyle(dragTarget.width, dragTarget.x, dragTarget.y, rackHeight).top,
                                                    left: dragTarget.width === 2 ? '4px' : (dragTarget.x === 0 ? '4px' : '48px'),
                                                    width: dragTarget.width === 2 ? '86px' : '42px',
                                                    height: '35px',
                                                    background: 'rgba(40, 167, 69, 0.4)',
                                                    border: '2px dashed #28a745',
                                                    boxSizing: 'border-box',
                                                    borderRadius: 4,
                                                    zIndex: 100,
                                                    pointerEvents: 'none',
                                                    transition: 'all 0.1s'
                                                }} />
                                            )}

                                            {rackMiners.map(miner => {
                                                const mWidth = miner.width || 1;
                                                const isBonusActive = firstInstanceMinerIds.has(miner._id);
                                                const bonusValue = (miner.bonus_percent || 0) / 100;
                                                const minerStyle = getMinerStyle(mWidth, miner.placement?.x || 0, miner.placement?.y || 0, rackHeight);

                                                return (
                                                    <div
                                                        key={miner._id}
                                                        className={`miner-img-wrapper size-${mWidth} pos-${miner.placement?.x || 0} ${activeTooltipId === miner._id ? 'active-tooltip' : ''}`}
                                                        style={{ ...minerStyle, cursor: 'grab' }}
                                                        draggable
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setActiveTooltipId(activeTooltipId === miner._id ? null : miner._id);
                                                        }}
                                                        onDragStart={(e) => {
                                                            e.stopPropagation();
                                                            e.dataTransfer.setData('miner', JSON.stringify(miner));
                                                            setDraggedMiner(miner as any);
                                                        }}
                                                        onDrag={(e) => {
                                                            if (e.clientY === 0) return;
                                                            const threshold = 80;
                                                            if (e.clientY < threshold) {
                                                                window.scrollBy(0, -10);
                                                            } else if (window.innerHeight - e.clientY < threshold) {
                                                                window.scrollBy(0, 10);
                                                            }
                                                        }}
                                                    >
                                                        <div className="miner-actions-overlay">
                                                            <button className="action-icon-btn" onClick={(e) => { e.stopPropagation(); handleDeleteMiner(miner._id); }}>✕</button>
                                                        </div>

                                                        <img
                                                            className="miner-item"
                                                            src={`https://static.rollercoin.com/static/img/market/miners/${miner.filename?.includes('.') ? miner.filename : (miner.filename + '.gif')}?v=1.2.1`}
                                                            alt={miner.name}
                                                            onError={(e) => {
                                                                const target = e.target as HTMLImageElement;
                                                                if (!target.src.includes('.png')) target.src = `https://static.rollercoin.com/static/img/market/miners/${miner.filename?.split('.')[0] || 'crypto_combo'}.png`;
                                                            }}
                                                        />

                                                        {miner.level > 0 && (
                                                            <div className={`miners-badges`}>
                                                                <img src={`https://static.rollercoin.com/static/img/storage/rarity_icons/level_${miner.level + 1}.png?v=1.0.0`} alt={miner.level.toString()} />
                                                            </div>
                                                        )}

                                                        <div className={`miner-tooltip ${(miner.placement?.y || 0) === 0 || (miner.placement?.y || 0) >= 2 ? 'miner-tooltip-down' : ''}`}>
                                                            <div className="miner-name">{miner.name}</div>
                                                            <div className="miner-stat-row">
                                                                <span>{t('merge.power')}:</span>
                                                                <span>{formatPower(Number(miner.power))}</span>
                                                            </div>
                                                            <div className="miner-stat-row">
                                                                <span>Bonus:</span>
                                                                {isBonusActive ? (
                                                                    <span style={{ color: '#03e1e4' }}>+{bonusValue.toFixed(2)}%</span>
                                                                ) : (
                                                                    <span style={{ color: '#d9534f', textDecoration: 'line-through' }}>{bonusValue.toFixed(2)}% {t('merge.copy')}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            });
                        })()}
                    </div>
                </div>

                <div className="rc-bottom-controls" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#252636', padding: '15px 25px', borderRadius: '12px', border: '1px solid #3c3e58', marginTop: 30, flexWrap: 'wrap', gap: 15 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 20, width: isMobile ? '100%' : 'auto', justifyContent: isMobile ? 'center' : 'flex-start' }}>
                        <span style={{ color: '#aaa', fontWeight: 'bold', fontSize: 18 }}>{t('simulator.rooms')}</span>
                        {userRooms.length > 0 && (
                            <div className="room-numbers" style={{ display: isMobile ? 'grid' : 'flex', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'none', gap: 10, width: isMobile ? '100%' : 'auto' }}>
                                {userRooms.map((r, idx) => (
                                    <button
                                        key={r._id || idx}
                                        onClick={() => setCurrentRoomIndex(idx)}
                                        style={{
                                            background: currentRoomIndex === idx ? '#fff' : '#1d1f33',
                                            color: currentRoomIndex === idx ? '#1a1b2e' : '#aaa',
                                            border: '1px solid #3c3e58',
                                            borderRadius: '8px',
                                            padding: '10px 18px',
                                            fontWeight: 'bold',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            fontSize: 18
                                        }}
                                    >
                                        {idx + 1}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', width: isMobile ? '100%' : 'auto' }}>
                        <button
                            className="btn-roller"
                            onClick={handleUndo}
                            disabled={history.length === 0}
                            style={{
                                padding: isMobile ? '8px 12px' : '12px 20px',
                                background: history.length === 0 ? '#444' : '#6c757d',
                                color: history.length === 0 ? '#888' : '#fff',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: isMobile ? 14 : 16, fontWeight: 'bold',
                                boxShadow: history.length === 0 ? 'none' : '0 4px 0 #5a6268',
                                cursor: history.length === 0 ? 'not-allowed' : 'pointer',
                                border: 'none', borderRadius: '8px',
                                flex: isMobile ? '1 1 auto' : 'none'
                            }}
                        >
                            <span style={{ fontSize: isMobile ? 16 : 20 }}>↩</span> {t('simulator.undo', 'Geri Al')}
                        </button>

                        <button
                            className="btn-roller"
                            onClick={handleReset}
                            style={{
                                padding: isMobile ? '8px 12px' : '12px 20px', background: '#d9534f', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: isMobile ? 14 : 16, fontWeight: 'bold',
                                boxShadow: '0 4px 0 #a94442', border: 'none', borderRadius: '8px', color: '#fff',
                                flex: isMobile ? '1 1 auto' : 'none'
                            }}
                        >
                            <span style={{ fontSize: isMobile ? 16 : 20 }}>✖</span> {t('simulator.reset', 'Sıfırla')}
                        </button>

                        <button
                            className="btn-roller"
                            onClick={() => {
                                if (currentRoomRacks.length >= validDropZones.length) {
                                    addNotification(t('simulator.cannotAddMoreRacks'), 'error');
                                    return;
                                }
                                setIsAddRackOpen(true);
                            }}
                            style={{ padding: '12px 25px', background: '#03e1e4', color: '#1a1b2e', display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 'bold', border: 'none', borderRadius: '8px' }}
                        >
                            <span style={{ fontSize: 20 }}>+</span> {t('simulator.addRack')}
                        </button>
                    </div>
                </div>
            </div>

            {/* NOTIFICATIONS */}
            {document.body && createPortal(
                <div className="notification-container" style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999999 }}>
                    {notifications.map(n => (
                        <Notification key={n.id} message={n.message} type={n.type} onClose={() => removeNotification(n.id)} />
                    ))}
                </div>,
                document.body
            )}

            {/* MODALLAR */}
            {isAddRackOpen && document.body && createPortal(
                <div className="modal-overlay" onClick={() => setIsAddRackOpen(false)} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', zIndex: 99999, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ background: '#1a1b2e', padding: 25, borderRadius: 8, minWidth: 320, border: '1px solid #514e72', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                        <h3 style={{ marginTop: 0, color: '#fff', fontSize: 20 }}>{t('simulator.addRack')}</h3>
                        <label style={{ display: 'block', marginBottom: 20, color: '#ccc', fontWeight: 'bold' }}>Bonus (%): <br /><input type="number" value={newRackBonus} onChange={e => setNewRackBonus(e.target.value)} style={{ width: '100%', padding: 10, marginTop: 8, background: '#292a3f', border: '1px solid #514e72', color: '#fff', borderRadius: 6, fontSize: 16 }} /></label>
                        <div style={{ display: 'flex', gap: 15, marginTop: 10 }}>
                            <button
                                onClick={() => setIsAddRackOpen(false)}
                                style={{
                                    flex: 1, padding: 12, background: '#d9534f', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold', fontSize: 16,
                                    boxShadow: '0 4px 0 #a94442', transition: 'transform 0.1s, box-shadow 0.1s'
                                }}
                                onMouseDown={(e) => { e.currentTarget.style.transform = 'translateY(4px)'; e.currentTarget.style.boxShadow = '0 0 0 #a94442'; }}
                                onMouseUp={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 0 #a94442'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 0 #a94442'; }}
                            >
                                {t('simulator.cancel')}
                            </button>
                            <button
                                onClick={handleAddRack}
                                style={{
                                    flex: 1, padding: 12, background: '#0275d8', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold', fontSize: 16,
                                    boxShadow: '0 4px 0 #025aa5', transition: 'transform 0.1s, box-shadow 0.1s'
                                }}
                                onMouseDown={(e) => { e.currentTarget.style.transform = 'translateY(4px)'; e.currentTarget.style.boxShadow = '0 0 0 #025aa5'; }}
                                onMouseUp={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 0 #025aa5'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 0 #025aa5'; }}
                            >
                                {t('simulator.add')}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* MINER SEARCH AND DRAG-DROP AREA */}
            {isMobile && !isMobileMinerSearchOpen && (
                <button
                    onClick={() => setIsMobileMinerSearchOpen(true)}
                    style={{ width: '100%', padding: '15px', marginTop: 20, background: '#03e1e4', color: '#1a1b2e', fontSize: 18, fontWeight: 'bold', border: 'none', borderRadius: 8, boxShadow: '0 4px 0 #02a9ab', cursor: 'pointer' }}
                >
                    🔍 {t('merge.searchMiner')}
                </button>
            )}

            {(!isMobile || isMobileMinerSearchOpen) && (
                (() => {
                    const content = (
                        <div
                            className={isMobile ? "miner-search-mobile-modal" : "miner-search-area"}
                            style={isMobile ? {
                                position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: '#1a1b2e', zIndex: 999999, overflowY: 'auto', padding: 20
                            } : { marginTop: 20 }}
                        >
                            {isMobile && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '1px solid #514e72', paddingBottom: 15 }}>
                                    <h3 style={{ margin: 0, color: '#fff', fontSize: 20 }}>{t('merge.searchMiner')}</h3>
                                    <button onClick={() => { setIsMobileMinerSearchOpen(false); setMobileTargetRackId(null); }} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: 32, cursor: 'pointer', lineHeight: 1 }}>×</button>
                                </div>
                            )}
                            <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>

                                {/* LEFT: FILTER SIDEBAR */}
                                <div className="rc-filter-container" style={{ flex: '1 1 300px', maxWidth: 400 }}>
                                    <h3 style={{ marginTop: 0, marginBottom: 20, fontSize: 18, borderBottom: '1px solid #3c3e58', paddingBottom: 10 }}>{t('merge.filters')}</h3>

                                    {/* Power range */}
                                    <div className="rc-filter-group">
                                        <label className="rc-filter-label">{t('merge.filterPower')}:</label>
                                        <div className="rc-dual-slider-container">
                                            <div className="rc-dual-slider-fill" style={{ left: `${Math.min(100, ((getMinPowerGh() || 0) / 100000000000) * 100)}%`, width: `${Math.max(0, Math.min(100, ((getMaxPowerGh() || 100000000000) / 100000000000) * 100) - Math.min(100, ((getMinPowerGh() || 0) / 100000000000) * 100))}%` }} />
                                            <input
                                                type="range"
                                                className="rc-native-slider rc-slider-min"
                                                min="0" max="100000000000" step="1000000"
                                                value={getMinPowerGh() || 0}
                                                onChange={e => handleMinPowerSlider(Math.min(Number(e.target.value), (getMaxPowerGh() || 100000000000) - 1000000))}
                                            />
                                            <input
                                                type="range"
                                                className="rc-native-slider rc-slider-max"
                                                min="0" max="100000000000" step="1000000"
                                                value={getMaxPowerGh() || 100000000000}
                                                onChange={e => handleMaxPowerSlider(Math.max(Number(e.target.value), (getMinPowerGh() || 0) + 1000000))}
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
                                                <input type="number" className="rc-filter-input" value={maxPower} onChange={e => setMaxPower(e.target.value)} placeholder={t('merge.max')} style={{ width: '100%' }} />
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
                                            <span>{t('merge.min')}: {getMinPowerGh() ? formatPower(getMinPowerGh()!) : '0'}</span>
                                            <span>{t('merge.max')}: {(getMaxPowerGh() || 100000000000) < 100000000000 ? formatPower(getMaxPowerGh()!) : t('merge.unlimited')}</span>
                                        </div>
                                    </div>

                                    {/* Bonus range */}
                                    <div className="rc-filter-group">
                                        <label className="rc-filter-label">{t('merge.filterBonus')}:</label>
                                        <div className="rc-dual-slider-container">
                                            <div className="rc-dual-slider-fill" style={{ left: `${Math.min(100, (Number(minBonus || 0) / 500) * 100)}%`, width: `${Math.max(0, Math.min(100, (Number(maxBonus || 500) / 500) * 100) - Math.min(100, (Number(minBonus || 0) / 500) * 100))}%` }} />
                                            <input
                                                type="range"
                                                className="rc-native-slider rc-slider-min"
                                                min="0" max="500" step="1"
                                                value={minBonus || 0}
                                                onChange={e => setMinBonus(Math.min(Number(e.target.value), Number(maxBonus || 500) - 1).toString())}
                                            />
                                            <input
                                                type="range"
                                                className="rc-native-slider rc-slider-max"
                                                min="0" max="500" step="1"
                                                value={maxBonus || 500}
                                                onChange={e => setMaxBonus(Math.max(Number(e.target.value), Number(minBonus || 0) + 1).toString())}
                                            />
                                        </div>
                                        <div className="rc-filter-inputs">
                                            <input type="number" className="rc-filter-input" value={minBonus} onChange={e => setMinBonus(e.target.value)} placeholder="0" />
                                            <span className="rc-filter-separator">-</span>
                                            <input type="number" className="rc-filter-input" value={maxBonus} onChange={e => setMaxBonus(e.target.value)} placeholder={t('merge.max')} />
                                            <button className="rc-filter-ok" onClick={() => handleSearchMiners(0)}>OK</button>
                                        </div>
                                    </div>

                                    {/* Cells count */}
                                    <div className="rc-filter-group">
                                        <label className="rc-filter-label">{t('merge.filterCells')}:</label>
                                        <div className="rc-checkbox-group">
                                            <label className="rc-checkbox-label">
                                                <input type="checkbox" checked={minerWidth === '1'} onChange={() => setMinerWidth(minerWidth === '1' ? '' : '1')} />
                                                <span className="rc-checkbox-custom"></span>
                                                1
                                            </label>
                                            <label className="rc-checkbox-label">
                                                <input type="checkbox" checked={minerWidth === '2'} onChange={() => setMinerWidth(minerWidth === '2' ? '' : '2')} />
                                                <span className="rc-checkbox-custom"></span>
                                                2
                                            </label>
                                        </div>
                                    </div>

                                    {/* Sort */}
                                    <div className="rc-filter-group" style={{ borderTop: '1px solid #3c3e58', paddingTop: 20 }}>
                                        <label className="rc-filter-label" style={{ marginBottom: 10 }}>{t('merge.sorting')}:</label>
                                        <div className="rc-filter-inputs">
                                            <select value={sortBy} onChange={e => { setSortBy(e.target.value); setTimeout(() => handleSearchMiners(0), 50); }} className="rc-select">
                                                <option value="power">{t('merge.sortOptions.power')}</option>
                                                <option value="percent">{t('merge.sortOptions.bonus')}</option>
                                                <option value="name">{t('merge.sortOptions.name')}</option>
                                                <option value="newest">{t('merge.sortOptions.newest')}</option>
                                            </select>
                                            <button className="rc-filter-ok" onClick={() => { setIsDescending(!isDescending); setTimeout(() => handleSearchMiners(0), 50); }} style={{ padding: '8px 10px', fontSize: 15 }}>
                                                {isDescending ? '▼' : '▲'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Search by Name */}
                                    <div className="rc-filter-group" style={{ marginTop: 20 }}>
                                        <input type="text" className="rc-search-input" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearchMiners(0)} placeholder={t('merge.searchByName')} />
                                        <button className="rc-filter-search-btn" onClick={() => handleSearchMiners(0)} disabled={isSearching}>
                                            {isSearching ? t('merge.searching') : t('merge.searchBtn')}
                                        </button>
                                    </div>
                                </div>

                                {/* RIGHT: RESULTS AREA */}
                                <div className="miner-search-results-wrapper" style={{ flex: '2 1 300px', background: '#15162a', padding: 20, borderRadius: 8, border: '1px solid #514e72' }}>
                                    <h3 style={{ marginTop: 0, color: '#fff', marginBottom: 5 }}>{t('merge.searchResults')}</h3>
                                    <p style={{ color: '#aaa', fontSize: 13, marginBottom: 15 }}>{t('merge.dragDropHint')}</p>

                                    <div className="miner-search-results" style={{ display: 'flex', flexWrap: 'wrap', gap: 10, maxHeight: 600, overflowY: 'auto', padding: 5 }}>
                                        {minerList.length === 0 ? (
                                            <div style={{ color: '#888', width: '100%', textAlign: 'center', padding: 20 }}>{t('merge.noResultsFound')}</div>
                                        ) : (
                                            minerList.map(miner => (
                                                <div
                                                    key={miner.id}
                                                    draggable
                                                    onDragStart={(e) => { e.dataTransfer.setData('miner', JSON.stringify(miner)); setDraggedMiner(miner); }}
                                                    onDragEnd={() => { setDraggedMiner(null); setDragTarget(null); }}
                                                    style={{
                                                        cursor: 'grab', background: '#2f3045', padding: 10, borderRadius: 4,
                                                        display: 'flex', flexDirection: 'column', alignItems: 'center', width: 160,
                                                        border: '1px solid #514e72', transition: 'border 0.2s', position: 'relative'
                                                    }}
                                                    onMouseEnter={(e) => e.currentTarget.style.borderColor = '#03e1e4'}
                                                    onMouseLeave={(e) => e.currentTarget.style.borderColor = '#514e72'}
                                                >
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleAutoPlaceMiner(miner); }}
                                                        style={{
                                                            position: 'absolute', top: -5, right: -5, background: '#03e1e4', color: '#1a1b2e',
                                                            border: 'none', borderRadius: '50%', width: 26, height: 26, fontSize: 18,
                                                            fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            boxShadow: '0 2px 4px rgba(0,0,0,0.4)', zIndex: 10
                                                        }}
                                                        title={t('merge.addToRoom')}
                                                    >
                                                        +
                                                    </button>
                                                    <img
                                                        src={`https://static.rollercoin.com/static/img/market/miners/${miner.fileName?.includes('.') ? miner.fileName : (miner.fileName + '.gif')}?v=1.2.1`}
                                                        style={{ width: 80, height: 'auto', pointerEvents: 'none' }}
                                                        onError={(e) => {
                                                            const target = e.target as HTMLImageElement;
                                                            if (!target.src.includes('.png')) target.src = `https://static.rollercoin.com/static/img/market/miners/${miner.fileName?.split('.')[0] || 'crypto_combo'}.png`;
                                                        }}
                                                    />
                                                    <span style={{ color: '#fff', fontSize: 13, textAlign: 'center', marginTop: 8, fontWeight: 'bold', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{miner.name}</span>
                                                    <span style={{ color: '#888', fontSize: 12 }}>Lvl {miner.level + 1} • {miner.width} Hücre</span>
                                                    <span style={{ color: '#03e1e4', fontSize: 13, marginTop: 4 }}>{formatPower(miner.power)}</span>
                                                    {miner.percent > 0 && <span style={{ color: '#28a745', fontSize: 12 }}>+{(miner.percent / 100).toFixed(2)}% Bonus</span>}
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    {totalPages > 1 && (
                                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 15, color: '#fff' }}>
                                            <button onClick={() => handleSearchMiners(pageIndex - 1)} disabled={pageIndex === 0 || isSearching} style={{ padding: '5px 10px', background: '#514e72', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>{t('pagination.previous')}</button>
                                            <span>{pageIndex + 1} / {totalPages}</span>
                                            <button onClick={() => handleSearchMiners(pageIndex + 1)} disabled={pageIndex >= totalPages - 1 || isSearching} style={{ padding: '5px 10px', background: '#514e72', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>{t('pagination.next')}</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                    return isMobile && isMobileMinerSearchOpen ? createPortal(content, document.body) : content;
                })()
            )}
        </div>
    );
};