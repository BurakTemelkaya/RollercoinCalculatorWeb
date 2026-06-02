/**
 * Auth Context
 *
 * Provides authentication state and actions to the entire application.
 * Handles JWT token storage, auto-refresh, and role-based access control.
 */

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import type { AuthUser, UserForLoginDto, UserForRegisterDto, LoginResponse } from '../types/auth';
import {
  login as apiLogin,
  register as apiRegister,
  refreshToken as apiRefreshToken,
  revokeToken as apiRevokeToken,
  decodeJwt,
  isTokenExpired,
} from '../services/authApi';

const ACCESS_TOKEN_KEY = 'rollercoin_web_access_token';

interface AuthContextType {
  user: AuthUser | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (dto: UserForLoginDto, turnstileToken: string) => Promise<LoginResponse>;
  register: (dto: UserForRegisterDto, turnstileToken: string) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  getValidToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isAuthenticated = !!user && !!accessToken;
  const isAdmin = user?.roles?.includes('Admin') ?? false;

  /**
   * Persist token and extract user info from JWT.
   */
  const setSession = useCallback((response: LoginResponse) => {
    const token = response.accessToken.token;
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
    setAccessToken(token);

    try {
      const decoded = decodeJwt(token);
      setUser(decoded);
      scheduleRefresh(decoded.exp);
    } catch (e) {
      console.error('Failed to decode JWT:', e);
      clearSession();
    }
  }, []);

  /**
   * Clear all auth state.
   */
  const clearSession = useCallback(() => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    setAccessToken(null);
    setUser(null);
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []);

  /**
   * Schedule automatic token refresh before expiration.
   */
  const scheduleRefresh = useCallback((exp: number) => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }

    const nowInSeconds = Math.floor(Date.now() / 1000);
    const timeUntilExp = exp - nowInSeconds;
    
    // Refresh 60 seconds before expiration
    let delaySeconds = timeUntilExp - 60;
    
    // If the token is extremely short-lived (e.g. 1 minute for testing), 
    // waiting 60s before expiration would mean delaying by 0s, causing an infinite loop.
    // Instead, wait for 80% of the remaining time.
    if (delaySeconds <= 0 && timeUntilExp > 0) {
      delaySeconds = timeUntilExp * 0.8;
    }

    const delay = Math.max(delaySeconds * 1000, 0);

    refreshTimerRef.current = setTimeout(async () => {
      try {
        const accessToken = await apiRefreshToken();
        const token = accessToken.token;
        localStorage.setItem(ACCESS_TOKEN_KEY, token);
        setAccessToken(token);

        const decoded = decodeJwt(token);
        setUser(decoded);
        scheduleRefresh(decoded.exp);
      } catch {
        console.warn('Token refresh failed, logging out');
        clearSession();
      }
    }, delay);
  }, [clearSession]);

  /**
   * Initialize auth state from localStorage on mount.
   */
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem(ACCESS_TOKEN_KEY);

      if (!savedToken) {
        setIsLoading(false);
        return;
      }

      if (!isTokenExpired(savedToken)) {
        // Token still valid
        try {
          const decoded = decodeJwt(savedToken);
          setUser(decoded);
          setAccessToken(savedToken);
          scheduleRefresh(decoded.exp);
        } catch {
          clearSession();
        }
      } else {
        // Token expired, try refresh
        try {
          const accessToken = await apiRefreshToken();
          const token = accessToken.token;
          localStorage.setItem(ACCESS_TOKEN_KEY, token);
          setAccessToken(token);

          const decoded = decodeJwt(token);
          setUser(decoded);
          scheduleRefresh(decoded.exp);
        } catch {
          clearSession();
        }
      }

      setIsLoading(false);
    };

    initAuth();

    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, [clearSession, scheduleRefresh]);

  /**
   * Login action.
   */
  const login = useCallback(async (dto: UserForLoginDto, turnstileToken: string): Promise<LoginResponse> => {
    const response = await apiLogin(dto, turnstileToken);
    setSession(response);
    return response;
  }, [setSession]);

  /**
   * Register action. Automatically logs in after successful registration.
   */
  const register = useCallback(async (dto: UserForRegisterDto, turnstileToken: string): Promise<LoginResponse> => {
    const response = await apiRegister(dto, turnstileToken);
    setSession(response);
    return response;
  }, [setSession]);

  /**
   * Logout action.
   */
  const logout = useCallback(async () => {
    try {
      if (accessToken) {
        await apiRevokeToken(accessToken);
      }
    } catch {
      // Ignore revoke errors, still clear local session
    }
    clearSession();
    window.location.href = '/';
  }, [clearSession, accessToken]);

  /**
   * Get a valid access token, refreshing if necessary.
   * Used by components that need to make authenticated API calls.
   */
  const getValidToken = useCallback(async (): Promise<string | null> => {
    if (accessToken && !isTokenExpired(accessToken)) {
      return accessToken;
    }

    try {
      const accessToken = await apiRefreshToken();
      const token = accessToken.token;
      localStorage.setItem(ACCESS_TOKEN_KEY, token);
      setAccessToken(token);

      const decoded = decodeJwt(token);
      setUser(decoded);
      scheduleRefresh(decoded.exp);

      return token;
    } catch {
      clearSession();
      return null;
    }
  }, [accessToken, clearSession, scheduleRefresh]);

  const value: AuthContextType = {
    user,
    accessToken,
    isLoading,
    isAuthenticated,
    isAdmin,
    login,
    register,
    logout,
    getValidToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
