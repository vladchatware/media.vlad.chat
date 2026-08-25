import React from "react";
import { AbsoluteFill, useCurrentFrame, Series } from "remotion";
import { loadFont } from "@remotion/google-fonts/NotoSans";
import {
  createTikTokStyleCaptions,
  Caption as RemotionCaption,
} from "@remotion/captions";

const { fontFamily } = loadFont();

export const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
    width: "100%",
  },
  caption: {
    backgroundColor: "white",
    paddingInline: 24,
    marginBlock: -5,
    borderRadius: 16,
    borderSize: 1,
    borderColor: "transparent",
    borderStyle: "solid",
  },
  captionToken: {
    fontSize: 52,
    fontWeight: 400,
    fontFamily,
  },
};

const inFrame = (frame: number, from: number, to: number) => {
  const frameFrom = Math.floor(from / (1000 / 30));
  const frameTo = Math.floor(to / (1000 / 30));
  return frameFrom <= frame && frame <= frameTo;
};

export const captionPositionStyle: Record<string, React.CSSProperties> = {
  "left-closeup": {
    paddingTop: 800,
  },
  "left-medium": {
    paddingTop: 100,
  },
  "right-closeup": {
    paddingBottom: 1200,
  },
  "right-medium": {
    paddingTop: 100,
  },
  "left-two-shot": {
    paddingTop: 100,
  },
  "right-two-shot": {
    paddingTop: 100,
  },
};

export const Captions = ({
  captions,
  captionPosition,
  combineTokensWithinMilliseconds,
}: {
  captions: RemotionCaption[];
  captionPosition: string;
  combineTokensWithinMilliseconds: number;
}) => {
  const frame = useCurrentFrame();
  const { pages } = createTikTokStyleCaptions({
    captions,
    combineTokensWithinMilliseconds,
  });

  return (
    <Series>
      {pages.map((caption, j) => {
        const durationInFrames = Math.floor((caption.durationMs / 1000) * 30);
        return (
          <Series.Sequence
            key={j}
            premountFor={1}
            postmountFor={1}
            durationInFrames={durationInFrames || 10}
          >
            <AbsoluteFill
              style={{
                ...captionPositionStyle[captionPosition],
                ...styles.container,
              }}
            >
              <div style={styles.caption}>
                {caption.tokens.map((token, i) => {
                  const visible = inFrame(frame, token.fromMs, token.toMs);
                  const style = visible ? { color: "red" } : { color: "black" };

                  return (
                    <span key={i} style={{ ...style, ...styles.captionToken }}>
                      {token.text}
                    </span>
                  );
                })}
              </div>
            </AbsoluteFill>
          </Series.Sequence>
        );
      })}
    </Series>
  );
};
