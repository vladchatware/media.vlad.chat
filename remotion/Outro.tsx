import { CameraMotionBlur } from "@remotion/motion-blur"
import { AbsoluteFill, Audio, OffthreadVideo } from "remotion"
import { staticUrl } from "./assets"

export const Outro = (props: { video: string }) => {
  return <>
    <Audio src={staticUrl(props.video)} volume={1} />
    <CameraMotionBlur shutterAngle={280} samples={1}>
      <AbsoluteFill style={{ flex: 1, backgroundColor: 'black' }}>
        <OffthreadVideo
          src={staticUrl(props.video)}
          volume={0}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            objectPosition: 'center',
          }}
        />
      </AbsoluteFill>
    </CameraMotionBlur>
  </>
}
