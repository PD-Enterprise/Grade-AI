# Plan: Secure Internet Images in Chat

## Goal

Let models link images from the internet (`![alt](url)`) and render them in
the chat container as properly styled, secure components — without XSS,
tracking leaks, or hallucinated-URL breakage.

## Threat model

- `javascript:` / `data:image/svg+xml` in markdown → XSS. Mitigated by
  svelte-markdown's `defaultSanitizeUrl` + our own https-only check +
  rejecting SVG in the proxy.
- Tracking pixels / IP leak → mitigated by proxying through first-party
  `/api/image` with `referrerpolicy="no-referrer"`.
- SSRF via `?url=` (localhost, cloud metadata, private nets) → mitigated by
  hostname + resolved-IP blocklist, redirect cap, timeout, size cap.
- Hallucinated URLs → mitigated by verified-image path (Tavily), with
  graceful fallback rendering for plain markdown.

## Data flow (both paths)

1. **Verified:** model calls `web_search` → Tavily returns text results +
   `images[]` (with descriptions) → formatted into tool context →
   model emits only those exact URLs as `![desc](url)`.
2. **Fallback:** model emits plain `![alt](https://...)` without tool use →
   frontend still renders via the same hardened `ImageBlock` + proxy.
3. `ImageBlock` validates `https:`, builds `/api/image?url=...`, shows
   skeleton → image → error fallback, click opens lightbox.

## Proxy (`GET /api/image?url=...`, SvelteKit, Cloudflare Pages)

Pass-through, no durable storage:

1. `new URL(url)`, require `https:`. Reject others.
2. Blocklist: `localhost`, `127/8`, `10/8`, `172.16/12`, `192.168/16`,
   `169.254.169.254`, `::1`, `0.0.0.0`. Re-validate each redirect (max 3).
3. `fetch` with ~10s timeout, `redirect: manual`.
4. Allow `content-type: image/jpeg|png|webp|gif|avif` only. Reject SVG.
5. Enforce `content-length <= 5MB` + abort oversized streams.
6. Stream back with `Content-Type`, `Cache-Control: public, max-age=86400`,
   `X-Content-Type-Options: nosniff`. Optional Cloudflare Cache API keyed by
   URL hash. Require login session + light rate limit (~30/min/user).
7. CSP tightened to `img-src 'self' data:` so external origins can't load
   directly. Direct `<img src="https://evil...">` never happens.

## Backend changes (`PD-Enterprise-Backend`)

- `src/routes/grade-ai/utils/webSearch.ts`: send `include_images: true`,
  `include_image_descriptions: true`; extend response types; filter to
  `https:` (max ~6); append `Images (verified — only use these exact URLs
for ![...](...))` section in `formatSearchResults()`.
- `groq-provider.ts` / `gemini-provider.ts`: no new tool; verified images
  flow through existing `web_search` tool result.
- `src/routes/grade-ai/routes/prompts/system-prompts.ts` (DIRECT + SOCRATIC):
  instruct model to emit `![short description](VERIFIED_URL)` on its own line,
  only from `Images` section, max 3 per reply, never invent URLs.

## Frontend changes (`Grade-AI`)

- New `src/routes/components/ImageBlock.svelte` (props `href/title/text`):
  card `figure` (`rounded-xl border-border bg-card`), loading skeleton,
  `onerror` fallback with "Open source" link, `figcaption` = alt text,
  click → `<dialog>` lightbox (backdrop/Esc close). Attrs:
  `loading="lazy" decoding="async" referrerpolicy="no-referrer"`.
- `src/routes/components/message.svelte`: `image: ImageBlock` in `renderers`.
- New `src/routes/api/image/+server.ts`: proxy per spec above.
- `src/routes/layout.css`: `.markdown-content figure.chat-image` styles.
- CSP: `img-src 'self' data:` once proxy is live.

## Files

- Backend: `webSearch.ts`, `system-prompts.ts` (providers unchanged)
- Frontend: `ImageBlock.svelte` (new), `message.svelte`,
  `api/image/+server.ts` (new), `layout.css`, CSP header

## Verification

- `bun run check` + `bun run lint` in `Grade-AI`; `tsc --noEmit` in backend.
- Manual: "show a diagram of photosynthesis" → card renders → lightbox opens;
  `![x](javascript:alert(1))` renders as link, not img; external hotlink goes
  via `/api/image`; `?url=http://169.254.169.254` → 400.
- Note: repos have no test framework (`AGENTS.md`: don't add tests unasked),
  so no new automated tests; verification is typecheck + manual.
