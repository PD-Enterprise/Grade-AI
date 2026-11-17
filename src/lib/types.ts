export type ChatProvider = 'groq' | 'gemini' | 'cloudflare';

export type ChatRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
	id: string;
	conversationId: string;
	role: ChatRole;
	content: string;
	model?: string;
	provider?: ChatProvider;
	previousVersions?: string[];
	warning?: string;
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
	providerName: ChatProvider;
	modelName: string;
	modelString: string;
	description: string;
};

export type promptBody = {
	prompt: string;
	provider: ChatProvider;
	model: string;
	mode: 'socratic' | 'direct';
	history?: { role: ChatRole; content: string }[];
	conversationId: Thread['id'];
	messageClientId: string;
	assistantClientId: string;
};
