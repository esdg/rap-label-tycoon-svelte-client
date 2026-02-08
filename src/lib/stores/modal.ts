import { writable } from 'svelte/store';

// Define modal types
export type ModalType = 'task-modal' | 'example2' | null;

interface ModalState {
	type: ModalType;
	isOpen: boolean;
	data?: Record<string, any>;
}

// Create the modal store with initial state
const initialState: ModalState = {
	type: null,
	isOpen: false,
	data: undefined
};

const createModalStore = () => {
	const { subscribe, set, update } = writable<ModalState>(initialState);

	let currentState = initialState;
	subscribe((state) => {
		currentState = state;
	});

	return {
		subscribe,

		/**
		 * Open a specific modal
		 * @param type - The type of modal to open
		 * @param data - Optional data to pass to the modal
		 */
		open: (type: ModalType, data?: Record<string, any>) => {
			update((state) => ({
				...state,
				type,
				isOpen: true,
				data
			}));
		},

		/**
		 * Close the current modal
		 */
		close: () => {
			set(initialState);
		},

		/**
		 * Transition from current modal to a new one with animation
		 * @param type - The type of modal to open
		 * @param data - Optional data to pass to the modal
		 * @param delay - Delay in ms before opening new modal (default: 300ms to match animation)
		 */
		transition: async (type: ModalType, data?: Record<string, any>, delay: number = 300) => {
			set(initialState);
			await new Promise((resolve) => setTimeout(resolve, delay));
			update((state) => ({
				...state,
				type,
				isOpen: true,
				data
			}));
		},

		/**
		 * Update modal data
		 */
		updateData: (data: Record<string, any>) => {
			update((state) => ({
				...state,
				data: { ...state.data, ...data }
			}));
		},

		/**
		 * Get the current modal data
		 * @returns The current modal data or an empty object if none exists
		 */
		getData: () => {
			return currentState.data ?? {};
		}
	};
};

export const modalStore = createModalStore();
