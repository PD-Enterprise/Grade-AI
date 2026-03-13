export function returnJson(
	status: number,
	message: string | unknown,
	data: unknown,
	error: unknown
) {
	return new Response(
		JSON.stringify({
			status: status,
			message: message,
			data: data,
			error: error
		})
	);
}
