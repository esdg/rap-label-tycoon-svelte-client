import { apiFetch } from './client';
import type { AppConfig } from '$lib/types/config';

export async function fetchClientConfig(): Promise<AppConfig> {
    return apiFetch<AppConfig>('/api/v1/client-config');
}
