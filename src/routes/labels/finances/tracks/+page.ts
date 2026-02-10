import { executeGuards } from '$lib/guards';
import { requireLabel } from '$lib/guards/rules';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
	await executeGuards({
		rules: [{ name: 'require-label', check: requireLabel }]
	});
};
