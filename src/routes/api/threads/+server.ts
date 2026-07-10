import { getThreads } from '$lib/api/threads';
import { returnJson } from '$lib/utils/returnJson';

export async function GET({ request }) {
	const cookie = request.headers.get('cookie') || '';

	const [success, error, message, data, errDetail] = await getThreads(cookie);

	if (error || !success) {
		return returnJson(500, message, null, errDetail);
	}
	return returnJson(200, message, data, null);
}
