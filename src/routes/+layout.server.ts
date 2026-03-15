import type { UserData } from '$lib/types';
import config from '$lib/utils/apiConfig';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	const { user, session } = locals;
	let membership: UserData['membership'] | undefined;

	if (session && user) {
		// Add new user to Database
		const userInsertion = await insertUser(user.email, user.name, user.image);
		if (userInsertion instanceof Error) {
			return {
				status: 500,
				message: 'Error inserting user'
			};
		}

		// Get user role
		const userRole = await getUserRole(user.email);
		if (userRole instanceof Error) {
			return {
				status: 500,
				message: 'Error getting user role'
			};
		}
		membership = userRole;
	}

	return {
		session,
		user,
		membership
	};
};

async function insertUser(email: string, name: string, image: string | null) {
	try {
		const request = await fetch(`${config.apiUrl}users/new-user`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				email: email,
				name: name,
				avatarUrl: image
			})
		});

		return await request.json();
	} catch (error) {
		return new Error('Error inserting user');
	}
}

async function getUserRole(email: string) {
	try {
		const request = await fetch(`${config.apiUrl}users/roles/get-role`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				email: email
			})
		});
		const result = await request.json();
		// console.log(result.data);

		return result.data;
	} catch (error) {
		return new Error('Error getting user role');
	}
}
