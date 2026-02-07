import { staticFile } from "remotion";

const absoluteUrlPattern = /^(https?:\/\/|data:|blob:)/i;

export const resolveAssetSrc = (src: string): string => {
  if (absoluteUrlPattern.test(src)) {
    return src;
  }

  return staticFile(src);
};
