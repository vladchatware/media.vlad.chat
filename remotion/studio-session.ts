type StudioSessionPayload = {
  workspaceId: string;
  projectId: string;
  compositionId: string;
  inputProps: Record<string, unknown>;
  assets: Array<{
    id: string;
    type: "image" | "audio" | "video" | "json" | "font" | "other";
    url: string;
    metadata?: Record<string, string | number | boolean | null>;
  }>;
  userId?: string;
  expiresAt: number;
};

let sessionPromise: Promise<StudioSessionPayload | null> | null = null;

const getSearchParam = (key: string): string | null => {
  if (typeof window === "undefined") {
    return null;
  }

  return new URLSearchParams(window.location.search).get(key);
};

const getApiOrigin = (): string => {
  const fromQuery = getSearchParam("apiOrigin");
  if (fromQuery) {
    return fromQuery;
  }

  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return "http://localhost:3000";
};

const fetchStudioSession = async (): Promise<StudioSessionPayload | null> => {
  const token = getSearchParam("session");
  if (!token) {
    return null;
  }

  const apiOrigin = getApiOrigin();
  const response = await fetch(
    `${apiOrigin}/api/studio/session?token=${encodeURIComponent(token)}`,
  );

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as StudioSessionPayload;
};

const getStudioSession = async (): Promise<StudioSessionPayload | null> => {
  if (!sessionPromise) {
    sessionPromise = fetchStudioSession();
  }

  return sessionPromise;
};

export const getStudioInputPropsForComposition = async (
  compositionId: string,
): Promise<Record<string, unknown> | null> => {
  const session = await getStudioSession();
  if (!session) {
    return null;
  }

  if (session.compositionId !== compositionId) {
    return null;
  }

  return session.inputProps;
};
