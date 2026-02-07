export type WorkspaceAsset = {
  id: string;
  type: "image" | "audio" | "video" | "json" | "font" | "other";
  urlPath: string;
};

export type WorkspaceProject = {
  id: string;
  title: string;
  compositionId: "Story";
  status: "draft" | "rendering" | "ready";
  updatedAt: string;
  inputProps: Record<string, unknown>;
  assets: WorkspaceAsset[];
};

export type WorkspaceData = {
  id: string;
  name: string;
  memberRole: "owner";
  projects: WorkspaceProject[];
};
