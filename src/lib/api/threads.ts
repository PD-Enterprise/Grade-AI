import type { Thread } from '$lib/types';
import config from '$lib/utils/apiConfig';
import { functionReturn } from '$lib/utils/functionReturn';

export async function createNewThread(id: Thread['id'], title: Thread['title'], cookie?: string) {
	const headers: Record<string, string> = { 'Content-Type': 'application/json' };
	if (cookie) {
		headers['Cookie'] = cookie;
	}

	const response = await fetch(`${config.apiUrl}/grade-ai/thread`, {
		method: 'POST',
		headers,
		body: JSON.stringify({
			title: title,
			clientUUID: id
		})
	});
	const data = await response.json();

	if (data.status !== 200) {
		return functionReturn(false, true, data.message, null, data.error);
	} else {
		return functionReturn(true, false, data.message, data.data, null);
	}
}

export async function getThreads(cookie?: string) {
	const headers: Record<string, string> = { 'Content-Type': 'application/json' };
	if (cookie) {
		headers['Cookie'] = cookie;
	}

	const response = await fetch(`${config.apiUrl}/grade-ai/threads`, {
		method: 'GET',
		headers
	});
	const data = await response.json();

	if (data.status !== 200) {
		return functionReturn(false, true, data.message, null, data.error);
	} else {
		return functionReturn(true, false, data.message, data.data, null);
	}
}

export async function deleteThread(id: Thread['id'], cookie?: string) {
	const headers: Record<string, string> = { 'Content-Type': 'application/json' };
	if (cookie) {
		headers['Cookie'] = cookie;
	}

	const response = await fetch(`${config.apiUrl}/grade-ai/thread/${id}`, {
		method: 'DELETE',
		headers
	});
	const data = await response.json();

	if (data.status !== 200) {
		return functionReturn(false, true, data.message, null, data.error);
	} else {
		return functionReturn(true, false, data.message, data.data, null);
	}
}
