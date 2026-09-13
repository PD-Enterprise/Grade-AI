import { deleteThread, updateThreadTitle } from '$lib/api/threads';
import { returnJson } from '$lib/utils/returnJson';

export async function PATCH({ params, request }) {
	const cookie = request.headers.get('cookie') || '';
	const body = await request.json();

	const [success, error, message, data, errDetail] = await updateThreadTitle(
		params.id,
		{ title: body.title, regenerate: body.regenerate, prompt: body.prompt },
		cookie
	);

	if (error || !success) {
		return returnJson(500, message, null, errDetail);
	}
	return returnJson(200, message, data, null);
}

export async function DELETE({ params, request }) {
	const cookie = request.headers.get('cookie') || '';

	const [success, error, message, data, errDetail] = await deleteThread(params.id, cookie);

	if (error || !success) {
		return returnJson(500, message, null, errDetail);
	}
	return returnJson(200, message, data, null);
}
