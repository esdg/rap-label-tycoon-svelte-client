<script>
	import ProgressBar from '$lib/components/progress-bars/ProgressBar.svelte';
</script>

<div class="h-screen">
	<ProgressBar
		value={65}
		lengthClass="w-56"
		thicknessClass="h-1"
		backgroundClass="bg-gray-700/50"
		progressClass="bg-emerald-500"
	/>
</div>
