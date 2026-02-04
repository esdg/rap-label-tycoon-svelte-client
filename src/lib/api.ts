// Re-export everything from the new API module structure
// This file maintains backward compatibility with existing imports

export * from './api/index';

// Legacy aliases for backward compatibility
export { fetchPlayerById as getPlayerById } from './api/players';
export { fetchPlayerByFirebaseId as getPlayerByFirebaseUserId } from './api/players';
export { fetchLabelById as getLabelById } from './api/labels';
export { fetchLabelsByIds as getPlayerLabels } from './api/labels';
export { fetchArtistsByIds as getArtistsByIds } from './api/artists';
export { fetchContractsByIds as getContractsByIds } from './api/contracts';

// Legacy 'api' function alias (used by guards and other legacy code)
export { apiFetch as api } from './api/client';
