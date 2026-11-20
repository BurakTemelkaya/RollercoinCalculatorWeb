import { buildApiUrl } from '../config/api';
import { apiFetch } from './apiClient';
import { GetListOperationClaimDto, CreateUserOperationClaimDto, CreateUserOperationClaimResponseDto, DeleteUserOperationClaimDto, DeleteUserOperationClaimResponseDto } from '../types/auth';
import { PaginatedResponse } from '../types/pagination';

export interface RollerCoinTokenUpdateDto {
  accessToken: string;
  refreshToken: string;
}

export async function updateRollercoinToken(dto: RollerCoinTokenUpdateDto, userToken: string): Promise<boolean> {
  // Replace this URL with the actual endpoint for CreateRollerCoinTokenUpdateCommand
  // It is usually derived from the controller name.
  const url = buildApiUrl('/api/RollercoinToken');
  
  const response = await apiFetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken}`
    },
    body: JSON.stringify(dto),
  });

  // The user stated the API returns a boolean (true/false)
  const result = await response.json();
  return result === true;
}

/** Step of the admin-assisted RollerCoin sign-in: solve the captcha, or type the e-mailed code. */
export interface RollerCoinLoginStep {
  step: 'captcha' | 'code';
  email?: string;
  captchaImg?: string;
  thumbImg?: string;
  width: number;
  height: number;
  maxDots: number;
}

async function postRollercoinLogin<T>(path: string, body: unknown, userToken: string): Promise<T> {
  const response = await apiFetch(buildApiUrl(`/api/RollercoinToken/login/${path}`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
    body: JSON.stringify(body),
  });
  return response.json();
}

export const startRollercoinLogin = (userToken: string) =>
  postRollercoinLogin<RollerCoinLoginStep>('start', {}, userToken);

/** points: "x1,y1,x2,y2,..." in captcha image pixels. */
export const submitRollercoinCaptcha = (points: string, userToken: string) =>
  postRollercoinLogin<RollerCoinLoginStep>('captcha', { points }, userToken);

export const verifyRollercoinLoginCode = (code: string, userToken: string) =>
  postRollercoinLogin<boolean>('code', { code }, userToken);

export async function getOperationClaims(accessToken: string, pageIndex = 0, pageSize = 100): Promise<PaginatedResponse<GetListOperationClaimDto>> {
  const url = buildApiUrl(`/api/OperationClaim?PageRequest.PageIndex=${pageIndex}&PageRequest.PageSize=${pageSize}`);
  
  const response = await apiFetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  return await response.json();
}

export async function assignRoleToUser(dto: CreateUserOperationClaimDto, accessToken: string): Promise<CreateUserOperationClaimResponseDto> {
  const url = buildApiUrl('/api/UserOperationClaim');
  
  const response = await apiFetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({ createUserOperationClaimDto: dto }),
  });

  return await response.json();
}

export async function removeRoleFromUser(dto: DeleteUserOperationClaimDto, accessToken: string): Promise<DeleteUserOperationClaimResponseDto> {
  const url = buildApiUrl(`/api/UserOperationClaim?DeleteUserOperationClaimDto.UserId=${dto.userId}&DeleteUserOperationClaimDto.OperationClaimId=${dto.operationClaimId}`);
  
  const response = await apiFetch(url, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  return await response.json();
}
