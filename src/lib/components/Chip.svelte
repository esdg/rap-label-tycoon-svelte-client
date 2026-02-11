<script lang="ts">
	let className = '';
	export { className as class };
</script>

<div
	class="
    w-fit
    min-w-12 rounded px-2 py-0 text-center
    text-xs
    font-light
    lowercase
    {className}"
>
	<slot />
</div>
