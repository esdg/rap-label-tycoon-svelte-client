<script lang="ts">
	export let image: string;
	export let id: string | undefined = undefined;
	// Allow parent to override the gradient overlay classes
	export let gradientClass = '';

	let className = '';
	export { className as class };
</script>

<section
	{id}
	class="relative grid select-none md:h-auto md:basis-2/5 md:overflow-hidden {className}"
>
	<img src={image} alt="Hero" class="absolute inset-0 h-full w-full object-cover" />

	<div class={`absolute inset-0 ${gradientClass}`}></div>

	<div class="relative z-10 mx-auto flex h-full max-w-6xl items-end px-6 text-white">
		<slot />
	</div>
</section>
