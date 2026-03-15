export type ChatRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
	id: string;
	role: ChatRole;
	content: string;
}
export interface Thread {
	id: string;
	title: string;
	messages: ChatMessage[];
	status: 'loading' | 'success' | 'error';
}

export type UserData = {
	name: string;
	email: string;
	image: string | null | undefined;
	membership: 'tier-1' | 'tier-2' | 'tier-3' | undefined;
};

export type ModelList = {
	providerName: 'groq' | 'openrouter' | 'gemini';
	modelName: string;
	modelString: string;
	description: string;
};

export type promptBody = {
	prompt: string;
	provider: 'groq' | 'openrouter' | 'gemini';
	model: string;
	mode: 'socratic' | 'direct';
	history: ChatMessage[];
	conversationId: Thread['id'] | undefined;
};
