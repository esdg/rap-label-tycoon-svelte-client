// Modal Usage Examples
// This file demonstrates how to use the modal system from different parts of your application

import { modalStore } from '$lib/stores/modal';

/**
 * Example 1: Open Example Modal 1
 * Call this function from any page or component
 */
export const openExampleModal1 = (data?: Record<string, any>) => {
    modalStore.open('example1', data);
};

/**
 * Example 2: Open Example Modal 2
 * Call this function from any page or component
 */
export const openExampleModal2 = (data?: Record<string, any>) => {
    modalStore.open('example2', data);
};

/**
 * Example 3: Close the current modal
 * Call this function to close any open modal
 */
export const closeModal = () => {
    modalStore.close();
};

/**
 * Example 4: Update modal data
 * Useful for updating modal content without closing and reopening
 */
export const updateModalData = (data: Record<string, any>) => {
    modalStore.updateData(data);
};

// ============================================
// USAGE EXAMPLES - How to use in components
// ============================================

/**
 * Usage Example 1: Open modal from a button click in a Svelte component
 *
 * <script lang="ts">
 *   import { openExampleModal1, openExampleModal2 } from '$lib/modals/usage';
 * </script>
 *
 * <button on:click={() => openExampleModal1()}>
 *   Open Modal 1
 * </button>
 *
 * <button on:click={() => openExampleModal2()}>
 *   Open Modal 2
 * </button>
 */

/**
 * Usage Example 2: Open modal with data
 *
 * <script lang="ts">
 *   import { openExampleModal1 } from '$lib/modals/usage';
 *
 *   const user = {
 *     name: 'John Doe',
 *     email: 'john@example.com'
 *   };
 * </script>
 *
 * <button on:click={() => openExampleModal1(user)}>
 *   Open Modal with User Data
 * </button>
 */

/**
 * Usage Example 3: Import from route component
 *
 * File: src/routes/+page.svelte
 *
 * <script lang="ts">
 *   import { openExampleModal1, openExampleModal2 } from '$lib/modals/usage';
 * </script>
 *
 * <main>
 *   <h1>Welcome</h1>
 *   <button on:click={() => openExampleModal1()}>
 *     Click me for Modal 1
 *   </button>
 *   <button on:click={() => openExampleModal2()}>
 *     Click me for Modal 2
 *   </button>
 * </main>
 */
