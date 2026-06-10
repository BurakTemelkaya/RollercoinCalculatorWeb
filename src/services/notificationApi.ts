import { apiFetch } from './apiClient';
import { buildApiUrl } from '../config/api';

export interface NotificationPreferenceDto {
    id: string;
    userId: string;
    notificationType: string;
    isWebPushEnabled: boolean;
    isEmailEnabled: boolean;
    createdDate: string;
    updatedDate: string | null;
}

export interface CreateNotificationPreferenceDto {
    notificationType: string;
    isWebPushEnabled: boolean;
    isEmailEnabled: boolean;
}

export interface CreateWebPushSubscriptionCommand {
    endpoint: string;
    p256dh: string;
    auth: string;
}

/**
 * Retrieves the current notification preferences for the logged-in user.
 */
export async function getNotificationPreferences(token: string): Promise<NotificationPreferenceDto[]> {
    const url = buildApiUrl('/api/NotificationPrefence');
    const response = await apiFetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    return response.json();
}

/**
 * Creates or updates the notification preferences for the logged-in user.
 */
export async function updateNotificationPreferences(token: string, preferences: CreateNotificationPreferenceDto[]): Promise<void> {
    const url = buildApiUrl('/api/NotificationPrefence');
    const response = await apiFetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ notificationPrefences: preferences })
    });
    await response.json();
}

/**
 * Subscribes the user to web push notifications with the provided browser subscription details.
 */
export async function createPushSubscription(token: string, command: CreateWebPushSubscriptionCommand): Promise<void> {
    const url = buildApiUrl('/api/PushNotification');
    const response = await apiFetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(command)
    });
    await response.json();
}
