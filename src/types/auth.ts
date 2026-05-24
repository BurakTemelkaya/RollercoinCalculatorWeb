/** Auth-related type definitions */

export interface UserForLoginDto {
  email: string;
  password: string;
  authenticatorCode?: string | null;
}

export interface UserForRegisterDto {
  email: string;
  password: string;
}

export interface AccessToken {
  token: string;
  expirationDate: string;
}

export interface RefreshTokenDto {
  id: string;
  userId: string;
  token: string;
  expirationDate: string;
  createdByIp: string;
}

export interface LoginResponse {
  accessToken: AccessToken;
  refreshToken: RefreshTokenDto;
  requiredAuthenticatorType?: number | null;
}

/** JWT claim keys used by the .NET backend */
export const JWT_CLAIMS = {
  nameIdentifier: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier',
  email: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress',
  role: 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role',
} as const;

/** Decoded JWT payload mapped to friendly names */
export interface AuthUser {
  userId: string;
  email: string;
  roles: string[];
  exp: number;
}

export interface UpdatePasswordCommand {
  userId?: string | null;
  existPassword: string;
  newPassword: string;
  roles?: string[] | null;
}
