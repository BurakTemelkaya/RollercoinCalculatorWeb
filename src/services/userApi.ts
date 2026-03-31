/**
 * User API Service
 * 
 * Handles fetching user data from the backend API
 */

import { getApiUrl } from '../config/api';
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
