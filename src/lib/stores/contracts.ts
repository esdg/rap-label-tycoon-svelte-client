import { writable, derived } from 'svelte/store';
import type { Contract } from '$lib/types/contracts';
import { ContractStatus } from '$lib/types/contracts';

// Main store holding all contracts for the current label
export const contracts = writable<Contract[]>([]);

// Derived store for signed contracts
export const signedContracts = derived(contracts, ($contracts) =>
    $contracts.filter((contract) => contract.status === ContractStatus.Signed)
);

// Derived store for contracts in negotiation
export const negotiationContracts = derived(contracts, ($contracts) =>
    $contracts.filter((contract) => contract.status === ContractStatus.Negotiation)
);

// Derived store for refused contracts
export const refusedContracts = derived(contracts, ($contracts) =>
    $contracts.filter((contract) => contract.status === ContractStatus.Refused)
);

// Derived store for expired contracts
export const expiredContracts = derived(contracts, ($contracts) =>
    $contracts.filter((contract) => contract.status === ContractStatus.Expired)
);

// Helper function to add a contract
export function addContract(contract: Contract) {
    contracts.update((currentContracts) => [...currentContracts, contract]);
}

// Helper function to remove a contract by ID
export function removeContract(contractId: string) {
    contracts.update((currentContracts) =>
        currentContracts.filter((contract) => contract.id !== contractId)
    );
}

// Helper function to update a contract
export function updateContract(contractId: string, updatedContract: Partial<Contract>) {
    contracts.update((currentContracts) =>
        currentContracts.map((contract) =>
            contract.id === contractId ? { ...contract, ...updatedContract } : contract
        )
    );
}

// Helper function to get contract by artist ID
export function getContractByArtistId(artistId: string, contractsList: Contract[]): Contract | undefined {
    return contractsList.find((contract) => contract.artistId === artistId);
}

// Helper function to set all contracts (useful for initial load from API)
export function setContracts(newContracts: Contract[]) {
    contracts.set(newContracts);
}

// Helper function to clear all contracts
export function clearContracts() {
    contracts.set([]);
}
