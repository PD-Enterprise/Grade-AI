import type { UserData, Thread, promptBody, ModelList } from '$lib/types';

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

export const threads = $state<{ values: Thread[] }>({
	values: [
		{
			id: '1',
			title: 'Thread 1',
			messages: [
				{
					role: 'user',
					content: 'Hello, how are you?',
					id: '1-1'
				},
				{
					role: 'assistant',
					content: 'I am fine, thank you for asking.',
					id: '1-2'
				}
			],
			status: 'success'
		},
		{
			id: '2',
			title: 'Thread 2',
			messages: [
				{
					role: 'user',
					content: 'What is your name?',
					id: '2-1'
				},
				{
					role: 'assistant',
					content: 'My name is AI Assistant.',
					id: '2-2'
				}
			],
			status: 'success'
		}
	]
});

export const newPromptBody = $state<{ value: promptBody | null }>({ value: null });

export const currentModel = $state({ value: 'Llama 3.1 8B' });
export const modelType = $state<{ value: 'direct' | 'socratic' }>({ value: 'direct' });
export const modelList = $state<{ values: ModelList[] }>({ values: [] });
