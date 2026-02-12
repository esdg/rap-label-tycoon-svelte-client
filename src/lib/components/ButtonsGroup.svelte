<script lang="ts">
	let className = '';
	export { className as class };
</script>

<div
	class="inline-flex [&>*:not(.fixed):first-of-type>button]:!rounded-l-md [&>*:not(.fixed):first-of-type]:!rounded-l-md [&>*:not(.fixed):last-of-type>button]:!rounded-r-md [&>*:not(.fixed):last-of-type]:!rounded-r-md [&>*:not(.fixed):not(:first-child)>button]:border-l-transparent [&>*:not(.fixed):not(:first-child)]:border-l-transparent [&>*:not(.fixed)>button]:!rounded-none [&>*:not(.fixed)]:!rounded-none {className}"
>
	<slot />
</div>
