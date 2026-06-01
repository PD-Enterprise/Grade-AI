import type { ChatMessage, Thread, ThreadStatus } from '$lib/types';

const STORAGE_PREFIX = 'thread:';

function storageKey(id: string): string {
	return `${STORAGE_PREFIX}${JSON.stringify(id)}`;
}

export function createThread(
	id: string,
	title: string,
	mode: 'direct' | 'socratic'
): Thread {
	return {
		id,
		title,
		mode,
		messages: [],
		status: 'idle',
		createdAt: Date.now(),
		updatedAt: Date.now()
	};
}

export function createUserMessage(content: string, model?: string, provider?: 'groq' | 'gemini'): ChatMessage {
	return {
		id: crypto.randomUUID(),
		role: 'user',
		content,
		model,
		provider,
		timestamp: Date.now()
	};
}

export function createAssistantMessage(): ChatMessage {
	return {
		id: crypto.randomUUID(),
		role: 'assistant',
		content: '',
		timestamp: Date.now()
	};
}

export function addMessage(thread: Thread, message: ChatMessage): Thread {
	thread.messages.push(message);
	thread.updatedAt = Date.now();
	saveThread(thread);
	return thread;
}

export function updateMessage(
	thread: Thread,
	messageId: string,
	updates: Partial<ChatMessage>
): Thread {
	const idx = thread.messages.findIndex((m) => m.id === messageId);
	if (idx === -1) return thread;
	thread.messages[idx] = { ...thread.messages[idx], ...updates };
	saveThread(thread);
	return thread;
}

export function removeMessage(thread: Thread, messageId: string): Thread {
	thread.messages = thread.messages.filter((m) => m.id !== messageId);
	thread.updatedAt = Date.now();
	saveThread(thread);
	return thread;
}

export function setThreadStatus(thread: Thread, status: ThreadStatus): Thread {
	thread.status = status;
	saveThread(thread);
	return thread;
}

function legacyStorageKey(id: string): string {
	return `${STORAGE_PREFIX} "${id}"`;
}

export function deleteThread(threadId: string): void {
	localStorage.removeItem(storageKey(threadId));
	localStorage.removeItem(legacyStorageKey(threadId));
}

export function saveThread(thread: Thread): void {
	const canonical = storageKey(thread.id);
	const legacy = legacyStorageKey(thread.id);
	if (localStorage.getItem(legacy) !== null) {
		localStorage.removeItem(legacy);
	}
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
