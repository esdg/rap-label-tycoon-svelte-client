<script lang="ts">
	import {
		HomeIcon,
		BuildingOfficeIcon,
		CurrencyDollarIcon,
		CalendarDaysIcon,
		PowerIcon,
		MegaphoneIcon,
		MagnifyingGlassCircleIcon
	} from 'heroicons-svelte/24/solid';
	import RecordIconSmall from '$lib/icons/RecordIconSmall.svelte';
	import RosterIcon from '$lib/icons/RosterIcon.svelte';
	import { logoutAndRedirect } from '$lib/services/auth';

	async function handleLogout() {
		await logoutAndRedirect();
	}
</script>

<nav class="bg-black text-white px-4 py-3 flex flex-col gap-4 items-center">
	<a href="/labels"><HomeIcon class=" hover:text-secondary-500 w-6 h-6" /></a>
	<a href="/labels/roster"><RosterIcon class=" hover:text-secondary-500 w-6 h-6" /></a>
	<BuildingOfficeIcon class=" hover:text-secondary-500 w-6 h-6" />
	<a href="/labels/music-and-release"
		><RecordIconSmall class=" hover:text-secondary-500 w-6 h-6" /></a
	>
	<a href="/artists/talents-scouting"
		><MagnifyingGlassCircleIcon class=" hover:text-secondary-500 w-6 h-6" /></a
	>
	<a href="/labels/finances"><CurrencyDollarIcon class=" hover:text-secondary-500 w-6 h-6" /></a>
	<MegaphoneIcon class=" hover:text-secondary-500 w-6 h-6" />
	<CalendarDaysIcon class=" hover:text-secondary-500 w-6 h-6" />

	<button on:click={handleLogout} class="mt-auto">
		<PowerIcon class=" hover:text-secondary-500 w-6 h-6" />
	</button>
</nav>
