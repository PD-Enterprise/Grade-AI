import type { UserData } from '$lib/types';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	const { user, session } = locals;

	const membership: UserData['membership'] | undefined = 'tier-1';

	return {
		session,
		user,
		membership
	};
};
