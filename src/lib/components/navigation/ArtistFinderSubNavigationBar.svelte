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
				color={isActive('/artists/talents-scouting', currentPath, true)
					? 'groupNavigationActive'
					: 'groupNavigation'}
				altText="Open scout talents modal"
				on:clicked={() => goto('/artists/talents-scouting')}
			>
				Finder
			</Button>
		</svelte:fragment>
		Open the scouting interface to discover new artists for your label; this will show you potential talents
		in the world and allow you to send out scouts to find them.
	</Tooltip>
	<Tooltip position="bottom" maxWidth={260}>
		<svelte:fragment slot="trigger">
			<Button
				color={isActive('/artists/watchlist', currentPath, true)
					? 'groupNavigationActive'
					: 'groupNavigation'}
				altText="Refresh scouting tasks"
				on:clicked={() => goto('/artists/watchlist')}
			>
				Watchlist
			</Button>
		</svelte:fragment>
		View artists you have scouted and are currently tracking; this is where you can manage your scouting
		targets and see potential signings before they are added to your roster.
	</Tooltip>
	<Tooltip position="bottom" maxWidth={260}>
		<svelte:fragment slot="trigger">
			<Button
				color={isActive('/artists/discovered', currentPath, true)
					? 'groupNavigationActive'
					: 'groupNavigation'}
				altText="Refresh scouting tasks"
				on:clicked={() => goto('/artists/discovered')}
			>
				Discovered
			</Button>
		</svelte:fragment>
		View artists you have discovered through scouting; this is where you can review potential new signings
		and decide who to add to your label's roster.
	</Tooltip>
</ButtonsGroup>
