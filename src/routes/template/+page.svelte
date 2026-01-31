<script>
	import hero from '$lib/assets/hero-register.png';
</script>

<div class="flex flex-row h-screen">
	<section class="basis-2/5 overflow-hidden relative select-none">
		<img src={hero} alt="Hero" class="absolute inset-0 h-full w-full object-cover" />

		<div class="absolute inset-0 bg-gradient-to-t from-black/70 to-black/20"></div>

		<div class="relative z-10 mx-auto flex h-full max-w-6xl items-end px-6 pb-16 text-white">
			<div class="w-112 mx-auto">
				<h1 class="text-5xl font-black mb-4 text-center">Start your journey as a label boss</h1>
				<p class="max-w text-lg text-center">
					Sign artists, build your roster, and turn raw talent into legends.
				</p>
				<p class="max-w text-2xl font-medium text-center mt-6 text-primary-500">
					Your story starts now.
				</p>
			</div>
		</div>
	</section>
	<section class="basis-3/5"></section>
</div>
