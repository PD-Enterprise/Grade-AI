import { resolve } from '$app/paths';
import { authClient } from './auth-client';

export async function login() {
	const data = await authClient.signIn.social({
		provider: 'google',
		callbackURL: '/',
		errorCallbackURL: '/error'
	});

	return data;
}

export async function logout() {
	await authClient.signOut({
		fetchOptions: {
			onSuccess: () => {
				window.location.href = resolve('/');
			}
		}
	});
}
