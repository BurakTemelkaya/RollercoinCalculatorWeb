import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { RollercoinRoomResponse, ApiRoomRack, ApiRoomMiner } from '../types/room';
import { autoScalePower, toBaseUnit } from '../utils/powerParser';
import { guessSetByMiner, guessSetByRackName, calculateSetBonuses } from '../utils/setCalculator';
import { PowerUnit } from '../types';
import { fetchUserMinersFromApi, MinerDto } from '../services/userApi';
import { fetchSellableMiners } from '../services/minerApi';
import type { GetRackSetListDto, GetRackListDto } from '../services/rackApi';
import { fetchRackList } from '../services/rackApi';
import Notification from './Notification';
import SpriteSheetMiner from './SpriteSheetMiner';
import CdnImage from './CdnImage';
import sellableIcon from '../assets/sellable.svg';
import { getCdnBaseUrl } from '../config/api';
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
    dynamicSets?: GetRackSetListDto[];
}

export const RoomSimulator: React.FC<RoomSimulatorProps> = ({ room, onChange, userId, dynamicSets }) => {
    const { t } = useTranslation();
    const [isInventoryCollapsed, setIsInventoryCollapsed] = useState(false);
    const [addRackTarget, setAddRackTarget] = useState<{ x: number, y: number } | null>(null);
    const [isMobileMinerSearchOpen, setIsMobileMinerSearchOpen] = useState(false);
    const [currentRoomIndex, setCurrentRoomIndex] = useState(0);
    const [initialRoom] = useState<RollercoinRoomResponse>(JSON.parse(JSON.stringify(room)));
    const [history, setHistory] = useState<RollercoinRoomResponse[]>([]);

    // Rack Edit Modal State
    const [editingRackId, setEditingRackId] = useState<string | null>(null);
    const [replacingMinerId, setReplacingMinerId] = useState<string | null>(null);
    const [replaceTargetRackId, setReplaceTargetRackId] = useState<string | null>(null);
    const inventoryRef = useRef<HTMLDivElement>(null);

    const handleInitiateAddOrReplace = (targetRackId: string | null) => {
        setReplaceTargetRackId(targetRackId);
        setEditingRackId(null);
        setIsInventoryCollapsed(false);
        setInventoryTab('miners');
        if (isMobile) {
            setIsMobileMinerSearchOpen(true);
        } else {
            setTimeout(() => {
                inventoryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        }
    };

    const handleMinerImgError = (e: React.SyntheticEvent<HTMLImageElement, Event>, cleanName: string) => {
        const target = e.currentTarget;
        const localPng = `${getCdnBaseUrl()}/miners/${cleanName}.png`;
        const rcPng = `https://static.rollercoin.com/static/img/market/miners/${cleanName}.png`;
        
        if (target.src.includes('.gif') || target.src.includes('?v=')) {
            target.src = localPng;
        } else if (target.src === localPng) {
            target.src = rcPng;
        }
    };

    const handleRackImgError = (e: React.SyntheticEvent<HTMLImageElement, Event>, rackId: string) => {
        const target = e.currentTarget;
        const localGif = `${getCdnBaseUrl()}/racks/${rackId}.gif`;
        const rcGif = `https://static.rollercoin.com/static/img/game/inventory/racks/${rackId}.gif?v=1.2.5`;
        
        if (target.src.includes('.png') || target.src.includes('?v=')) {
            target.src = localGif;
        } else if (target.src === localGif) {
            target.src = rcGif;
        } else {
            target.style.display = 'none';
        }
    };

    // Miner Inventory Toolbar State
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    useEffect(() => {
        if (room.rooms && room.rooms.length > 0) {
            if (currentRoomIndex >= room.rooms.length) {
                setCurrentRoomIndex(room.rooms.length - 1);
            }
        }
    }, [room.rooms, currentRoomIndex]);

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
        setHistory(prev => [...prev, JSON.parse(JSON.stringify(room))]);
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

    const handleSaveLayout = () => {
        try {
            localStorage.setItem(`saved_room_layout_${userId || 'default'}`, JSON.stringify(room));
            addNotification(t('simulator.layoutSaved', 'Dizilim başarıyla kaydedildi!'), 'success');
        } catch (error) {
            console.error('Error saving layout:', error);
            addNotification(t('simulator.layoutSaveError', 'Dizilim kaydedilemedi!'), 'error');
        }
    };

    const handleLoadLayout = () => {
        try {
            const savedLayout = localStorage.getItem(`saved_room_layout_${userId || 'default'}`);
            if (savedLayout) {
                if (window.confirm(t('simulator.loadConfirm', 'Kaydedilen dizilimi yüklemek mevcut diziliminizi değiştirecektir. Emin misiniz?'))) {
                    const parsedLayout = JSON.parse(savedLayout);
                    setHistory(prev => [...prev, room]);
                    onChange(parsedLayout);
                    setCurrentRoomIndex(0);
                    addNotification(t('simulator.layoutLoaded', 'Kaydedilen dizilim yüklendi!'), 'success');
                }
            } else {
                addNotification(t('simulator.noSavedLayout', 'Kaydedilmiş bir dizilim bulunamadı!'), 'error');
            }
        } catch (error) {
            console.error('Error loading layout:', error);
            addNotification(t('simulator.layoutLoadError', 'Dizilim yüklenirken hata oluştu!'), 'error');
        }
    };

    const handleAddRoom = () => {
        const rooms = room.rooms || [];
        if (rooms.length >= 4) {
            addNotification(t('simulator.maxRoomsReached', 'Maksimum 4 oda ekleyebilirsiniz.'), 'error');
            return;
        }

        const newRoomId = 'mock_room_' + Date.now();
        const newRoom: any = {
            _id: newRoomId,
            room_info: {
                room_id: 'mock_room_type',
                level: rooms.length, // 0'dan büyük olduğu için diğer odaların layout'unu (4, 8, 6) kullanacak
                cols: 8,
                rows: 3
            }
        };
        const updatedRooms = [...rooms, newRoom];
        handleRoomChange({ ...room, rooms: updatedRooms });
        setCurrentRoomIndex(updatedRooms.length - 1);
        addNotification(t('simulator.roomAddedSuccess', 'Oda başarıyla eklendi.'), 'success');
    };

    const handleDeleteRoom = () => {
        const rooms = room.rooms || [];
        if (rooms.length <= 1) {
            addNotification(t('simulator.minRoomReached', 'En az 1 oda kalmalıdır.'), 'error');
            return;
        }
        if (!window.confirm(t('simulator.deleteRoomConfirm', 'Bu odayı silmek istediğinize emin misiniz? Odanın içindeki tüm raf ve madenciler de silinecektir.'))) {
            return;
        }

        const roomToDeleteId = rooms[currentRoomIndex]._id;
        const newRooms = rooms.filter((_, idx) => idx !== currentRoomIndex);

        const newRacks = (room.racks || []).filter(r => r.placement?.user_room_id !== roomToDeleteId);
        const remainingRackIds = new Set(newRacks.map(r => r._id));
        const newMiners = (room.miners || []).filter(m => remainingRackIds.has(m.placement?.user_rack_id || ''));

        handleRoomChange({
            ...room,
            rooms: newRooms,
            racks: newRacks,
            miners: newMiners
        });

        setCurrentRoomIndex(Math.max(0, currentRoomIndex - 1));
        addNotification(t('simulator.roomDeletedSuccess', 'Oda başarıyla silindi.'), 'success');
    };

    // Inventory Tab State

    // Inventory Tab State
    const [inventoryTab, setInventoryTab] = useState<'miners' | 'racks'>('miners');

    // Rack Inventory State
    const [rackList, setRackList] = useState<GetRackListDto[]>([]);
    const [rackSearchQuery, setRackSearchQuery] = useState('');
    const [rackSortBy, setRackSortBy] = useState<'Date' | 'RackBonus'>('RackBonus');
    const [rackIsDescending, setRackIsDescending] = useState(true);
    const [rackPageIndex, setRackPageIndex] = useState(0);
    const [rackTotalPages, setRackTotalPages] = useState(1);
    const [isRackSearching, setIsRackSearching] = useState(false);

    // Miner Arama State'leri
    const [searchQuery, setSearchQuery] = useState('');

    // Auto-search effect for query
    useEffect(() => {
        if (!isSearchOpen && !isFilterOpen) return;
        const timer = setTimeout(() => {
            handleSearchMiners(0);
        }, 400);
        return () => clearTimeout(timer);
    }, [searchQuery]);
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

    const handleSearchMiners = async (page = 0) => {
        if (!userId) {
            alert(t('simulator.linkAccountAlert'));
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

    // Initial load of miners
    useEffect(() => {
        if (userId) {
            handleSearchMiners(0);
        }
    }, [userId]);

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

    // Sellable miners: fetch which miners can be sold on marketplace
    const [sellableMinerIds, setSellableMinerIds] = useState<Set<string>>(new Set());
    useEffect(() => {
        const minerIds = [...new Set((room.miners || []).map(m => m.miner_id).filter(Boolean))];
        if (minerIds.length === 0) {
            setSellableMinerIds(new Set());
            return;
        }
        fetchSellableMiners(minerIds).then(results => {
            const sellableSet = new Set<string>();
            for (const item of results) {
                if (item.isSellable) {
                    sellableSet.add(item.minerId);
                }
            }
            setSellableMinerIds(sellableSet);
        });
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
        if (editingRackId === rackId) setEditingRackId(null);
    };

    const handleDeleteMiner = (minerId: string) => {
        const newMiners = (room.miners || []).filter(m => m._id !== minerId);
        handleRoomChange({ ...room, miners: newMiners });
    };

    const handleUnmountMiners = (rackId: string) => {
        const newMiners = (room.miners || []).filter(m => m.placement?.user_rack_id !== rackId);
        handleRoomChange({ ...room, miners: newMiners });
        addNotification(t('simulator.unmountMinersSuccess'), 'success');
    };

    const handleUnmountRack = (rackId: string) => {
        handleDeleteRack(rackId);
        setEditingRackId(null);
        addNotification(t('simulator.unmountRackSuccess'), 'success');
    };

    const handleNavigateRack = (direction: 1 | -1) => {
        if (!editingRackId) return;
        const activeRoom = room.rooms ? room.rooms[currentRoomIndex] : null;
        if (!activeRoom) return;
        const racksInRoom = (room.racks || []).filter(r => r.placement?.user_room_id === activeRoom._id);
        const sortedRacks = [...racksInRoom].sort((a, b) => {
            const yA = Number(a.placement?.y || 0);
            const yB = Number(b.placement?.y || 0);
            if (yA !== yB) return yA - yB;
            return Number(a.placement?.x || 0) - Number(b.placement?.x || 0);
        });
        const currentIdx = sortedRacks.findIndex(r => r._id === editingRackId);
        if (currentIdx === -1) return;
        const newIdx = currentIdx + direction;
        if (newIdx >= 0 && newIdx < sortedRacks.length) {
            setEditingRackId(sortedRacks[newIdx]._id);
        }
    };

    const handleReplaceMiner = (newMiner: MinerDto, oldMinerId: string, rackId: string) => {
        const oldMiner = (room.miners || []).find(m => m._id === oldMinerId);
        if (!oldMiner || !oldMiner.placement) return;
        const targetX = oldMiner.placement.x;
        const targetY = oldMiner.placement.y;
        // Remove old miner first
        const minersWithoutOld = (room.miners || []).filter(m => m._id !== oldMinerId);
        // Add new miner at same position
        const rack: any = (room.racks || []).find(r => r._id === rackId);
        const width = newMiner.width || 1;
        const isMinerInRackSet = () => {
            const rackName = rack?.name || rack?.rack_info?.name;
            if (!rackName) return false;
            const rackSet = guessSetByRackName(rackName);
            if (!rackSet) return false;
            const minerObj = {
                filename: newMiner.fileName || (newMiner as any).filename,
                name: newMiner.name
            } as ApiRoomMiner;
            const minerSet = guessSetByMiner(minerObj);
            return minerSet !== null && minerSet.title.en === rackSet.title.en;
        };
        const fakeId = 'mock_miner_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
        const replacementMiner: ApiRoomMiner = {
            _id: fakeId, miner_id: newMiner.id || (newMiner as any).miner_id || ('mock_model_' + Date.now()), name: newMiner.name,
            power: newMiner.power, bonus_percent: newMiner.percent || (newMiner as any).bonus_percent || 0,
            width, level: newMiner.level || 0, type: 'miner', is_in_set: isMinerInRackSet(),
            updated: newMiner.createdDate || (newMiner as any).updated || new Date().toISOString(), filename: newMiner.fileName || (newMiner as any).filename || 'abyss_walker',
            placement: { user_rack_id: rackId, x: targetX, y: targetY }
        };
        handleRoomChange({ ...room, miners: [...minersWithoutOld, replacementMiner] });
        setReplacingMinerId(null);
        setReplaceTargetRackId(null);
        addNotification(t('simulator.minerAddedSuccess', { name: newMiner.name }), 'success');
    };



    // ---- Rack Inventory Functions ----

    const handleSearchRacks = async (page = 0) => {
        setIsRackSearching(true);
        try {
            const res = await fetchRackList({
                PageIndex: page,
                Name: rackSearchQuery || undefined,
                SortBy: rackSortBy,
                IsDescending: rackIsDescending,
            });
            setRackList(res.items || []);
            const pages = res.pages ?? (res as any).Pages ?? (res as any).totalPages ?? (res as any).TotalPages ?? (res.count && res.size ? Math.ceil(res.count / res.size) : 1);
            setRackTotalPages(pages);
            setRackPageIndex(page);
        } catch (err) {
            console.error('Rack search error:', err);
        } finally {
            setIsRackSearching(false);
        }
    };

    // Auto-search racks when query changes
    useEffect(() => {
        if (inventoryTab !== 'racks') return;
        const timer = setTimeout(() => {
            handleSearchRacks(0);
        }, 400);
        return () => clearTimeout(timer);
    }, [rackSearchQuery]);

    // Load racks when tab switches to racks
    useEffect(() => {
        if (inventoryTab === 'racks' && rackList.length === 0) {
            handleSearchRacks(0);
        }
    }, [inventoryTab]);

    const handleAddRackFromList = (rack: GetRackListDto, targetPos?: { x: number, y: number }) => {
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
                addNotification(t('simulator.maxRacksReached', { max: maxAllowedRacks }), 'error');
                return;
            }

            const maxRows = activeLevel === 0 ? 2 : 3;
            let targetX = targetPos?.x ?? -1;
            let targetY = targetPos?.y ?? -1;

            if (targetX === -1) {
                // Find first empty position
                for (let y = 0; y < maxRows; y++) {
                    const config = getRowConfig(activeLevel, y);
                    for (let x = 0; x < config.capacity; x++) {
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
                return;
            }

            const { apiX, apiY } = getApiPosition(targetX, targetY, activeLevel);

            const fakeId = 'mock_rack_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
            const newRack: any = {
                _id: fakeId,
                rack_id: rack.id,
                name: rack.name,
                bonus: rack.powerBonus,
                cells: rack.capacity,
                type: 'rack',
                rack_info: { width: 2, height: Math.ceil(rack.capacity / 2), capacity: rack.capacity },
                placement: { room_level: activeRoom.room_info?.level || 0, user_room_id: activeRoomId, x: apiX, y: apiY }
            };

            const updatedRoom = { ...room, racks: [...(room.racks || []), newRack as ApiRoomRack] };
            handleRoomChange(updatedRoom);
            setAddRackTarget(null);
            addNotification(t('simulator.rackAddedSuccess'), 'success');
        } catch (err: any) {
            addNotification(t('simulator.rackAddedError', { error: err.message }), 'error');
            console.error(err);
        }
    };

    const handleAutoPlaceRack = (rack: GetRackListDto) => {
        if (addRackTarget) {
            handleAddRackFromList(rack, addRackTarget);
            setAddRackTarget(null);
        } else {
            handleAddRackFromList(rack);
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

        if (replaceTargetRackId) {
            const targetRack = racks.find(r => r._id === replaceTargetRackId);
            if (targetRack) {
                // Try to place it in the target rack first
                racks = [targetRack, ...racks.filter(r => r._id !== replaceTargetRackId)];
            }
            setReplaceTargetRackId(null);
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
        addNotification(t('simulator.noEmptySpace'), 'error');
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
                addNotification(t('simulator.cellTaken'), 'error');
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
                addNotification(t('simulator.cellTaken'), 'error');
                return;
            }
        }

        const isMinerInRackSet = () => {
            const rackName = rack?.name || rack?.rack_info?.name;
            if (!rackName) return false;
            const rackSet = guessSetByRackName(rackName);
            if (!rackSet) return false;
            const minerObj = {
                filename: miner.fileName || (miner as any).filename,
                name: miner.name
            } as ApiRoomMiner;
            const minerSet = guessSetByMiner(minerObj);
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
            addNotification(t('simulator.minerMoved', { name: `${newMiner.name}${levelStr}` }), 'success');
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
            if (y === 1) return { visualX: x + 4, visualY: 0 };
            if (y === 2) return { visualX: x, visualY: 1 };
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
                if (visualX >= 4) return { apiX: visualX - 4, apiY: 1 };
                return { apiX: visualX, apiY: 0 };
            }
            if (visualY === 1) return { apiX: visualX, apiY: 2 };
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

    const getMinerStyle = (width: number, mX: number, mY: number, rackHeight: number, isModal: boolean = false): React.CSSProperties => {
        const effectiveY = rackHeight === 3 ? mY + 1 : mY;
        let finalTop = 0;
        let finalLeft = 0;

        // =========================================================================================
        // 🛠️ MİNER PİKSEL AYARLARI (ELLE DÜZENLEME ALANI)
        // Buradaki değerleri değiştirerek miner'ların raflardaki konumlarını ayarlayabilirsiniz.
        // =========================================================================================

        if (!isModal) {
            // --- 1) ANA ODA (MAIN ROOM) AYARLARI ---
            // İkili (Büyük) miner'ların yukarıdan aşağıya raf hizaları (Y)
            const mainTopsSize2 = [-25, 15, 55, 95];

            // Tekli (Küçük) miner'ların yukarıdan aşağıya raf hizaları (Y)
            const mainTopsSize1 = [-25, 15, 55, 95];

            // Sol-Sağ hizalamaları (X)
            const mainLeftSize2 = effectiveY === 0 ? 10 : 10; // İkili miner'ın soldan boşluğu
            const mainLeftSize1_Left = -10;  // Tekli miner soldayken (mX = 0)
            const mainLeftSize1_Right = 30; // Tekli miner sağdayken (mX = 1)

            finalTop = width === 2 ? (mainTopsSize2[effectiveY] ?? 0) : (mainTopsSize1[effectiveY] ?? 0);
            finalLeft = width === 2 ? mainLeftSize2 : (mX === 0 ? mainLeftSize1_Left : mainLeftSize1_Right);
        } else {
            // --- 2) DÜZENLE (EDIT MODAL) AYARLARI ---
            // İkili (Büyük) miner'ların yukarıdan aşağıya raf hizaları (Y)
            const modalTopsSize2 = [-30, 10, 50, 90];

            // Tekli (Küçük) miner'ların yukarıdan aşağıya raf hizaları (Y)
            const modalTopsSize1 = [-30, 10, 50, 95];

            // Sol-Sağ hizalamaları (X)
            const modalLeftSize2 = 10; // İkili miner'ın soldan boşluğu
            const modalLeftSize1_Left = -10; // Tekli miner soldayken (mX = 0)
            const modalLeftSize1_Right = 30; // Tekli miner sağdayken (mX = 1)

            finalTop = width === 2 ? (modalTopsSize2[effectiveY] ?? 0) : (modalTopsSize1[effectiveY] ?? 0);
            finalLeft = width === 2 ? modalLeftSize2 : (mX === 0 ? modalLeftSize1_Left : modalLeftSize1_Right);
        }

        // =========================================================================================

        // İzometrik perspektifte sol taraftaki (mX === 0) miner görsel olarak daha "önde" olmalıdır.
        const zIndex = 10 + (effectiveY * 2) + (mX === 0 ? 1 : 0);

        return {
            top: `${finalTop}px`,
            left: `${finalLeft}px`,
            zIndex: zIndex,
            width: "80%",
            transform: 'none'
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

    const setBonuses = calculateSetBonuses(room, dynamicSets);
    let totalSetPercentPower = 0;
    let totalSetBonusPowerGh = 0;
    for (const setBonus of setBonuses.values()) {
        totalSetPercentPower += setBonus.percent_power;
        totalSetBonusPowerGh += setBonus.bonus_power;
    }

    const roomMinerBonusPower = globalBasePower * (totalRoomBonus / 10000);
    const setPercentPowerGh = roomBasePower * (totalSetPercentPower / 10000);
    const roomPowerWithBonus = roomBasePower + roomRackBonusPower + roomMinerBonusPower + setPercentPowerGh + totalSetBonusPowerGh;
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
                    {(totalSetPercentPower > 0 || totalSetBonusPowerGh > 0) && (
                        <div className="room-stat-item">
                            <span className="rs-label">{t('simulator.setBonus')}</span>
                            <span className="rs-value success">
                                {totalSetPercentPower > 0 ? `+${(totalSetPercentPower / 100).toFixed(2)}% ` : ''}
                                {totalSetBonusPowerGh > 0 ? `+${formatPower(totalSetBonusPowerGh)}` : ''}
                            </span>
                            {totalSetPercentPower > 0 && <span className="rs-subvalue">+{formatPower(setPercentPowerGh)}</span>}
                        </div>
                    )}
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
                                    setInventoryTab('racks');
                                    setIsInventoryCollapsed(false);
                                    if (isMobile) {
                                        setIsMobileMinerSearchOpen(true);
                                    } else {
                                        setTimeout(() => {
                                            inventoryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                        }, 100);
                                    }
                                    addNotification(t('simulator.selectRackToAdd'), 'info');
                                }}
                                onDragOver={(e) => {
                                    if (e.dataTransfer.types.includes('rack')) {
                                        e.preventDefault();
                                        e.currentTarget.classList.add('rack-drop-active');
                                    }
                                }}
                                onDragLeave={(e) => {
                                    e.currentTarget.classList.remove('rack-drop-active');
                                }}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    e.currentTarget.classList.remove('rack-drop-active');
                                    const rackData = e.dataTransfer.getData('rack');
                                    if (rackData) {
                                        try {
                                            const rack = JSON.parse(rackData) as GetRackListDto;
                                            handleAddRackFromList(rack, { x: zone.x, y: zone.y });
                                        } catch (err) {
                                            console.error('Rack drop parse error', err);
                                        }
                                    }
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
                                        className={`card-rack-item card-rack-item-${idx} rack-drop-wrapper ${dragTarget?.rackId === rack._id ? 'drag-over' : ''}`}
                                        onClick={() => setEditingRackId(rack._id)}
                                        onDragOver={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            if (!draggedMiner) return;

                                            const rect = e.currentTarget.getBoundingClientRect();
                                            let cellY = Math.floor((e.clientY - rect.top) / (rect.height / rackHeight));
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
                                        style={isMobile ? { cursor: 'pointer' } : {
                                            gridColumn: gridX + 1,
                                            gridRow: visualY + 1,
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <CdnImage
                                            className="rack-item"
                                            type="rack"
                                            itemId={rack.rack_id}
                                            fallbackUrl={`https://static.rollercoin.com/static/img/game/inventory/racks/${rack.rack_id}.png?v=1.2.5`}
                                            alt={rack.name}
                                            onError={(e) => handleRackImgError(e, rack.rack_id)}
                                        />

                                        <div className={`rack-tooltip ${rackY === 0 || rackY >= 2 ? 'rack-tooltip-down' : ''}`}>
                                            <div style={{ color: '#03e1e4', fontWeight: 'bold' }}>{rack.name}</div>
                                            <div style={{ color: '#aaa' }}>{t('merge.cell')}: {(rack as any)?.rack_info?.capacity || 8}</div>
                                            {((rack as any)?.bonus || 0) > 0 && <div style={{ color: '#28a745' }}>{t('merge.bonusAmount', { amount: (((rack as any)?.bonus || 0) / 100).toFixed(2) })}</div>}
                                        </div>

                                        <div className="miners-block-wrapper" style={{ minHeight: '100%' }}>
                                            {dragTarget && dragTarget.rackId === rack._id && (() => {
                                                const style = getMinerStyle(dragTarget.width, dragTarget.x, dragTarget.y, rackHeight);
                                                const dropHighlightOffsetY = 5;
                                                return (
                                                    <div style={{
                                                        position: 'absolute',
                                                        top: `calc(${style.top} + ${dropHighlightOffsetY}px)`,
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
                                                );
                                            })()}

                                            {rackMiners.map(miner => {
                                                const mWidth = miner.width || 1;
                                                const isBonusActive = firstInstanceMinerIds.has(miner._id);
                                                const isSellable = sellableMinerIds.has(miner.miner_id);
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
                                                            setEditingRackId(rack._id);
                                                        }}
                                                        onDragStart={(e) => {
                                                            e.stopPropagation();
                                                            e.dataTransfer.setData('miner', JSON.stringify(miner));
                                                            setDraggedMiner(miner as any);

                                                            // Hide tooltip temporarily so it doesn't get captured in the drag image
                                                            const tooltip = (e.currentTarget as HTMLElement).querySelector('.miner-tooltip') as HTMLElement;
                                                            if (tooltip) tooltip.style.display = 'none';

                                                            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                                                            e.dataTransfer.setDragImage(e.currentTarget as Element, rect.width / 2, rect.height / 2);

                                                            setTimeout(() => {
                                                                if (tooltip) tooltip.style.display = '';
                                                            }, 0);
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

                                                        <SpriteSheetMiner
                                                            filename={miner.filename}
                                                            framesData={miner.frames_data}
                                                            className="miner-item"
                                                            alt={miner.name}
                                                            loading="lazy"
                                                        />

                                                        {(miner.level > 0 || !isBonusActive || isSellable) && (
                                                            <div className={`miners-badges`}>
                                                                {miner.level > 0 && (
                                                                    <img src={miner.type === 'old_merge' ? '/miner-levels/level_star.png' : `/miner-levels/level_${miner.level + 1}.webp`} alt={miner.level.toString()} />
                                                                )}
                                                                {isSellable && (
                                                                    <img className="sellable-badge" src={sellableIcon} alt="Sellable" title={t('simulator.sellableMiner', 'Satılabilir')} />
                                                                )}
                                                                {!isBonusActive && (
                                                                    <div className="duplicate-badge" title={t('simulator.duplicateMiner', 'Kopya Miner')}>
                                                                        2x
                                                                    </div>
                                                                )}
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
                                {(userRooms.length < 4) && (
                                    <button
                                        onClick={handleAddRoom}
                                        style={{
                                            background: '#03e1e4',
                                            color: '#1a1b2e',
                                            border: 'none',
                                            borderRadius: '8px',
                                            padding: '10px 18px',
                                            fontWeight: 'bold',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            fontSize: 18,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                        title={t('simulator.addRoom', 'Oda Ekle')}
                                    >
                                        +
                                    </button>
                                )}
                                {(userRooms.length > 1) && (
                                    <button
                                        onClick={handleDeleteRoom}
                                        style={{
                                            background: '#d9534f',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: '8px',
                                            padding: '10px 18px',
                                            fontWeight: 'bold',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            fontSize: 18,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                        title={t('simulator.deleteRoom', 'Odayı Sil')}
                                    >
                                        🗑
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', width: isMobile ? '100%' : 'auto' }}>
                        <button
                            className="btn-roller"
                            onClick={handleUndo}
                            title={t('simulator.undo', 'Geri Al')}
                            disabled={history.length === 0}
                            style={{
                                padding: isMobile ? '10px 14px' : '12px 24px',
                                background: history.length === 0 ? '#444' : '#6c757d',
                                color: history.length === 0 ? '#888' : '#fff',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isMobile ? 18 : 22, fontWeight: 'bold',
                                boxShadow: history.length === 0 ? 'none' : '0 4px 0 #5a6268',
                                cursor: history.length === 0 ? 'not-allowed' : 'pointer',
                                border: 'none', borderRadius: '8px',
                                flex: isMobile ? '1 1 auto' : 'none'
                            }}
                        >
                            ↩
                        </button>

                        <button
                            className="btn-roller"
                            onClick={handleReset}
                            title={t('simulator.reset', 'Sıfırla')}
                            style={{
                                padding: isMobile ? '10px 14px' : '12px 24px', background: '#d9534f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isMobile ? 18 : 22, fontWeight: 'bold',
                                boxShadow: '0 4px 0 #a94442', border: 'none', borderRadius: '8px', color: '#fff',
                                flex: isMobile ? '1 1 auto' : 'none'
                            }}
                        >
                            ✖
                        </button>

                        <button
                            className="btn-roller"
                            onClick={handleSaveLayout}
                            title={t('simulator.saveLayout', 'Kaydet')}
                            style={{
                                padding: isMobile ? '10px 14px' : '12px 24px', background: '#35536F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isMobile ? 18 : 22, fontWeight: 'bold',
                                boxShadow: '0 4px 0 #20354A', border: 'none', borderRadius: '8px', color: '#fff',
                                flex: isMobile ? '1 1 auto' : 'none'
                            }}
                        >
                            💾
                        </button>

                        <button
                            className="btn-roller"
                            onClick={handleLoadLayout}
                            title={t('simulator.loadLayout', 'Yükle')}
                            style={{
                                padding: isMobile ? '10px 14px' : '12px 24px', background: '#7798B5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isMobile ? 18 : 22, fontWeight: 'bold',
                                boxShadow: '0 4px 0 #587994', border: 'none', borderRadius: '8px', color: '#fff',
                                flex: isMobile ? '1 1 auto' : 'none'
                            }}
                        >
                            📂
                        </button>

                        <button
                            className="btn-roller"
                            onClick={() => {
                                if (currentRoomRacks.length >= validDropZones.length) {
                                    addNotification(t('simulator.cannotAddMoreRacks', 'Daha fazla raf ekleyemezsiniz.'), 'error');
                                    return;
                                }
                                setInventoryTab('racks');
                                setIsInventoryCollapsed(false);
                                if (isMobile) {
                                    setIsMobileMinerSearchOpen(true);
                                } else {
                                    setTimeout(() => {
                                        inventoryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                    }, 100);
                                }
                            }}
                            title={t('simulator.addRack', 'Raf Ekle')}
                            style={{
                                padding: isMobile ? '10px 14px' : '12px 24px', background: '#03e1e4', color: '#1a1b2e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isMobile ? 18 : 22, fontWeight: 'bold', border: 'none', borderRadius: '8px',
                                flex: isMobile ? '1 1 auto' : 'none'
                            }}
                        >
                            ➕
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

            {/* RACK EDIT MODAL */}
            {editingRackId && document.body && createPortal(
                (() => {
                    const editingRack = (room.racks || []).find(r => r._id === editingRackId);
                    if (!editingRack) return null;
                    const rackMiners = (room.miners || []).filter(m => m.placement?.user_rack_id === editingRackId);
                    const rackHeight = (editingRack as any)?.rack_info?.height || 4;
                    const rackBonus = ((editingRack as any)?.bonus || 0) / 100;

                    // Find slot index
                    const activeRoom = room.rooms ? room.rooms[currentRoomIndex] : null;
                    const racksInRoom = activeRoom ? (room.racks || []).filter(r => r.placement?.user_room_id === activeRoom._id) : [];
                    const sortedRacksForNav = [...racksInRoom].sort((a, b) => {
                        const yA = Number(a.placement?.y || 0);
                        const yB = Number(b.placement?.y || 0);
                        if (yA !== yB) return yA - yB;
                        return Number(a.placement?.x || 0) - Number(b.placement?.x || 0);
                    });
                    const currentSlotIdx = sortedRacksForNav.findIndex(r => r._id === editingRackId);

                    // Build slot rows
                    const slotRows: (typeof rackMiners[0] | null)[][] = [];
                    for (let y = 0; y < rackHeight; y++) {
                        const minersAtY = rackMiners.filter(m => m.placement?.y === y);
                        const has2Wide = minersAtY.some(m => m.width === 2);
                        if (has2Wide) {
                            slotRows.push([minersAtY[0] || null]);
                        } else {
                            const left = minersAtY.find(m => m.placement?.x === 0) || null;
                            const right = minersAtY.find(m => m.placement?.x === 1) || null;
                            if (left || right) {
                                slotRows.push([left, right]);
                            } else {
                                slotRows.push([null, null]);
                            }
                        }
                    }

                    return (
                        <div className="rack-edit-overlay" onClick={() => { setEditingRackId(null); setReplacingMinerId(null); setReplaceTargetRackId(null); }}>
                            <div className="rack-edit-modal" onClick={e => e.stopPropagation()}>
                                <div className="rack-edit-header">
                                    <h3>{t('simulator.editRack')}</h3>
                                    <button className="rack-edit-close" onClick={() => { setEditingRackId(null); setReplacingMinerId(null); setReplaceTargetRackId(null); }}>✕</button>
                                </div>
                                <div className="rack-edit-body">
                                    <div className="rack-edit-preview">
                                        <div className="card-rack-item" style={{ flexShrink: 0, minWidth: 97, minHeight: 155, transform: isMobile ? 'scale(0.8)' : 'scale(1.2)', transformOrigin: 'center center', pointerEvents: 'none' }}>
                                            <CdnImage
                                                className="rack-item"
                                                type="rack"
                                                itemId={editingRack.rack_id}
                                                fallbackUrl={`https://static.rollercoin.com/static/img/game/inventory/racks/${editingRack.rack_id}.png?v=1.2.5`}
                                                alt={editingRack.name}
                                                style={{ display: 'block' }}
                                                onError={(e) => handleRackImgError(e, editingRack.rack_id)}
                                            />
                                            <div className="miners-block-wrapper" style={{ minHeight: '100%' }}>
                                                {rackMiners.map(miner => {
                                                    const mWidth = miner.width || 1;
                                                    const isBonusActive = firstInstanceMinerIds.has(miner._id);
                                                    const isSellable = sellableMinerIds.has(miner.miner_id);
                                                    const minerStyle = getMinerStyle(mWidth, miner.placement?.x || 0, miner.placement?.y || 0, rackHeight, true);
                                                    return (
                                                        <div
                                                            key={`preview-${miner._id}`}
                                                            className={`miner-img-wrapper size-${mWidth} pos-${miner.placement?.x || 0}`}
                                                            style={{ ...minerStyle, cursor: 'default' }}
                                                        >
                                                            <SpriteSheetMiner
                                                                filename={miner.filename}
                                                                framesData={miner.frames_data}
                                                                className="miner-item"
                                                                alt={miner.name}
                                                            />
                                                            {(miner.level > 0 || !isBonusActive || isSellable) && (
                                                                <div className="miners-badges">
                                                                    {miner.level > 0 && (
                                                                        <img src={miner.type === 'old_merge' ? '/miner-levels/level_star.png' : `/miner-levels/level_${miner.level + 1}.webp`} alt={miner.level.toString()} />
                                                                    )}
                                                                    {isSellable && (
                                                                        <img className="sellable-badge" src={sellableIcon} alt="Sellable" title={t('simulator.sellableMiner', 'Satılabilir')} />
                                                                    )}
                                                                    {!isBonusActive && (
                                                                        <div className="duplicate-badge" title={t('simulator.duplicateMiner', 'Kopya Miner')}>
                                                                            2x
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="rack-edit-content">
                                        {/* Navigation */}
                                        <div className="rack-edit-nav">
                                            <button className="rack-edit-nav-btn" onClick={() => handleNavigateRack(-1)} disabled={currentSlotIdx <= 0}>‹</button>
                                            <span className="rack-edit-nav-label">
                                                {t('simulator.slotLabel', { room: currentRoomIndex + 1, slot: currentSlotIdx + 1 })}
                                            </span>
                                            <button className="rack-edit-nav-btn" onClick={() => handleNavigateRack(1)} disabled={currentSlotIdx >= sortedRacksForNav.length - 1}>›</button>
                                        </div>

                                        {/* Rack info */}
                                        <div className="rack-edit-info">
                                            <div className="rack-edit-info-left">
                                                <span className="rack-edit-rack-name">{editingRack.name}</span>
                                                {rackBonus > 0 && <span className="rack-edit-rack-bonus">+{rackBonus.toFixed(2)}%</span>}
                                            </div>
                                            <div className="rack-edit-info-actions">
                                                <button className="rack-edit-unmount-btn" onClick={() => handleUnmountMiners(editingRackId)}>
                                                    <span>⬆</span> {t('simulator.unmountMiners')}
                                                </button>
                                                <button className="rack-edit-unmount-btn danger" onClick={() => handleUnmountRack(editingRackId)}>
                                                    <span>✕</span> {t('simulator.unmountRack')}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Miner slots */}
                                        <div className="rack-edit-slots">
                                            {slotRows.map((row, rowIdx) => (
                                                <div key={rowIdx} className="rack-edit-slot-row">
                                                    {row.map((miner, colIdx) => {
                                                        if (miner) {
                                                            const isBonusActive = firstInstanceMinerIds.has(miner._id);
                                                            const isSellable = sellableMinerIds.has(miner.miner_id);
                                                            const bonusValue = (miner.bonus_percent || 0) / 100;
                                                            return (
                                                                <div key={miner._id} className={`rack-edit-miner-card ${miner.width === 2 ? 'full-width' : ''}`}>
                                                                    <div className="rack-edit-miner-img-wrapper">
                                                                        <SpriteSheetMiner
                                                                            filename={miner.filename}
                                                                            framesData={miner.frames_data}
                                                                            className="rack-edit-miner-img"
                                                                            alt={miner.name}
                                                                        />
                                                                        {(miner.level > 0 || !isBonusActive || isSellable) && (
                                                                            <div className="miners-badges" style={{ top: 2, left: 2, flexWrap: 'wrap', maxWidth: '56px' }}>
                                                                                {miner.level > 0 && (
                                                                                    <img src={miner.type === 'old_merge' ? '/miner-levels/level_star.png' : `/miner-levels/level_${miner.level + 1}.webp`} alt={`Lvl ${miner.level + 1}`} style={{ width: 14, height: 14 }} />
                                                                                )}
                                                                                {isSellable && (
                                                                                    <img className="sellable-badge" src={sellableIcon} alt="Sellable" title={t('simulator.sellableMiner', 'Satılabilir')} />
                                                                                )}
                                                                                {!isBonusActive && (
                                                                                    <div className="duplicate-badge" title={t('simulator.duplicateMiner', 'Kopya Miner')}>
                                                                                        2x
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <div className="rack-edit-miner-info">
                                                                        <span className="rack-edit-miner-name">{miner.name}</span>
                                                                        <div className="rack-edit-miner-stats">
                                                                            <span className="rack-edit-miner-power">{formatPower(Number(miner.power))}</span>
                                                                            {bonusValue > 0 && (
                                                                                <span className={`rack-edit-miner-bonus ${!isBonusActive ? 'inactive' : ''}`}>
                                                                                    {isBonusActive ? `${bonusValue.toFixed(1)}%` : `${bonusValue.toFixed(1)}%`}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    <div className="rack-edit-miner-actions">
                                                                        <button
                                                                            className="rack-edit-action-btn"
                                                                            title={t('simulator.replaceMiner')}
                                                                            onClick={() => {
                                                                                setReplacingMinerId(miner._id);
                                                                                handleInitiateAddOrReplace(editingRackId);
                                                                                addNotification(t('simulator.selectMinerToReplace', 'Envanterden yeni madenciyi seçin'), 'info');
                                                                            }}
                                                                        >⟳</button>
                                                                        <button
                                                                            className="rack-edit-action-btn delete"
                                                                            onClick={() => { handleDeleteMiner(miner._id); addNotification(t('simulator.minerDeleted'), 'info'); }}
                                                                        >✕</button>
                                                                    </div>
                                                                </div>
                                                            );
                                                        } else {
                                                            return (
                                                                <div
                                                                    key={`empty-${rowIdx}-${colIdx}`}
                                                                    className="rack-edit-miner-card empty"
                                                                    style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5, transition: 'all 0.2s' }}
                                                                    onClick={() => {
                                                                        handleInitiateAddOrReplace(editingRackId);
                                                                        addNotification(t('simulator.selectMinerToAdd', 'Eklenecek madenciyi seçin'), 'info');
                                                                    }}
                                                                >
                                                                    <span style={{ color: '#03e1e4', fontSize: 24, fontWeight: 'bold' }}>+</span>
                                                                    <span style={{ color: '#aaa', fontSize: 13, marginTop: 4 }}>{t('simulator.addMiner', 'Ekle')}</span>
                                                                </div>
                                                            );
                                                        }
                                                    })}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })(),
                document.body
            )}

            {isMobile && !isMobileMinerSearchOpen && (
                <button
                    onClick={() => setIsMobileMinerSearchOpen(true)}
                    style={{ width: '100%', padding: '15px', marginTop: 20, background: '#03e1e4', color: '#1a1b2e', fontSize: 18, fontWeight: 'bold', border: 'none', borderRadius: 8, boxShadow: '0 4px 0 #02a9ab', cursor: 'pointer' }}
                >
                    🔍 {t('merge.searchMiner')}
                </button>
            )}

            {/* MINER INVENTORY TOOLBAR & MOBILE MODAL */}
            {(!isMobile || isMobileMinerSearchOpen) && (
                (() => {
                    const desktopContent = (
                        <div ref={inventoryRef} className={`inventory-toolbar-wrapper ${isInventoryCollapsed ? 'collapsed' : ''}`}>
                            {/* Toolbar bar */}
                            <div className="inventory-toolbar">
                                <div className="inventory-toolbar-left">
                                    {inventoryTab === 'miners' ? (
                                        isSearchOpen ? (
                                            <div className="inv-search-bar">
                                                <input
                                                    type="text"
                                                    className="inv-search-input"
                                                    value={searchQuery}
                                                    onChange={e => setSearchQuery(e.target.value)}
                                                    onKeyDown={e => e.key === 'Enter' && handleSearchMiners(0)}
                                                    placeholder={t('merge.searchByName')}
                                                    autoFocus
                                                />
                                                <button className="inv-search-close" onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }}>✕</button>
                                            </div>
                                        ) : (
                                            <>
                                                <button className="inv-icon-btn" onClick={() => setIsSearchOpen(true)} title={t('merge.searchMiner')}>
                                                    🔍
                                                </button>
                                                <button className={`inv-icon-btn ${isFilterOpen ? 'active' : ''}`} onClick={() => setIsFilterOpen(!isFilterOpen)} title={t('merge.filters')}>
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
                                                </button>
                                                <select
                                                    className="inv-sort-select"
                                                    value={`${sortBy}-${isDescending ? 'desc' : 'asc'}`}
                                                    onChange={e => {
                                                        const [newSort, dir] = e.target.value.split('-');
                                                        setSortBy(newSort);
                                                        setIsDescending(dir === 'desc');
                                                        setTimeout(() => handleSearchMiners(0), 50);
                                                    }}
                                                >
                                                    <option value="newest-desc">{t('merge.sortOptions.newest')} ↓</option>
                                                    <option value="newest-asc">{t('merge.sortOptions.newest')} ↑</option>
                                                    <option value="power-desc">{t('merge.sortOptions.power')} ↓</option>
                                                    <option value="power-asc">{t('merge.sortOptions.power')} ↑</option>
                                                    <option value="percent-desc">{t('merge.sortOptions.bonus')} ↓</option>
                                                    <option value="percent-asc">{t('merge.sortOptions.bonus')} ↑</option>
                                                    <option value="name-asc">{t('merge.sortOptions.name')} A-Z</option>
                                                    <option value="name-desc">{t('merge.sortOptions.name')} Z-A</option>
                                                </select>
                                            </>
                                        )
                                    ) : (
                                        // RACKS TOOLBAR LEFT
                                        isSearchOpen ? (
                                            <div className="inv-search-bar">
                                                <input
                                                    type="text"
                                                    className="inv-search-input"
                                                    value={rackSearchQuery}
                                                    onChange={e => setRackSearchQuery(e.target.value)}
                                                    onKeyDown={e => e.key === 'Enter' && handleSearchRacks(0)}
                                                    placeholder={t('simulator.searchRack', 'Raf ara...')}
                                                    autoFocus
                                                />
                                                <button className="inv-search-close" onClick={() => { setIsSearchOpen(false); setRackSearchQuery(''); }}>✕</button>
                                            </div>
                                        ) : (
                                            <>
                                                <button className="inv-icon-btn" onClick={() => setIsSearchOpen(true)} title={t('merge.searchMiner')}>
                                                    🔍
                                                </button>
                                                <select
                                                    className="inv-sort-select"
                                                    value={`${rackSortBy}-${rackIsDescending ? 'desc' : 'asc'}`}
                                                    onChange={e => {
                                                        const [newSort, dir] = e.target.value.split('-');
                                                        setRackSortBy(newSort as 'Date' | 'RackBonus');
                                                        setRackIsDescending(dir === 'desc');
                                                        setTimeout(() => handleSearchRacks(0), 50);
                                                    }}
                                                >
                                                    <option value="RackBonus-desc">{t('simulator.rackSortBonus')} ↓</option>
                                                    <option value="RackBonus-asc">{t('simulator.rackSortBonus')} ↑</option>
                                                    <option value="Date-desc">{t('simulator.rackSortDate')} ↓</option>
                                                    <option value="Date-asc">{t('simulator.rackSortDate')} ↑</option>
                                                </select>
                                            </>
                                        )
                                    )}
                                </div>

                                <div className="inv-tabs">
                                    <button
                                        className={`inv-tab ${inventoryTab === 'racks' ? 'active' : ''}`}
                                        onClick={() => { setInventoryTab('racks'); setIsFilterOpen(false); }}
                                    >
                                        {t('simulator.racksTab')}
                                    </button>
                                    <button
                                        className={`inv-tab ${inventoryTab === 'miners' ? 'active' : ''}`}
                                        onClick={() => setInventoryTab('miners')}
                                    >
                                        {t('simulator.minersTab')}
                                    </button>
                                </div>

                                <div className="inventory-toolbar-right">
                                    <button
                                        className="inv-nav-btn"
                                        onClick={() => inventoryTab === 'miners' ? handleSearchMiners(pageIndex - 1) : handleSearchRacks(rackPageIndex - 1)}
                                        disabled={inventoryTab === 'miners' ? (pageIndex === 0 || isSearching) : (rackPageIndex === 0 || isRackSearching)}
                                    >‹</button>
                                    <button
                                        className="inv-nav-btn"
                                        onClick={() => inventoryTab === 'miners' ? handleSearchMiners(pageIndex + 1) : handleSearchRacks(rackPageIndex + 1)}
                                        disabled={inventoryTab === 'miners' ? (pageIndex >= totalPages - 1 || isSearching) : (rackPageIndex >= rackTotalPages - 1 || isRackSearching)}
                                    >›</button>
                                    <button className="inv-nav-btn" onClick={() => setIsInventoryCollapsed(!isInventoryCollapsed)}>
                                        {isInventoryCollapsed ? '▲' : '▼'}
                                    </button>
                                </div>
                            </div>

                            {/* Filter panel (expandable) */}
                            {isFilterOpen && (
                                <div className="inventory-filter-panel">
                                    {/* Power range */}
                                    <div className="inv-filter-section">
                                        <label>{t('merge.filterPower')}:</label>
                                        <div className="rc-dual-slider-container">
                                            <div className="rc-dual-slider-fill" style={{ left: `${Math.min(100, ((getMinPowerGh() || 0) / 100000000000) * 100)}%`, width: `${Math.max(0, Math.min(100, ((getMaxPowerGh() || 100000000000) / 100000000000) * 100) - Math.min(100, ((getMinPowerGh() || 0) / 100000000000) * 100))}%` }} />
                                            <input type="range" className="rc-native-slider rc-slider-min" min="0" max="100000000000" step="1000000" value={getMinPowerGh() || 0} onChange={e => handleMinPowerSlider(Math.min(Number(e.target.value), (getMaxPowerGh() || 100000000000) - 1000000))} />
                                            <input type="range" className="rc-native-slider rc-slider-max" min="0" max="100000000000" step="1000000" value={getMaxPowerGh() || 100000000000} onChange={e => handleMaxPowerSlider(Math.max(Number(e.target.value), (getMinPowerGh() || 0) + 1000000))} />
                                        </div>
                                        <div className="rc-filter-inputs" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '6px' }}>
                                            <div style={{ display: 'flex', gap: '4px' }}>
                                                <input type="number" className="rc-filter-input" value={minPower} onChange={e => setMinPower(e.target.value)} placeholder="0" style={{ width: '100%' }} />
                                                <select className="rc-select" value={minPowerUnit} onChange={e => setMinPowerUnit(e.target.value as PowerUnit)} style={{ padding: '0 4px' }}>
                                                    <option value="Gh">Gh</option><option value="Th">Th</option><option value="Ph">Ph</option><option value="Eh">Eh</option>
                                                </select>
                                            </div>
                                            <div style={{ display: 'flex', gap: '4px' }}>
                                                <input type="number" className="rc-filter-input" value={maxPower} onChange={e => setMaxPower(e.target.value)} placeholder={t('merge.max')} style={{ width: '100%' }} />
                                                <select className="rc-select" value={maxPowerUnit} onChange={e => setMaxPowerUnit(e.target.value as PowerUnit)} style={{ padding: '0 4px' }}>
                                                    <option value="Gh">Gh</option><option value="Th">Th</option><option value="Ph">Ph</option><option value="Eh">Eh</option>
                                                </select>
                                            </div>
                                            <button className="rc-filter-ok" onClick={() => handleSearchMiners(0)}>OK</button>
                                        </div>
                                    </div>

                                    {/* Bonus range */}
                                    <div className="inv-filter-section">
                                        <label>{t('merge.filterBonus')}:</label>
                                        <div className="rc-dual-slider-container">
                                            <div className="rc-dual-slider-fill" style={{ left: `${Math.min(100, (Number(minBonus || 0) / 500) * 100)}%`, width: `${Math.max(0, Math.min(100, (Number(maxBonus || 500) / 500) * 100) - Math.min(100, (Number(minBonus || 0) / 500) * 100))}%` }} />
                                            <input type="range" className="rc-native-slider rc-slider-min" min="0" max="500" step="1" value={minBonus || 0} onChange={e => setMinBonus(Math.min(Number(e.target.value), Number(maxBonus || 500) - 1).toString())} />
                                            <input type="range" className="rc-native-slider rc-slider-max" min="0" max="500" step="1" value={maxBonus || 500} onChange={e => setMaxBonus(Math.max(Number(e.target.value), Number(minBonus || 0) + 1).toString())} />
                                        </div>
                                        <div className="rc-filter-inputs">
                                            <input type="number" className="rc-filter-input" value={minBonus} onChange={e => setMinBonus(e.target.value)} placeholder="0" />
                                            <span className="rc-filter-separator">-</span>
                                            <input type="number" className="rc-filter-input" value={maxBonus} onChange={e => setMaxBonus(e.target.value)} placeholder={t('merge.max')} />
                                            <button className="rc-filter-ok" onClick={() => handleSearchMiners(0)}>OK</button>
                                        </div>
                                    </div>

                                    {/* Cells count */}
                                    <div className="inv-filter-cells">
                                        <label style={{ color: '#ccc', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{t('merge.filterCells')}:</label>
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

                                    {/* Filter actions (clear + close) */}
                                    <div className="inv-filter-actions">
                                        <button className="inv-filter-action-btn danger" onClick={() => { setMinPower(''); setMaxPower(''); setMinBonus(''); setMaxBonus('135'); setMinerWidth(''); }} title={t('simulator.clearFilters')}>🗑</button>
                                        <button className="inv-filter-action-btn" onClick={() => setIsFilterOpen(false)} title={t('simulator.closeFilters')}>✕</button>
                                    </div>
                                </div>
                            )}

                            {/* Content grid */}
                            {!isInventoryCollapsed && (
                                <div className="inventory-miner-grid">
                                    {inventoryTab === 'miners' ? (
                                        minerList.length === 0 ? (
                                            <div className="inv-miner-card-empty">
                                                {isSearching ? t('merge.searching') : t('merge.noResultsFound')}
                                            </div>
                                        ) : (
                                            minerList.map(miner => (
                                                <div
                                                    key={miner.id}
                                                    className="inv-miner-card"
                                                    draggable
                                                    onDragStart={(e) => {
                                                        e.dataTransfer.setData('miner', JSON.stringify(miner));
                                                        setDraggedMiner(miner);
                                                        const imgWrapper = (e.currentTarget as HTMLElement).querySelector('.inv-miner-card-img-wrapper');
                                                        if (imgWrapper) {
                                                            const rect = imgWrapper.getBoundingClientRect();
                                                            e.dataTransfer.setDragImage(imgWrapper as Element, rect.width / 2, rect.height / 2);
                                                        }
                                                    }}
                                                    onDragEnd={() => { setDraggedMiner(null); setDragTarget(null); }}
                                                    onClick={() => {
                                                        if (replacingMinerId && replaceTargetRackId) {
                                                            handleReplaceMiner(miner, replacingMinerId, replaceTargetRackId);
                                                        } else {
                                                            handleAutoPlaceMiner(miner);
                                                        }
                                                    }}
                                                >
                                                    <div className="inv-miner-card-img-wrapper">
                                                        {miner.level > 0 && (
                                                            <div className="inv-miner-card-badge">
                                                                <img src={miner.type === 'old_merge' ? '/miner-levels/level_star.png' : `/miner-levels/level_${miner.level + 1}.webp`} alt={`Lvl ${miner.level + 1}`} />
                                                            </div>
                                                        )}
                                                        <CdnImage
                                                            className="inv-miner-card-img"
                                                            type="miner"
                                                            itemId={miner.fileName?.split('.')[0] || ''}
                                                            fallbackUrl={`https://static.rollercoin.com/static/img/market/miners/${miner.fileName?.includes('.') ? miner.fileName : (miner.fileName + '.gif')}?v=1.2.1`}
                                                            alt={miner.name}
                                                            loading="lazy"
                                                            onError={(e) => handleMinerImgError(e, miner.fileName?.split('.')[0] || 'crypto_combo')}
                                                        />
                                                    </div>
                                                    <span className="inv-miner-card-name">{miner.name}</span>
                                                    <span className="inv-miner-card-power">{formatPower(miner.power)}</span>
                                                    {miner.percent > 0 && <span className="inv-miner-card-bonus">+{(miner.percent / 100).toFixed(1)}%</span>}
                                                </div>
                                            ))
                                        )
                                    ) : (
                                        // RACKS GRID
                                        rackList.length === 0 ? (
                                            <div className="inv-miner-card-empty">
                                                {isRackSearching ? t('merge.searching') : t('merge.noResultsFound')}
                                            </div>
                                        ) : (
                                            rackList.map(rack => (
                                                <div
                                                    key={rack.id}
                                                    className="inv-rack-card inv-miner-card"
                                                    draggable
                                                    onDragStart={(e) => {
                                                        e.dataTransfer.setData('rack', JSON.stringify(rack));
                                                    }}
                                                    onClick={() => handleAutoPlaceRack(rack)}
                                                >
                                                    <div className="inv-miner-card-img-wrapper">
                                                        <CdnImage
                                                            className="inv-miner-card-img"
                                                            type="rack"
                                                            itemId={rack.id}
                                                            fallbackUrl={`https://static.rollercoin.com/static/img/market/racks/${rack.capacity === 6 ? 'rack_3' : 'rack_4'}.png`}
                                                            alt={rack.name}
                                                            loading="lazy"
                                                        />
                                                    </div>
                                                    <span className="inv-miner-card-name" style={{ color: '#03e1e4' }}>{rack.name}</span>
                                                    <span className="inv-miner-card-power">{t('simulator.rackCapacity')}: {rack.capacity}</span>
                                                    {rack.powerBonus > 0 && <span className="inv-miner-card-bonus">+{(rack.powerBonus / 100).toFixed(2).replace(/\.00$/, '')}%</span>}
                                                </div>
                                            ))
                                        )
                                    )}
                                </div>
                            )}
                        </div>
                    );

                    const mobileContent = (
                        <div className="mobile-inventory-modal">
                            <div className="mobile-inv-header">
                                <button className="mobile-inv-back" onClick={() => { setIsMobileMinerSearchOpen(false); setReplaceTargetRackId(null); setReplacingMinerId(null); }}>
                                    ‹ Back to rooms
                                </button>
                                <button className="mobile-inv-close" onClick={() => { setIsMobileMinerSearchOpen(false); setReplaceTargetRackId(null); setReplacingMinerId(null); }}>✕</button>
                            </div>

                            <div className="mobile-inv-tabs-row">
                                <div className="inv-tabs">
                                    <button
                                        className={`inv-tab ${inventoryTab === 'racks' ? 'active' : ''}`}
                                        onClick={() => { setInventoryTab('racks'); setIsFilterOpen(false); }}
                                    >
                                        {t('simulator.racksTab')}
                                    </button>
                                    <button
                                        className={`inv-tab ${inventoryTab === 'miners' ? 'active' : ''}`}
                                        onClick={() => setInventoryTab('miners')}
                                    >
                                        {t('simulator.minersTab')}
                                    </button>
                                </div>
                                <div className="mobile-inv-pagination">
                                    <button
                                        onClick={() => inventoryTab === 'miners' ? handleSearchMiners(pageIndex - 1) : handleSearchRacks(rackPageIndex - 1)}
                                        disabled={inventoryTab === 'miners' ? (pageIndex === 0 || isSearching) : (rackPageIndex === 0 || isRackSearching)}
                                    >‹</button>
                                    <span>{inventoryTab === 'miners' ? (pageIndex + 1) : (rackPageIndex + 1)}/{inventoryTab === 'miners' ? (totalPages || 1) : (rackTotalPages || 1)}</span>
                                    <button
                                        onClick={() => inventoryTab === 'miners' ? handleSearchMiners(pageIndex + 1) : handleSearchRacks(rackPageIndex + 1)}
                                        disabled={inventoryTab === 'miners' ? (pageIndex >= totalPages - 1 || isSearching) : (rackPageIndex >= rackTotalPages - 1 || isRackSearching)}
                                    >›</button>
                                </div>
                            </div>

                            <div className="mobile-inv-toolbar">
                                <button className="inv-icon-btn" onClick={() => { setIsSearchOpen(!isSearchOpen); if (isFilterOpen) setIsFilterOpen(false); }}>🔍</button>
                                {inventoryTab === 'miners' && (
                                    <button className={`inv-icon-btn ${isFilterOpen ? 'active' : ''}`} onClick={() => { setIsFilterOpen(!isFilterOpen); if (isSearchOpen) setIsSearchOpen(false); }}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
                                    </button>
                                )}
                                {inventoryTab === 'miners' ? (
                                    <select
                                        className="inv-sort-select"
                                        value={`${sortBy}-${isDescending ? 'desc' : 'asc'}`}
                                        onChange={e => {
                                            const [newSort, dir] = e.target.value.split('-');
                                            setSortBy(newSort);
                                            setIsDescending(dir === 'desc');
                                            setTimeout(() => handleSearchMiners(0), 50);
                                        }}
                                    >
                                        <option value="newest-desc">{t('merge.sortOptions.newest')} ↓</option>
                                        <option value="newest-asc">{t('merge.sortOptions.newest')} ↑</option>
                                        <option value="power-desc">{t('merge.sortOptions.power')} ↓</option>
                                        <option value="power-asc">{t('merge.sortOptions.power')} ↑</option>
                                        <option value="percent-desc">{t('merge.sortOptions.bonus')} ↓</option>
                                        <option value="percent-asc">{t('merge.sortOptions.bonus')} ↑</option>
                                        <option value="name-asc">{t('merge.sortOptions.name')} A-Z</option>
                                        <option value="name-desc">{t('merge.sortOptions.name')} Z-A</option>
                                    </select>
                                ) : (
                                    <select
                                        className="inv-sort-select"
                                        value={`${rackSortBy}-${rackIsDescending ? 'desc' : 'asc'}`}
                                        onChange={e => {
                                            const [newSort, dir] = e.target.value.split('-');
                                            setRackSortBy(newSort as 'Date' | 'RackBonus');
                                            setRackIsDescending(dir === 'desc');
                                            setTimeout(() => handleSearchRacks(0), 50);
                                        }}
                                    >
                                        <option value="RackBonus-desc">{t('simulator.rackSortBonus')} ↓</option>
                                        <option value="RackBonus-asc">{t('simulator.rackSortBonus')} ↑</option>
                                        <option value="Date-desc">{t('simulator.rackSortDate')} ↓</option>
                                        <option value="Date-asc">{t('simulator.rackSortDate')} ↑</option>
                                    </select>
                                )}
                            </div>

                            {isSearchOpen && (
                                <div className="mobile-inv-search">
                                    <input
                                        type="text"
                                        className="inv-search-input"
                                        value={inventoryTab === 'miners' ? searchQuery : rackSearchQuery}
                                        onChange={e => inventoryTab === 'miners' ? setSearchQuery(e.target.value) : setRackSearchQuery(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && (inventoryTab === 'miners' ? handleSearchMiners(0) : handleSearchRacks(0))}
                                        placeholder={inventoryTab === 'miners' ? t('merge.searchByName') : t('simulator.searchRack')}
                                        autoFocus
                                    />
                                    <button className="inv-search-close" onClick={() => { setIsSearchOpen(false); inventoryTab === 'miners' ? setSearchQuery('') : setRackSearchQuery(''); }}>✕</button>
                                </div>
                            )}

                            {isFilterOpen && (
                                <div className="mobile-inv-filter">
                                    {/* Simplified filter for mobile or same filter layout */}
                                    <div className="inv-filter-section">
                                        <label>{t('merge.filterPower')}:</label>
                                        <div className="rc-filter-inputs" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '6px' }}>
                                            <div style={{ display: 'flex', gap: '4px' }}>
                                                <input type="number" className="rc-filter-input" value={minPower} onChange={e => setMinPower(e.target.value)} placeholder="0" style={{ width: '100%' }} />
                                                <select className="rc-select" value={minPowerUnit} onChange={e => setMinPowerUnit(e.target.value as PowerUnit)} style={{ padding: '0 4px' }}>
                                                    <option value="Gh">Gh</option><option value="Th">Th</option><option value="Ph">Ph</option><option value="Eh">Eh</option>
                                                </select>
                                            </div>
                                            <div style={{ display: 'flex', gap: '4px' }}>
                                                <input type="number" className="rc-filter-input" value={maxPower} onChange={e => setMaxPower(e.target.value)} placeholder={t('merge.max')} style={{ width: '100%' }} />
                                                <select className="rc-select" value={maxPowerUnit} onChange={e => setMaxPowerUnit(e.target.value as PowerUnit)} style={{ padding: '0 4px' }}>
                                                    <option value="Gh">Gh</option><option value="Th">Th</option><option value="Ph">Ph</option><option value="Eh">Eh</option>
                                                </select>
                                            </div>
                                            <button className="rc-filter-ok" onClick={() => handleSearchMiners(0)}>OK</button>
                                        </div>
                                    </div>

                                    <div className="inv-filter-section" style={{ marginTop: 15 }}>
                                        <label>{t('merge.filterBonus')}:</label>
                                        <div className="rc-filter-inputs">
                                            <input type="number" className="rc-filter-input" value={minBonus} onChange={e => setMinBonus(e.target.value)} placeholder="0" />
                                            <span className="rc-filter-separator">-</span>
                                            <input type="number" className="rc-filter-input" value={maxBonus} onChange={e => setMaxBonus(e.target.value)} placeholder={t('merge.max')} />
                                            <button className="rc-filter-ok" onClick={() => handleSearchMiners(0)}>OK</button>
                                        </div>
                                    </div>

                                    <div className="inv-filter-actions">
                                        <button className="inv-filter-action-btn danger" onClick={() => { setMinPower(''); setMaxPower(''); setMinBonus(''); setMaxBonus('135'); setMinerWidth(''); handleSearchMiners(0); }} title={t('simulator.clearFilters')}>🗑</button>
                                    </div>
                                </div>
                            )}

                            <div className="mobile-inv-grid">
                                {inventoryTab === 'miners' ? (
                                    minerList.length === 0 ? (
                                        <div className="inv-miner-card-empty">
                                            {isSearching ? t('merge.searching') : t('merge.noResultsFound')}
                                        </div>
                                    ) : (
                                        minerList.map(miner => (
                                            <div
                                                key={miner.id}
                                                className="inv-miner-card"
                                                onClick={() => {
                                                    if (replacingMinerId && replaceTargetRackId) {
                                                        handleReplaceMiner(miner, replacingMinerId, replaceTargetRackId);
                                                        setIsMobileMinerSearchOpen(false);
                                                    } else {
                                                        handleAutoPlaceMiner(miner);
                                                        setIsMobileMinerSearchOpen(false);
                                                    }
                                                }}
                                            >
                                                <div className="inv-miner-card-img-wrapper">
                                                    {miner.level > 0 && (
                                                        <div className="inv-miner-card-badge">
                                                            <img src={miner.type === 'old_merge' ? '/miner-levels/level_star.png' : `/miner-levels/level_${miner.level + 1}.webp`} alt={`Lvl ${miner.level + 1}`} />
                                                        </div>
                                                    )}
                                                    <CdnImage
                                                        className="inv-miner-card-img"
                                                        type="miner"
                                                        itemId={miner.fileName?.split('.')[0] || ''}
                                                        fallbackUrl={`https://static.rollercoin.com/static/img/market/miners/${miner.fileName?.includes('.') ? miner.fileName : (miner.fileName + '.gif')}?v=1.2.1`}
                                                        alt={miner.name}
                                                        loading="lazy"
                                                        onError={(e) => handleMinerImgError(e, miner.fileName?.split('.')[0] || 'crypto_combo')}
                                                    />
                                                </div>
                                                <span className="inv-miner-card-name">{miner.name}</span>
                                                <span className="inv-miner-card-power">{formatPower(miner.power)} | <span className="inv-miner-card-bonus">{miner.percent > 0 ? `+${(miner.percent / 100).toFixed(1)}%` : '0%'}</span></span>
                                            </div>
                                        ))
                                    )
                                ) : (
                                    // RACKS GRID MOBILE
                                    rackList.length === 0 ? (
                                        <div className="inv-miner-card-empty">
                                            {isRackSearching ? t('merge.searching') : t('merge.noResultsFound')}
                                        </div>
                                    ) : (
                                        rackList.map(rack => (
                                            <div
                                                key={rack.id}
                                                className="inv-rack-card inv-miner-card"
                                                onClick={() => {
                                                    handleAutoPlaceRack(rack);
                                                    setIsMobileMinerSearchOpen(false);
                                                }}
                                            >
                                                <div className="inv-miner-card-img-wrapper">
                                                    <CdnImage
                                                        className="inv-miner-card-img"
                                                        type="rack"
                                                        itemId={rack.id}
                                                        fallbackUrl={`https://static.rollercoin.com/static/img/market/racks/${rack.capacity === 6 ? 'rack_3' : 'rack_4'}.png`}
                                                        alt={rack.name}
                                                        loading="lazy"
                                                    />
                                                </div>
                                                <span className="inv-miner-card-name" style={{ color: '#03e1e4' }}>{rack.name}</span>
                                                <span className="inv-miner-card-power">{t('simulator.rackCapacity')}: {rack.capacity} | <span className="inv-miner-card-bonus">{rack.powerBonus > 0 ? `+${(rack.powerBonus / 100).toFixed(2).replace(/\.00$/, '')}%` : '0%'}</span></span>
                                            </div>
                                        ))
                                    )
                                )}
                            </div>
                        </div>
                    );

                    return isMobile ? (isMobileMinerSearchOpen ? createPortal(mobileContent, document.body) : null) : desktopContent;
                })()
            )}
        </div>
    );
};

export default RoomSimulator;