<script lang="ts">
	import {
		HomeIcon,
		BuildingOfficeIcon,
		CurrencyDollarIcon,
		CalendarDaysIcon,
		PowerIcon,
		MegaphoneIcon
	} from 'heroicons-svelte/24/solid';
	import { logoutAndRedirect } from '$lib/services/auth';

	async function handleLogout() {
		await logoutAndRedirect();
	}
</script>

<nav class="bg-black text-white px-4 py-3 flex flex-col gap-4 items-center">
	<a href="/labels"><HomeIcon class=" hover:text-secondary-500 w-6 h-6" /></a>
	<BuildingOfficeIcon class=" hover:text-secondary-500 w-6 h-6" />
	<CurrencyDollarIcon class=" hover:text-secondary-500 w-6 h-6" />
	<MegaphoneIcon class=" hover:text-secondary-500 w-6 h-6" />
	<CalendarDaysIcon class=" hover:text-secondary-500 w-6 h-6" />

	<button on:click={handleLogout} class="mt-auto">
		<PowerIcon class=" hover:text-secondary-500 w-6 h-6" />
	</button>
</nav>
