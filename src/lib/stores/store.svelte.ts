import type { UserData } from '$lib/types';
import { writable } from 'svelte/store';

export const sidebarStatus = $state({ value: true });

export const isAuthenticated = $state({ value: false });
export const userData = $state<{ value: UserData }>({
	value: {
		name: '',
		email: '',
		image: '',
		membership: 'tier-1'
	}
});
