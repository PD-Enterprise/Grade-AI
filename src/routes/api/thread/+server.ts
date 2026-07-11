import { createNewThread } from '$lib/api/threads';
import { returnJson } from '$lib/utils/returnJson';

export async function POST({ request }) {
	const body = await request.json();
	const cookie = request.headers.get('cookie') || '';

	const [success, error, message, data, errDetail] = await createNewThread(
		body.id,
		body.title,
		body.prompt || '',
		cookie
	);

	if (error || !success) {
		return returnJson(500, message, null, errDetail);
	}
	return returnJson(200, message, data, null);
}
