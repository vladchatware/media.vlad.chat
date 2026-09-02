import React from 'react'
import { z } from 'zod/v3'
import { Audio } from '@remotion/media'
import { AbsoluteFill, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion'

export const streamCountdownSchema = z.object({
  daysToGo: z.number().int().min(1).max(99),
  eyebrow: z.string(),
  eventLabel: z.string(),
  dateLabel: z.string(),
  timeLabel: z.string(),
  timezone: z.string(),
  url: z.string(),
  accent: z.string(),
  audioSrc: z.string(),
})

export type StreamCountdownProps = z.infer<typeof streamCountdownSchema>

const NAVY = '#053b72'
const BLUE = '#149df2'
const WHITE = '#f9ffff'
const DEEP_GREEN = '#098a49'
const DISPLAY = 'Arial Rounded MT Bold, Arial, Helvetica, sans-serif'
const SANS = 'Trebuchet MS, Arial, sans-serif'
const clamp = { extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const }

// music.vlad.chat track_analysis, track 1758427929.
const TRACK_BPM = 112.73307800292969
const FIRST_DOWNBEAT_SEC = 2.043355941772461

// 30fps transient scan of first 15s: low-pass attacks and high-pass/snare attacks.
const KICK_TIMES = [
  0.358, 1.225, 2.025, 3.092, 3.458, 4.158, 5.225, 5.692, 6.325, 6.892, 7.325,
  8.392, 9.192, 9.725, 10.225, 10.525, 11.058, 11.858, 12.758, 13.158, 13.558,
  13.958, 14.492, 14.792,
]
const SNARE_TIMES = [
  0.158, 1.225, 2.025, 3.092, 4.158, 6.525, 7.325, 8.392, 9.192, 10.258,
  11.292, 12.358, 13.425, 14.492,
]

const beatPulse = (frame: number, fps: number) => {
  const beatFrames = fps * 60 / TRACK_BPM
  const relative = frame - FIRST_DOWNBEAT_SEC * fps
  const phase = ((relative % beatFrames) + beatFrames) % beatFrames
  const distance = Math.min(phase, beatFrames - phase)
  return interpolate(distance, [0, beatFrames * 0.46], [1, 0], clamp)
}

const transientEnvelope = (frame: number, fps: number, times: number[], decayFrames: number) => {
  let strength = 0
  for (const time of times) {
    const delta = frame - time * fps
    if (delta >= -1 && delta <= decayFrames) {
      strength = Math.max(strength, interpolate(delta, [-1, 0, decayFrames], [0, 1, 0], clamp))
    }
  }
  return strength
}

const Distortion: React.FC<{ scene: React.ReactNode; kick: number; snare: number }> = ({
  scene,
  kick,
  snare,
}) => {
  const frame = useCurrentFrame()
  const force = Math.max(kick * 0.8, snare)
  const shakeX = Math.sin(frame * 17.17) * kick * 30 + Math.sin(frame * 41.3) * snare * 58
  const shakeY = Math.cos(frame * 23.9) * kick * 15 + Math.sin(frame * 31.7) * snare * 34
  const stripHeight = 95 + (frame % 4) * 28

  return (
    <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: '#02122d' }}>
      <AbsoluteFill
        style={{
          transform: `translate(${shakeX}px, ${shakeY}px) scale(${1 + kick * 0.045 + snare * 0.075}) rotate(${Math.sin(frame * 9.1) * snare * 1.6}deg)`,
          filter: `contrast(${1 + force * 1.8}) saturate(${1 + force * 3.6}) hue-rotate(${snare * 95}deg)`,
        }}
      >
        {scene}
      </AbsoluteFill>

      {force > 0 && [0, 1, 2, 3].map((index) => {
        const top = (frame * (73 + index * 19) + index * 337) % 1750
        const direction = index % 2 === 0 ? 1 : -1
        return (
          <div
            key={index}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top,
              height: stripHeight,
              overflow: 'hidden',
              opacity: Math.min(1, force * (0.75 + index * 0.12)),
              mixBlendMode: index % 2 === 0 ? 'screen' : 'hard-light',
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: -90,
                top: -top,
                width: 1260,
                height: 1920,
                transform: `translateX(${direction * force * (80 + index * 38)}px)`,
                filter: index % 2 === 0 ? 'hue-rotate(135deg) saturate(4)' : 'hue-rotate(-90deg) contrast(2)',
              }}
            >
              {scene}
            </div>
          </div>
        )
      })}

      <AbsoluteFill
        style={{
          opacity: kick * 0.32,
          mixBlendMode: 'difference',
          background: 'repeating-linear-gradient(0deg, #fff 0 3px, #000 3px 9px)',
          transform: `translateY(${frame % 9}px)`,
        }}
      />
      <AbsoluteFill
        style={{
          opacity: snare * 0.72,
          background: frame % 2 === 0 ? '#ffffff' : '#65ff3d',
          mixBlendMode: 'screen',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: frame % 2 === 0 ? 42 : 710,
          top: 160 + ((frame * 97) % 1380),
          width: 330,
          height: 28 + snare * 92,
          opacity: force,
          background: snare > kick ? '#ff2bd6' : '#00f7ff',
          boxShadow: `${-Math.sign(shakeX || 1) * 36}px 0 0 #ff203d`,
          transform: `skewX(${Math.sin(frame) * 24}deg)`,
        }}
      />
      {snare > 0.25 && (
        <div
          style={{
            position: 'absolute',
            right: 48 + (frame % 3) * 80,
            top: 230 + ((frame * 61) % 1180),
            color: frame % 2 ? '#fff' : '#072f68',
            fontFamily: DISPLAY,
            fontSize: 76 + snare * 54,
            fontWeight: 900,
            letterSpacing: -5,
            transform: `rotate(${frame % 2 ? -9 : 7}deg) scaleX(${1 + snare * 0.65})`,
            textShadow: '7px 0 #ff2bd6, -7px 0 #00edff',
          }}
        >
          KSSHH!
        </div>
      )}
    </AbsoluteFill>
  )
}

