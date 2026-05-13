import { svelteKitHandler } from 'better-auth/svelte-kit';
import { auth } from '$lib/utils/auth';
import { building } from '$app/environment';

export async function handle({ event, resolve }) {
	return svelteKitHandler({
		event,
		resolve,
		auth,
		building
	});
}
