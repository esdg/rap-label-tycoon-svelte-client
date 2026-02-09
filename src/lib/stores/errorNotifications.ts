/**
 * Store for managing user-facing error notifications
 */

import { writable } from 'svelte/store';

export interface ErrorNotification {
	id: string;
	title: string;
	message: string;
	timestamp: number;
}

function createErrorNotificationStore() {
	const { subscribe, update } = writable<ErrorNotification[]>([]);

	return {
		subscribe,

		/**
		 * Add a new error notification
		 */
		add: (title: string, message: string) => {
			const notification: ErrorNotification = {
				id: crypto.randomUUID(),
				title,
				message,
				timestamp: Date.now()
			};

			update((notifications) => [...notifications, notification]);

			// Auto-dismiss after 8 seconds
			setTimeout(() => {
				update((notifications) => notifications.filter((n) => n.id !== notification.id));
			}, 8000);
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
