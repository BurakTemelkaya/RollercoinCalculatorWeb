import { buildApiUrl } from '../config/api';
import { apiFetch } from './apiClient';

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
