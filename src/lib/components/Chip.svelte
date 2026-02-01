<script>
	let className = '';
	export { className as class };
</script>

<div
	class="
    lowercase
    rounded
    px-2 py-0.5 min-w-12 w-fit text-center
    text-xs
    bg-primary-500 text-black {className}"
>
	<slot />
</div>
