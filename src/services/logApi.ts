/**
 * Log API Service
 *
 * Handles fetching log files and log content for admin panel.
 * Connects to ASP.NET Core LogController endpoints (/api/log).
 * Requires Bearer token authorization.
 */

import { buildApiUrl } from '../config/api';
import { apiFetch } from './apiClient';
import type { LogFileInfo, LogFileDetail } from '../types/log';

const LOG_BASE = '/api/log';

/**
 * Normalizes C# backend response to LogFileInfo (handles both PascalCase and camelCase)
 */
function normalizeLogFileInfo(item: any): LogFileInfo {
  return {
    fileName: item.fileName || item.FileName || item.name || item.Name || '',
    length: Number(item.length ?? item.Length ?? item.size ?? item.Size ?? 0),
    creationTime: item.creationTime || item.CreationTime || '',
    lastWriteTime: item.lastWriteTime || item.LastWriteTime || '',
  };
}

/**
 * Normalizes C# backend response to LogFileDetail (handles both PascalCase and camelCase)
 */
function normalizeLogFileDetail(item: any, fallbackName = ''): LogFileDetail {
  return {
    name: item.name || item.Name || item.fileName || item.FileName || fallbackName,
    content: item.content ?? item.Content ?? '',
    creationTime: item.creationTime || item.CreationTime || '',
    lastWriteTime: item.lastWriteTime || item.LastWriteTime || '',
  };
}

/**
 * Fetches the list of all log files from the server.
 * GET /api/log
 *
 * @param token - Optional admin Bearer access token
 * @returns Promise resolving to an array of LogFileInfo
 * @throws ApiError if the request fails
 */
export async function getLogFiles(token?: string | null): Promise<LogFileInfo[]> {
  const url = buildApiUrl(LOG_BASE);
  const headers: Record<string, string> = {
    'Accept': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await apiFetch(url, {
    method: 'GET',
    headers,
  });

  const data = await response.json();

  // Handle direct array or wrapped response { items: [...] } / { data: [...] }
  const rawList = Array.isArray(data)
    ? data
    : Array.isArray(data?.items)
    ? data.items
    : Array.isArray(data?.data)
    ? data.data
    : [];

  return rawList.map(normalizeLogFileInfo);
}

/**
 * Fetches the content and metadata of a specific log file by file name.
 * GET /api/log/{fileName}
 *
 * @param fileName - Name of the log file (e.g. "20260901.txt")
 * @param token - Optional admin Bearer access token
 * @returns Promise resolving to LogFileDetail
 * @throws ApiError if the request fails
 */
export async function getLogFileContent(fileName: string, token?: string | null): Promise<LogFileDetail> {
  const url = buildApiUrl(`${LOG_BASE}/${encodeURIComponent(fileName)}`);
  const headers: Record<string, string> = {
    'Accept': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await apiFetch(url, {
    method: 'GET',
    headers,
  });

  const data = await response.json();
  return normalizeLogFileDetail(data, fileName);
}

// Aliases matching other services' fetch... naming convention
export const fetchLogFiles = getLogFiles;
export const fetchLogFileContent = getLogFileContent;
