import { sentrySvelteKit } from '@sentry/sveltekit';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sentrySvelteKit({
			org: 'pd-enterprise',
			project: 'grade-ai'
		}),
		tailwindcss(),
		sveltekit()
	],
	define: {
		'process.env.IS_PREACT': JSON.stringify('true')
	}
});
