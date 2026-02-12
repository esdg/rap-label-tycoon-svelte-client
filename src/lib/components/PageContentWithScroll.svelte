<script>
	import bgImage from '$lib/assets/main-bg-office.png';
</script>

<div
	class="h-screen overflow-hidden bg-cover bg-center text-white"
	style="background-image: url({bgImage}); background-size: cover; background-position: center;"
>
	<div class="h-full overflow-auto overflow-x-hidden p-4 sm:p-8">
		<div class="mx-auto max-w-7xl flex-col gap-6">
			<slot />
		</div>
	</div>
</div>
