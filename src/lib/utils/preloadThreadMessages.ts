import type { ChatMessage } from '$lib/types';
import { addMessage, loadThreadMessages } from '$lib/threads';
import { threadMessages } from '$lib/stores/store.svelte';

const loadedThreads = new Set<string>();
const inFlight = new Set<string>();

export async function preloadThreadMessages(threadId: string): Promise<void> {
	if (loadedThreads.has(threadId) || inFlight.has(threadId)) return;

	const cached = threadMessages.values[threadId] ?? loadThreadMessages(threadId);
	if (cached.length > 0) {
		threadMessages.values[threadId] ??= cached;
		loadedThreads.add(threadId);
		return;
	}

	inFlight.add(threadId);
	loadedThreads.add(threadId);
	try {
		const res = await fetch(`/api/messages/${threadId}`, {
			method: 'GET',
			headers: { 'Content-Type': 'application/json' }
		});
		const result = await res.json();
		if (result.status === 200 && Array.isArray(result.data?.messages)) {
			const messages: ChatMessage[] = [];
			for (const m of result.data.messages) {
				const msg: ChatMessage = {
					id: m.clientUUID,
					conversationId: threadId,
					role: m.role,
					content: m.content,
					model: m.model,
					provider: m.provider,
					timestamp: m.createdAt
				};
				messages.push(msg);
				addMessage(msg);
			}
			threadMessages.values[threadId] = messages.sort((a, b) => a.timestamp - b.timestamp);
		}
	} catch (e) {
		console.error('Failed to preload messages:', e);
	} finally {
		inFlight.delete(threadId);
	}
}