const AeroWorld: React.FC<{ localFrame: number; accent: string; horizon?: number }> = ({
  localFrame,
  accent,
  horizon = 1220,
}) => {
  const { fps } = useVideoConfig()
  const globalFrame = useCurrentFrame()
  const beat = beatPulse(globalFrame, fps)
  const drift = interpolate(localFrame, [0, 5 * fps], [0, 46])

  return (
    <AbsoluteFill
      style={{
        overflow: 'hidden',
        background: 'linear-gradient(180deg, #038ee7 0%, #70d1ff 47%, #d8f7ff 70%, #fff 100%)',
        filter: `saturate(${1 + beat * 0.08}) brightness(${1 + beat * 0.025})`,
      }}
    >
      <div
        style={{
          position: 'absolute', width: 820, height: 820, top: -330, right: -260,
          borderRadius: '50%',
          background: 'radial-gradient(circle, #fff 0%, #fff9a8 18%, rgba(255,255,255,0) 68%)',
          transform: `scale(${1 + beat * 0.035})`,
        }}
      />

      {[
        { top: 285, left: -110, scale: 1.1 },
        { top: 450, left: 700, scale: 0.72 },
        { top: 710, left: 125, scale: 0.55 },
      ].map((cloud, index) => (
        <div
          key={index}
          style={{
            position: 'absolute', top: cloud.top,
            left: cloud.left + drift * (index % 2 === 0 ? 1 : -0.5),
            width: 350 * cloud.scale, height: 105 * cloud.scale, borderRadius: 999,
            background: 'linear-gradient(180deg, #fff 5%, #d9f5ff 100%)',
            boxShadow: '0 24px 40px rgba(0,98,173,0.13)',
          }}
        >
          <div style={{
            position: 'absolute', width: 145 * cloud.scale, height: 145 * cloud.scale,
            left: 55 * cloud.scale, top: -58 * cloud.scale, borderRadius: '50%',
            background: 'linear-gradient(150deg, #fff 25%, #e3f8ff 100%)',
          }} />
          <div style={{
            position: 'absolute', width: 118 * cloud.scale, height: 118 * cloud.scale,
            left: 172 * cloud.scale, top: -38 * cloud.scale, borderRadius: '50%',
            background: 'linear-gradient(150deg, #fff 20%, #def6ff 100%)',
          }} />
        </div>
      ))}

      <svg viewBox="0 0 1080 760" style={{ position: 'absolute', left: 0, top: horizon - 250, width: 1080, height: 760 }}>
        <defs>
          <linearGradient id="hillBack" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#b3f66b" /><stop offset="1" stopColor="#23a94e" />
          </linearGradient>
          <linearGradient id="hillFront" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#5ee038" /><stop offset="1" stopColor="#08783f" />
          </linearGradient>
          <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#35cbf4" /><stop offset="1" stopColor="#0578d2" />
          </linearGradient>
        </defs>
        <path d="M0 295 Q215 40 470 280 T1080 240 V760 H0Z" fill="url(#hillBack)" />
        <path d="M-100 510 Q210 170 565 485 T1180 420 V760 H-100Z" fill="url(#hillFront)" />
        <path d="M0 555 Q270 490 550 570 T1080 530 V760 H0Z" fill="url(#water)" />
        {Array.from({ length: 8 }).map((_, i) => (
          <path key={i} d={`M${-70 + i * 150 + (drift % 80)} ${610 + (i % 3) * 30} q70 -18 140 0`}
            fill="none" stroke="rgba(255,255,255,0.48)" strokeWidth="9" strokeLinecap="round" />
        ))}
      </svg>

      {Array.from({ length: 12 }).map((_, i) => {
        const size = 28 + (i % 5) * 17
        const x = (i * 193 + 70) % 1020
        const rise = (localFrame * (0.7 + (i % 4) * 0.23) + i * 115) % 1030
        return <div key={i} style={{
          position: 'absolute', left: x + Math.sin(localFrame * 0.03 + i) * 22, top: 1620 - rise,
          width: size, height: size, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.76)',
          background: 'radial-gradient(circle at 28% 24%, rgba(255,255,255,.95) 0 8%, rgba(255,255,255,.18) 22%, rgba(70,210,255,.16) 62%, rgba(255,255,255,.5) 100%)',
          boxShadow: `inset -8px -10px 20px rgba(0,111,215,.18), 0 0 18px ${accent}44`,
        }} />
      })}
    </AbsoluteFill>
  )
}

