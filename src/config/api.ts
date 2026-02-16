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
/**
 * Gets the user endpoint from environment variables
 */
function getUserEndpoint(): string {
  return import.meta.env.VITE_API_USER_ENDPOINT || '/api/RollercoinUser';
}

/**
 * Gets full API URL for specific endpoints
 */
export function getApiUrl(endpointKey: 'leagues' | 'user'): string {
  const baseUrl = getApiBaseUrl();

  switch (endpointKey) {
    case 'leagues':
      return `${baseUrl}${getLeagueEndpoint()}`;
    case 'user':
      return `${baseUrl}${getUserEndpoint()}`;
    default:
      throw new Error(`Unknown endpoint: ${endpointKey}`);
  }
}

/**
 * Helper to build custom API URLs
 */
export function buildApiUrl(path: string): string {
  const baseUrl = getApiBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}
