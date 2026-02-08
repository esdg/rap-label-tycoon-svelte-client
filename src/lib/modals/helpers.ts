/**
 * Type-safe modal helper functions
 * Provides strongly-typed interfaces for opening modals
 * Automatically uses transition() if a modal is already open, otherwise uses open()
 */

import { modalStore } from '$lib/stores/modal';
import { MODAL_DEFAULTS, MODAL_TYPES, TASK_SUB_MODALS } from './constants';
import type { Artist } from '$lib/types/nonPlayingCharacter';
import type { ScoutingTaskResponse } from '$lib/types/task';
import { get } from 'svelte/store';

/**
 * Internal helper to open or transition a modal based on current state
 */
function openOrTransition(type: typeof MODAL_TYPES.TASK, data: Record<string, any>) {
	const currentModal = get(modalStore);
	if (currentModal.isOpen) {
		modalStore.transition(type, data);
	} else {
		modalStore.open(type, data);
	}
}

/**
 * Open the talent scouting modal
 */
export function openScoutingModal() {
	openOrTransition(MODAL_TYPES.TASK, {
		subModal: TASK_SUB_MODALS.SCOUT,
		title: MODAL_DEFAULTS.SCOUTING.title,
		imageUrl: MODAL_DEFAULTS.SCOUTING.imageUrl
	});
}

/**
 * Open the scouting results modal
 *
 * @param scoutingTask - The completed scouting task with results
 */
export function openScoutResultsModal(scoutingTask: ScoutingTaskResponse) {
	openOrTransition(MODAL_TYPES.TASK, {
		subModal: TASK_SUB_MODALS.SCOUT_RESULTS,
		scoutingTaskResponse: scoutingTask,
		title: MODAL_DEFAULTS.SCOUTING.title,
		imageUrl: MODAL_DEFAULTS.SCOUTING.imageUrl
	});
}

/**
 * Open the contract signing modal
 *
 * @param artist - The artist to sign a contract with
 * @param options - Optional overrides for title and image
 */
export function openSignContractModal(
	artist: Artist,
	options?: { title?: string; imageUrl?: string }
) {
	openOrTransition(MODAL_TYPES.TASK, {
		subModal: TASK_SUB_MODALS.SIGN_CONTRACT,
		artist,
		title: options?.title ?? MODAL_DEFAULTS.SIGNING_CONTRACT.title,
		imageUrl: options?.imageUrl ?? artist.profileImage ?? MODAL_DEFAULTS.SIGNING_CONTRACT.imageUrl
	});
}

/**
 * Open the beat production modal
 *
 * @param options - Optional overrides for title and image
 */
export function openProducingBeatsModal(options?: { title?: string; imageUrl?: string }) {
	openOrTransition(MODAL_TYPES.TASK, {
		subModal: TASK_SUB_MODALS.PRODUCING_BEATS,
		title: options?.title ?? MODAL_DEFAULTS.PRODUCING_BEATS.title,
		imageUrl: options?.imageUrl ?? MODAL_DEFAULTS.PRODUCING_BEATS.imageUrl
	});
}

/**
 * Open the recording release modal
 *
 * @param options - Optional overrides for title and image
 */
export function openRecordingReleaseModal(options?: { title?: string; imageUrl?: string }) {
	openOrTransition(MODAL_TYPES.TASK, {
		subModal: TASK_SUB_MODALS.RECORDING_RELEASE,
		title: options?.title ?? MODAL_DEFAULTS.RECORDING_RELEASE.title,
		imageUrl: options?.imageUrl ?? MODAL_DEFAULTS.RECORDING_RELEASE.imageUrl
	});
}
