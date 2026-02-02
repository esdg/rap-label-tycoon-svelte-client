<script lang="ts">
	import NumericField from '$lib/components/formfields/NumericField.svelte';
	import SelectField from '$lib/components/formfields/SelectField.svelte';
	import SelectGroupField, {
		type SelectGroupChoice
	} from '$lib/components/formfields/SelectGroupField.svelte';

	// Computed choices
	$: scoutingTypeChoices = [
		{ name: 'test', value: 0 },
		{ name: 'test1', value: 1 },
		{ name: 'test2', value: 2 }
	];

	let value: number | null = null;

	let choice: SelectGroupChoice = 0;
</script>

<div class="h-screen">
	<SelectGroupField bind:selected={choice}>
		<div slot="left">
			<!-- left content -->
			<NumericField
				id="bonus"
				label="Bonus"
				bind:value
				step={1000}
				suffix="$"
				min={0}
				max={500000}
			/>
		</div>
		<div slot="right">
			<!-- right content -->
		</div>
	</SelectGroupField>
</div>
