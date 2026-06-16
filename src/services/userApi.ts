/**
 * User API Service
 * 
 * Handles fetching user data from the backend API
 */

import { getApiUrl, buildApiUrl } from '../config/api';
import { apiFetch, ApiError } from './apiClient';
import { RollercoinUserResponse } from '../types/user';
import { RollercoinRoomResponse } from '../types/room';

/**
 * Fetches user data from the API by username.
 * Uses apiFetch (low-level) instead of apiGet because the error response
 * body may contain a `detail` field that we want to surface.
 *
 * @param userName - The username to fetch
 * @returns Promise resolving to user data
 * @throws ApiError if the request fails (with detail from error body)
 */
export async function fetchUserFromApi(userName: string): Promise<RollercoinUserResponse> {
    const baseUrl = getApiUrl('user');
    const url = `${baseUrl}?userName=${encodeURIComponent(userName)}`;

    // apiFetch already handles 429 and parses error detail from JSON body
    const response = await apiFetch(url);
    return response.json() as Promise<RollercoinUserResponse>;
}

/**
 * Fetches user room data (miners and racks) from the API by userId.
 *
 * @param userId - The user's ID (avatar_Id)
 * @returns Promise resolving to user room data
 */
export async function fetchUserRoomFromApi(userId: string): Promise<RollercoinRoomResponse> {
    const baseUrl = getApiUrl('user');
    // Using the path /room based on the provided backend controller structure:
    // [HttpGet("room")] public async Task<IActionResult> GetUserRoom([FromQuery] string userId)
    const url = `${baseUrl}/room?userId=${encodeURIComponent(userId)}`;

    const response = await apiFetch(url);
    return response.json() as Promise<RollercoinRoomResponse>;
}

export interface MinerDto {
    id: string;
    name: string;
    fileName?: string;
    imageVersion: number;
    level: number;
    percent: number;
    power: number;
    width: number;
    createdDate: string;
}

export interface MinerFilterParams {
    Name?: string;
    MinMinerPower?: number;
    MaxMinerPower?: number;
    MinMinerBonus?: number;
    MaxMinerBonus?: number;
    Width?: number;
    SortBy?: string;
    IsDescending?: boolean;
    PageIndex: number;
}

export async function fetchUserMinersFromApi(params: MinerFilterParams): Promise<PaginatedResponse<MinerDto>> {
    let queryParams = `PageRequest.PageIndex=${params.PageIndex}&PageRequest.PageSize=20`;
    if (params.Name) queryParams += `&Name=${encodeURIComponent(params.Name)}`;
    if (params.MinMinerPower !== undefined && params.MinMinerPower !== null && !isNaN(params.MinMinerPower)) queryParams += `&MinMinerPower=${params.MinMinerPower}`;
    if (params.MaxMinerPower !== undefined && params.MaxMinerPower !== null && !isNaN(params.MaxMinerPower)) queryParams += `&MaxMinerPower=${params.MaxMinerPower}`;
    if (params.MinMinerBonus !== undefined && params.MinMinerBonus !== null && !isNaN(params.MinMinerBonus)) queryParams += `&MinMinerBonus=${params.MinMinerBonus}`;
    if (params.MaxMinerBonus !== undefined && params.MaxMinerBonus !== null && !isNaN(params.MaxMinerBonus)) queryParams += `&MaxMinerBonus=${params.MaxMinerBonus}`;
    if (params.Width !== undefined && params.Width !== null && !isNaN(params.Width)) queryParams += `&Width=${params.Width}`;
    if (params.SortBy) queryParams += `&SortBy=${params.SortBy}`;
    if (params.IsDescending !== undefined) queryParams += `&IsDescending=${params.IsDescending}`;

    const url = buildApiUrl(`/api/Miner?${queryParams}`);
    const response = await apiFetch(url);
    return response.json() as Promise<PaginatedResponse<MinerDto>>;
}

/**
 * Re-export ApiError for upstream error handling
 */
export { ApiError };

import { UpdateUserPasswordCommand, UpdateUserPasswordResponse, GetUserDto } from '../types/auth';
import { PaginatedResponse } from '../types/pagination';

export interface GetUserListQuery {
    pageIndex: number;
    pageSize: number;
}

/**
 * Fetches a paginated list of users (Admin only)
 * 
 * @param query - Pagination parameters
 * @param token - The admin's auth token
 * @returns Promise resolving to the paginated user list
 */
export async function getUserList(query: GetUserListQuery, token: string): Promise<PaginatedResponse<GetUserDto>> {
    const url = buildApiUrl(`/api/User?PageRequest.PageIndex=${query.pageIndex}&PageRequest.PageSize=${query.pageSize}`);

    const response = await apiFetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    return response.json() as Promise<PaginatedResponse<GetUserDto>>;
}


/**
 * Updates the password for a user.
 * 
 * @param dto - The update password command data
 * @param token - The user's auth token
 * @returns Promise resolving to the update response
 */
export async function updatePassword(dto: UpdateUserPasswordCommand, token: string): Promise<UpdateUserPasswordResponse> {
    const url = buildApiUrl('/api/User/UpdatePassword');

    const response = await apiFetch(url, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(dto),
    });

    return response.json() as Promise<UpdateUserPasswordResponse>;
}
