import { getModelList } from '$lib/api/getModelList.js';
import { updateUserAcademicLevel } from '$lib/api/updateUserAcademicLevel.js';
import { returnJson } from '$lib/utils/returnJson.js';

// eslint-disable-next-line no-empty-pattern
export async function GET({}) {
	const [success, error, message, data] = await getModelList();

	if (error || !success) {
		return returnJson(500, message, null, error);
	}
	return returnJson(200, 'Model List fetched successfully', data, null);
}

export async function POST({ request }) {
	const body = await request.json();
	const cookie = request.headers.get('cookie') || '';

	const [success, error, message, data, errDetail] = await updateUserAcademicLevel(
		body.academicLevel,
		cookie
	);

	if (error || !success) {
		return returnJson(500, message, null, errDetail);
	}
	return returnJson(200, message, data, null);
}
