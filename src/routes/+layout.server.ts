import type { UserData } from '$lib/types';
import config from '$lib/utils/apiConfig';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async (event) => {
	const session = await event.locals.auth();
	let membership: UserData['membership'] | undefined;
	let academicLevel: UserData['academicLevel'] | undefined;

	if (session && session.user) {
		const user = session.user;
		if (!user.email || !user.name || !user.image) {
			return {
				status: 400,
				message: 'User data missing'
			};
		}

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

		// Get user academic level
		const userAcademicLevel = await getUserAcademicLevel(user.email);
		if (userAcademicLevel instanceof Error) {
			return {
				status: 500,
				message: 'Error getting user academic level'
			};
		}
		academicLevel = userAcademicLevel?.academicLevel;

		// console.log(academicLevel);

		return {
			session,
			user,
			membership,
			academicLevel
		};
	}
};

async function insertUser(email: string, name: string, image: string | null | undefined) {
	try {
		const request = await fetch(`${config.apiUrl}/users/new-user`, {
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
		return new Error('Error inserting user' + error);
	}
}

async function getUserRole(email: string) {
	try {
		const request = await fetch(`${config.apiUrl}/users/roles/get-role`, {
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
		return new Error('Error getting user role' + error);
	}
}

async function getUserAcademicLevel(email: string) {
	try {
		const request = await fetch(`${config.apiUrl}/grade-ai/get-user-academic-level`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				email: email
			})
		});
		const result = await request.json();

		return result.data;
	} catch (error) {
		return new Error('Error getting user role' + error);
	}
}
