/**
 * Modal configuration constants
 * Centralized default images and titles for task modals
 */

export const MODAL_DEFAULTS = {
	SCOUTING: {
		title: 'Scouting Talents',
		imageUrl:
			'https://res.cloudinary.com/dig430oem/image/upload/v1770582359/scouting-cover_puhh6v.png'
	},
	SIGNING_CONTRACT: {
		title: 'Signing Contract',
		imageUrl:
			'https://res.cloudinary.com/dig430oem/image/upload/v1770582358/signing-contract-cover_zk5vee.png'
	},
	PRODUCING_BEATS: {
		title: 'Producing Beats',
		imageUrl:
			'https://res.cloudinary.com/dig430oem/image/upload/v1770582359/scouting-cover_puhh6v.png'
	},
	RECORDING_RELEASE: {
		title: 'Recording Release',
		imageUrl:
			'https://res.cloudinary.com/dig430oem/image/upload/v1770582359/scouting-cover_puhh6v.png'
	}
} as const;

export const MODAL_TYPES = {
	TASK: 'task-modal'
} as const;

export const TASK_SUB_MODALS = {
	SCOUT: 'scout',
	SCOUT_RESULTS: 'scout-results',
	SIGN_CONTRACT: 'sign-contract',
	PRODUCING_BEATS: 'producing-beats',
	RECORDING_RELEASE: 'recording-release'
} as const;
