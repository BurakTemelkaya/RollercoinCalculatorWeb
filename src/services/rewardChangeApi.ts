/**
 * Reward Change API Service
 *
 * Handles fetching reward change events from the backend API
 */

import { getApiUrl } from '../config/api';
import { apiGet } from './apiClient';
import { RewardChangeEvent } from '../types/rewardChange';

/**
 * Fetches the latest reward change event from the API
 * @returns Promise resolving to the reward change event data
 * @throws ApiError if the request fails
 */
export async function fetchRewardChange(): Promise<RewardChangeEvent> {
    const url = getApiUrl('rewardChange');
    return apiGet<RewardChangeEvent>(url);
}
