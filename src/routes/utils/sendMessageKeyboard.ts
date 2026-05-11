export function handleKeyDown(event: KeyboardEvent, sendMessage: () => void) {
	if (event.key == 'Enter' && !event.shiftKey) {
		event.preventDefault();
		sendMessage();
	}
}
