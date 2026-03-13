import { getModelList } from '$lib/api/getModelList.js';
import { returnJson } from '$lib/utils/returnJson.js';

// eslint-disable-next-line no-empty-pattern
export async function GET({}) {
	const [success, error, message, data] = await getModelList();
	// console.log(success, error);
	// console.log(message);
	// console.log(data);

	if (error || !success) {
		return returnJson(500, message, null, error);
	}
	return returnJson(200, 'Model List fetched successfully', data, null);
}
