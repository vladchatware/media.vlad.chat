import { CameraMotionBlur } from "@remotion/motion-blur"
import { AbsoluteFill, OffthreadVideo, staticFile } from "remotion"

export const Outro = (props: { video: string }) => {
  return <CameraMotionBlur shutterAngle={280} samples={1}>
    <AbsoluteFill style={{ flex: 1 }}>
      <OffthreadVideo src={staticFile(props.video)} />
    </AbsoluteFill>
  </CameraMotionBlur>
}
