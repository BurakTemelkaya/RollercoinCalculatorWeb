import React from 'react';
import { getRoomSkin, getSkinRoomSize, getSkinTiles, mapSkinPoint } from '../utils/roomSkins';

// Mirrored from static.rollercoin.com/static/rooms/sprites so rooms don't depend on RollerCoin's CDN.
const sprite = (path: string) => `/room-skins${encodeURI(path)}`;

interface Props {
    appearanceId?: string;
    level: number;
    isMobile: boolean;
    style: React.CSSProperties;
}

export const RoomSkinBackground: React.FC<Props> = ({ appearanceId, level, isMobile, style }) => {
    const skin = getRoomSkin(appearanceId);
    const room = skin.rooms.find(r => r.level === level);
    if (!room) return null;
    const piece = (url: string, left: number, top: number, w: number, h: number, key: string) => (
        <div key={key} style={{ position: 'absolute', left, top, width: w, height: h, backgroundImage: `url("${sprite(url)}")`, backgroundPosition: '0 0' }} />
    );
    const tiles = getSkinTiles(level, isMobile);
    const { width, height } = getSkinRoomSize(isMobile);
    const columns = width / 180;
    return (
        <div className="room-skin-bg" aria-hidden="true" style={{ ...style, width, height }}>
            {skin.windowView && piece(skin.windowView.url, 0, 0, width, skin.windowView.frameHeight * 2, 'sky')}
            {tiles.map((tile, i) => piece(room.sprites[tile], (i % columns) * 180, Math.floor(i / columns) * 150, 180, 150, `t${i}`))}
            {room.decores.flatMap((d, i) => {
                const at = mapSkinPoint(d.left, d.top, tiles);
                if (!at) return [];
                return [
                    piece(d.url, at.x, at.y, d.w, d.h, `d${i}`),
                    d.light ? piece(d.light, at.x, at.y, d.w, d.h, `l${i}`) : null,
                ];
            })}
        </div>
    );
};
