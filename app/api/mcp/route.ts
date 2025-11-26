import { z } from "zod"
import { createMcpHandler } from "mcp-handler"
import { start } from "workflow/api"
import { story } from "../../../workflows/story"
import { carousel } from "../../../workflows/carousel"
import { tweet } from "../../../workflows/tweet"
import { thread } from "../../../workflows/thread"
import { video } from "../../../workflows/video"

const handler = createMcpHandler(
  (server) => {
    server.registerTool("generate_story", {
      description: "Generate a full story with image slides, voiceover audio, and captions. Creates a narrative dialogue between a person and their shadow.",
      inputSchema: { prompt: z.string().describe("The story prompt or theme to generate content about") },
    }, async ({ prompt }) => {
      const run = await start(story, [prompt])
      return {
        content: [{ type: "text", text: `✓ Story generation started!\n\nRun ID: ${run.runId}` }],
      }
    })

    server.registerTool("generate_carousel", {
      description: "Generate a carousel post with story content and image slides for social media.",
      inputSchema: { prompt: z.string().describe("The carousel prompt or theme") },
    }, async ({ prompt }) => {
      const run = await start(carousel, [prompt])
      return {
        content: [{ type: "text", text: `✓ Carousel generation started!\n\nRun ID: ${run.runId}` }],
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
        content: [{ type: "text", text: `✓ Tweet video generation started!\n\nRun ID: ${run.runId}` }],
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
        content: [{ type: "text", text: `✓ Thread video generation started!\n\nRun ID: ${run.runId}` }],
      }
    })

    server.registerTool("generate_video", {
      description: "Generate a full AI video using Sora. Creates a complete video with AI-generated visuals and dialogue.",
      inputSchema: { prompt: z.string().describe("The video prompt or theme") },
    }, async ({ prompt }) => {
      const run = await start(video, [prompt])
      return {
        content: [{ type: "text", text: `✓ AI Video generation started!\n\nRun ID: ${run.runId}` }],
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
