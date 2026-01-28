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
         * Update modal data
         */
        updateData: (data: Record<string, any>) => {
            update((state) => ({
                ...state,
                data: { ...state.data, ...data }
            }));
        }
    };
};

export const modalStore = createModalStore();
