<script lang="ts">
	export let image: string;
	export let id: string | undefined = undefined;
	// Allow parent to override the gradient overlay classes
	export let gradientClass =
		'bg-gradient-to-t from-primary-950 md:via-primary-950 md:via-10% to-transparent';

	let className = '';
	export { className as class };
</script>

<section
	{id}
	class="md:h-auto md:basis-2/5 md:overflow-hidden relative select-none grid {className}"
>
	<img src={image} alt="Hero" class="absolute inset-0 h-full w-full object-cover" />

	<div class={`absolute inset-0 ${gradientClass}`}></div>

	<div class="relative z-10 mx-auto flex h-full max-w-6xl items-end px-6 text-white">
		<slot />
	</div>
</section>
