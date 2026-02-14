<script lang="ts">
	import { ClockIcon } from 'heroicons-svelte/24/solid';
	import type { EventLog } from '$lib/types/eventLog';
	import { formatRelativeTime } from '$lib/utils/timeUtils';
	import { formatPayloadLabel } from '$lib/utils/notificationUtils';
	import Chip from '../Chip.svelte';
	import { describeEvent } from './notificationTemplates';

	export let event: EventLog;
	export let currentPlayerId: string | null | undefined;

	$: tone = getTone(event);

	function getTone(event: EventLog) {
		if (event.dataPayload.success === false) {
			return {
				badge: 'bg-error-900/40 text-error-200'
			};
		}

		return {
			badge: 'bg-success-900/50 text-success-200'
		};
	}
</script>

<article class="relative flex gap-3 border-b border-gray-700/40 px-4 py-3 last:border-b-0">
	{#if !event.isRead}
		<div
			class="absolute right-2 top-2 h-1.5 w-1.5 flex-none rounded-full bg-secondary-500 text-xs"
		></div>
	{/if}
	<div class="flex flex-1 flex-col gap-1">
		<div class="flex flex-wrap items-center gap-2 text-sm font-thin text-white">
			<Chip class={`${tone.badge} rounded-none text-xs`}>
				{formatPayloadLabel(event.dataPayload.payload_type)}
			</Chip>
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
		<p class="text-xs text-gray-300">
			{#each describeEvent(event, currentPlayerId) as part, index (index)}
				{#if part.kind === 'link'}
					<a href={part.href} class="text-secondary-400 hover:underline">{part.label}</a>
				{:else}
					<span>{part.value}</span>
				{/if}
			{/each}
		</p>
	</div>
</article>
