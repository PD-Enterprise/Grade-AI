import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	const { user, session } = locals;

	// if (session) {
	// 	try {
	// 		const request = await fetch(`${config.apiUrl}users/new-user`, {
	// 			method: 'POST',
	// 			headers: { 'Content-Type': 'application/json' },
	// 			body: JSON.stringify({
	// 				name: session.user.name,
	// 				email: session.user.email
	// 			})
	// 		});
	// 		const result = await request.json();
	// 	} catch (error) {
	// 		return {
	// 			status: 500,
	// 			message: 'Error adding user to database'
	// 		};
	// 	}
	// }
	return {
		user
	};
};
