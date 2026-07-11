import type { ChatMessage, Thread, ThreadStatus } from '$lib/types';

const STORAGE_PREFIX = 'thread:';
const MESSAGE_STORAGE_PREFIX = 'message:';
const MESSAGE_INDEX_PREFIX = 'message-index:';

function storageKey(id: string): string {
	return `${STORAGE_PREFIX}${JSON.stringify(id)}`;
}

function messageStorageKey(id: string): string {
	return `${MESSAGE_STORAGE_PREFIX}${JSON.stringify(id)}`;
}

function messageIndexKey(threadId: string): string {
	return `${MESSAGE_INDEX_PREFIX}${JSON.stringify(threadId)}`;
}

function getMessageIndex(threadId: string): string[] {
	const key = messageIndexKey(threadId);
	const data = localStorage.getItem(key);
	if (!data) return [];
	try {
		return JSON.parse(data) as string[];
	} catch {
		return [];
	}
}

function saveMessageIndex(threadId: string, index: string[]): void {
	localStorage.setItem(messageIndexKey(threadId), JSON.stringify(index));
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
	const index = getMessageIndex(message.conversationId);
	index.push(message.id);
	saveMessageIndex(message.conversationId, index);
}

export function updateMessage(messageId: string, updates: Partial<ChatMessage>): void {
	const key = messageStorageKey(messageId);
	const data = localStorage.getItem(key);
	if (!data) return;
	const message = JSON.parse(data) as ChatMessage;
	localStorage.setItem(key, JSON.stringify({ ...message, ...updates }));
}

export function removeMessage(messageId: string): void {
	const key = messageStorageKey(messageId);
	const data = localStorage.getItem(key);
	if (data) {
		try {
			const message = JSON.parse(data) as ChatMessage;
			const index = getMessageIndex(message.conversationId);
			const filtered = index.filter((id) => id !== messageId);
			if (filtered.length !== index.length) {
				saveMessageIndex(message.conversationId, filtered);
			}
		} catch {
			// skip
		}
	}
	localStorage.removeItem(key);
}

export function loadThreadMessages(threadId: string): ChatMessage[] {
	const index = getMessageIndex(threadId);
	if (index.length > 0) {
		const messages: ChatMessage[] = [];
		for (const id of index) {
			const data = localStorage.getItem(messageStorageKey(id));
			if (data && data !== 'undefined') {
				try {
					const message = JSON.parse(data) as ChatMessage;
					if (message) messages.push(message);
				} catch {
					// skip malformed entries
				}
			}
		}
		return messages.sort((a, b) => a.timestamp - b.timestamp);
	}

	// Fallback: scan all keys (legacy data without index)
	const messages: ChatMessage[] = [];
	const keys = Object.keys(localStorage);
	for (const key of keys) {
		if (key.startsWith(MESSAGE_STORAGE_PREFIX)) {
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
	const index = getMessageIndex(threadId);
	for (const id of index) {
		localStorage.removeItem(messageStorageKey(id));
	}
	localStorage.removeItem(messageIndexKey(threadId));
	localStorage.removeItem(storageKey(threadId));
}

export function saveThread(thread: Thread): void {
	const canonical = storageKey(thread.id);
	localStorage.setItem(canonical, JSON.stringify(thread));
}

export function loadAllThreads(): Thread[] {
	const threads: Thread[] = [];
	const seen = new Set<string>();
	const keys = Object.keys(localStorage);
	for (const key of keys) {
		if (key.startsWith(STORAGE_PREFIX)) {
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
