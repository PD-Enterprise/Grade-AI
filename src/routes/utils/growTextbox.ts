export function grow(node: HTMLTextAreaElement, { value }: { value: string }) {
	function update({ value: v }: { value: string }) {
		if (!v) {
			node.style.height = '';
			return;
		}
		node.style.height = 'auto';
		node.style.height = Math.min(node.scrollHeight, 250) + 'px';
	}
	update({ value });
	return { update };
}
