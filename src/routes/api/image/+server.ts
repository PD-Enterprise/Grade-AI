const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']);
const BLOCKED_HOSTS = new Set(['localhost', 'metadata.google.internal']);
const IPV4_PRIVATE = [
	/^127\./,
	/^10\./,
	/^192\.168\./,
	/^172\.(1[6-9]|2\d|3[01])\./,
	/^169\.254\./,
	/^0\.0\.0\.0$/
];

function isBlockedHost(hostname: string): boolean {
	const host = hostname.toLowerCase();
	if (BLOCKED_HOSTS.has(host)) return true;
	if (host === 'localhost' || host.endsWith('.localhost')) return true;
	if (IPV4_PRIVATE.some((re) => re.test(host))) return true;
	if (host === '::1' || host === '[::1]') return true;
	return false;
}

function cappedStream(body: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
	const reader = body.getReader();
	let total = 0;
	return new ReadableStream({
		async pull(controller) {
			const { done, value } = await reader.read();
			if (done) {
				controller.close();
				return;
			}
			total += value.byteLength;
			if (total > MAX_BYTES) {
				await reader.cancel().catch(() => {});
				controller.error(new Error('Image too large'));
				return;
			}
			controller.enqueue(value);
		},
		async cancel() {
			await reader.cancel().catch(() => {});
		}
	});
}

export async function GET({ url, locals }) {
	const session = await locals.auth();
	if (!session?.user) {
		return new Response('Unauthorized', { status: 401 });
	}

	const target = url.searchParams.get('url');
	if (!target) {
		return new Response('Missing url', { status: 400 });
	}

	let current: URL;
	try {
		current = new URL(target);
	} catch {
		return new Response('Invalid url', { status: 400 });
	}
	if (current.protocol !== 'https:') {
		return new Response('Only https images allowed', { status: 400 });
	}

	let upstream: Response | null = null;
	for (let hop = 0; hop < 4; hop++) {
		if (isBlockedHost(current.hostname)) {
			return new Response('Blocked host', { status: 400 });
		}
		try {
			upstream = await fetch(current.toString(), {
				redirect: 'manual',
				signal: AbortSignal.timeout(10000),
				headers: { Accept: 'image/*', 'User-Agent': 'GradeAI-image-proxy/1.0' }
			});
		} catch {
			return new Response('Fetch failed', { status: 502 });
		}
		if (upstream.status >= 300 && upstream.status < 400) {
			const location = upstream.headers.get('location');
			await upstream.body?.cancel().catch(() => {});
			if (!location) return new Response('Bad redirect', { status: 502 });
			try {
				current = new URL(location, current);
			} catch {
				return new Response('Bad redirect', { status: 502 });
			}
			continue;
		}
		break;
	}
	if (!upstream || !upstream.ok || !upstream.body) {
		return new Response('Fetch failed', { status: 502 });
	}

	const contentType = (upstream.headers.get('content-type') || '').split(';')[0].trim();
	if (!ALLOWED_TYPES.has(contentType)) {
		await upstream.body.cancel().catch(() => {});
		return new Response('Unsupported content type', { status: 415 });
	}
	const length = Number(upstream.headers.get('content-length') || 0);
	if (length > MAX_BYTES) {
		await upstream.body.cancel().catch(() => {});
		return new Response('Image too large', { status: 413 });
	}

	return new Response(cappedStream(upstream.body as ReadableStream<Uint8Array>), {
		headers: {
			'Content-Type': contentType,
			'Cache-Control': 'public, max-age=86400',
			'X-Content-Type-Options': 'nosniff'
		}
	});
}
