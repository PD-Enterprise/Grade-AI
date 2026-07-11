export function grow(node: HTMLTextAreaElement, { value }: { value: string }) {
	void value;
	const update = () => {
		node.style.height = 'auto';
		node.style.height = Math.min(node.scrollHeight, 250) + 'px';
	};
	update();
	return { update };
}
