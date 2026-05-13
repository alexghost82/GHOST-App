import { httpRequest } from './http-client'
import type { Channel } from '../types'

interface ProvisioningResponse {
  ok?: boolean
  token: string
  launchUrl: string
  expiresAtIso: string
  channel: Pick<Channel, 'id' | 'name' | 'type' | 'liveState' | 'captureMode' | 'cameraEnabled' | 'localAgentBinding' | 'localAgentStatus'>
  error?: string
}

export async function createLocalAgentProvisioningSession(channelId: string): Promise<ProvisioningResponse> {
  const response = await httpRequest('/api/local-agent/provisioning-sessions', {
    method: 'POST',
    body: JSON.stringify({ channelId }),
  })
  const payload = (await response.json().catch(() => null)) as ProvisioningResponse | null
  if (!response.ok || !payload?.launchUrl) {
    throw new Error(payload?.error || 'Failed to create a local agent provisioning session.')
  }
  return payload
}
