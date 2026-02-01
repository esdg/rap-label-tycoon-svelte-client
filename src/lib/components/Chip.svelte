<script>
	let className = '';
	export { className as class };
</script>

<span
	class="inline-flex items-center
    lowercase
    rounded
    px-2 py-0.5
    text-sm font-medium
    bg-primary-500 text-black {className}"
>
	<slot />
</span>
