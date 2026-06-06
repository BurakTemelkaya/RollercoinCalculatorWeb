/** Auth-related type definitions */

export interface UserForLoginDto {
  email: string;
  password: string;
  authenticatorCode?: string | null;
}

export interface UserForRegisterDto {
  name: string;
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

export interface UpdateUserPasswordCommand {
  userId?: string | null;
  existPassword: string;
  newPassword: string;
}

export interface UpdateUserPasswordResponse {
  userId: string;
  updateDate: string;
}

export interface GetListOperationClaimDto {
  id: string;
  name: string;
  createdDate: string;
  updatedDate?: string | null;
  deletedDate?: string | null;
}

export interface GetUserDto {
  id: string;
  name: string;
  email: string;
  createdDate: string;
  updatedDate?: string | null;
  deletedDate?: string | null;
  userOperationClaims?: {
    id: string;
    userId: string;
    operationClaimId: string;
    operationClaim: GetListOperationClaimDto;
    createdDate: string;
    updatedDate?: string | null;
    deletedDate?: string | null;
  }[];
}

export interface CreateUserOperationClaimDto {
  userId: string;
  operationClaimId: string;
}

export interface CreateUserOperationClaimResponseDto {
  id: string;
  userId: string;
  operationClaimId: string;
}

export interface DeleteUserOperationClaimDto {
  userId: string;
  operationClaimId: string;
}

export interface DeleteUserOperationClaimResponseDto {
  id: string;
  userId: string;
  operationClaimId: string;
  deletedDate: string;
}

/** Forgot Password - Step 1: Request reset code */
export interface ForgotPasswordRequestDto {
  createPasswordResetCodeDto: {
    email: string;
  };
}

export interface ForgotPasswordResponse {
  createdDate: string;
  expirationDate: string;
}

/** Forgot Password - Step 2: Reset password with code */
export interface ForgotPasswordResetDto {
  email: string;
  resetCode: string;
  newPassword: string;
  ipAddress: string;
}

export interface ForgotPasswordResetResponse {
  token: string;
  expirationDate: string;
}

