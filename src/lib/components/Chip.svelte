<script lang="ts">
	let className = '';
	export { className as class };
</script>

<div
	class="
    lowercase
    rounded
    px-2 py-0 min-w-12 w-fit text-center
    text-xs
    {className}"
>
	<slot />
</div>
