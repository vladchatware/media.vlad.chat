import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { CameraMotionBlur } from "@remotion/motion-blur";
import { styles, captionPositionStyle } from "./Captions";

const fontFamily =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", Roboto, Arial, sans-serif';

export type SlideProps = {
  image: string;
  text: string;
  side: "left" | "right";
  shot: "two-shot" | "closeup" | "medium";
};

const slideStyles = {
  text: {
    fontSize: 52,
    fontWeight: 500,
    fontFamily,
    textAlign: "center" as const,
    lineHeight: 1.4,
    letterSpacing: "-0.01em",
  },
  textContainer: {
    maxWidth: "88%",
    display: "flex",
    justifyContent: "center",
    textAlign: "center" as const,
    position: "relative" as const,
    zIndex: 10,
  },
  span: {
    padding: "12px 28px",
    borderRadius: "20px",
    boxDecorationBreak: "clone" as const,
    WebkitBoxDecorationBreak: "clone" as const,
    display: "inline",
  },
};

export const Slide = ({ image, text, side, shot }: SlideProps) => {
  return (
    <CameraMotionBlur shutterAngle={280} samples={1}>
      <Img
        src={image.startsWith("http") ? image : staticFile(image)}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />

      <AbsoluteFill
        style={{
          ...styles.container,
          ...captionPositionStyle[`${side}-${shot}`],
        }}
      >
        <div style={slideStyles.textContainer}>
          {/* Background Layer */}
          <div
            style={{
              ...slideStyles.text,
              position: "absolute",
              zIndex: 0,
              width: "100%",
            }}
          >
            <span
              style={{
                ...slideStyles.span,
                backgroundColor: "white",
                color: "transparent",
              }}
            >
              {text}
            </span>
          </div>

          {/* Sharp Text Layer on Top */}
          <div
            style={{
              ...slideStyles.text,
              position: "relative",
              zIndex: 1,
              width: "100%",
            }}
          >
            <span
              style={{
                ...slideStyles.span,
                backgroundColor: "transparent",
                color: "black",
              }}
            >
              {text}
            </span>
          </div>
        </div>
      </AbsoluteFill>
    </CameraMotionBlur>
  );
};
