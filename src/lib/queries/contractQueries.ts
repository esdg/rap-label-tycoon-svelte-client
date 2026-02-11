// Contracts query hooks
import { createQuery, useQueryClient } from '@tanstack/svelte-query';
import { queryKeys } from './queryClient';
import { fetchContractsByIds, fetchContractsByLabelId } from '$lib/api/contracts';
import type { Contract } from '$lib/types/contracts';
import { ContractStatus } from '$lib/types/contracts';

// Query: Fetch contracts by IDs
export function createContractsByIdsQuery(ids: string[]) {
	return createQuery<Contract[], Error>({
		queryKey: ids.length > 0 ? queryKeys.contracts.byIds(ids) : ['contracts', 'none'],
		queryFn: () => fetchContractsByIds(ids),
		enabled: ids.length > 0
	});
}

// Query: Fetch all contracts for a label
export function createLabelContractsQuery(labelId: string | null) {
	return createQuery<Contract[], Error>({
		queryKey: labelId ? queryKeys.contracts.byLabel(labelId) : ['contracts', 'none'],
		queryFn: () => fetchContractsByLabelId(labelId!),
		enabled: !!labelId
	});
}

// Helper: Filter contracts by status (use with query results)
export function filterContractsByStatus(contracts: Contract[], status: ContractStatus): Contract[] {
	return contracts.filter((c) => c.status === status);
}

// Helper: Get signed contracts
export function getSignedContracts(contracts: Contract[]): Contract[] {
	return filterContractsByStatus(contracts, ContractStatus.Signed);
}

// Helper: Get contracts in negotiation
export function getNegotiationContracts(contracts: Contract[]): Contract[] {
	return filterContractsByStatus(contracts, ContractStatus.Negotiation);
}

// Add contracts to cache
export function addContractsToCache(contracts: Contract[], labelId: string) {
	const queryClient = useQueryClient();

	queryClient.setQueryData<Contract[]>(queryKeys.contracts.byLabel(labelId), (old) => {
		if (!old) return contracts;
		const existingIds = new Set(old.map((c) => c.id));
		const newContracts = contracts.filter((c) => !existingIds.has(c.id));
		return [...old, ...newContracts];
	});
}
