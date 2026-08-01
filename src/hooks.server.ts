import * as Sentry from '@sentry/sveltekit';
import { sequence } from '@sveltejs/kit/hooks';
import { handle as authHandle } from '$lib/utils/auth';

const loginRedirectHandle = (async ({ event, resolve }) => {
	if (event.url.pathname === '/login') {
		const session = await event.locals.auth();
		if (session?.user) {
			return new Response(null, {
				status: 302,
				headers: { Location: '/' }
			});
		}
	}
	return resolve(event);
}) satisfies import('@sveltejs/kit').Handle;

export const handle = sequence(Sentry.sentryHandle(), authHandle, loginRedirectHandle);
export const handleError = Sentry.handleErrorWithSentry();
