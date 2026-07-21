import type { UserData, Thread, ModelList } from '$lib/types';

export const sidebarStatus = $state({ value: true });

export const isAuthenticated = $state({ value: false });
export const userData = $state<{ value: UserData }>({
	value: {
		name: '',
		email: '',
		image: '',
		membership: 'tier-1',
		academicLevel: undefined
	}
});
export const userAcademicLevel = $state<{ value: string }>({ value: '' });

export const threads = $state<{ values: Thread[] }>({
	values: []
});

export const currentModel = $state({ value: '' });
export const defaultMode = $state<{ value: 'direct' | 'socratic' }>({ value: 'direct' });
export const modelList = $state<{ values: ModelList[] }>({ values: [] });
export const modelsLoading = $state({ value: true });
export const pageLoading = $state({ value: false });
