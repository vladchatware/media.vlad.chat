# Social Media Engine

This app generates a short videos around specific content that is specified in
the prompt.

## Pipeline

1. Generate a story

```json
[
  {
    "topic": "The topic of the story",
    "dialog": [
      {
        "text": "Dialog line",
        "instructions": "Voice instructions",
        "side": "Which side is speaking in a dialog",
        "voice": "OpenAI voice name"
      }
    ]
  }
]
```

2. Generate a sound

Take the **text**, **instructions** and **voice** to generate an audio file.

The process happen before submitting the rendering job, not a browser runtime.

3. Transcribe the sound

Take that previously generated audio file and feed back to transcriptions
to get an accurate position of the captions.

The process is also happening before the actual rendering job.

```

```

## Studio Launch Contract

Use Next.js as the source of truth for workspace-scoped composition data, and let Remotion Studio consume signed launch sessions.

### Start Studio locally

```bash
bun run studio
```

Optional tunnel for remote access:

```bash
bun run tunnel:studio
```

### Environment variables

- `STUDIO_SESSION_SECRET`: HMAC signing secret (32+ chars in production)
- `STUDIO_ORIGIN`: Studio URL used for launch links. Default: `http://localhost:4097`

### API endpoints

- `POST /api/studio/sessions`
  - Creates a short-lived launch token and returns `studioLaunchUrl`.
  - `studioLaunchUrl` includes `session` and `apiOrigin` query params for Studio bootstrap.
  - Body:

```json
{
  "workspaceId": "ws_123",
  "projectId": "proj_456",
  "compositionId": "Story",
  "inputProps": {},
  "assets": [
    {
      "id": "a1",
      "type": "audio",
      "url": "https://cdn.example.com/speech-0.mp3"
    }
  ],
  "apiOrigin": "https://api.media.vlad.chat",
  "ttlSeconds": 600
}
```

- `GET /api/studio/session?token=...`
  - Verifies the token and returns workspace-scoped session payload for Studio.
