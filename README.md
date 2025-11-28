# Social Media Engine

This repository is a content-generation engine that composes short-form social media media (images, audio, captions, and videos) using AI services and renders visual compositions with Remotion.

**Highlights:**
- **Server / UI:** Next.js app (routes under `app/api`).
- **Workflows:** Orchestrated using `workflow`-based scripts in `workflows/` (e.g. `story`, `video`, `thread`, `tweet`, `carousel`).
- **AI utilities:** `src/ai.ts` wraps OpenAI calls for text, audio, images and video generation.
- **Renderer:** A small Bun-based renderer (`renderer.ts` + `render-worker.ts`) that bundles Remotion compositions and renders media via `@remotion/renderer`.

**Table of contents**
- Prerequisites
- Quickstart
- Common commands
- API & workflow usage
- Rendering flow
- File structure
- Environment variables
- Troubleshooting

**Prerequisites**
- Node.js 20+ (recommended) for Next.js and tooling.
- Bun (recommended) for the renderer server and worker (`renderer.ts` / `render-worker.ts`). The project uses `bun run` in the `serve:render` script.
- `ffmpeg` (Remotion may require ffmpeg/av binaries depending on your environment). Install via your OS package manager if needed.

**Quickstart (developer)**
1. Install dependencies (choose one):
	 - With npm/yarn (Node):

	 ```bash
	 npm install
	 ```

	 - Or with Bun (recommended for renderer):

	 ```bash
	 bun install
	 ```

2. Start the Next.js dev server (UI / API routes):

```bash
npm run dev
# or: bun run next dev
```

3. In a separate terminal start the renderer service (required for workflows that call `/api/render`):

```bash
# Requires Bun to be installed on your machine
bun run renderer.ts
# or via npm script (this still requires Bun):
npm run serve:render
```

4. (Optional) Launch Remotion studio to preview compositions:

```bash
npm run studio
```

5. Build / production:

```bash
npm run build
npm run start
```

**Common scripts** (from `package.json`)
- `dev`: runs `next dev`.
- `build`: runs `next build`.
- `start`: runs `next start`.
- `serve:render`: runs `bun run renderer.ts` (starts the Bun-based render delegator at port `3001`).
- `studio`: runs `remotion studio` for composition previews.

**API & workflow usage**
The Next.js app exposes simple GET endpoints that start workflows. These endpoints call `workflow/api` to orchestrate tasks.

- Start a story workflow:

```bash
curl "http://localhost:3000/api/story?prompt=$(printf '%s' "Your prompt here" | jq -s -R -r @uri)"
```

- Start a video workflow (generates slides/audio then triggers Remotion render):

```bash
curl "http://localhost:3000/api/video?prompt=$(printf '%s' "Your prompt here" | jq -s -R -r @uri)"
```

- Create a thread or tweet workflow (requires `content` and `voice` query params):

```bash
curl "http://localhost:3000/api/thread?content=$(printf '%s' "My thread text" | jq -s -R -r @uri)&voice=ash"
curl "http://localhost:3000/api/tweet?content=$(printf '%s' "Short tweet text" | jq -s -R -r @uri)&voice=onyx"
```

**Renderer API**
- The Bun renderer listens on port `3001` and accepts POSTs to `/api/render` with JSON `{ id, inputProps }`.
- Example (render a Remotion composition named `Story`):

```bash
curl -X POST http://localhost:3001/api/render \
	-H 'Content-Type: application/json' \
	-d '{"id":"Story","inputProps":{"story":{}}}'
```

The renderer spawns a `render-worker.ts` worker which bundles `remotion/index.ts` and calls `@remotion/renderer` to produce an output file (typically saved under `out/`).

**Rendering flow (high level)**
- Workflows in `workflows/*` call helpers in `src/ai.ts` to generate assets (slides, speech MP3s, captions JSON, etc.).
- `workflows/render.ts` will POST to the local renderer (`http://localhost:3001/api/render`) to ask Remotion to render a named composition with `inputProps`.
- The renderer uses `@remotion/bundler` to create a serve URL from `remotion/index.ts`, selects the requested composition id, and calls `renderMedia` to render an output mp4.

**Key files / structure**
- `app/` - Next.js app routes, including API endpoints under `app/api/`.
- `remotion/` - Remotion React compositions (e.g. `Root.tsx`, `Story.tsx`, `Captions.tsx`, etc.).
- `workflows/` - Workflow definitions used by the `app/api` endpoints.
- `src/ai.ts` - AI wrappers: text generation, image generation, TTS, whisper transcription and video functions via OpenAI SDK.
- `renderer.ts` & `render-worker.ts` - Bun-based render delegator and worker that call Remotion to produce media files.
- `public/` - Generated assets (slides, audio files, captions, temporary outputs).
- `stories/` - Example story JSON files.

**Environment variables**
- `OPENAI_API_KEY` (or other provider keys) — `src/ai.ts` uses the OpenAI SDK and will need credentials. Make sure the appropriate environment variables are set for the OpenAI client you use.
- If you use any alternative AI gateway services present in `package.json` (e.g. `@ai-sdk/*`), set their keys as required.

**Troubleshooting & notes**
- Renderer requires Bun (the `serve:render` script runs `bun run renderer.ts`). If you don't have Bun, you can still run Next.js with `npm run dev` but workflows that post to the renderer will fail.
- Remotion rendering may require `ffmpeg` on your system. If renders fail with codec/ffmpeg errors, install `ffmpeg` and try again.
- `src/ai.ts` writes generated files into `public/` (audio/images/captions). Ensure the process has write permissions to that folder.
- The OpenAI usage in `src/ai.ts` references modern models (e.g. `gpt-5-mini`, `gpt-image-1`). Make sure your API key and account have access to the models you intend to use.

**Contributing / Next steps**
- Add `.env.example` listing required env vars and any optional keys.
- Add CI (tests / lint / build) if you want automated checks on PRs.
- Consider adding a small `docs/` page documenting common workflows and Remotion composition names.

**License**
- This project currently lists `ISC` in `package.json`. Update if you want a different license.

---

If you want, I can also:
- add a `.env.example` file with the expected environment variables,
- run a quick check to detect missing devtools (Bun/ffmpeg) and create a small troubleshooting script, or
- wire up a GitHub Actions workflow to run a build and lint on PRs.

Which of these follow-ups would you like me to do next?