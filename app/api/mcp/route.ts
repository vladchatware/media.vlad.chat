import { z } from "zod"
import { createMcpHandler } from "mcp-handler"
import { start, getRun } from "workflow/api"
import { story } from "../../../workflows/story"
import { carousel } from "../../../workflows/carousel"
import { tweet } from "../../../workflows/tweet"
import { thread } from "../../../workflows/thread"
import { video } from "../../../workflows/video"
import type { ProgressEvent } from "../../../src/progress"

const handler = createMcpHandler(
  (server) => {
    // ============================================
    // CONTENT GENERATION TOOLS
    // ============================================
    
    server.registerTool("generate_story", {
      description: "Generate a full story with image slides, voiceover audio, and captions. Creates a narrative dialogue between a person and their shadow.",
      inputSchema: { prompt: z.string().describe("The story prompt or theme to generate content about") },
    }, async ({ prompt }) => {
      const run = await start(story, [prompt])
      return {
        content: [{ type: "text", text: `✓ Story generation started!\n\nRun ID: ${run.runId}\n\nUse 'workflow_status' or 'workflow_progress' to track progress.` }],
      }
    })

    server.registerTool("generate_carousel", {
      description: "Generate a carousel post with story content and image slides for social media.",
      inputSchema: { prompt: z.string().describe("The carousel prompt or theme") },
    }, async ({ prompt }) => {
      const run = await start(carousel, [prompt])
      return {
        content: [{ type: "text", text: `✓ Carousel generation started!\n\nRun ID: ${run.runId}\n\nUse 'workflow_status' or 'workflow_progress' to track progress.` }],
      }
    })

    server.registerTool("generate_tweet", {
      description: "Generate a tweet video with voiceover. Creates a video of the tweet content being read aloud.",
      inputSchema: {
        content: z.string().describe("The tweet content to generate"),
        voice: z.enum(["ash", "onyx"]).default("ash").describe("Voice to use: 'ash' (teacher) or 'onyx' (student)"),
      },
    }, async ({ content, voice }) => {
      const run = await start(tweet, [content, voice])
      return {
        content: [{ type: "text", text: `✓ Tweet video generation started!\n\nRun ID: ${run.runId}\n\nUse 'workflow_status' or 'workflow_progress' to track progress.` }],
      }
    })

    server.registerTool("generate_thread", {
      description: "Generate a thread video with voiceover for platforms like Threads.",
      inputSchema: {
        content: z.string().describe("The thread content to generate"),
        voice: z.enum(["ash", "onyx"]).default("ash").describe("Voice to use: 'ash' (teacher) or 'onyx' (student)"),
      },
    }, async ({ content, voice }) => {
      const run = await start(thread, [content, voice])
      return {
        content: [{ type: "text", text: `✓ Thread video generation started!\n\nRun ID: ${run.runId}\n\nUse 'workflow_status' or 'workflow_progress' to track progress.` }],
      }
    })

    server.registerTool("generate_video", {
      description: "Generate a full AI video using Sora. Creates a complete video with AI-generated visuals and dialogue.",
      inputSchema: { prompt: z.string().describe("The video prompt or theme") },
    }, async ({ prompt }) => {
      const run = await start(video, [prompt])
      return {
        content: [{ type: "text", text: `✓ AI Video generation started!\n\nRun ID: ${run.runId}\n\nUse 'workflow_status' or 'workflow_progress' to track progress.` }],
      }
    })

    // ============================================
    // WORKFLOW MANAGEMENT TOOLS
    // ============================================

    server.registerTool("workflow_status", {
      description: "Check the current status of a workflow run. Returns whether it's running, completed, or failed.",
      inputSchema: {
        run_id: z.string().describe("The workflow run ID to check status for"),
      },
    }, async ({ run_id }) => {
      try {
        const run = getRun(run_id)
        
        // status is a getter that returns a Promise
        const [status, startedAt, completedAt] = await Promise.all([
          run.status,
          run.startedAt,
          run.completedAt,
        ])

        const statusEmoji: Record<string, string> = {
          'running': '🔄',
          'completed': '✅',
          'failed': '❌',
          'cancelled': '⏹️',
          'pending': '⏳',
          'paused': '⏸️',
        }

        let message = `${statusEmoji[status] || '❓'} Workflow Status: ${status.toUpperCase()}\n\n`
        message += `Run ID: ${run_id}\n`
        
        if (startedAt) {
          message += `Started: ${startedAt.toLocaleString()}\n`
        }
        
        if (completedAt) {
          message += `Completed: ${completedAt.toLocaleString()}\n`
        }

        return {
          content: [{ type: "text", text: message }],
        }
      } catch (error) {
        return {
          content: [{ type: "text", text: `❌ Could not find workflow run: ${run_id}` }],
        }
      }
    })

    server.registerTool("workflow_progress", {
      description: "Get the latest progress updates from a running workflow. Shows step-by-step progress with timestamps.",
      inputSchema: {
        run_id: z.string().describe("The workflow run ID to get progress for"),
      },
    }, async ({ run_id }) => {
      try {
        const run = getRun(run_id)
        const readable = run.getReadable<ProgressEvent>()
        const reader = readable.getReader()
        
        const events: ProgressEvent[] = []
        
        // Collect events with a timeout to avoid blocking
        const collectEvents = async () => {
          const timeoutMs = 2000
          const startTime = Date.now()
          
          try {
            while (Date.now() - startTime < timeoutMs) {
              const readPromise = reader.read()
              const timeoutPromise = new Promise<{ done: true; value: undefined }>((resolve) => 
                setTimeout(() => resolve({ done: true, value: undefined }), timeoutMs - (Date.now() - startTime))
              )
              
              const { done, value } = await Promise.race([readPromise, timeoutPromise])
              if (done) break
              if (value) events.push(value)
            }
          } finally {
            reader.releaseLock()
          }
        }

        await collectEvents()

        if (events.length === 0) {
          return {
            content: [{ type: "text", text: `⏳ No progress events yet for workflow: ${run_id}\n\nThe workflow may still be initializing.` }],
          }
        }

        const progressEmoji: Record<string, string> = {
          'start': '🚀',
          'step': '⚡',
          'complete': '✅',
          'error': '❌',
        }

        let message = `📊 Workflow Progress (${events.length} events)\n\n`
        message += `Run ID: ${run_id}\n\n`
        
        for (const event of events) {
          const emoji = progressEmoji[event.type] || '•'
          const time = new Date(event.timestamp).toLocaleTimeString()
          const progress = event.progress !== undefined ? ` [${event.progress}%]` : ''
          const step = event.step ? ` (${event.step})` : ''
          
          message += `${emoji} ${time}${step}${progress}\n   ${event.message}\n\n`
        }

        const lastEvent = events[events.length - 1]
        if (lastEvent.type === 'complete') {
          message += `\n🎉 Workflow completed successfully!`
        } else if (lastEvent.type === 'error') {
          message += `\n⚠️ Workflow encountered an error.`
        }

        return {
          content: [{ type: "text", text: message }],
        }
      } catch (error) {
        return {
          content: [{ type: "text", text: `❌ Could not find workflow run: ${run_id}` }],
        }
      }
    })

    server.registerTool("workflow_cancel", {
      description: "Cancel a running workflow. The workflow will stop at the next checkpoint.",
      inputSchema: {
        run_id: z.string().describe("The workflow run ID to cancel"),
      },
    }, async ({ run_id }) => {
      try {
        const run = getRun(run_id)
        await run.cancel()

        return {
          content: [{ type: "text", text: `⏹️ Cancellation requested for workflow: ${run_id}\n\nThe workflow will stop at the next checkpoint.` }],
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        return {
          content: [{ type: "text", text: `❌ Failed to cancel workflow: ${run_id}\n\nError: ${message}` }],
        }
      }
    })

    server.registerTool("workflow_result", {
      description: "Get the final result of a completed workflow. Only works for workflows that have finished.",
      inputSchema: {
        run_id: z.string().describe("The workflow run ID to get the result for"),
      },
    }, async ({ run_id }) => {
      try {
        const run = getRun(run_id)
        const status = await run.status

        if (status !== 'completed') {
          return {
            content: [{ type: "text", text: `⏳ Workflow is not yet complete.\n\nCurrent status: ${status}\n\nPlease wait for the workflow to finish or use 'workflow_progress' to check updates.` }],
          }
        }

        const result = await run.returnValue

        return {
          content: [{ type: "text", text: `✅ Workflow Result\n\nRun ID: ${run_id}\n\n${JSON.stringify(result, null, 2)}` }],
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        return {
          content: [{ type: "text", text: `❌ Failed to get workflow result: ${run_id}\n\nError: ${message}` }],
        }
      }
    })
  },
  {
    serverInfo: {
      name: "media-vlad-chat",
      version: "1.0.0",
    },
  },
  { basePath: "/api" }
)

export { handler as GET, handler as POST, handler as DELETE }
