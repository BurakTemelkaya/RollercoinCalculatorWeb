export interface ApiRoomMinerPlacement {
    user_rack_id: string;
    x: number;
    y: number;
}

export interface ApiRoomMiner {
    _id: string;
    miner_id: string;
    placement: ApiRoomMinerPlacement | null;
    name: string;
    width: number;
    level: number;
    type: string;
    power: number;
    filename: string;
    bonus_percent: number;
    is_in_set: boolean;
    updated: string;
}

export interface ApiRoomRackPlacement {
    user_room_id: string;
    x: number;
    y: number;
}

export interface ApiRoomRack {
    _id: string;
    rack_id: string;
    placement: ApiRoomRackPlacement | null;
    name: string;
    bonus_percent: number;
    cells: number;
    type: string;
}

export interface ApiRoom {
    _id: string;
    room_info: {
        room_id: string;
        level: number;
        cols: number;
        rows: number;
    }
}

export interface RollercoinRoomResponse {
    is_user_from_session: boolean;
    miners: ApiRoomMiner[];
    racks?: ApiRoomRack[];
    rooms?: ApiRoom[];
    // Other fields like skin, appearance are omitted as they are not needed for power calc
}
