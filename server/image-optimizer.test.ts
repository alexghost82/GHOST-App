import { describe, expect, it } from 'vitest'
import sharp from 'sharp'
import { getImageProfileByTask, optimizeImageDataUrl } from './image-optimizer'

async function buildSamplePngDataUrl(): Promise<string> {
  const buffer = await sharp({
    create: {
      width: 4,
      height: 4,
      channels: 3,
      background: { r: 120, g: 120, b: 120 },
    },
  })
    .png()
    .toBuffer()

  return `data:image/png;base64,${buffer.toString('base64')}`
}

describe('image-optimizer', () => {
  it('converts scan-low input to compressed jpeg output', async () => {
    const sourceImage = await buildSamplePngDataUrl()
    const result = await optimizeImageDataUrl(sourceImage, 'scan-low')
    expect(result.dataUrl.startsWith('data:image/jpeg;base64,')).toBe(true)
    expect(result.detail).toBe('low')
    expect(result.byteSize).toBeGreaterThan(0)
  })

  it('selects the expected image profile for each task shape', () => {
    expect(getImageProfileByTask('chat', false)).toBe('scan-standard')
    expect(getImageProfileByTask('scan', false)).toBe('scan-low')
    expect(getImageProfileByTask('scan', true)).toBe('scan-standard')
  })
})
