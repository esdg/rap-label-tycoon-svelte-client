<script lang="ts">
	import { goto } from '$app/navigation';
	import Button from '../Button.svelte';
	import ButtonsGroup from '../ButtonsGroup.svelte';
	import Tooltip from '../Tooltip.svelte';
	import { page } from '$app/stores';

	$: currentPath = $page.url.pathname;

	function isActive(path: string, current: string, exactMatch: boolean = false): boolean {
		if (exactMatch) {
			return current === path;
		}
		return current === path || current.startsWith(path + '/');
	}
</script>

<ButtonsGroup>
	<Tooltip position="bottom" maxWidth={260}>
		<svelte:fragment slot="trigger">
			<Button
				color={isActive('/labels/roster', currentPath, true)
					? 'groupNavigationActive'
					: 'groupNavigation'}
				style="hollow"
				altText="Switch roster/contracts view"
				on:clicked={() => goto('/labels/roster')}
			>
				Roster
			</Button>
		</svelte:fragment>
		A list of all your roster artists; use this to manage and view your current signed talents.
	</Tooltip>
	<Tooltip position="bottom" maxWidth={260}>
		<svelte:fragment slot="trigger">
			<Button
				color={isActive('/labels/contracts', currentPath, true)
					? 'groupNavigationActive'
					: 'groupNavigation'}
				altText="Switch roster/contracts view"
				on:clicked={() => goto('/labels/contracts')}
			>
				Contracts
			</Button>
		</svelte:fragment>
		A list of all your contracts, including unsigned ones; use this to track potential signings and scouting
		targets.
	</Tooltip>
</ButtonsGroup>
