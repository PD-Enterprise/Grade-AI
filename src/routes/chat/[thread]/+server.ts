import { getResponseFromLLM } from '$lib/api/getResponseFromLLM';

export async function POST({ request }) {
	const body = await request.json();
	const cookie = request.headers.get('cookie') || '';

	const apiResponse = await getResponseFromLLM(body.promptBody, cookie);
	if (!apiResponse.ok) {
		return new Response(apiResponse.body, {
			status: apiResponse.status,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	return new Response(apiResponse.body, {
		headers: {
			'Content-Type': 'application/x-ndjson',
			'Cache-Control': 'no-cache',
			Connection: 'keep-alive'
		}
	});
}
