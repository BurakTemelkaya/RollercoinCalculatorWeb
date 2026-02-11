/**
 * API Response Types
 * 
 * Type definitions for API responses from the backend
 */

// Currency data within a league
export interface ApiCurrency {
    id: number;
    name: string;
    totalPower: number;
    userCount: number;
    payoutAmount: number;
}

// League data from API
export interface ApiLeagueData {
    id: string;
    title: string;
    level: number;
    minPower: number;
    imageUrl: string;
    lastUpdatedAt: string;
    currencies: ApiCurrency[];
}

// API Response type (array of leagues)
export type ApiLeaguesResponse = ApiLeagueData[];
