# Grade AI — Agent Guide

## Stack

Svelte 5 (runes) + SvelteKit 2 + TypeScript + Tailwind CSS v4 + daisyUI v5 + Vite 7.  
Package manager: **bun** (see `bun.lock`, not `package-lock.json`).  
Deploy target: **Cloudflare Pages** via `@sveltejs/adapter-cloudflare`.  
Auth: **Auth.js** (`@auth/sveltekit`) with Google OAuth.  
Backend: separate Cloudflare Worker (not in this repo) at `http://localhost:8787` (dev) or `https://backend-service.pdenterprise314.workers.dev` (prod).

## Commands

| Command           | What it does                                                                   |
| ----------------- | ------------------------------------------------------------------------------ |
| `bun run dev`     | Dev server on port 3000 (do not start — assume one is already running)         |
| `bun run build`   | Production build                                                               |
| `bun run preview` | Preview via wrangler (`wrangler pages dev .svelte-kit/cloudflare --port 4173`) |
| `bun run check`   | Type-check with `svelte-check`                                                 |
| `bun run lint`    | `prettier --check . && eslint .`                                               |
| `bun run format`  | `prettier --write .`                                                           |
| `bun run gen`     | `wrangler types` — regenerates `worker-configuration.d.ts` (gitignored)        |

Always run `bun run lint && bun run check` before committing.

## Env

Required vars (see `.env.example`):

```
AUTH_SECRET, AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET, AUTH_TRUST_HOST, INTERNAL_KEY
```

Loaded via `$env/static/private` in `src/lib/utils/auth.ts`.

## Code style

- Tabs, single quotes, no trailing commas, print width 100 (enforced by Prettier)
- Tailwind classes sorted via `prettier-plugin-tailwindcss` (stylesheet at `src/routes/layout.css`)
- ESLint: TS recommended + svelte recommended + prettier compat

## Architecture

- **State**: Svelte 5 runes (`$state`) in `src/lib/stores/store.svelte.ts` — no legacy stores
- **Threads**: persisted to `localStorage` (key prefix `thread:`), no server-side storage
- **Chat streaming**: NDJSON (`application/x-ndjson`) from `/chat/[thread]` server endpoint; delta/error/done event types
- **Model list**: fetched from backend via `GET /` (root route), cached in rune state
- **Modes**: `direct` (instant answers) or `socratic` (guided questioning), per-thread + localStorage default

## Key files

| Path                                    | Purpose                                                          |
| --------------------------------------- | ---------------------------------------------------------------- |
| `src/lib/utils/auth.ts`                 | Auth.js handler + Google OAuth + signIn callback registers users |
| `src/lib/utils/apiConfig.ts`            | API URL routing (dev vs prod)                                    |
| `src/lib/threads.ts`                    | localStorage CRUD for threads                                    |
| `src/lib/types.ts`                      | Core types: `Thread`, `ChatMessage`, `ModelList`, `promptBody`   |
| `src/routes/+page.svelte`               | Home page (prompt input, model/mode selection)                   |
| `src/routes/chat/[thread]/+page.svelte` | Chat view (streaming messages, auto-send on navigation)          |
| `src/routes/chat/[thread]/+server.ts`   | Proxies LLM calls to backend, returns NDJSON stream              |
| `src/routes/+server.ts`                 | GET (model list) + POST (academic level update)                  |
| `src/routes/login/+page.svelte`         | Google sign-in                                                   |
| `src/routes/logout/+page.svelte`        | Sign-out confirmation                                            |

## Testing

No test framework or test files found. Do not add tests without explicit request.

## App flow

1. User lands on `/` → layout checks session, loads model list from backend
2. If not authenticated → `NotLoggedIn` overlay shown
3. User types prompt, selects model + mode, hits send → creates thread in localStorage, navigates to `/chat/[thread]`
4. Chat page auto-sends the pending user message, streams response via NDJSON
5. Threads persist in localStorage, sidebar lists them
