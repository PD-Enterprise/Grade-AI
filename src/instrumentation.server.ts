import * as Sentry from '@sentry/sveltekit';

Sentry.init({
	dsn: 'https://ac05b76e8c9268e50762e361b55fb324@o4508974910406656.ingest.us.sentry.io/4511837058564096',

	tracesSampleRate: 1.0,

	// Enable logs to be sent to Sentry
	enableLogs: true

	// uncomment the line below to enable Spotlight (https://spotlightjs.com)
	// spotlight: import.meta.env.DEV,
});
