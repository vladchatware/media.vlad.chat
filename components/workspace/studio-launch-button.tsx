"use client";

import { useState } from "react";

type StudioLaunchButtonProps = {
  workspaceId: string;
  projectId: string;
  compositionId: "Story" | "Thread" | "Tweet" | "Outro";
  inputProps: Record<string, unknown>;
  assets: {
    id: string;
    type: "image" | "audio" | "video" | "json" | "font" | "other";
    urlPath: string;
  }[];
};

export const StudioLaunchButton = ({
  workspaceId,
  projectId,
  compositionId,
  inputProps,
  assets,
}: StudioLaunchButtonProps) => {
  const [loading, setLoading] = useState(false);

  const onLaunch = async () => {
    try {
      setLoading(true);
      const origin = window.location.origin;
      const response = await fetch("/api/studio/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          projectId,
          compositionId,
          inputProps,
          apiOrigin: origin,
          ttlSeconds: 600,
          assets: assets.map((asset) => ({
            id: asset.id,
            type: asset.type,
            url: new URL(asset.urlPath, origin).toString(),
          })),
        }),
      });

      if (!response.ok) {
        const errorPayload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(
          errorPayload?.error ?? "Unable to create Studio session",
        );
      }

      const payload = (await response.json()) as { studioLaunchUrl: string };
      window.location.assign(payload.studioLaunchUrl);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to launch Studio";
      window.alert(message);
      setLoading(false);
    }
  };

  return (
    <button className="action" disabled={loading} onClick={onLaunch}>
      {loading ? "Launching..." : "Open In Studio"}
    </button>
  );
};
