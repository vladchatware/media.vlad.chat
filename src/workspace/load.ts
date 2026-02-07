import "server-only";

import { access, readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { WorkspaceData, WorkspaceProject, WorkspaceAsset } from "./types";

type StoryLine = {
  text?: string;
  instructions?: string;
  side?: "left" | "right";
  voice?: "ash" | "onyx";
  shot?: "closeup" | "medium" | "two-shot";
};

type StoryFile = {
  topic?: string;
  dialog?: StoryLine[];
};

const toRelativeTime = (timestampMs: number): string => {
  const deltaMs = Date.now() - timestampMs;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (deltaMs < hour) {
    const minutes = Math.max(1, Math.floor(deltaMs / minute));
    return `${minutes}m ago`;
  }

  if (deltaMs < day) {
    const hours = Math.floor(deltaMs / hour);
    return `${hours}h ago`;
  }

  const days = Math.floor(deltaMs / day);
  return `${days}d ago`;
};

const exists = async (filePath: string): Promise<boolean> => {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
};

const titleFromFileName = (fileName: string): string => {
  const base = fileName.replace(/\.json$/i, "");
  const hyphenIndex = base.indexOf("-");
  return hyphenIndex > 0 ? base.slice(hyphenIndex + 1) : base;
};

const normalizeStory = (parsed: StoryFile, fallbackTitle: string) => {
  const topic = typeof parsed.topic === "string" ? parsed.topic : fallbackTitle;
  const lines = Array.isArray(parsed.dialog) ? parsed.dialog : [];

  return {
    topic,
    dialog: lines.map((line) => ({
      text: line.text ?? "",
      instructions: line.instructions ?? "",
      side: line.side === "right" ? "right" : "left",
      voice: line.voice === "ash" ? "ash" : "onyx",
      shot: line.shot ?? "two-shot",
    })),
  };
};

const buildAssetsForStory = async (
  publicDir: string,
  dialogLength: number,
): Promise<{
  assets: WorkspaceAsset[];
  status: WorkspaceProject["status"];
}> => {
  const assets: WorkspaceAsset[] = [];
  let allMediaReady = dialogLength > 0;
  let anyMediaReady = false;

  for (let i = 0; i < dialogLength; i += 1) {
    const speechName = `speech-${i}.mp3`;
    const captionsName = `captions-${i}.json`;
    const speechPath = path.join(publicDir, speechName);
    const captionsPath = path.join(publicDir, captionsName);

    const [speechExists, captionsExists] = await Promise.all([
      exists(speechPath),
      exists(captionsPath),
    ]);

    if (speechExists) {
      anyMediaReady = true;
      assets.push({
        id: `speech-${i}`,
        type: "audio",
        urlPath: `/${speechName}`,
      });
    }

    if (captionsExists) {
      anyMediaReady = true;
      assets.push({
        id: `captions-${i}`,
        type: "json",
        urlPath: `/${captionsName}`,
      });
    }

    if (!speechExists || !captionsExists) {
      allMediaReady = false;
    }
  }

  if (allMediaReady && dialogLength > 0) {
    return { assets, status: "ready" };
  }

  if (anyMediaReady) {
    return { assets, status: "rendering" };
  }

  return { assets, status: "draft" };
};

export const loadWorkspaceData = async (): Promise<WorkspaceData> => {
  const storiesDir = path.join(process.cwd(), "stories");
  const publicDir = path.join(process.cwd(), "public");

  const fileNames = (await readdir(storiesDir)).filter((name) =>
    name.endsWith(".json"),
  );

  const fileMeta = await Promise.all(
    fileNames.map(async (fileName) => {
      const fullPath = path.join(storiesDir, fileName);
      const info = await stat(fullPath);
      return { fileName, fullPath, mtimeMs: info.mtimeMs };
    }),
  );

  fileMeta.sort((a, b) => b.mtimeMs - a.mtimeMs);

  const projects: WorkspaceProject[] = [];

  for (const item of fileMeta.slice(0, 16)) {
    const raw = await readFile(item.fullPath, "utf8");
    const parsed = JSON.parse(raw) as StoryFile;
    const title = titleFromFileName(item.fileName);
    const story = normalizeStory(parsed, title);
    const { assets, status } = await buildAssetsForStory(
      publicDir,
      story.dialog.length,
    );

    projects.push({
      id: item.fileName.replace(/\.json$/i, ""),
      title,
      compositionId: "Story",
      status,
      updatedAt: toRelativeTime(item.mtimeMs),
      inputProps: { story },
      assets,
    });
  }

  return {
    id: "local-workspace",
    name: "Media Workspace",
    memberRole: "owner",
    projects,
  };
};
