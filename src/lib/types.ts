export type ChatRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
	role: ChatRole;
	content: string;
}

export type UserData = {
	name: string;
	email: string;
	image: string | null | undefined;
	membership: 'tier-1' | 'tier-2' | 'tier-3' | undefined;
};
