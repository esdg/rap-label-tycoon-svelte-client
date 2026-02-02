<script lang="ts">
	export let id: string;
</script>

<label
	for={id}
	class="2xl:flex-row-reverse 2xl:w-24 2xl:h-10 mr-4 2xl:absolute 2xl:right-full block text-base mb-2 flex items-center text-right uppercase font-thin select-none"
>
	<slot />
</label>
