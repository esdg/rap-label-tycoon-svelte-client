<script lang="ts">
	import {
		HomeIcon,
		CurrencyDollarIcon,
		CalendarDaysIcon,
		PowerIcon,
		MegaphoneIcon,
		MagnifyingGlassCircleIcon,
		TrophyIcon
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
		description?: string;
		disabled?: boolean;
		exactMatch?: boolean;
	}

	const menuItems: MenuItem[] = [
		{
			path: '/labels',
			icon: HomeIcon,
			label: 'Label Dashboard',
			description:
				'Your command center. Get a quick snapshot of your label’s health: money, reputation, active projects, and urgent tasks that need your attention.',
			exactMatch: true
		},
		{
			path: '/labels/roster',
			icon: RosterIcon,
			label: 'Label Roster',
			description:
				'Manage your signed artists. Check their stats, mood, contracts, and progress, and decide who to develop, push, or let go.'
		},
		{
			path: '/artists/talents-scouting',
			icon: MagnifyingGlassCircleIcon,
			label: 'Artist Finder',
			description:
				'Discover the next big thing. Browse unsigned artists, listen to their demos, and decide who to sign to your label. The future of hip-hop is in your hands.'
		},
		{
			path: '/labels/music-and-release',
			icon: RecordIconSmall,
			label: 'Music & Releases',
			description:
				'Oversee your music projects. Track production stages, manage release schedules, and ensure every drop is a hit.'
		},
		{
			path: '/labels/finances',
			icon: CurrencyDollarIcon,
			label: 'Financial Overview',
			description:
				'Keep your label profitable. Monitor income, expenses, and cash flow to make informed financial decisions and grow your empire.'
		},
		{
			path: '/marketing',
			icon: MegaphoneIcon,
			label: 'Marketing (Coming Soon)',
			description:
				'Promote your label and artists. Plan campaigns, track engagement, and build your brand presence.',
			disabled: true
		},
		{
			path: '/schedule',
			icon: CalendarDaysIcon,
			label: 'Schedule (Coming Soon)',
			description:
				'Organize your label’s calendar. Manage events, deadlines, and important dates to keep everything on track.',
			disabled: true
		},
		{
			path: '/leaderboard',
			icon: TrophyIcon,
			label: 'Leaderboard',
			description:
				'See how your label stacks up against the competition. Compare ratings, reputation, and rankings with other labels.'
		}
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

<nav class="flex min-h-screen flex-col items-center gap-2 bg-black px-4 py-3 text-white">
	{#each menuItems as item, index (item.path)}
		{#if item.disabled}
			<Tooltip position="right">
				<span slot="trigger" class="cursor-not-allowed opacity-50">
					<svelte:component this={item.icon} class={getIconClass(item.path, true)} />
				</span>
				<p class="text-white">{item.label}</p>
				<p>{item.description}</p>
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
				<p class="text-white">{item.label}</p>
				<p>{item.description}</p>
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
