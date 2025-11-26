# Workflow System Documentation

This document covers the workflow system for media.vlad.chat, including how to create workflows, track progress, and manage running workflows.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Workflows](#workflows)
- [Progress Streaming](#progress-streaming)
- [MCP Tools](#mcp-tools)
- [REST API](#rest-api)
- [Creating New Workflows](#creating-new-workflows)

---

## Overview

The workflow system is built on [Vercel Workflow DevKit](https://useworkflow.dev) and provides:

- **Durable execution** - Workflows survive server restarts and failures
- **Real-time streaming** - Progress updates streamed to clients as workflows execute
- **MCP integration** - AI agents can start and manage workflows via Model Context Protocol
- **Cancelation** - Running workflows can be stopped at checkpoints

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         MCP Server                               │
│                    /api/mcp/route.ts                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │generate_story│  │generate_tweet│  │workflow_status│           │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
└─────────┼────────────────┼────────────────┼─────────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Workflow Engine                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  story.ts   │  │  tweet.ts   │  │  video.ts   │  ...         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│         │                │                │                      │
│         └────────────────┼────────────────┘                      │
│                          ▼                                       │
│              ┌──────────────────────┐                           │
│              │    Progress Stream    │ ◄── emitStep(), etc.     │
│              │   (src/progress.ts)   │                          │
│              └──────────┬───────────┘                           │
└─────────────────────────┼───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      REST API Endpoints                          │
│  GET  /api/workflow/[runId]/stream  → SSE progress stream       │
│  GET  /api/workflow/[runId]/status  → Current status            │
│  GET  /api/workflow/[runId]/result  → Final result              │
│  POST /api/workflow/[runId]/cancel  → Cancel workflow           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Workflows

### Available Workflows

| Workflow | File | Description |
|----------|------|-------------|
| **Story** | `workflows/story.ts` | Full story with slides, voiceover, and captions |
| **Carousel** | `workflows/carousel.ts` | Social media carousel with story content |
| **Tweet** | `workflows/tweet.ts` | Tweet video with voiceover |
| **Thread** | `workflows/thread.ts` | Thread video for platforms like Threads |
| **Video** | `workflows/video.ts` | Full AI video using Sora |

### Workflow States

| State | Emoji | Description |
|-------|-------|-------------|
| `pending` | ⏳ | Queued, waiting to start |
| `running` | 🔄 | Currently executing |
| `paused` | ⏸️ | Paused, waiting for hook |
| `completed` | ✅ | Finished successfully |
| `failed` | ❌ | Encountered an error |
| `cancelled` | ⏹️ | Manually cancelled |

---

## Progress Streaming

Workflows emit real-time progress events that can be consumed by clients.

### Progress Event Types

```typescript
type ProgressEvent = {
  type: 'start' | 'step' | 'complete' | 'error'
  message: string
  step?: string        // Step identifier (e.g., 'audio', 'render')
  progress?: number    // Percentage 0-100
  timestamp: number    // Unix timestamp
  metadata?: Record<string, unknown>
}
```

### Using Progress in Workflows

Import the progress utilities in your workflow:

```typescript
import { emitStart, emitStep, emitComplete, closeProgress } from '../src/progress'

export const myWorkflow = async (input: string) => {
  "use workflow"

  // Emit start event
  await emitStart(`Starting workflow for: "${input}"`, { input })

  // Emit step progress
  await emitStep('processing', 'Processing data...', 25)
  // ... do work ...

  await emitStep('rendering', 'Rendering output...', 75)
  // ... do work ...

  // Emit completion
  await emitComplete('Workflow finished!', { result: 'success' })
  await closeProgress()
}
```

### Progress Utilities

| Function | Parameters | Description |
|----------|------------|-------------|
| `emitStart` | `(message, metadata?)` | Emit workflow start event |
| `emitStep` | `(step, message, progress?, metadata?)` | Emit step progress |
| `emitComplete` | `(message, metadata?)` | Emit completion event (100%) |
| `emitError` | `(message, metadata?)` | Emit error event |
| `closeProgress` | `()` | Close the progress stream |

---

## MCP Tools

The MCP server exposes tools for AI agents to interact with workflows.

### Content Generation Tools

#### `generate_story`
Generate a full story with image slides, voiceover audio, and captions.

```json
{
  "prompt": "A tale about a programmer and their shadow"
}
```

#### `generate_carousel`
Generate a carousel post with story content and image slides.

```json
{
  "prompt": "Tips for better sleep"
}
```

#### `generate_tweet`
Generate a tweet video with voiceover.

```json
{
  "content": "The tweet text to generate",
  "voice": "ash"  // or "onyx"
}
```

#### `generate_thread`
Generate a thread video for platforms like Threads.

```json
{
  "content": "Thread content here",
  "voice": "ash"  // or "onyx"
}
```

#### `generate_video`
Generate a full AI video using Sora.

```json
{
  "prompt": "A cinematic scene of..."
}
```

### Workflow Management Tools

#### `workflow_status`
Check the current status of a workflow run.

```json
{
  "run_id": "abc123-def456"
}
```

**Response:**
```
🔄 Workflow Status: RUNNING

Run ID: abc123-def456
Started: 11/26/2025, 10:30:15 AM
```

#### `workflow_progress`
Get step-by-step progress updates from a running workflow.

```json
{
  "run_id": "abc123-def456"
}
```

**Response:**
```
📊 Workflow Progress (4 events)

Run ID: abc123-def456

🚀 10:30:15 Starting story generation...
⚡ 10:30:16 (story) [5%] Generating story structure with AI...
⚡ 10:30:22 (production) [15%] Story "The Shadow's Tale" created...
⚡ 10:30:45 (render) [90%] Rendering final video...
```

#### `workflow_cancel`
Cancel a running workflow.

```json
{
  "run_id": "abc123-def456"
}
```

#### `workflow_result`
Get the final result of a completed workflow.

```json
{
  "run_id": "abc123-def456"
}
```

---

## REST API

### Stream Progress Events

```http
GET /api/workflow/{runId}/stream
```

Returns a Server-Sent Events (SSE) stream of progress events.

**Query Parameters:**
- `startIndex` (optional): Resume from a specific event index

**Response:** `text/event-stream`

```
id: 0
event: progress
data: {"type":"start","message":"Starting...","timestamp":1732627815000}

id: 1
event: progress
data: {"type":"step","step":"audio","message":"Generating...","progress":30,"timestamp":1732627820000}

event: done
data: {}
```

**Client Example:**
```javascript
const eventSource = new EventSource(`/api/workflow/${runId}/stream`)

eventSource.addEventListener('progress', (event) => {
  const data = JSON.parse(event.data)
  console.log(`[${data.progress}%] ${data.message}`)
})

eventSource.addEventListener('done', () => {
  eventSource.close()
})
```

### Get Workflow Status

```http
GET /api/workflow/{runId}/status
```

**Response:**
```json
{
  "runId": "abc123-def456",
  "status": "running",
  "startedAt": "2025-11-26T10:30:15.000Z",
  "completedAt": null
}
```

### Get Workflow Result

```http
GET /api/workflow/{runId}/result
```

**Response:**
```json
{
  "runId": "abc123-def456",
  "success": true,
  "result": {
    "topic": "The Shadow's Tale",
    "dialog": [...]
  }
}
```

### Cancel Workflow

```http
POST /api/workflow/{runId}/cancel
```

**Response:**
```json
{
  "success": true,
  "runId": "abc123-def456",
  "message": "Workflow cancellation requested"
}
```

---

## Creating New Workflows

### 1. Create the Workflow File

Create a new file in `workflows/`:

```typescript
// workflows/my-workflow.ts
import { emitStart, emitStep, emitComplete, closeProgress } from '../src/progress'

export const myWorkflow = async (param1: string, param2: number) => {
  "use workflow"

  await emitStart(`Starting my workflow`, { param1, param2 })

  // Step 1
  await emitStep('step1', 'Doing step 1...', 25)
  const result1 = await someStep(param1)

  // Step 2
  await emitStep('step2', 'Doing step 2...', 50)
  const result2 = await anotherStep(param2)

  // Step 3
  await emitStep('step3', 'Finalizing...', 90)
  const finalResult = await finalStep(result1, result2)

  await emitComplete('Workflow finished!', { result: finalResult })
  await closeProgress()

  return finalResult
}

// Steps must use "use step" directive
async function someStep(input: string) {
  "use step"
  // ... implementation
}
```

### 2. Register in MCP Server

Add the tool to `app/api/mcp/route.ts`:

```typescript
import { myWorkflow } from "../../../workflows/my-workflow"

// Inside createMcpHandler callback:
server.registerTool("my_workflow", {
  description: "Description of what this workflow does",
  inputSchema: {
    param1: z.string().describe("First parameter"),
    param2: z.number().describe("Second parameter"),
  },
}, async ({ param1, param2 }) => {
  const run = await start(myWorkflow, [param1, param2])
  return {
    content: [{
      type: "text",
      text: `✓ Workflow started!\n\nRun ID: ${run.runId}\n\nUse 'workflow_status' to track progress.`
    }],
  }
})
```

### 3. Best Practices

- Always emit `start` and `complete` events
- Use meaningful step names for progress tracking
- Include percentage progress when possible
- Add metadata for debugging/logging
- Always call `closeProgress()` at the end
- Handle errors gracefully with `emitError()`

---

## File Structure

```
media.vlad.chat/
├── app/api/
│   ├── mcp/
│   │   └── route.ts          # MCP server with all tools
│   └── workflow/
│       └── [runId]/
│           ├── stream/route.ts   # SSE progress stream
│           ├── status/route.ts   # Workflow status
│           ├── result/route.ts   # Workflow result
│           └── cancel/route.ts   # Cancel workflow
├── workflows/
│   ├── story.ts              # Story workflow
│   ├── carousel.ts           # Carousel workflow
│   ├── tweet.ts              # Tweet workflow
│   ├── thread.ts             # Thread workflow
│   ├── video.ts              # Video workflow
│   └── render.ts             # Rendering steps
├── src/
│   ├── ai.ts                 # AI generation functions
│   ├── progress.ts           # Progress streaming utilities
│   └── prompt.ts             # System prompts
└── docs/
    └── workflow.md           # This documentation
```

---

## External Resources

- [Workflow DevKit Documentation](https://useworkflow.dev)
- [Streaming Guide](https://useworkflow.dev/docs/foundations/streaming)
- [Hooks & Webhooks](https://useworkflow.dev/docs/foundations/hooks)
- [MCP Protocol](https://modelcontextprotocol.io)

