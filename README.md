# Social Media Content Engine

A content-generation engine that composes short-form social media content (images, audio, captions, and videos) using AI services and renders visual compositions with Remotion.

**Highlights:**
- **Server / UI:** Next.js app with API routes under `app/api/`
- **Workflows:** Orchestrated using `workflow` package in `workflows/` (story, video, thread, tweet, carousel)
- **AI utilities:** `src/ai.ts` wraps OpenAI SDK for text, audio, images, and video generation
- **MCP Server:** Exposes content generation tools via Model Context Protocol at `/api/mcp`
- **Renderer:** Bun-based renderer (`renderer.ts` + `render-worker.ts`) that bundles Remotion compositions and renders media via `@remotion/renderer`

**Table of Contents**
- [Prerequisites](#prerequisites)
- [Quickstart](#quickstart-developer)
- [Common Commands](#common-scripts)
- [API Endpoints](#api--workflow-usage)
- [MCP Server Integration](#mcp-server-integration)
- [Renderer API](#renderer-api)
- [Rendering Flow](#rendering-flow-high-level)
- [File Structure](#key-files--structure)
- [Environment Variables](#environment-variables)
- [Troubleshooting](#troubleshooting--notes)

**Prerequisites**
- **Node.js 20+** (required) for Next.js and tooling
- **Bun** (required) for the renderer server and worker (`renderer.ts` / `render-worker.ts`)
- **FFmpeg** (required) for Remotion video rendering. Install via your OS package manager:
  - macOS: `brew install ffmpeg`
  - Ubuntu/Debian: `sudo apt-get install ffmpeg`
  - Windows: Download from [ffmpeg.org](https://ffmpeg.org/)

**Quickstart (Developer)**

1. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add your API keys:
   - `OPENAI_API_KEY` - Required for all AI generation features
   - `AI_GATEWAY_API_KEY` - Optional, for AI Gateway integration

2. **Install dependencies:**
   ```bash
   npm install
   # or
   bun install
   ```

3. **Start the Next.js dev server (API routes):**
   ```bash
   npm run dev
   ```
   The server will start at `http://localhost:3000`

4. **In a separate terminal, start the renderer service:**
   ```bash
   npm run serve:render
   ```
   The renderer will start at `http://localhost:3001`

5. **(Optional) Launch Remotion studio to preview compositions:**
   ```bash
   npm run studio
   ```

6. **Build for production:**
   ```bash
   npm run build
   npm run start
   ```

**Common Scripts**
| Script | Description |
|--------|-------------|
| `npm run dev` | Start Next.js development server on port 3000 |
| `npm run build` | Build Next.js app for production |
| `npm run start` | Start Next.js production server |
| `npm run serve:render` | Start Bun-based renderer on port 3001 (requires Bun) |
| `npm run studio` | Launch Remotion Studio for composition previews |

**API & Workflow Usage**

The Next.js app exposes GET endpoints that start asynchronous workflows. All endpoints return a `runId` for tracking.

### Available Endpoints

**1. Story Generation** (`/api/story`)
Generates a narrative dialogue with image slides, voiceover audio, and captions.

```bash
curl "http://localhost:3000/api/story?prompt=A%20story%20about%20creativity"
```

**2. Carousel Generation** (`/api/carousel`)
Creates carousel posts with story content and image slides for social media.

```bash
curl "http://localhost:3000/api/carousel?prompt=Tips%20for%20productivity"
```

**3. Tweet Video** (`/api/tweet`)
Generates a video with voiceover reading tweet content.

```bash
curl "http://localhost:3000/api/tweet?content=Your%20tweet%20text&voice=ash"
```

Voices: `ash` (teacher) or `onyx` (student)

**4. Thread Video** (`/api/thread`)
Creates a video for thread content with voiceover.

```bash
curl "http://localhost:3000/api/thread?content=Your%20thread%20content&voice=onyx"
```

**5. AI Video Generation** (`/api/video`)
Generates a complete video using OpenAI's video generation (Sora).

```bash
curl "http://localhost:3000/api/video?prompt=A%20cinematic%20sunrise"
```

### Response Format
All endpoints return JSON with a workflow run ID:
```json
{
  "runId": "wf_abc123xyz"
}
```

**MCP Server Integration**

This project includes an MCP (Model Context Protocol) server at `/api/mcp` that exposes content generation tools. This allows AI assistants like Claude Desktop to directly invoke content generation workflows.

### Available MCP Tools

- `generate_story` - Generate a full story with images, audio, and captions
- `generate_carousel` - Create carousel posts for social media
- `generate_tweet` - Generate tweet videos with voiceover
- `generate_thread` - Generate thread videos with voiceover  
- `generate_video` - Generate AI videos using Sora

### MCP Server Configuration

To use with Claude Desktop, add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "media-vlad-chat": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote-client",
        "http://localhost:3000/api/mcp"
      ]
    }
  }
}
```

**Renderer API**

The Bun renderer listens on port `3001` and accepts POST requests to render Remotion compositions.

**Endpoint:** `POST http://localhost:3001/api/render`

**Request Body:**
```json
{
  "id": "Story",
  "inputProps": {
    "story": {...}
  }
}
```

**Available Compositions:**
- `Story` - Full story with dialogue and slides
- `Carousel` - Carousel post composition
- `Tweet` - Tweet video composition
- `Thread` - Thread video composition

The renderer spawns a `render-worker.ts` worker which bundles `remotion/index.ts` and calls `@remotion/renderer` to produce output files (saved to `out/` directory).

**Rendering Flow (High Level)**

1. **API Request** - User or MCP client calls an API endpoint (e.g., `/api/story?prompt=...`)
2. **Workflow Execution** - Workflow package orchestrates the generation process
3. **AI Asset Generation** - `src/ai.ts` calls OpenAI APIs to generate:
   - Text content (story scripts, tweets, threads)
   - Images (slides using DALL-E)
   - Audio (voiceover using TTS)
   - Captions (using Whisper for transcription)
   - Video (using Sora for AI video generation)
4. **Assets Saved** - Generated assets are saved to `public/` directory
5. **Render Request** - `workflows/render.ts` POSTs to renderer at `http://localhost:3001/api/render`
6. **Remotion Bundling** - Renderer uses `@remotion/bundler` to bundle `remotion/index.ts`
7. **Video Rendering** - `@remotion/renderer` renders the composition to MP4 in `out/` directory

**Key Files / Structure**

```
media.vlad.chat/
├── app/
│   └── api/                 # Next.js API routes
│       ├── carousel/        # Carousel generation endpoint
│       ├── mcp/            # MCP server endpoint
│       ├── story/          # Story generation endpoint
│       ├── thread/         # Thread video endpoint
│       ├── tweet/          # Tweet video endpoint
│       └── video/          # AI video generation endpoint
├── remotion/               # Remotion React compositions
│   ├── Root.tsx           # Root composition
│   ├── Story.tsx          # Story composition
│   ├── Carousel.tsx       # Carousel composition
│   ├── Tweet.tsx          # Tweet composition
│   ├── Thread.tsx         # Thread composition
│   ├── Captions.tsx       # Caption rendering
│   └── Outro.tsx          # Outro composition
├── workflows/             # Workflow orchestration
│   ├── story.ts          # Story generation workflow
│   ├── carousel.ts       # Carousel generation workflow
│   ├── tweet.ts          # Tweet video workflow
│   ├── thread.ts         # Thread video workflow
│   ├── video.ts          # AI video workflow
│   └── render.ts         # Render coordination
├── src/
│   ├── ai.ts             # OpenAI API wrappers
│   └── prompt.ts         # Prompt templates
├── public/               # Generated assets (images, audio, captions)
├── renderer.ts           # Bun-based render server
├── render-worker.ts      # Render worker process
└── .env.example          # Environment variable template
```

**Environment Variables**

Create a `.env` file in the project root:

```bash
# Required
OPENAI_API_KEY=sk-...          # OpenAI API key for all AI generation features

# Optional
AI_GATEWAY_API_KEY=...         # For AI Gateway integration (if using @ai-sdk/gateway)
```

**Required Features by API Key:**
- `OPENAI_API_KEY`: Text generation (GPT models), image generation (DALL-E), text-to-speech, Whisper transcription, video generation (Sora)

**Troubleshooting & Notes**

### Common Issues

**1. Renderer fails to start**
- Ensure Bun is installed: `curl -fsSL https://bun.sh/install | bash`
- The renderer requires Bun specifically; it won't work with Node.js alone

**2. Video rendering fails**
- Install FFmpeg: `brew install ffmpeg` (macOS) or equivalent for your OS
- Check FFmpeg is in PATH: `ffmpeg -version`

**3. File permission errors**
- Ensure write permissions for `public/` and `out/` directories
- Generated assets (audio, images, captions) are written to `public/`

**4. OpenAI API errors**
- Verify your `OPENAI_API_KEY` is set correctly in `.env`
- Check your OpenAI account has access to required models (GPT, DALL-E, TTS, Whisper, Sora)
- Monitor API quota and billing limits

**5. Workflow doesn't complete**
- Check both servers are running (Next.js on 3000, Renderer on 3001)
- Workflows are asynchronous - use the returned `runId` to track status
- Check console logs in both terminal windows for errors

### Development Tips

- Use `npm run studio` to preview and test Remotion compositions visually
- Generated files accumulate in `public/` - clean periodically to save disk space
- The MCP server can be tested with Claude Desktop or compatible MCP clients
- Workflow execution is logged to the console running `npm run dev`

**License**

ISC License - See `package.json`

**Contributing**

Contributions welcome! Consider:
- Adding tests for workflows and AI generation
- Improving error handling and retry logic
- Adding more composition templates
- Optimizing render performance
- Adding CI/CD workflows
