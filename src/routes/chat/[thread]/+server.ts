import { getResponseFromLLM } from '$lib/api/getResponseFromLLM.js';

export async function POST({ request }) {
	const body = await request.json();

	const apiResponse = await getResponseFromLLM(body.promptBody);
	if (!apiResponse.ok) {
		return new Response(apiResponse.body, {
			status: apiResponse.status,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	return new Response(apiResponse.body, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			Connection: 'keep-alive'
		}
	});
}
