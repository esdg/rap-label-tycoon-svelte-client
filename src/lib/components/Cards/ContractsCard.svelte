<script lang="ts">
	import type { SigningContractResults } from '$lib/types/SigningContractTask';
	import type { TaskResponse } from '$lib/types/task';

	export let contractsTaskResponse: TaskResponse[] = [];

	function getSigningArtistId(task: TaskResponse): string | null {
		const results = task.results as SigningContractResults | null;
		return results?.contract?.artistId ?? null;
	}
</script>

<article>
	<div>Curently negociating {contractsTaskResponse.length} contract(s)</div>
	<div>
		{#each contractsTaskResponse as contractTask}
			<div class="border p-2 my-2">
				<div>{getSigningArtistId(contractTask) ?? ''}</div>
				<div>{contractTask.results?.details}</div>
			</div>
		{/each}
	</div>
</article>