const GlassPill: React.FC<{ children: React.ReactNode; dark?: boolean }> = ({ children, dark }) => (
  <div style={{
    display: 'inline-flex', alignItems: 'center', padding: '17px 28px 14px', borderRadius: 999,
    border: '2px solid rgba(255,255,255,.88)',
    background: dark ? 'linear-gradient(180deg, rgba(8,65,124,.84), rgba(2,39,80,.92))' : 'linear-gradient(180deg, rgba(255,255,255,.9), rgba(190,237,255,.66))',
    color: dark ? WHITE : NAVY,
    boxShadow: 'inset 0 3px 6px rgba(255,255,255,.7), 0 12px 30px rgba(0,67,125,.2)',
    fontFamily: SANS, fontWeight: 800, fontSize: 25, letterSpacing: 2.5,
    textTransform: 'uppercase', whiteSpace: 'nowrap',
  }}>{children}</div>
)

const GlassPanel: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{
    border: '3px solid rgba(255,255,255,.82)', borderRadius: 54,
    background: 'linear-gradient(145deg, rgba(255,255,255,.82) 0%, rgba(210,245,255,.53) 44%, rgba(123,215,250,.43) 100%)',
    boxShadow: 'inset 0 5px 10px rgba(255,255,255,.86), inset 0 -7px 16px rgba(13,126,196,.13), 0 35px 80px rgba(0,68,125,.24)',
    backdropFilter: 'blur(12px)', ...style,
  }}>{children}</div>
)

const Equalizer: React.FC<{ color?: string }> = ({ color = WHITE }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const beat = beatPulse(frame, fps)
  return <div style={{ display: 'flex', alignItems: 'flex-end', height: 64, gap: 8 }}>
      {Array.from({ length: 15 }).map((_, i) => {
        const a = Math.sin(frame * 0.24 + i * 1.33) * 0.5 + 0.5
        const b = Math.sin(frame * 0.08 + i * 0.52) * 0.5 + 0.5
        return <div key={i} style={{ width: 8, height: 10 + a * 25 + b * 17 + beat * 10,
          borderRadius: 8, backgroundColor: color, boxShadow: `0 0 ${9 + beat * 9}px ${color}` }} />
      })}
    </div>
}

