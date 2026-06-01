import config from '$lib/utils/apiConfig';
import { functionReturn } from '$lib/utils/functionReturn';

export async function updateUserAcademicLevel(academicLevel: number, cookie?: string) {
	const headers: Record<string, string> = { 'Content-Type': 'application/json' };
	if (cookie) {
		headers['Cookie'] = cookie;
	}

	const response = await fetch(`${config.apiUrl}/users/academic-level`, {
		method: 'POST',
		headers,
		body: JSON.stringify({ academicLevel: academicLevel })
	});
	const data = await response.json();

	if (data.status !== 200) {
		return functionReturn(false, true, data.message, null, data.error);
	} else {
		return functionReturn(true, false, data.message, data.data, null);
	}
}
