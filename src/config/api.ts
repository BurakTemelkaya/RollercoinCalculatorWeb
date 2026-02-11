/**
 * API Configuration
 * 
 * This file uses Vite environment variables from .env files
 * - Development: .env.development
 * - Production: .env.production
 * - Local Override: .env.local (optional, gitignored)
 */

/**
 * Gets the API base URL from environment variables
 */
export function getApiBaseUrl(): string {
  const url = import.meta.env.VITE_API_URL;

  if (!url) {
    console.error('VITE_API_URL is not defined in environment variables!');
    return 'https://localhost:7080'; // Fallback
  }

  return url;
}

/**
 * Gets the league endpoint from environment variables
 */
function getLeagueEndpoint(): string {
  return import.meta.env.VITE_API_LEAGUE_ENDPOINT || '/api/League';
}

/**
 * Gets full API URL for leagues endpoint
 */
export function getApiUrl(endpointKey: 'leagues'): string {
  if (endpointKey === 'leagues') {
    return `${getApiBaseUrl()}${getLeagueEndpoint()}`;
  }

  throw new Error(`Unknown endpoint: ${endpointKey}`);
}
