/**
 * Auth API Service
 *
 * Handles login, register, token refresh, and revoke operations.
 * JWT tokens are decoded client-side for role and user info extraction.
 */

import { buildApiUrl } from '../config/api';
import { apiFetch } from './apiClient';
import type {
  UserForLoginDto,
  UserForRegisterDto,
  LoginResponse,
  AccessToken,
  AuthUser,
  JWT_CLAIMS,
} from '../types/auth';

const AUTH_BASE = '/api/Auth';

/**
 * Login with email and password.
 * Turnstile token is automatically attached by apiFetch for POST requests.
 */
export async function login(dto: UserForLoginDto, turnstileToken: string): Promise<LoginResponse> {
  const url = buildApiUrl(`${AUTH_BASE}/Login`);
  const response = await apiFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
    credentials: 'include', // for httpOnly refresh token cookie
    turnstileToken,
  });
  return response.json() as Promise<LoginResponse>;
}

/**
 * Register a new user account.
 * Returns the same LoginResponse format as login.
 */
export async function register(dto: UserForRegisterDto, turnstileToken: string): Promise<LoginResponse> {
  const url = buildApiUrl(`${AUTH_BASE}/Register`);
  const response = await apiFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
    credentials: 'include',
    turnstileToken,
  });
  return response.json() as Promise<LoginResponse>;
}

/**
 * Refresh the access token using the refresh token cookie.
 * Backend returns only the AccessToken object (not the full LoginResponse).
 */
export async function refreshToken(): Promise<AccessToken> {
  const url = buildApiUrl(`${AUTH_BASE}/RefreshToken`);
  const response = await apiFetch(url, {
    method: 'GET',
    credentials: 'include',
  });
  return response.json() as Promise<AccessToken>;
}

/**
 * Revoke the current refresh token (logout server-side).
 * Send an empty request (no body) so it falls back to the cookie.
 */
export async function revokeToken(token: string): Promise<void> {
  const url = buildApiUrl(`${AUTH_BASE}/RevokeToken`);
  await apiFetch(url, {
    method: 'PUT',
    headers: { 
      'Authorization': `Bearer ${token}` 
    },
    credentials: 'include',
  });
}

/**
 * Decode a JWT token payload without verification.
 * Extracts user info from .NET claim URIs.
 */
export function decodeJwt(token: string): AuthUser {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWT token format');
  }

  // Base64url decode
  const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split('')
      .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  );

  const payload = JSON.parse(jsonPayload);

  const CLAIMS: typeof JWT_CLAIMS = {
    nameIdentifier: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier',
    email: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress',
    role: 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role',
  };

  // Role can be a single string or an array
  const rawRole = payload[CLAIMS.role];
  const roles = Array.isArray(rawRole) ? rawRole : rawRole ? [rawRole] : [];

  return {
    userId: payload[CLAIMS.nameIdentifier] || '',
    email: payload[CLAIMS.email] || '',
    roles,
    exp: payload.exp || 0,
  };
}

/**
 * Check if a JWT token is expired.
 * Adds a 30-second buffer to trigger refresh before actual expiration.
 */
export function isTokenExpired(token: string): boolean {
  try {
    const decoded = decodeJwt(token);
    const nowInSeconds = Math.floor(Date.now() / 1000);
    return decoded.exp <= nowInSeconds + 30; // 30s buffer
  } catch {
    return true;
  }
}
