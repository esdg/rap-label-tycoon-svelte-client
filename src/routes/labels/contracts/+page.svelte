<script lang="ts">
	import RosterSubNaviationBar from '$lib/components/navigation/RosterSubNaviationBar.svelte';
	import PageContentWithScroll from '$lib/components/PageContentWithScroll.svelte';
</script>

<PageContentWithScroll>
	<div>
		<div class="mb-10 flex select-none flex-wrap items-start justify-between gap-4">
			<div>
				<h1 class="text-7xl font-thin uppercase leading-none">Contracts</h1>
				<p class="text-sm text-gray-300">Your label's contracts with artists.</p>
			</div>
			<RosterSubNaviationBar />
		</div>
	</div>
</PageContentWithScroll>
