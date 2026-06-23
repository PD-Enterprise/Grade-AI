import type { UserData } from '$lib/types';
import config from '$lib/utils/apiConfig';
import type { RequestEvent } from '@sveltejs/kit';
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

		// Get user role
		const userRole = await getUserRole(event);
		if (userRole instanceof Error) {
			return {
				status: 500,
				message: 'Error getting user role'
			};
		}
		membership = userRole;

		// Get user academic level
		const userAcademicLevel = await getUserAcademicLevel(event);
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
			membership,
			academicLevel
		};
	}
};

async function getUserRole(event: RequestEvent) {
	try {
		const request = await event.fetch(`${config.apiUrl}/users/roles/get-role`, {
			method: 'GET',
			headers: { 'Content-Type': 'application/json' }
		});
		const result = await request.json();

		return result.data;
	} catch (error) {
		return new Error('Error getting user role' + error);
	}
}

async function getUserAcademicLevel(event: RequestEvent) {
	try {
		const request = await event.fetch(`${config.apiUrl}/users/academic-level`, {
			method: 'GET',
			headers: { 'Content-Type': 'application/json' }
		});
		const result = await request.json();

		return result.data;
	} catch (error) {
		return new Error('Error getting user role' + error);
	}
}
