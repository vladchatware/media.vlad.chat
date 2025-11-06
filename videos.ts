import { downloadVideo, listVideos } from "./src/ai";

const res = await listVideos()

console.log('Videos', res)

try {
  await downloadVideo(res[0].id, 'video-1.mp4')
} catch (e) {
  console.log(e.message)
}
