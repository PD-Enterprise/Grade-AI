import config from '$lib/utils/apiConfig';
import { functionReturn } from '$lib/utils/functionReturn';

export async function updateUserAcademicLevel(email: string, academicLevel: number) {
	const response = await fetch(`${config.apiUrl}/grade-ai/update-user-academic-level`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ email: email, academicLevel: academicLevel })
	});
	const data = await response.json();

	if (data.status !== 200) {
		return functionReturn(false, true, data.message, null, data.error);
	} else {
		return functionReturn(true, false, data.message, data.data, null);
	}
}
