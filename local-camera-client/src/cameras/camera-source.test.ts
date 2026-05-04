// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { getCameraSourceHost, maskRtspUrl } from './camera-source.js'

describe('camera-source helpers', () => {
  it('masks RTSP passwords', () => {
    expect(maskRtspUrl('rtsp://admin:secret@example.com:554/Streaming/Channels/101'))
      .toBe('rtsp://admin:***@example.com:554/Streaming/Channels/101')
  })

  it('extracts host from rtsp and hikvision sources', () => {
    expect(getCameraSourceHost({ type: 'rtsp', url: 'rtsp://user:pass@10.0.0.8:554/stream' })).toBe('10.0.0.8')
    expect(getCameraSourceHost({ type: 'hikvision-sdk', host: '10.0.0.9', port: 8000, username: 'a', channel: 1 })).toBe('10.0.0.9')
  })
})
