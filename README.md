# ModelBench — Automated AI Judging & Hosting Hub

> Upload generated web projects, push them to GitHub, and let a blind LLM judge rank
> every model on a live leaderboard.

ModelBench is a Next.js (App Router) application that lets you:

1. **Upload** generated web projects (single HTML pages or full Vite/Next.js codebases).
2. **Host** them automatically on GitHub via the REST API.
3. **Judge** them with a high-speed, intelligent LLM (Groq or xAI Grok).
4. **Rank** every model on a live, aggregated leaderboard.
5. **Group** projects by prompt so you can compare models on the *same* task.

The judging engine and GitHub deployer are exposed as **server-only** API routes so
your API keys never leak into the browser bundle.

---

## Table of contents

- [Quick start](#quick-start)
- [Configuration](#configuration)
- [Architecture map](#architecture-map)
- [Modifying the judging engine](#modifying-the-judging-engine)
- [Swapping model IDs or provider base URLs](#swapping-model-ids-or-provider-base-urls)
- [Adding a new LLM provider](#adding-a-new-llm-provider)
- [Storage & privacy](#storage--privacy)
- [Deployment notes](#deployment-notes)
- [Tech stack](#tech-stack)
- [License](#license)

---

## Quick start

```bash
# 1. Install
pnpm install   # or: npm install / yarn / bun install

# 2. Configure your secrets (see Configuration below)
cp .env.example .env
# edit .env and add your GITHUB_TOKEN, GROQ_API_KEY, GROK_API_KEY

# 3. Run the dev server
pnpm dev       # http://localhost:3000
```

Open <http://localhost:3000>, click **Settings → Test connections** to confirm
your keys work, then head to **Upload** to add your first project.

---

## Configuration

All server-side secrets live in `.env` (never commit this — it's already in
`.gitignore`). **Do not** prefix any of these with `NEXT_PUBLIC_`.

| Variable             | Required | Default                  | Description                                                  |
|----------------------|----------|--------------------------|--------------------------------------------------------------|
| `GROQ_API_KEY`       | optional | —                        | API key for Groq. Used for any `provider: "groq"` model.     |
| `GROK_API_KEY`       | optional | —                        | API key for xAI (Grok). Used for any `provider: "grok"` model.|
| `GITHUB_TOKEN`       | optional | —                        | PAT with `repo` scope. Used to push projects.                 |
| `DEFAULT_MODEL`      | optional | `llama-3.3-70b-versatile`| Fallback judge model if none is selected.                    |
| `GITHUB_PAGES_BRANCH`| optional | `gh-pages`               | Branch used for GitHub Pages (informational).                |

If a variable is missing on the server, the **Settings** panel accepts
per-user keys stored in `localStorage` so multiple people on the same
deployment can each bring their own credentials.

> The Settings panel **never** writes keys to the browser in a way that
> other tabs/scripts can sniff — keys are only sent in the request body
> of `/api/test` and `/api/judge`, both of which read the value on the
> server and respond without echoing it back.

---

## Architecture map

```
/
├── app/                              # Next.js App Router
│   ├── layout.tsx                    # Root layout, fonts, toaster
│   ├── globals.css                   # Tailwind + shadcn design tokens
│   ├── page.tsx                      # Dashboard (hero + recent projects)
│   ├── upload/page.tsx               # Add a project, generate, judge
│   ├── leaderboard/page.tsx          # Aggregated leaderboard view
│   ├── settings/page.tsx             # API key + connection test
│   └── api/                          # Server-only API routes
│       ├── judge/route.ts            # POST: run judging engine
│       ├── deploy/route.ts           # POST: push to GitHub
│       ├── generate/route.ts         # POST: generate code from a prompt
│       └── test/route.ts             # POST: ping configured providers
│
├── components/
│   ├── ui/                           # shadcn-style primitives
│   │   ├── button.tsx, card.tsx, badge.tsx, input.tsx,
│   │   ├── textarea.tsx, label.tsx, select.tsx, tabs.tsx,
│   │   └── dialog.tsx, separator.tsx
│   ├── Navbar.tsx                    # Top navigation
│   ├── FileUpload.tsx                # Drop / folder picker
│   ├── ProjectCard.tsx               # One project + judge/deploy actions
│   ├── Leaderboard.tsx               # Ranking + prompt-grouped panels
│   ├── ModelSelect.tsx               # Reusable provider/model dropdown
│   └── ScoreBar.tsx                  # Animated score bar
│
├── lib/                              # Pure server + shared modules
│   ├── types.ts                      # All TypeScript domain types + MODEL_CATALOG
│   ├── utils.ts                      # cn(), uid(), formatters
│   ├── llm.ts                        # OpenAI-compatible client (Groq + Grok)
│   ├── judge.ts                      # Judge system prompt + parser
│   ├── github.ts                     # GitHub REST API wrapper
│   └── store.ts                      # localStorage helpers
│
├── hooks/
│   ├── useLocalStorage.ts            # SSR-safe localStorage hook
│   └── useProjects.ts                # Projects store + runJudge() / runDeploy()
│
├── .env.example                      # Template for required env vars
├── .gitignore                        # Includes .env* to prevent leaks
├── next.config.js                    # Larger body size for deploy uploads
├── tailwind.config.ts                # shadcn-compatible Tailwind config
├── tsconfig.json                     # @/* path alias
└── package.json
```

### Where each requirement lives

| Requirement                                  | File(s)                                                    |
|----------------------------------------------|------------------------------------------------------------|
| File/folder upload                           | `components/FileUpload.tsx`                                |
| GitHub repo creation + push                  | `lib/github.ts`, `app/api/deploy/route.ts`                 |
| GitHub Pages enablement                      | `lib/github.ts` → `enablePages()`                          |
| LLM judging engine                           | `lib/judge.ts`, `app/api/judge/route.ts`                   |
| System prompt / evaluation rubric            | `lib/judge.ts` → `JUDGE_SYSTEM_PROMPT`                     |
| JSON parsing + validation                    | `lib/judge.ts` → `parseJudgeResponse()`                    |
| Leaderboard aggregation                      | `components/Leaderboard.tsx` → `aggregate()`               |
| Prompt grouping                              | `components/Leaderboard.tsx` → `CategoryPanel`             |
| OpenAI-compatible client wrapper             | `lib/llm.ts` → `chatCompletion()`                          |
| Model catalog                                | `lib/types.ts` → `MODEL_CATALOG`                            |
| localStorage for scores/prompts              | `lib/store.ts`, `hooks/useProjects.ts`                     |
| Secure server-side keys (no `NEXT_PUBLIC_*`) | All `app/api/*` route files + `lib/llm.ts` + `lib/github.ts` |

---

## Modifying the judging engine

The judging engine is intentionally contained in **one file**:
[`lib/judge.ts`](./lib/judge.ts). To tweak it, open that file and look for
`JUDGE_SYSTEM_PROMPT`.

### Add a new evaluation criterion

1. Open `lib/types.ts` and add a new field to `JudgeScores`:

   ```ts
   export interface JudgeScores {
     design: number;
     codeQuality: number;
     featureCompleteness: number;
     performance: number; // ← new
   }
   ```

2. Open `lib/judge.ts` and:
   - Add `"performance": <integer 1-10>` to the JSON schema in `JUDGE_SYSTEM_PROMPT`.
   - Extend the parser in `parseJudgeResponse()` to extract the new field,
     clamp it to the valid range, and add it to the total/average math.

3. (Optional) Update the `ScoreBar` and `Leaderboard` components to display
   the new dimension.

### Change the scoring scale

By default the engine scores 1-10 per dimension. To switch to 0-100:

- Update the schema in `JUDGE_SYSTEM_PROMPT` (e.g. `0-100`).
- Update `clamp(parsed.design, 1, 10)` in `parseJudgeResponse` to `clamp(parsed.design, 0, 100)`.
- Update the `max={10}` prop on `<ScoreBar>` to `max={100}`.

### Tighten or relax the persona

`JUDGE_SYSTEM_PROMPT` starts with the persona ("You are a Senior Frontend QA
Engineer..."). Rewrite the opening paragraph to change voice, or add new
guidelines below the existing ones — just be sure to keep the **OUTPUT FORMAT**
section intact so the JSON parser keeps working.

---

## Swapping model IDs or provider base URLs

### Pick a different model

The list of available models lives in `lib/types.ts`:

```ts
export const MODEL_CATALOG: ModelSpec[] = [
  { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B (Groq)', provider: 'groq', baseUrl: 'https://api.groq.com/openai/v1' },
  // ... add more
];
```

To add a new one, just push a `ModelSpec` to the array. The `id` is what
gets sent to the provider, and `baseUrl` lets you override the default
OpenAI-compatible endpoint.

To change the **default judge model**, set `DEFAULT_MODEL` in `.env` (e.g.
`DEFAULT_MODEL=grok:grok-3-mini` is not yet supported — use the bare model id
for now: `DEFAULT_MODEL=grok-3-mini`).

### Change the base URL of a provider

Open `lib/llm.ts` and edit the `getClient()` helper:

```ts
const baseURL =
  baseUrlOverride ??
  (provider === 'groq'
    ? 'https://api.groq.com/openai/v1'
    : 'https://api.x.ai/v1');
```

For per-model overrides, populate the `baseUrl` field in `MODEL_CATALOG`.

---

## Adding a new LLM provider

`lib/llm.ts` is provider-agnostic. To add (say) OpenRouter:

1. Add the provider to the `LLMProvider` union in `lib/types.ts`:

   ```ts
   export type LLMProvider = 'groq' | 'grok' | 'openrouter';
   ```

2. Extend `getApiKey()` to read a new env var:

   ```ts
   const env = provider === 'groq'
     ? process.env.GROQ_API_KEY
     : provider === 'grok'
     ? process.env.GROK_API_KEY
     : process.env.OPENROUTER_API_KEY;
   ```

3. Extend `getClient()` to know the base URL:

   ```ts
   const baseURL = baseUrlOverride ?? (
     provider === 'groq'     ? 'https://api.groq.com/openai/v1' :
     provider === 'grok'     ? 'https://api.x.ai/v1' :
     /* openrouter */          'https://openrouter.ai/api/v1'
   );
   ```

4. Add one or more `ModelSpec` entries with `provider: 'openrouter'`.

The judging engine, deployer, and UI will pick up the new provider with
no further changes.

---

## Storage & privacy

- **Code & scores** are stored in `localStorage` under the
  `modelbench:` namespace (`lib/store.ts`).
- **API keys** in the Settings panel are also in `localStorage`, but are
  *only* sent to the server in request bodies. The server reads them from
  `process.env` first and only falls back to the per-request override.
- **No telemetry** is sent anywhere. The only outbound calls are to
  `api.github.com`, `api.groq.com`, and `api.x.ai`.
- `.env*` files are listed in `.gitignore` so they cannot be committed
  by accident. Verify with `git status` before pushing.

---

## Deployment notes

The app is a standard Next.js 14 application. Any platform that supports
Next.js (Vercel, Netlify, Render, Fly, a Node server) works out of the box.

For **Vercel**, set the environment variables in the project's
*Settings → Environment Variables* panel. Do **not** mark any of them
as `NEXT_PUBLIC_*`.

For **self-hosted Node**, build with `pnpm build` and start with
`pnpm start`. Make sure the environment variables are present in the
process environment.

---

## Tech stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** + shadcn-style primitives (Radix UI under the hood)
- **OpenAI Node SDK** (works against any OpenAI-compatible endpoint)
- **Lucide React** icons
- **Sonner** for toasts
- **localStorage** for client-side persistence

---

## License

MIT — do whatever you want, no warranty.
