import type { promptBody } from '$lib/types';
import config from '$lib/utils/apiConfig';

export async function getResponseFromLLM(promptBody: promptBody) {
	const response = await fetch(`${config.apiUrl}grade-ai/chat`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(promptBody)
	});

	return response;
}
