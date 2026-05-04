import type { Channel, TimelineSampledFrame } from '../types'

function getLastSampledFrameDataUrl(sampledFrames: TimelineSampledFrame[] | undefined): string | undefined {
  if (!sampledFrames || sampledFrames.length === 0) {
    return undefined
  }
  return sampledFrames[sampledFrames.length - 1]?.dataUrl
}

export function resolveChannelAvatarDataUrl(channel: Channel): string | undefined {
  if (channel.lastFrameDataUrl) {
    return channel.lastFrameDataUrl
  }

  for (let index = channel.messages.length - 1; index >= 0; index -= 1) {
    const frameDataUrl = channel.messages[index]?.frameDataUrl
    if (frameDataUrl) {
      return frameDataUrl
    }
  }

  return getLastSampledFrameDataUrl(channel.timelineState?.sampledFrames)
}
