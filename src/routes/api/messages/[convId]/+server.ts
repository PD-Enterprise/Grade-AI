import { getMessages } from '$lib/api/messages';
import { returnJson } from '$lib/utils/returnJson';

export async function GET({ params, request }) {
	const cookie = request.headers.get('cookie') || '';

	const [success, error, message, data, errDetail] = await getMessages(params.convId, cookie);

	if (error || !success) {
		return returnJson(500, message, null, errDetail);
	}
	return returnJson(200, message, data, null);
}
