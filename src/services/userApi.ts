/**
 * User API Service
 * 
 * Handles fetching user data from the backend API
 */

import { getApiUrl } from '../config/api';
import { RollercoinUserResponse } from '../types/user';

/**
 * Fetches user data from the API by username
 * @param userName - The username to fetch
 * @returns Promise resolving to user data
 * @throws Error if the request fails
 */
export async function fetchUserFromApi(userName: string): Promise<RollercoinUserResponse> {
    try {
        const baseUrl = getApiUrl('user');
        const url = `${baseUrl}?userName=${encodeURIComponent(userName)}`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }

        const data: RollercoinUserResponse = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching user from API:', error);
        throw error;
    }
}
