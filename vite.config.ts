import { sentrySvelteKit } from '@sentry/sveltekit';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		// sentrySvelteKit({
		// 	org: process.env.SENTRY_ORG,
		// 	project: process.env.SENTRY_PROJECT,
		// 	authToken: process.env.SENTRY_AUTH_TOKEN,
		// }),
		tailwindcss(),
		sveltekit()
	],
	define: {
		'process.env.IS_PREACT': JSON.stringify('true')
	}
});
