import { Series } from "remotion"
import { StoryMetadata } from "./Story"
import { Slide } from "./Slide"

export const Carousel = ({ story, image }: { story: StoryMetadata, image: string }) => {
  return <Series>
      {story.dialog.map(line =>
        <Series.Sequence durationInFrames={1}>
        <Slide
          image={image}
          text={line.text}
          side={line.side}
          shot={line.shot} />
        </Series.Sequence>
      )}
  </Series>
}