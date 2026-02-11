/**
 * Store for managing user-facing notifications (errors, success, info, warnings)
 */

import { writable } from 'svelte/store';

export type NotificationType = 'error' | 'success' | 'info' | 'warning';

export interface ErrorNotification {
	id: string;
	title: string;
	message: string;
	timestamp: number;
	type: NotificationType;
}

function createErrorNotificationStore() {
	const { subscribe, update } = writable<ErrorNotification[]>([]);

	return {
		subscribe,

		/**
		 * Add a new notification
		 */
		add: (title: string, message: string, type: NotificationType = 'error') => {
			const notification: ErrorNotification = {
				id: crypto.randomUUID(),
				title,
				message,
				timestamp: Date.now(),
				type
			};

			update((notifications) => [...notifications, notification]);

			// Auto-dismiss after 8 seconds (or 5 for success)
			const dismissTime = type === 'success' ? 5000 : 8000;
			setTimeout(() => {
				update((notifications) => notifications.filter((n) => n.id !== notification.id));
			}, dismissTime);
		},

		/**
		 * Dismiss a specific notification
		 */
		dismiss: (id: string) => {
			update((notifications) => notifications.filter((n) => n.id !== id));
		},

		/**
		 * Clear all notifications
		 */
		clear: () => {
			update(() => []);
		}
	};
}

export const errorNotifications = createErrorNotificationStore();
