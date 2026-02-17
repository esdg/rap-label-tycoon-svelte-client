<script lang="ts">
	import { ClockIcon } from 'heroicons-svelte/24/solid';
	import type { EventLog } from '$lib/types/eventLog';
	import { formatRelativeTime } from '$lib/utils/timeUtils';
	import { formatPayloadLabel } from '$lib/utils/notificationUtils';
	import Chip from '../Chip.svelte';
	import { describeEvent } from './notificationTemplates';
	import { createEventDispatcher } from 'svelte';

	export let event: EventLog;
	export let currentPlayerId: string | null | undefined;

	const dispatch = createEventDispatcher();

	$: tone = getTone(event);

	function getTone(event: EventLog) {
		if (event.dataPayload.success === false) {
			return {
				badge: 'bg-error-900 text-error-200'
			};
		}

		return {
			badge: 'bg-success-900 text-success-200'
		};
	}

	async function handleActionClick(onClick: () => void | Promise<void>) {
		await onClick();
		dispatch('close-panel');
	}
</script>

<article class="relative flex gap-3 border-b border-gray-700/40 p-2 last:border-b-0">
	{#if !event.isRead}
		<div
			class="absolute right-2 top-2 h-1.5 w-1.5 flex-none rounded-full bg-secondary-500 text-xs"
		></div>
	{/if}
	<div class="flex flex-1 flex-col gap-1">
		<div class="flex flex-wrap items-center gap-2 text-sm font-thin text-white">
			<div class="flex">
				<div class={`${tone.badge} h-auto w-1`}></div>
				<Chip class="rounded-none bg-gray-700 text-xs lowercase text-gray-300">
					{formatPayloadLabel(event.dataPayload.payload_type)}
				</Chip>
			</div>
			<div class="flex flex-wrap items-center gap-1 text-[11px] text-gray-400">
				<ClockIcon class="h-3 w-3 text-gray-600" />
				<span>{formatRelativeTime(event.createdAt)}</span>
				{#if event.readAt}
					<span>
						(viewed {formatRelativeTime(event.readAt)})
					</span>
				{/if}
			</div>
		</div>
		<p class="text-sm text-gray-300">
			{#each describeEvent(event, currentPlayerId) as part, index (index)}
				{#if part.kind === 'link'}
					<a
						href={part.href}
						class="{part.color ?? 'text-secondary-500'} underline hover:no-underline"
						>{part.label}</a
					>
				{:else if part.kind === 'action'}
					<button
						type="button"
						on:click={() => handleActionClick(part.onClick)}
						class="{part.color ?? 'text-secondary-500'} cursor-pointer underline hover:no-underline"
						>{part.label}</button
					>
				{:else}
					<span class={part.color ?? ''}>{part.value}</span>
				{/if}
			{/each}
		</p>
	</div>
</article>
