export function generateTitle(text: string, wordLimit: number = 5) {
	const words = text.split(' ');
	if (words.length <= wordLimit) return text;

	return words.slice(0, wordLimit).join(' ') + '...';
}
