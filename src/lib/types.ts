export type ChatRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
	id: string;
	conversationId: string;
	role: ChatRole;
	content: string;
	model?: string;
	provider?: 'groq' | 'gemini';
	timestamp: number;
}

export type ThreadStatus = 'idle' | 'loading' | 'success' | 'error';

export interface Thread {
	id: string;
	title: string;
	mode: 'direct' | 'socratic';
	status: ThreadStatus;
	createdAt: number;
	updatedAt: number;
}

export type UserData = {
	name: string;
	email: string;
	image: string | null | undefined;
	membership: 'tier-1' | 'tier-2' | 'tier-3' | undefined;
	academicLevel: string | undefined;
};

export type ModelList = {
	providerName: 'groq' | 'gemini';
	modelName: string;
	modelString: string;
	description: string;
};

export type promptBody = {
	conversationId: Thread['id'];
	messageClientId: string;
	assistantClientId: string;
};
