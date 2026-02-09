<script lang="ts">
	import {
		HomeIcon,
		CurrencyDollarIcon,
		CalendarDaysIcon,
		PowerIcon,
		MegaphoneIcon,
		MagnifyingGlassCircleIcon
	} from 'heroicons-svelte/24/solid';
	import RecordIconSmall from '$lib/icons/RecordIconSmall.svelte';
	import RosterIcon from '$lib/icons/RosterIcon.svelte';
	import Tooltip from '$lib/components/Tooltip.svelte';
	import { logoutAndRedirect } from '$lib/services/auth';
	import { page } from '$app/stores';

	interface MenuItem {
		path: string;
		icon: any;
		label: string;
		disabled?: boolean;
		exactMatch?: boolean;
	}

	const menuItems: MenuItem[] = [
		{ path: '/labels', icon: HomeIcon, label: 'Label Dashboard', exactMatch: true },
		{ path: '/labels/roster', icon: RosterIcon, label: 'Artist Roster' },
		{
			path: '/artists/talents-scouting',
			icon: MagnifyingGlassCircleIcon,
			label: 'Scout New Talent'
		},
		{ path: '/labels/music-and-release', icon: RecordIconSmall, label: 'Music & Releases' },
		{ path: '/labels/finances', icon: CurrencyDollarIcon, label: 'Financial Overview' },
		{ path: '/marketing', icon: MegaphoneIcon, label: 'Marketing (Coming Soon)', disabled: true },
		{ path: '/schedule', icon: CalendarDaysIcon, label: 'Schedule (Coming Soon)', disabled: true }
	];

	$: currentPath = $page.url.pathname;

	function isActive(path: string, current: string, exactMatch: boolean = false): boolean {
		if (exactMatch) {
			return current === path;
		}
		return current === path || current.startsWith(path + '/');
	}

	$: getIconClass = (path: string, disabled: boolean = false, exactMatch: boolean = false) => {
		if (disabled) return 'h-6 w-6';
		return isActive(path, currentPath, exactMatch)
			? 'text-secondary-500 w-6 h-6'
			: 'w-6 h-6 hover:text-secondary-500';
	};

	async function handleLogout() {
		await logoutAndRedirect();
	}
</script>

<nav class="flex min-h-screen flex-col items-center gap-4 bg-black px-4 py-3 text-white">
	{#each menuItems as item, index (item.path)}
		{#if item.disabled}
			<Tooltip position="right">
				<span slot="trigger" class="cursor-not-allowed opacity-50">
					<svelte:component this={item.icon} class={getIconClass(item.path, true)} />
				</span>
				{item.label}
			</Tooltip>
		{:else}
			<Tooltip position="right">
				<a
					slot="trigger"
					href={item.path}
					class:mb-4={index === 0}
					class:mb-2={item.path === '/labels/music-and-release'}
				>
					<svelte:component
						this={item.icon}
						class={getIconClass(item.path, false, item.exactMatch)}
					/>
				</a>
				{item.label}
			</Tooltip>
		{/if}
	{/each}

	<Tooltip position="right" wrapperClass="mt-auto">
		<button on:click={handleLogout} slot="trigger">
			<PowerIcon class="h-6 w-6 hover:text-secondary-500" />
		</button>
		Sign Out
	</Tooltip>
</nav>
