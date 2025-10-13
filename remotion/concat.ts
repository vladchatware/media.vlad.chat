import { $ } from 'bun'
import _path from 'path'

const path = _path.join(__dirname, '..', 'out')

export const concat = async (name) => {
  const files = await $`ls ${path}/*.mp4 | sort -V`.text()
  const lines = files.split('\n').map(f => f ? `file '${f}'\n` : '')

  await Bun.write(`${path}/videos.txt`, lines.join(''))

  await $`ffmpeg -y -f concat -safe 0 -i ${path}/videos.txt -c copy ${path}/${name}.mp4`.quiet()

  await $`mv ${path}/${name}.mp4 ${path}/../finished`.nothrow()
  await cleanup()
}

export const cleanup = async () => {
  await $`rm ${path}/videos.txt`.nothrow()
  await $`rm ${path}/*.mp4`.nothrow()
  await $`rm ${_path.join(__dirname, '..', 'public', 'captions-*.json')}`
  await $`rm ${_path.join(__dirname, '..', 'public', 'speech-*.mp3')}`
}
