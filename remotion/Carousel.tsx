import { Series } from "remotion"
import { Slide } from "./Slide"
import { z } from "zod/v3"
import { storyProp } from "./types"

type StoryData = z.infer<typeof storyProp>['story'];

export const Carousel = ({ story, image }: { story: StoryData, image: string }) => {
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
