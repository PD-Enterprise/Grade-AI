import type { UserData } from '$lib/types';
import { writable } from 'svelte/store';
import type { Thread } from '../../routes/types';

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

export const threads = $state<Thread[]>([
	{
		id: '1',
		title: 'Thread 1',
		messages: [
			{
				role: 'user',
				content: 'Hello, how are you?'
			},
			{
				role: 'assistant',
				content: 'I am fine, thank you for asking.'
			}
		]
	},
	{
		id: '2',
		title: 'Thread 2',
		messages: [
			{
				role: 'user',
				content: 'What is your name?'
			},
			{
				role: 'assistant',
				content: 'My name is AI Assistant.'
			}
		]
	}
]);
