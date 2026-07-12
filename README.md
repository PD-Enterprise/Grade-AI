# Grade AI

Grade AI is a modern, AI-powered academic grading assistant built with SvelteKit, offering intelligent tutoring through both direct and Socratic teaching modes.

## Features

- **Dual Teaching Modes**: Switch between **Direct Model** (instant answers) and **Socratic Model** (guided questioning) for adaptive learning.
- **Multi-Model Support**: Choose from multiple AI models fetched dynamically from a backend service.
- **Real-Time Streaming**: Responses stream via NDJSON for instant, progressive output.
- **Rich Message Rendering**: Full Markdown and KaTeX (LaTeX math) support with HTML sanitization.
- **Text-to-Speech**: Listen to assistant responses with speak/pause/resume/stop controls.
- **Persistent Conversations**: Threads and messages stored in localStorage, synced with cloud backend.
- **Google OAuth Authentication**: Secure login via Auth.js with auto-registration on first sign-in.
- **Academic Level Tracking**: Per-user academic level (K-12 or UG/G/PG) for tailored responses.
- **Responsive Design**: Optimized for both desktop and mobile with collapsible sidebar.
- **Progressive Web App**: Installable with offline support via service worker and web manifest.

## Tech Stack

- **Frontend**: Svelte 5 (runes), SvelteKit 2, TypeScript, Tailwind CSS v4, DaisyUI v5
- **Authentication**: Auth.js (`@auth/sveltekit`) with Google OAuth
- **Streaming**: NDJSON (`application/x-ndjson`) for real-time LLM responses
- **Markdown Rendering**: `@humanspeak/svelte-markdown` with KaTeX for LaTeX and DOMPurify for sanitization
- **Deployment**: Cloudflare Pages (`@sveltejs/adapter-cloudflare`)
- **Backend**: Separate Cloudflare Worker (not in this repo) at `http://localhost:8787` (dev) or `https://backend-service.pdenterprise314.workers.dev` (prod)
- **Other**: `@iconify/svelte` for icons, `nanoid` for ID generation

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) (v1.x+) — the project uses `bun.lock` (not `package-lock.json`)
- A Cloudflare backend worker running locally or in production
- Google OAuth credentials (client ID and secret)

### Environment Setup

Copy `.env.example` to `.env` and fill in the required variables:

```bash
AUTH_SECRET=your_auth_secret
AUTH_GOOGLE_ID=your_google_client_id
AUTH_GOOGLE_SECRET=your_google_client_secret
AUTH_TRUST_HOST=true
INTERNAL_KEY=your_internal_api_key
```

### Installation

```bash
git clone https://github.com/PD-Enterprise/Grade-AI
cd Grade-AI

bun install
```

### Development

