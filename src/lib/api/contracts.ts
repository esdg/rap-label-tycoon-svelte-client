// Contracts API functions
import { apiFetch } from './client';
import type { Contract } from '$lib/types/contracts';

export async function fetchContractsByIds(ids: string[]): Promise<Contract[]> {
    if (ids.length === 0) return [];
    const idsParam = ids.join(',');
    return apiFetch<Contract[]>(`/api/v1/contracts/by-ids?ids=${idsParam}`);
}

export async function fetchContractById(id: string): Promise<Contract> {
    return apiFetch<Contract>(`/api/v1/contracts/${id}`);
}

// Note: No direct label->contracts endpoint exists yet
// Contracts are fetched by IDs from task results
