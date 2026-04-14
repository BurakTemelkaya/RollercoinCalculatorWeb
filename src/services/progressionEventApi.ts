/**
 * Progression Event API Service
 * 
 * Fetches and parses progression event data from the backend API
 */

import { buildApiUrl } from '../config/api';
import { apiGet } from './apiClient';
import type { ProgressionEventResponse, ProgressionEventData, MultiplierData, TaskData, ProgressionEventListItem } from '../types/progressionEvent';
import type { PaginatedResponse } from '../types/pagination';

export interface ParsedProgressionEvent {
    id: string;
    name: string;
    endDate: string;
    data: ProgressionEventData;
    multiplierData?: MultiplierData[];
    taskData?: TaskData[];
}

/**
 * Parses a raw ProgressionEventResponse into a ParsedProgressionEvent.
 * Shared between fetchProgressionEvent and fetchProgressionEventById.
 */
function parseProgressionEventResponse(raw: ProgressionEventResponse): ParsedProgressionEvent {
    const data: ProgressionEventData = JSON.parse(raw.data);
    let multiplierData: MultiplierData[] | undefined;
    let taskData: TaskData[] | undefined;

    try {
        if (raw.multiplierData) {
            multiplierData = JSON.parse(raw.multiplierData);
        }
        if (raw.taskData) {
            taskData = JSON.parse(raw.taskData);
        }
    } catch (e) {
        console.error("Error parsing dynamic progression event data:", e);
    }

    // Ensure endDate is treated as UTC. The API returns dates without timezone info
    // (e.g. "2026-03-09T15:00:00"), which JavaScript would parse as local time instead of UTC.
    const endDate = raw.endDate && !raw.endDate.endsWith('Z') && !raw.endDate.includes('+')
        ? raw.endDate + 'Z'
        : raw.endDate;

    return {
        id: raw.id,
        name: raw.name,
        endDate,
        data,
        multiplierData,
        taskData,
    };
}

/**
 * Fetches the current (latest) progression event from the API
 */
export async function fetchProgressionEvent(): Promise<ParsedProgressionEvent> {
    const url = buildApiUrl('/api/ProgressionEvents');
    const raw = await apiGet<ProgressionEventResponse>(url);
    return parseProgressionEventResponse(raw);
}

/**
 * Fetches a specific progression event by ID
 */
export async function fetchProgressionEventById(id: string): Promise<ParsedProgressionEvent> {
    const url = buildApiUrl(`/api/ProgressionEvents/GetById?id=${encodeURIComponent(id)}`);
    const raw = await apiGet<ProgressionEventResponse>(url);
    return parseProgressionEventResponse(raw);
}

/**
 * Fetches a paginated list of progression events
 */
export async function fetchProgressionEventList(
    pageIndex: number = 0,
    pageSize: number = 10
): Promise<PaginatedResponse<ProgressionEventListItem>> {
    const url = buildApiUrl(`/api/ProgressionEvents/GetList?PageIndex=${pageIndex}&PageSize=${pageSize}`);
    return apiGet<PaginatedResponse<ProgressionEventListItem>>(url);
}

