export function functionReturn(
	successState: boolean,
	errorState: boolean,
	message: string,
	data: unknown = null,
	error: unknown = null
) {
	return [successState, errorState, message, data, error];
}