```bash
bun run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

### Build

```bash
bun run build
```

### Preview Production Build

```bash
bun run preview
```

## Usage

- **Home Page** (`/`): Select a model, choose a mode (Direct or Socratic), type your prompt, and press Enter or click Send to start a conversation.
- **Chat View** (`/chat/[thread]`): View real-time streaming responses, listen via TTS, and continue the conversation with follow-up messages.
- **Sidebar**: Browse your conversation history, start new chats, delete old threads, and access your profile (name, email, membership, academic level).
- **Authentication**: Sign in with Google via the login page. First-time users are auto-registered on the backend.
- **Onboarding**: New users set their academic level (K-12 grade 1-15 or UG/G/PG) for tailored AI responses.
- **Progressive Web App**: Install Grade AI on your device for an app-like experience with offline support.

## Project Structure

```
src/
  app.html                 # HTML shell (dark theme, PWA manifest, service worker)
  hooks.server.ts          # Auth.js server hooks
  routes/
    +layout.svelte         # Root layout (sidebar, auth check, model list)
    +layout.server.ts      # Server load (session, membership, academic level)
    +page.svelte           # Home page (prompt input, mode/model selection)
    +server.ts             # GET / (model list) + POST / (academic level update)
    layout.css             # Tailwind v4 + DaisyUI + custom dark theme
    login/
      +page.svelte         # Google sign-in page
    logout/
      +page.svelte         # Sign-out confirmation
    chat/
      [thread]/
        +page.svelte       # Chat view (streaming messages, send/retry)
        +server.ts         # POST /chat/:thread (proxies LLM, returns NDJSON)
    api/
      threads/
        +server.ts         # GET /api/threads (list threads)
      thread/
        +server.ts         # POST /api/thread (create thread)
        [id]/
          +server.ts       # DELETE /api/thread/:id (delete thread)
      messages/
        [convId]/
          +server.ts       # GET /api/messages/:convId (fetch messages)
    components/
      sidebar.svelte       # Conversation list + user profile
      message.svelte       # Message bubble (Markdown, KaTeX, TTS)
      ModelSelector.svelte # Model dropdown selector
      onboarding.svelte    # First-time academic level setup
      notLoggedIn.svelte   # Login-required overlay
  lib/
    stores/
      store.svelte.ts      # Global reactive state (Svelte 5 runes)
    threads.ts             # localStorage CRUD for threads and messages
    types.ts               # Core TypeScript types
    api/
      getModelList.ts      # Fetch available models
      getResponseFromLLM.ts # Stream LLM response
      threads.ts           # Cloud thread CRUD
      messages.ts          # Fetch messages from cloud
      updateUserAcademicLevel.ts
    utils/
      auth.ts              # Auth.js config (Google OAuth)
      apiConfig.ts         # Dev/prod API URL routing
      generateTempTitle.ts # Title generation from prompt
      scrollToBottom.ts    # Auto-scroll utility
      validateAcademicLevel.ts
      functionReturn.ts    # Tuple return helper
      returnJson.ts        # JSON response factory
  lib/
    utils/
      growTextbox.ts       # Auto-resize textarea action
      sendMessageKeyboard.ts # Enter-to-send handler
static/
  manifest.json            # PWA manifest
  sw.js                    # Service worker (offline support)
  icons/                   # PWA icons and Apple splash screens
  logo.webp                # Favicon
  robots.txt               # Crawler rules
```

## Configuration

- **API URLs**: Managed in `src/lib/utils/apiConfig.ts` — routes between `localhost:8787` (dev) and the Cloudflare backend worker (prod) based on `import.meta.env.MODE`.
- **Authentication**: Configured in `src/lib/utils/auth.ts` via Auth.js with Google OAuth provider.
- **Code Style**: Tabs, single quotes, no trailing commas, print width 100 — enforced by Prettier and ESLint.
- **Tailwind + DaisyUI**: Theme `black` (default), custom dark CSS variables in `src/routes/layout.css`.

## Scripts

| Command           | Description                                   |
| ----------------- | --------------------------------------------- |
| `bun run dev`     | Start dev server on port 3000                 |
| `bun run build`   | Production build for Cloudflare Pages         |
| `bun run preview` | Preview via `wrangler pages dev` on port 4173 |
| `bun run check`   | Type-check with `svelte-check`                |
| `bun run lint`    | `prettier --check . && eslint .`              |
| `bun run format`  | `prettier --write .`                          |
| `bun run gen`     | `wrangler types` — regenerate worker types    |

## Dependencies

See [`package.json`](./package.json) for a full list. Key dependencies include:

- `@sveltejs/kit`, `svelte`, `vite`, `tailwindcss`, `daisyui`
- `@auth/sveltekit` for Google OAuth authentication
- `@humanspeak/svelte-markdown`, `katex`, `dompurify` for rich message rendering
- `@iconify/svelte` for UI icons
- `nanoid` for ID generation
- `wrangler` for Cloudflare Pages deployment

## Roadmap

- [ ] Diagram note support (Excalidraw integration)
- [ ] Diagram embed support
- [ ] TinyMCE rich text editor integration

## Contact

Questions or feedback? [Contact us!](https://pd-enterprise.pages.dev/contact-us)
