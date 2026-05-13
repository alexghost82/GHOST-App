import { httpRequest } from './http-client'
import type { Channel } from '../types'

export type LocalAgentCaptureProfile = 'scan-low' | 'scan-standard' | 'chat-high'
export type LocalAgentCapturePurpose = 'chat' | 'timeline' | 'preview'

interface CaptureResponsePayload {
  ok?: boolean
  frameDataUrl?: string
  capturedAtIso?: string
  error?: string
}

export async function requestLocalAgentCapture(
  channel: Channel,
  input: {
    profile: LocalAgentCaptureProfile
    purpose: LocalAgentCapturePurpose
    timeoutMs?: number
  },
): Promise<string> {
  const response = await httpRequest('/api/local-agent/capture-request', {
    method: 'POST',
    body: JSON.stringify({
      channelId: channel.id,
      profile: input.profile,
      purpose: input.purpose,
      timeoutMs: input.timeoutMs ?? 25_000,
    }),
  })

  const payload = (await response.json().catch(() => null)) as CaptureResponsePayload | null
  if (!response.ok || !payload?.frameDataUrl) {
    throw new Error(
      payload?.error ||
        'The bound local client is unavailable. Reconnect that local client and try again.',
    )
  }

  return payload.frameDataUrl
}
