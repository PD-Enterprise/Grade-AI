export function grow(node: HTMLTextAreaElement, { value }) {
	const update = () => {
		node.style.height = 'auto';
		node.style.height = Math.min(node.scrollHeight, 150) + 'px';
	};
	update();
	return { update };
}
