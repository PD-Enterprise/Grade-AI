import { createAuthClient } from 'better-auth/svelte';
import config from './apiConfig';

export const authClient = createAuthClient({
	baseURL: config.apiUrl
});
