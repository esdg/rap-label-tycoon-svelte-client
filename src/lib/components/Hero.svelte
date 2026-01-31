<script lang="ts">
	export let image: string;
	export let id: string | undefined = undefined;
</script>

<section {id} class="h-128 md:h-auto md:basis-2/5 md:overflow-hidden relative select-none">
	<img src={image} alt="Hero" class="absolute inset-0 h-full w-full object-cover" />

	<div
		class="absolute inset-0 bg-gradient-to-t from-app md:via-app md:via-10% to-transparent"
	></div>

	<div class="relative z-10 mx-auto flex h-full max-w-6xl items-end px-6 pb-24 text-white">
		<slot />
	</div>
</section>