const Intro: React.FC<StreamCountdownProps & { localFrame: number }> = ({ localFrame, eyebrow, eventLabel, accent }) => {
  const { fps } = useVideoConfig()
  const enter = spring({ frame: localFrame, fps, config: { damping: 18, stiffness: 135 } })
  return <AbsoluteFill style={{ color: WHITE }}>
    <AeroWorld localFrame={localFrame} accent={accent} horizon={1350} />
    <div style={{ position: 'absolute', top: 94, left: 66 }}><GlassPill dark>{eyebrow}</GlassPill></div>
    <div style={{ position: 'absolute', left: 58, right: 58, top: 455,
      transform: `translateY(${interpolate(enter, [0, 1], [180, 0])}px)`,
      opacity: interpolate(localFrame, [0, .45 * fps], [0, 1], clamp) }}>
      <GlassPanel style={{ padding: '62px 54px 58px' }}>
        <div style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: 126, letterSpacing: -8,
          lineHeight: .88, color: NAVY, textTransform: 'uppercase',
          textShadow: '0 4px 0 #fff, 0 11px 22px rgba(0,74,140,.22)' }}>{eventLabel}</div>
        <div style={{ marginTop: 40, paddingTop: 26, borderTop: '3px solid rgba(5,59,114,.28)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontFamily: SANS, color: NAVY, fontWeight: 800, fontSize: 29 }}>ONE FINAL TRANSMISSION</div>
          <Equalizer color={BLUE} />
        </div>
      </GlassPanel>
    </div>
  </AbsoluteFill>
}

const Countdown: React.FC<StreamCountdownProps & { localFrame: number }> = ({ localFrame, daysToGo, accent, url }) => {
  const { fps } = useVideoConfig()
  const pop = spring({ frame: localFrame, fps, durationInFrames: .9 * fps,
    config: { damping: 12, stiffness: 180, mass: .8 } })
  const beat = beatPulse(useCurrentFrame(), fps)
  return <AbsoluteFill>
    <AeroWorld localFrame={localFrame} accent={accent} horizon={1180} />
    <div style={{ position: 'absolute', top: 90, left: 0, right: 0, textAlign: 'center' }}>
      <GlassPill>final stream countdown</GlassPill>
    </div>
    <div style={{ position: 'absolute', top: 250, left: 40, right: 40, textAlign: 'center',
      transform: `scale(${interpolate(pop, [0, 1], [.25, 1]) * (1 + beat * 0.025)}) rotate(${interpolate(pop, [0, 1], [-9, 0])}deg)` }}>
      <div style={{ fontFamily: DISPLAY, fontSize: 640, fontWeight: 900, lineHeight: .9,
        letterSpacing: -70, paddingRight: 56, color: 'transparent',
        background: 'linear-gradient(180deg, #fff 5%, #bff8ff 32%, #159fec 58%, #0758a6 84%)',
        WebkitBackgroundClip: 'text', WebkitTextStroke: '6px rgba(255,255,255,.95)',
        filter: 'drop-shadow(0 24px 24px rgba(0,55,120,.35))' }}>{String(daysToGo).padStart(2, '0')}</div>
      <div style={{ display: 'inline-block', marginTop: -30, padding: '20px 48px 18px', borderRadius: 999,
        fontFamily: DISPLAY, fontWeight: 900, fontSize: 72, letterSpacing: 2, color: WHITE,
        background: 'linear-gradient(180deg, #79e845, #15933d)', border: '4px solid rgba(255,255,255,.9)',
        boxShadow: 'inset 0 5px 7px rgba(255,255,255,.45), 0 16px 35px rgba(0,80,80,.3)' }}>DAYS TO GO</div>
    </div>
    <div style={{ position: 'absolute', left: 65, right: 65, bottom: 92, display: 'flex',
      alignItems: 'center', justifyContent: 'space-between' }}>
      <GlassPill dark>{url}</GlassPill><Equalizer />
    </div>
  </AbsoluteFill>
}

const Details: React.FC<StreamCountdownProps & { localFrame: number }> = ({ localFrame, dateLabel, timeLabel, timezone, accent, url }) => {
  const { fps } = useVideoConfig()
  const enter = spring({ frame: localFrame, fps, config: { damping: 20, stiffness: 145 } })
  return <AbsoluteFill>
    <AeroWorld localFrame={localFrame} accent={accent} horizon={1460} />
    <div style={{ position: 'absolute', top: 92, left: 0, right: 0, textAlign: 'center' }}><GlassPill dark>save the date</GlassPill></div>
    <GlassPanel style={{ position: 'absolute', top: 335, left: 58, right: 58, padding: '62px 54px 54px',
      transform: `translateY(${interpolate(enter, [0, 1], [300, 0])}px)` }}>
      <div style={{ fontFamily: DISPLAY, fontWeight: 900, color: NAVY, fontSize: 124, letterSpacing: -7,
        lineHeight: .9, textTransform: 'uppercase', textShadow: '0 4px 0 white' }}>{dateLabel}</div>
      <div style={{ marginTop: 46, paddingTop: 38, borderTop: '3px solid rgba(5,59,114,.28)',
        fontFamily: DISPLAY, fontWeight: 900, color: DEEP_GREEN, fontSize: 164, letterSpacing: -9,
        lineHeight: .85 }}>{timeLabel}</div>
      <div style={{ marginTop: 34, display: 'flex', justifyContent: 'space-between', color: NAVY,
        fontFamily: SANS, fontSize: 27, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase' }}>
        <span>{timezone}</span><span>live online</span>
      </div>
    </GlassPanel>
    <div style={{ position: 'absolute', bottom: 98, left: 0, right: 0, textAlign: 'center' }}><GlassPill>{url}</GlassPill></div>
  </AbsoluteFill>
}

const EndCard: React.FC<StreamCountdownProps & { localFrame: number }> = ({ localFrame, eventLabel, accent, url }) => {
  const { fps } = useVideoConfig()
  const enter = spring({ frame: localFrame, fps, config: { damping: 16, stiffness: 170 } })
  const orbit = interpolate(localFrame, [0, 3 * fps], [0, 45])
  return <AbsoluteFill>
    <AeroWorld localFrame={localFrame} accent={accent} horizon={1320} />
    {[0, 1, 2].map((i) => <div key={i} style={{ position: 'absolute', width: 560 + i * 280,
      height: 560 + i * 280, left: 540 - (560 + i * 280) / 2, top: 785 - (560 + i * 280) / 2,
      borderRadius: '50%', border: `${6 - i}px solid rgba(255,255,255,${.78 - i * .2})`,
      transform: `rotate(${orbit * (i % 2 ? -1 : 1)}deg)`, boxShadow: '0 0 30px rgba(255,255,255,.35)' }} />)}
    <div style={{ position: 'absolute', left: 58, right: 58, top: 405, textAlign: 'center',
      transform: `scale(${interpolate(enter, [0, 1], [.5, 1])})` }}>
      <GlassPanel style={{ padding: '62px 42px 66px' }}>
        <div style={{ fontFamily: DISPLAY, color: NAVY, fontWeight: 900, fontSize: 118, lineHeight: .88,
          letterSpacing: -7, textTransform: 'uppercase', textShadow: '0 4px 0 white' }}>{eventLabel}</div>
        <div style={{ marginTop: 54 }}><GlassPill dark>{url}</GlassPill></div>
      </GlassPanel>
    </div>
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 90, textAlign: 'center',
      fontFamily: SANS, fontSize: 27, fontWeight: 900, color: WHITE, letterSpacing: 3,
      textTransform: 'uppercase', textShadow: '0 3px 12px rgba(0,59,110,.65)' }}>
      one last dive into the future we were promised
    </div>
  </AbsoluteFill>
}

export const StreamCountdown: React.FC<StreamCountdownProps> = (props) => {
  const frame = useCurrentFrame()
  const { fps, durationInFrames } = useVideoConfig()
  const introEnd = Math.round(2.5 * fps)
  const countdownEnd = Math.round(8 * fps)
  const detailsEnd = Math.round(12 * fps)
  const kick = transientEnvelope(frame, fps, KICK_TIMES, 7)
  const snare = transientEnvelope(frame, fps, SNARE_TIMES, 5)
  let scene: React.ReactNode
  if (frame < introEnd) scene = <Intro {...props} localFrame={frame} />
  else if (frame < countdownEnd) scene = <Countdown {...props} localFrame={frame - introEnd} />
  else if (frame < detailsEnd) scene = <Details {...props} localFrame={frame - countdownEnd} />
  else scene = <EndCard {...props} localFrame={frame - detailsEnd} />

  return <AbsoluteFill>
    <Distortion scene={scene} kick={kick} snare={snare} />
    <Audio
      src={staticFile(props.audioSrc)}
      volume={(audioFrame) => interpolate(
        audioFrame,
        [0, Math.round(.35 * fps), durationInFrames - Math.round(.9 * fps), durationInFrames],
        [0, .92, .92, 0],
        clamp,
      )}
    />
  </AbsoluteFill>
}
