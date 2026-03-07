/**
 * Progression Event API Service
 * 
 * Fetches and parses progression event data from the backend API
 */

import { buildApiUrl } from '../config/api';
import type { ProgressionEventResponse, ProgressionEventData, MultiplierData, TaskData } from '../types/progressionEvent';

export interface ParsedProgressionEvent {
    id: string;
    name: string;
    endDate: string;
    data: ProgressionEventData;
    multiplierData?: MultiplierData[];
    taskData?: TaskData[];
}

/**
 * Fetches the current progression event from the API
 */
export async function fetchProgressionEvent(): Promise<ParsedProgressionEvent> {
    const url = buildApiUrl('/api/ProgressionEvents');

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
    }

    const raw: ProgressionEventResponse = await response.json();

    // Parse the nested JSON data string
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

    return {
        id: raw.id,
        name: raw.name,
        endDate: raw.endDate,
        data,
        multiplierData,
        taskData,
    };
}
