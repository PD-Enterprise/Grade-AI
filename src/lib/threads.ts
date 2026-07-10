import type { ChatMessage, Thread, ThreadStatus } from '$lib/types';

const STORAGE_PREFIX = 'thread:';
const MESSAGE_STORAGE_PREFIX = 'message:';

function storageKey(id: string): string {
	return `${STORAGE_PREFIX}${JSON.stringify(id)}`;
}

function messageStorageKey(id: string): string {
	return `${MESSAGE_STORAGE_PREFIX}${JSON.stringify(id)}`;
}

export function createThread(id: string, title: string, mode: 'direct' | 'socratic'): Thread {
	return {
		id,
		title,
		mode,
		status: 'idle',
		createdAt: Date.now(),
		updatedAt: Date.now()
	};
}

export function createUserMessage(
	conversationId: string,
	content: string,
	model?: string,
	provider?: 'groq' | 'gemini'
): ChatMessage {
	return {
		id: crypto.randomUUID(),
		conversationId,
		role: 'user',
		content,
		model,
		provider,
		timestamp: Date.now()
	};
}

export function createAssistantMessage(
	conversationId: string,
	model?: string,
	provider?: 'groq' | 'gemini'
): ChatMessage {
	return {
		id: crypto.randomUUID(),
		conversationId,
		role: 'assistant',
		content: '',
		model,
		provider,
		timestamp: Date.now()
	};
}

export function addMessage(message: ChatMessage): void {
	localStorage.setItem(messageStorageKey(message.id), JSON.stringify(message));
}

export function updateMessage(messageId: string, updates: Partial<ChatMessage>): void {
	const key = messageStorageKey(messageId);
	const data = localStorage.getItem(key);
	if (!data) return;
	const message = JSON.parse(data) as ChatMessage;
	localStorage.setItem(key, JSON.stringify({ ...message, ...updates }));
}

export function removeMessage(messageId: string): void {
	localStorage.removeItem(messageStorageKey(messageId));
}

export function loadThreadMessages(threadId: string): ChatMessage[] {
	const messages: ChatMessage[] = [];
	for (let i = 0; i < localStorage.length; i++) {
		const key = localStorage.key(i);
		if (key?.startsWith(MESSAGE_STORAGE_PREFIX)) {
			const data = localStorage.getItem(key);
			if (data && data !== 'undefined') {
				try {
					const message = JSON.parse(data) as ChatMessage;
					if (message && message.conversationId === threadId) {
						messages.push(message);
					}
				} catch {
					// skip malformed entries
				}
			}
		}
	}
	return messages.sort((a, b) => a.timestamp - b.timestamp);
}

export function setThreadStatus(thread: Thread, status: ThreadStatus): Thread {
	thread.status = status;
	saveThread(thread);
	return thread;
}

export function deleteThread(threadId: string): void {
	for (let i = 0; i < localStorage.length; i++) {
		const key = localStorage.key(i);
		if (key?.startsWith(MESSAGE_STORAGE_PREFIX)) {
			const data = localStorage.getItem(key);
			if (data && data !== 'undefined') {
				try {
					const message = JSON.parse(data) as ChatMessage;
					if (message.conversationId === threadId) {
						localStorage.removeItem(key);
					}
				} catch {
					// skip
				}
			}
		}
	}
	localStorage.removeItem(storageKey(threadId));
}

export function saveThread(thread: Thread): void {
	const canonical = storageKey(thread.id);
	localStorage.setItem(canonical, JSON.stringify(thread));
}

export function loadAllThreads(): Thread[] {
	const threads: Thread[] = [];
	const seen = new Set<string>();
	for (let i = 0; i < localStorage.length; i++) {
		const key = localStorage.key(i);
		if (key?.startsWith(STORAGE_PREFIX)) {
			const data = localStorage.getItem(key);
			if (data && data !== 'undefined') {
				try {
					const thread = JSON.parse(data) as Thread;
					if (thread && thread.id && !seen.has(thread.id)) {
						seen.add(thread.id);
						threads.push(thread);
					}
				} catch {
					// skip malformed entries
				}
			}
		}
	}
	return threads;
}
