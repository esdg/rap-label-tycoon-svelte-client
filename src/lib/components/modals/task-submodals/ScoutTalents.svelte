<script lang="ts">
	import { onMount } from 'svelte';
	import { modalStore } from '$lib/stores/modal';
	import { label, updateLabelBankroll } from '$lib/stores/label';
	import { player } from '$lib/stores/player';
	import { addScoutingTask } from '$lib/stores/tasks';
	import { fetchScoutingScopes, createScoutingTask, TaskCreationError } from '$lib/api';
	import { RapMusicStyle, RapMusicStyleNames } from '$lib/types/musicStyles';
	import {
		ScoutingType,
		ScoutingTypeNames,
		TaskCreationErrorType,
		type ScoutingScope
	} from '$lib/types/scouting';
	import SelectField from '$lib/components/formfields/SelectField.svelte';

	let scoutingType: ScoutingType = ScoutingType.Rappers;
	let selectedScope: string | null = null;
	let selectedGenres: Set<RapMusicStyle> = new Set();
	let scoutingScopes: ScoutingScope[] = [];
	let loading = false;
	let error: string | null = null;

	// Prepare choices for SelectField components
	$: scoutingTypeChoices = [
		{ name: ScoutingTypeNames[ScoutingType.Rappers], value: ScoutingType.Rappers },
		{ name: ScoutingTypeNames[ScoutingType.Beatmakers], value: ScoutingType.Beatmakers }
	];

	$: scopeChoices = scoutingScopes.map((scope) => ({
		name: scope.displayName,
		value: scope.id,
		title: scope.description
	}));

	$: genreChoices = Object.values(RapMusicStyle)
		.filter((v) => typeof v === 'number')
		.map((genre) => ({
			name: RapMusicStyleNames[genre as RapMusicStyle],
			value: genre
		}));

	onMount(async () => {
		try {
			scoutingScopes = await fetchScoutingScopes();
		} catch (err) {
			error = 'Failed to load scouting scopes';
			console.error(err);
		}
	});

	function getErrorMessage(errorCode: number, defaultMessage: string): string {
		const errorMessages: Record<number, string> = {
			[TaskCreationErrorType.NotFound]: 'Resource not found. Please try again.',
			[TaskCreationErrorType.ValidationError]: 'Invalid request. Please check your selections.',
			[TaskCreationErrorType.InsufficientBudget]:
				'Insufficient budget. You need more funds to start this scouting task.',
			[TaskCreationErrorType.WorkerBusy]:
				'You are already assigned to another active task. Complete it first.',
			[TaskCreationErrorType.TaskLimitReached]:
				'Your label has reached the maximum number of active tasks.',
			[TaskCreationErrorType.ActiveContractExists]: 'This artist already has an active contract.',
			[TaskCreationErrorType.WorkerExhausted]:
				'You are exhausted and need to rest before taking on new tasks.'
		};

		return errorMessages[errorCode] || defaultMessage;
	}

	async function handleStartScouting() {
		if (!$label) {
			error = 'No label found';
			return;
		}

		if (!$player) {
			error = 'No player found';
			return;
		}

		if (!selectedScope) {
			error = 'Please select a coverage option';
			return;
		}

		if (selectedGenres.size === 0) {
			error = 'Please select at least one genre';
			return;
		}

		loading = true;
		error = null;

		try {
			const taskRequest = {
				labelId: $label.id,
				workerId: $player.id,
				scoutingType: scoutingType,
				productionStyles: Array.from(selectedGenres),
				scopeId: selectedScope
			};

			const response = await createScoutingTask(taskRequest);

			// Add task to store
			addScoutingTask(response);

			// Update label bankroll
			updateLabelBankroll(-response.budgetRequired);

			// Close modal
			modalStore.close();
		} catch (err) {
			if (err instanceof TaskCreationError) {
				error = getErrorMessage(err.errorResponse.code, err.errorResponse.message);
			} else {
				error = 'Failed to create scouting task. Please try again.';
			}
			console.error(err);
		} finally {
			loading = false;
		}
	}

	function handleCancel() {
		modalStore.close();
	}
</script>

<section class="flex flex-col gap-6 px-6 md:px-8 pb-6 h-full" aria-label="Scout Talents">
	<h2 class="text-3xl font-bold text-gray-900">Scout Talents</h2>

	{#if error}
		<div
			class="px-4 py-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm animate-in fade-in duration-200"
		>
			{error}
		</div>
	{/if}

	<!-- Scout For -->
	<SelectField
		label="Scout for"
		choices={scoutingTypeChoices}
		mode="toggle"
		bind:value={scoutingType}
		defaultValue={ScoutingType.Rappers}
		labelFor="scouting-type-btn"
	/>

	<!-- Coverage -->
	<SelectField
		label="Coverage"
		choices={scopeChoices}
		mode="toggle"
		bind:value={selectedScope}
		labelFor="scouting-scope-btn"
	/>

	<!-- Genre -->
	<SelectField
		label="Genre"
		choices={genreChoices}
		mode="multi"
		bind:value={selectedGenres}
		labelFor="genre-btn"
	/>

	<!-- Prospector -->
	<div class="flex flex-col gap-3">
		<label class="text-xs font-semibold text-gray-600 uppercase tracking-wider" for="prospector-btn"
			>Prospector</label
		>
		<div class="flex flex-wrap gap-2">
			<button
				id="prospector-btn"
				class="px-5 py-2.5 border rounded font-medium text-sm bg-indigo-600 border-indigo-600 text-white shadow-sm opacity-75 cursor-not-allowed"
				disabled
			>
				You
			</button>
		</div>
	</div>

	<!-- Actions -->
	<div class="flex gap-3 pt-2">
		<button
			class="px-6 py-3 rounded-md font-semibold text-base transition-all duration-200
				{loading
				? 'bg-indigo-400 text-white cursor-wait'
				: 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg active:scale-95'}"
			on:click={handleStartScouting}
			disabled={loading}
		>
			{loading ? 'Starting...' : 'Start Scouting'}
		</button>
		<button
			class="px-6 py-3 rounded-md font-semibold text-base bg-white text-gray-800 border border-gray-300
				hover:border-gray-400 hover:shadow-md active:scale-95 transition-all duration-200"
			on:click={handleCancel}
		>
			Cancel
		</button>
	</div>
</section>
