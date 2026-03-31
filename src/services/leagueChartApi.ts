/**
 * League Chart Data API Service
 *
 * Fetches historical average power and payout data for a specific league and currency.
 */

import { getApiUrl } from '../config/api';
import { apiGet } from './apiClient';

export interface LeagueChartDataPoint {
    date: string;
    averagePower: number;
    averagePayout: number;
}

export type LeagueChartResponse = LeagueChartDataPoint[];

/**
 * Fetches chart data for a specific league and currency.
 * If startDate/endDate are omitted, the API returns the last 30 days.
 *
 * @param leagueId - The league ID (e.g. "68af01ce48490927df92d67e")
 * @param currencyId - The currency ID (numeric, from ApiCurrency.id)
 * @param startDate - Optional start date (MM.dd.yyyy)
 * @param endDate - Optional end date (MM.dd.yyyy)
 */
export async function fetchLeagueChartData(
    leagueId: string,
    currencyId: number,
    startDate?: string,
    endDate?: string
): Promise<LeagueChartResponse> {
    const baseUrl = getApiUrl('leagues');
    const params = new URLSearchParams({
        leagueId,
        currencyId: currencyId.toString(),
    });

    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const url = `${baseUrl}/GetLeagueChartData?${params.toString()}`;
    return apiGet<LeagueChartResponse>(url);
}
