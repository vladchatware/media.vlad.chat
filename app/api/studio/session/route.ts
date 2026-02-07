import { NextResponse } from "next/server";
import { verifyStudioSessionToken } from "@/src/studio/session";

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

const corsHeaders = (): HeadersInit => {
  const studioOrigin = process.env.STUDIO_ORIGIN ?? "http://localhost:4097";

  return {
    "Access-Control-Allow-Origin": studioOrigin,
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    Vary: "Origin",
  };
};

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(),
  });
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Missing token" },
        { status: 400, headers: corsHeaders() },
      );
    }

    const claims = verifyStudioSessionToken({
      token,
      secret: getStudioSessionSecret(),
    });

    return NextResponse.json(
      {
        workspaceId: claims.workspaceId,
        projectId: claims.projectId,
        compositionId: claims.compositionId,
        inputProps: claims.inputProps,
        assets: claims.assets,
        userId: claims.userId,
        expiresAt: claims.exp,
      },
      { headers: corsHeaders() },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: message },
      { status: 401, headers: corsHeaders() },
    );
  }
}
