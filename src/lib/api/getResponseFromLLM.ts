import type { promptBody } from '$lib/types';
import config from '$lib/utils/apiConfig';

export async function getResponseFromLLM(promptBody: promptBody, cookie?: string) {
	const headers: Record<string, string> = { 'Content-Type': 'application/json' };
	if (cookie) {
		headers['Cookie'] = cookie;
	}

	const response = await fetch(`${config.apiUrl}/grade-ai/chat`, {
		method: 'POST',
		headers,
		body: JSON.stringify(promptBody)
	});

	return response;
}
