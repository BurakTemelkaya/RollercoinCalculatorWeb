/**
 * User API Service
 * 
 * Handles fetching user data from the backend API
 */

import { getApiUrl, buildApiUrl } from '../config/api';
import { apiFetch, ApiError } from './apiClient';
import { RollercoinUserResponse } from '../types/user';

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
