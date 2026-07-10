import type { ChatMessage } from '$lib/types';

export function scrollToBottom(
	messages: ChatMessage[],
	messagesContainer: HTMLDivElement | undefined,
	instant: boolean = false
) {
	if (messages.length && messagesContainer) {
		messagesContainer.scrollTo({
			top: messagesContainer.scrollHeight,
			behavior: instant ? 'instant' : 'smooth'
		});
	}
}
