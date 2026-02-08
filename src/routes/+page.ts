import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
    // Since this is the root route and we want authenticated users to go to their label dashboard,
    // we'll redirect immediately. The +layout.svelte handles auth checks for all routes.
    throw redirect(302, '/labels');
};
