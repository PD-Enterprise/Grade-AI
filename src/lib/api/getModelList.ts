import config from '$lib/utils/apiConfig';
import { functionReturn } from '$lib/utils/functionReturn';

export async function getModelList() {
	const response = await fetch(`${config.apiUrl}grade-ai/get-model-list`);
	const data = await response.json();

	if (data.status !== 200) {
		return functionReturn(false, true, data.message, null, data.error);
	} else {
		return functionReturn(true, false, data.message, data.data, null);
	}
}
