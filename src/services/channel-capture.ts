import type { Channel } from '../types'
import { captureLatestCameraFrame, createFallbackCameraFrame } from './camera-frame'
import {
  requestLocalAgentCapture,
  type LocalAgentCaptureProfile,
  type LocalAgentCapturePurpose,
} from './local-agent-capture'

export function isLocalAgentChannel(channel: Channel): boolean {
  return channel.captureMode === 'local_agent'
}

export async function captureChannelFrame(
  channel: Channel,
  input: {
    profile: LocalAgentCaptureProfile
    purpose: LocalAgentCapturePurpose
    timeoutMs?: number
  },
): Promise<string> {
  if (isLocalAgentChannel(channel)) {
    return requestLocalAgentCapture(channel, input)
  }

  try {
    return await captureLatestCameraFrame(input.profile)
  } catch (error) {
    console.warn('Falling back to synthetic browser frame', error)
    return createFallbackCameraFrame(input.profile)
  }
}
