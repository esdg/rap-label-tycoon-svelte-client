import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
	// Redirect to labels dashboard
	// The +layout.svelte handles all auth checks and redirects
	throw redirect(302, '/labels');
};
