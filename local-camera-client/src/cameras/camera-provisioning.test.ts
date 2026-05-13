// @vitest-environment node
import { describe, expect, it } from 'vitest'
import {
  assertHikvisionSdkAvailable,
  buildHikvisionMainRtspUrl,
  buildSourceFromRtspProvisioning,
  isHikvisionDiscovery,
  normalizeCameraHost,
} from './camera-provisioning.js'

describe('camera provisioning', () => {
  it('builds the default Hikvision main-stream RTSP URL from IP and credentials', () => {
    expect(buildHikvisionMainRtspUrl({
      host: '10.0.0.8',
      username: 'admin',
      password: 'secret',
    })).toBe('rtsp://admin:secret@10.0.0.8:554/Streaming/Channels/101')
  })

  it('normalizes pasted camera addresses to a plain host', () => {
    expect(normalizeCameraHost('http://10.0.0.9:8080/device')).toBe('10.0.0.9')
    expect(normalizeCameraHost('rtsp://user:pass@10.0.0.10:554/Streaming/Channels/101')).toBe('10.0.0.10')
  })

  it('detects Hikvision discovery results', () => {
    expect(isHikvisionDiscovery({ sourceType: 'hikvision-sdk', discoveryType: 'network-scan' })).toBe(true)
    expect(isHikvisionDiscovery({ sourceType: 'rtsp', discoveryType: 'network-scan', manufacturer: 'Hikvision' })).toBe(true)
    expect(isHikvisionDiscovery({ sourceType: 'rtsp', discoveryType: 'onvif', manufacturer: 'Generic' })).toBe(false)
  })

  it('routes discovered Hikvision RTSP setup to the SDK source', () => {
    expect(buildSourceFromRtspProvisioning({
      host: '10.0.0.11',
      username: 'admin',
      password: 'secret',
      discovery: {
        sourceType: 'hikvision-sdk',
        discoveryType: 'hikvision-sdk',
        suggestedSource: { type: 'hikvision-sdk', port: 8000, channel: 1 },
      },
    })).toEqual({
      type: 'hikvision-sdk',
      host: '10.0.0.11',
      port: 8000,
      username: 'admin',
      password: 'secret',
      channel: 1,
      useHttps: false,
    })
  })

  it('keeps generic RTSP cameras on the RTSP adapter', () => {
    expect(buildSourceFromRtspProvisioning({
      host: '10.0.0.12',
      username: 'operator',
      password: 'secret',
      discovery: { sourceType: 'rtsp', discoveryType: 'onvif', manufacturer: 'Generic' },
    })).toEqual({
      type: 'rtsp',
      url: 'rtsp://operator:secret@10.0.0.12:554/Streaming/Channels/101',
      transport: 'tcp',
      username: 'operator',
      password: 'secret',
    })
  })

  it('fails clearly when Hikvision SDK is required but DLLs are missing', () => {
    expect(() => assertHikvisionSdkAvailable({ GHOST_HIKVISION_SDK_DIR: 'Z:/missing-hikvision-sdk' }))
      .toThrow('Hikvision SDK is required for Hikvision cameras')
  })
})
