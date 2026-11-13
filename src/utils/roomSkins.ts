import roomSkins from '../data/roomSkins.json';

// Extracted from RollerCoin's game bundle: appearance id -> 720x450 room built from 4x3 tiles of 180x150 plus decor images.
export type RoomSkinDecore = { url: string; top: number; left: number; w: number; h: number; light?: string };
export type RoomSkin = { windowView?: { url: string; frameWidth: number; frameHeight: number }; rooms: { level: number; sprites: string[]; decores: RoomSkinDecore[] }[] };

const SKINS = roomSkins as Record<string, RoomSkin>;
const DEFAULT_SKIN_ID = '60703ad365dce86c863214b2';

export const getRoomSkin = (appearanceId: string | undefined) => SKINS[appearanceId ?? ''] ?? SKINS[DEFAULT_SKIN_ID];
export const hasRoomSkin = (appearanceId: string | undefined, level: number) => getRoomSkin(appearanceId).rooms.some(r => r.level === level);

// RollerCoin lays the 4x3 desktop tiles out as 2 columns on mobile, dropping corner tiles (same arrays as the game's room scene).
const DESKTOP_TILES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
export const getSkinTiles = (level: number, isMobile: boolean) =>
    !isMobile ? DESKTOP_TILES : level === 0 ? [1, 2, 4, 5, 6, 7, 9, 10, 8, 11] : [1, 2, 4, 5, 6, 7, 8, 9, 10, 11];
export const getSkinRoomSize = (isMobile: boolean) => (isMobile ? { width: 360, height: 750 } : { width: 720, height: 450 });

/** Moves a point from desktop room coordinates into the (possibly mobile) layout; null when its tile is not shown. */
export const mapSkinPoint = (left: number, top: number, tiles: number[]) => {
    const tileCol = Math.floor(left / 180);
    const tileRow = Math.floor(top / 150);
    const slot = tiles.indexOf(tileRow * 4 + tileCol);
    if (slot < 0) return null;
    const columns = tiles.length === 12 ? 4 : 2;
    return { x: left - tileCol * 180 + (slot % columns) * 180, y: top - tileRow * 150 + Math.floor(slot / columns) * 150 };
};
