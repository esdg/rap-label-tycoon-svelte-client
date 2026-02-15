<script lang="ts">
	import {
		BellAlertIcon,
		ArrowPathIcon,
		ExclamationTriangleIcon,
		ClockIcon
	} from 'heroicons-svelte/24/solid';
	import { currentLabel, currentPlayer } from '$lib/stores/appState';
	import {
		createEventLogsQuery,
		createMarkEventLogsAsReadMutation
	} from '$lib/queries/eventLogQueries';
	import { clickOutside } from '$lib/utils/clickOutside';
	import NotificationItem from './NotificationItem.svelte';

	let isOpen = false;
	let includeRead = true;
	let limit = 10;
	let markedIds = new Set<string>();
	let isMarking = false;
	let markTimeout: ReturnType<typeof setTimeout> | null = null;

	$: labelId = $currentLabel?.id ?? null;
	$: playerId = $currentPlayer?.id ?? null;
	$: eventLogsQuery = createEventLogsQuery(labelId, {
		limit,
		includeRead,
		refetchInterval: 15000
	});
	$: unreadCount = $eventLogsQuery?.data?.filter((event) => !event.isRead).length ?? 0;

	const markAsReadMutation = createMarkEventLogsAsReadMutation();

	function markUnreadAsRead() {
		if (labelId && $eventLogsQuery.data && !isMarking) {
			const unreadIds = $eventLogsQuery.data
				.filter((event) => !event.isRead && !markedIds.has(event.id))
				.map((event) => event.id);

			if (unreadIds.length > 0) {
				isMarking = true;
				// Track these IDs to prevent re-marking
				unreadIds.forEach((id) => markedIds.add(id));

				$markAsReadMutation.mutate(
					{
						labelId,
						eventLogIds: unreadIds
					},
					{
						onSettled: () => {
							isMarking = false;
						}
					}
				);
			}
		}
	}

	function togglePanel() {
		isOpen = !isOpen;

		// Clear any pending mark timeout
		if (markTimeout) {
			clearTimeout(markTimeout);
			markTimeout = null;
		}

		// Mark as read after 2 seconds when opening
		if (isOpen) {
			markTimeout = setTimeout(() => {
				markUnreadAsRead();
				markTimeout = null;
			}, 2000);
		}
	}

	function closePanel() {
		// Clear timeout and mark immediately when closing
		if (markTimeout) {
			clearTimeout(markTimeout);
			markTimeout = null;
		}
		markUnreadAsRead();
		isOpen = false;
	}
</script>

<div class="relative flex flex-col items-center" use:clickOutside on:click_outside={closePanel}>
	<button
		type="button"
		on:click={togglePanel}
		class="relative rounded-full p-2 text-white transition hover:text-secondary-500 focus:outline-none"
		aria-expanded={isOpen}
		aria-label="Toggle notifications"
	>
		<BellAlertIcon class="h-6 w-6" />
		{#if unreadCount > 0}
			<span
				class="absolute -right-0 -top-0 mr-1 mt-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-secondary-500 text-[10px] font-semibold text-black shadow-lg"
			>
				{unreadCount}
			</span>
		{/if}
	</button>

	{#if isOpen}
		<div
			class="absolute -right-6 top-14 z-50 w-[26rem] max-w-[80vw] select-none before:absolute before:-top-[8px] before:left-[364px] before:z-[60] before:h-4 before:w-4 before:rotate-45 before:border-l before:border-t before:border-gray-600/70 before:bg-primary-950/95 before:content-['']"
			style="box-shadow: rgba(0, 0, 0, 0.07) 0px 1px 2px, rgba(0, 0, 0, 0.07) 0px 2px 4px, rgba(0, 0, 0, 0.07) 0px 4px 8px, rgba(0, 0, 0, 0.07) 0px 8px 16px, rgba(0, 0, 0, 0.07) 0px 16px 32px, rgba(0, 0, 0, 0.07) 0px 32px 64px;"
		>
			<div
				class="overflow-hidden rounded-md border border-gray-600/70 bg-primary-950/95 shadow-2xl backdrop-blur"
			>
				<section class="max-h-[70vh] overflow-y-auto">
					{#if $eventLogsQuery.isLoading}
						<div class="flex items-center gap-3 px-4 py-6 text-gray-300">
							<ArrowPathIcon class="h-5 w-5 animate-spin text-secondary-400" />
							<span>Loading the latest updates...</span>
						</div>
					{:else if $eventLogsQuery.isError}
						<div class="flex items-start gap-3 px-4 py-5 text-red-200">
							<ExclamationTriangleIcon class="h-5 w-5 text-red-400" />
							<div>
								<p class="text-sm font-semibold">Could not fetch notifications</p>
								<p class="text-xs text-red-200/80">{$eventLogsQuery.error?.message}</p>
							</div>
						</div>
					{:else if !$eventLogsQuery.data || $eventLogsQuery.data.length === 0}
						<div class="flex items-center gap-3 px-4 py-6 text-gray-300">
							<ClockIcon class="h-5 w-5 text-secondary-400" />
							<span>No {includeRead ? '' : 'unread '}notifications yet.</span>
						</div>
					{:else}
						{#each $eventLogsQuery.data as event (event.id)}
							<NotificationItem {event} currentPlayerId={playerId} />
						{/each}
					{/if}
				</section>
			</div>
		</div>
	{/if}
</div>
