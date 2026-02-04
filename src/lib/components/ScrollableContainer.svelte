<script lang="ts">
	export let error: string | null = null;
</script>

<section class="flex flex-col h-full overflow-hidden">
	<!-- Header -->
	{#if $$slots.header}
		<header class="w-full max-w-96 lg:max-w-2xl mx-auto mt-4 sm:mt-6 lg:mt-8 mb-6 px-4 sm:px-0">
			<slot name="header" />
		</header>
	{/if}
	<!-- Main Content - Scrollable -->
	<main class="flex-1 overflow-y-auto">
		<slot />
	</main>
	<!-- Error Message -->
	{#if error}
		<div
			class="flex-shrink-0 px-4 lg:px-6 xl:px-8 py-2 lg:py-3 xl:py-4 bg-error-900/50 text-error-500 text-sm lg:text-base xl:text-lg animate-in fade-in duration-200"
		>
			{error}
		</div>
	{/if}
	<!-- Footer -->
	{#if $$slots.footer}
		<footer
			class="w-full bg-black py-2 sm:py-3 px-3 sm:px-4 border-t border-gray-700 sticky bottom-0"
		>
			<div class="flex flex-col sm:flex-row gap-3 lg:gap-4 sm:items-center">
				<slot name="footer" />
			</div>
		</footer>
	{/if}
</section>
