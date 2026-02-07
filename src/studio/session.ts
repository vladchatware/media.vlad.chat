import crypto from "node:crypto";

export type StudioAssetType =
  | "image"
  | "audio"
  | "video"
  | "json"
  | "font"
  | "other";

export type StudioAsset = {
  id: string;
  type: StudioAssetType;
  url: string;
  metadata?: Record<string, string | number | boolean | null>;
};

export type StudioSessionClaims = {
  iss: "media.vlad.chat";
  aud: "remotion-studio-launch";
  iat: number;
  exp: number;
  jti: string;
  workspaceId: string;
  projectId: string;
  compositionId: string;
  inputProps: Record<string, unknown>;
  assets: StudioAsset[];
  userId?: string;
};

type SessionPayload = {
  workspaceId: string;
  projectId: string;
  compositionId: string;
  inputProps: Record<string, unknown>;
  assets: StudioAsset[];
  userId?: string;
};

const TOKEN_ISSUER = "media.vlad.chat" as const;
const TOKEN_AUDIENCE = "remotion-studio-launch" as const;

const encodeBase64Url = (value: string): string => {
  return Buffer.from(value, "utf8").toString("base64url");
};

const decodeBase64Url = (value: string): string => {
  return Buffer.from(value, "base64url").toString("utf8");
};

const sign = (unsignedToken: string, secret: string): string => {
  return crypto
    .createHmac("sha256", secret)
    .update(unsignedToken)
    .digest("base64url");
};

export const createStudioSessionToken = ({
  payload,
  secret,
  ttlSeconds,
}: {
  payload: SessionPayload;
  secret: string;
  ttlSeconds: number;
}): { token: string; claims: StudioSessionClaims } => {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const claims: StudioSessionClaims = {
    iss: TOKEN_ISSUER,
    aud: TOKEN_AUDIENCE,
    iat: nowSeconds,
    exp: nowSeconds + ttlSeconds,
    jti: crypto.randomUUID(),
    workspaceId: payload.workspaceId,
    projectId: payload.projectId,
    compositionId: payload.compositionId,
    inputProps: payload.inputProps,
    assets: payload.assets,
    userId: payload.userId,
  };

  const encodedClaims = encodeBase64Url(JSON.stringify(claims));
  const signature = sign(encodedClaims, secret);
  return {
    token: `${encodedClaims}.${signature}`,
    claims,
  };
};

export const verifyStudioSessionToken = ({
  token,
  secret,
}: {
  token: string;
  secret: string;
}): StudioSessionClaims => {
  const [encodedClaims, signature] = token.split(".");
  if (!encodedClaims || !signature) {
    throw new Error("Invalid token format");
  }

  const expectedSignature = sign(encodedClaims, secret);
  const signatureBuffer = Buffer.from(signature, "utf8");
  const expectedBuffer = Buffer.from(expectedSignature, "utf8");
  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    throw new Error("Invalid token signature");
  }

  const parsed = JSON.parse(
    decodeBase64Url(encodedClaims),
  ) as StudioSessionClaims;

  if (parsed.iss !== TOKEN_ISSUER || parsed.aud !== TOKEN_AUDIENCE) {
    throw new Error("Invalid token issuer or audience");
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  if (parsed.exp < nowSeconds) {
    throw new Error("Token expired");
  }

  return parsed;
};
