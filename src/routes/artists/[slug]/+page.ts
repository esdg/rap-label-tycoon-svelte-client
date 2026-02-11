import type { PageLoad } from './$types';

// Auth and label requirement checks are handled by +layout.svelte
export const load: PageLoad = async ({ params }) => {
	return {
		artistId: params.slug
	};
};
