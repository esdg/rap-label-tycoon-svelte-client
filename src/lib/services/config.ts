import { get } from 'svelte/store';
import { queryClient, queryKeys } from '$lib/queries/queryClient';
import { fetchClientConfig } from '$lib/api/config';
import { appState } from '$lib/stores/appState';
import type { AppConfig } from '$lib/types/config';

export async function loadClientConfig(): Promise<AppConfig> {
    const existing = get(appState).clientConfig;
    if (existing) return existing;

    const config = await fetchClientConfig();
    appState.setClientConfig(config);

    // Seed caches so queries can reuse this static reference data
    queryClient.setQueryData(queryKeys.clientConfig, config);
    queryClient.setQueryData(queryKeys.scoutingScopes, config.scoutingScopes);

    return config;
}
