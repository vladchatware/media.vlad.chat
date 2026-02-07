import { NextResponse } from "next/server";
import { z } from "zod";
import { createStudioSessionToken } from "@/src/studio/session";

const createStudioSessionBodySchema = z.object({
  workspaceId: z.string().min(1),
  projectId: z.string().min(1),
  compositionId: z.string().min(1),
  inputProps: z.record(z.string(), z.unknown()).default({}),
  assets: z
    .array(
      z.object({
        id: z.string().min(1),
        type: z.enum(["image", "audio", "video", "json", "font", "other"]),
        url: z.string().url(),
        metadata: z
          .record(
            z.string(),
            z.union([z.string(), z.number(), z.boolean(), z.null()]),
          )
          .optional(),
      }),
    )
    .default([]),
  userId: z.string().min(1).optional(),
  ttlSeconds: z.number().int().min(60).max(3600).optional(),
  apiOrigin: z.string().url().optional(),
});

const getStudioSessionSecret = (): string => {
  const value = process.env.STUDIO_SESSION_SECRET;
  if (value && value.length >= 32) {
    return value;
  }

  if (process.env.NODE_ENV !== "production") {
    return "local-development-only-studio-session-secret";
  }

  throw new Error(
    "STUDIO_SESSION_SECRET must be set and at least 32 characters in production",
  );
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createStudioSessionBodySchema.parse(body);
    const ttlSeconds = parsed.ttlSeconds ?? 600;
    const secret = getStudioSessionSecret();

    const { token, claims } = createStudioSessionToken({
      payload: {
        workspaceId: parsed.workspaceId,
        projectId: parsed.projectId,
        compositionId: parsed.compositionId,
        inputProps: parsed.inputProps,
        assets: parsed.assets,
        userId: parsed.userId,
      },
      secret,
      ttlSeconds,
    });

    const studioOrigin = process.env.STUDIO_ORIGIN ?? "http://localhost:4097";
    const apiOrigin = parsed.apiOrigin ?? new URL(request.url).origin;
    const studioLaunchUrl = `${studioOrigin}/?session=${encodeURIComponent(token)}&apiOrigin=${encodeURIComponent(apiOrigin)}`;

    return NextResponse.json({
      token,
      expiresAt: claims.exp,
      apiOrigin,
      studioLaunchUrl,
      session: {
        workspaceId: claims.workspaceId,
        projectId: claims.projectId,
        compositionId: claims.compositionId,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
