import { resolve } from '$app/paths';
import { authClient } from './authClient';

export async function login() {
	const data = await authClient.signIn.social({
		provider: 'google',
		callbackURL: window.location.origin + '/',
		errorCallbackURL: window.location.origin + '/error'
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
