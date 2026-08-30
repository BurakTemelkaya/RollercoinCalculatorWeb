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
  // If we are in development, use relative URL so Vite proxy handles it and browser sends SameSite cookies
  if (import.meta.env.DEV) {
    return '';
  }

  const url = import.meta.env.VITE_API_URL;

  if (!url) {
    console.error('VITE_API_URL is not defined in environment variables!');
    return 'https://localhost:7080'; // Fallback
  }

  return url;
}

/**
 * Gets the CDN base URL from environment variables, bypassing DEV proxy
 * Used specifically for static assets like miner/rack images served by the backend
 */
export function getCdnBaseUrl(): string {
  // First try the dedicated CDN URL, fallback to API URL, then fallback to localhost
  const cdnUrl = import.meta.env.VITE_CDN_URL;
  if (cdnUrl) {
    return cdnUrl;
  }

  const url = import.meta.env.VITE_API_URL;
  if (!url) {
    return 'https://localhost:7080'; // Fallback
  }

  // If we only have API URL, automatically transform it to CDN URL on production for best practice fallback
  return url.replace('api.rollercoincalculator.app', 'cdn.rollercoincalculator.app');
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
 * Gets the reward change endpoint from environment variables
 */
function getRewardChangeEndpoint(): string {
  return import.meta.env.VITE_API_REWARD_CHANGE_ENDPOINT || '/api/RewardChange';
}

/**
 * Gets full API URL for specific endpoints
 */
export function getApiUrl(endpointKey: 'leagues' | 'user' | 'rewardChange'): string {
  const baseUrl = getApiBaseUrl();

  switch (endpointKey) {
    case 'leagues':
      return `${baseUrl}${getLeagueEndpoint()}`;
    case 'user':
      return `${baseUrl}${getUserEndpoint()}`;
    case 'rewardChange':
      return `${baseUrl}${getRewardChangeEndpoint()}`;
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
